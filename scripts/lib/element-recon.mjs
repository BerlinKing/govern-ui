import path from 'node:path';
import { readFile, realpath, mkdir, writeFile, lstat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const hash = value => createHash('sha256').update(value).digest('hex').slice(0, 20);
const unique = values => [...new Set(values)];
export const CATEGORIES = {
  color: ['颜色', 'Color'], typography: ['字体排版', 'Typography'], icon: ['图标', 'Icons'],
  shadow: ['投影', 'Shadow'], stroke: ['描边', 'Stroke'], radius: ['圆角', 'Radius'],
  spacing: ['间距尺寸', 'Spacing / sizing'], opacity: ['透明度', 'Opacity'], blur: ['模糊', 'Blur'],
  layer: ['层级', 'Layer'], motion: ['动效参数', 'Motion'], other: ['待归类', 'Unclassified'],
  layout: ['结构 / 行为', 'Layout / behavior'],
};

// Scope labels/opening paths are analyst-authored. Syntax, branches and values are extracted.
// Never execute the target's config, component code, or dynamic expressions.
export async function reconRepository(root, scope, options = {}) {
  root = await realpath(root);
  if (scope.schemaVersion !== 1 || !scope.id || !Array.isArray(scope.nodes) || !Array.isArray(scope.elements)) throw new Error('Invalid element scope schema');
  const ids = scope.nodes.map(n => n.id);
  if (new Set(ids).size !== ids.length || scope.nodes.some(n => !n.id || (n.parentId && !ids.includes(n.parentId)))) throw new Error('Invalid hierarchy');
  for (const node of scope.nodes) {
    const seen = new Set(); let current = node;
    while (current) { if (seen.has(current.id)) throw new Error('Hierarchy cycle'); seen.add(current.id); current = scope.nodes.find(n => n.id === current.parentId); }
  }
  if (new Set(scope.elements.map(e => e.id)).size !== scope.elements.length) throw new Error('Duplicate element ID');
  for (const e of scope.elements) if (!e.id || !ids.includes(e.nodeId) || !e.locator?.tag || !e.opening?.steps?.length || !e.opening?.evidence?.length) throw new Error(`Incomplete element contract: ${e.id}`);
  const files = new Map();
  async function file(relative) {
    if (!relative || path.isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) throw new Error('Source paths must be repository-relative');
    if (!files.has(relative)) {
      const absolute = await realpath(path.join(root, relative));
      if (!absolute.startsWith(root + path.sep)) throw new Error('Source symlink escapes repository');
      files.set(relative, { file: relative, text: await readFile(absolute, 'utf8') });
    }
    return files.get(relative);
  }
  const req = createRequire(path.join(root, 'package.json'));
  let ts;
  try { ts = req(options.typescript || 'typescript'); }
  catch { throw new Error('recon requires an already-installed TypeScript parser; supply --typescript <typescript.js>. No dependency was installed.'); }
  const asts = new Map();
  async function ast(relative) {
    if (!asts.has(relative)) {
      const f = await file(relative);
      const sf = ts.createSourceFile(relative, f.text, ts.ScriptTarget.Latest, true, relative.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      if (sf.parseDiagnostics.length) throw new Error(`Unparsed source: ${relative}`);
      asts.set(relative, sf);
    }
    return asts.get(relative);
  }
  const walk = (n, visit) => { visit(n); ts.forEachChild(n, child => walk(child, visit)); };
  const evidence = (sf, node) => ({ file: sf.fileName, line: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, excerpt: node.getText(sf) });
  async function anchor(a) {
    const f = await file(a.file); const start = f.text.indexOf(a.contains);
    if (!a.contains || start < 0 || f.text.indexOf(a.contains, start + a.contains.length) >= 0) throw new Error(`Missing or ambiguous evidence anchor: ${a.file}: ${a.contains}`);
    return { file: a.file, line: f.text.slice(0, start).split('\n').length, excerpt: a.contains };
  }
  async function locate(locator) {
    const sf = await ast(locator.file); let matches = []; const openingMatches = [];
    walk(sf, n => {
      if (!(ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n))) return;
      if (n.tagName.getText(sf) !== locator.tag) return;
      const full = ts.isJsxOpeningElement(n) ? n.parent.getText(sf) : n.getText(sf);
      if (locator.contains && !full.includes(locator.contains)) return;
      matches.push(n);
      if (locator.contains && n.getText(sf).includes(locator.contains)) openingMatches.push(n);
    });
    if (openingMatches.length) matches = openingMatches;
    if (matches.length !== (locator.count ?? 1)) throw new Error(`Expected ${locator.count ?? 1} JSX anchors, found ${matches.length}: ${locator.file} ${locator.tag} ${locator.contains ?? ''}`);
    return { sf, matches };
  }
  // Only literal booleans read at the named callsite constrain branches. Unknown stays unknown.
  const bindings = {};
  for (const entry of scope.entries ?? []) {
    const { sf, matches } = await locate(entry);
    if (matches.length !== 1) throw new Error('Callsite must be unique');
    const props = {}; let spread = false;
    for (const p of matches[0].attributes.properties) {
      if (ts.isJsxSpreadAttribute(p)) { spread = true; continue; }
      const init = p.initializer;
      const value = !init ? true : ts.isJsxExpression(init) && init.expression?.kind === ts.SyntaxKind.TrueKeyword ? true : ts.isJsxExpression(init) && init.expression?.kind === ts.SyntaxKind.FalseKeyword ? false : undefined;
      if (value !== undefined) props[p.name.getText(sf)] = value;
    }
    if (bindings[entry.targetFile]) throw new Error('Multiple callsites require separate scoped runs; do not combine bindings');
    bindings[entry.targetFile] = { props: spread ? {} : props, evidence: evidence(sf, matches[0]), unresolvedSpread: spread };
  }
  function known(node, env) {
    if (ts.isParenthesizedExpression(node)) return known(node.expression, env);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isIdentifier(node)) return env[node.text];
    if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) { const v = known(node.operand, env); return v === undefined ? undefined : !v; }
    return undefined;
  }
  function branchConditions(node, sf, env) {
    const conditions = [];
    for (let child = node, p = node.parent; p; child = p, p = p.parent) {
      if (ts.isConditionalExpression(p) && (child === p.whenTrue || child === p.whenFalse)) {
        const yes = child === p.whenTrue, v = known(p.condition, env);
        conditions.push({ expression: `${yes ? '' : '!('}${p.condition.getText(sf)}${yes ? '' : ')'}`, active: v === undefined ? null : yes === v });
      }
      if (ts.isBinaryExpression(p) && p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && child === p.right) conditions.push({ expression: p.left.getText(sf), active: known(p.left, env) ?? null });
    }
    return conditions;
  }
  const categoryFor = (property, value) => {
    if (/shadow/i.test(property + ' ' + value)) return 'shadow';
    if (/blur|backdrop/i.test(property + ' ' + value)) return 'blur';
    if (/opacity/i.test(property)) return 'opacity';
    if (/zIndex|z-index/.test(property)) return 'layer';
    if (/font|lineHeight|line-height|letter|textAlign|text-align/.test(property)) return 'typography';
    if (/radius|rounded/i.test(property)) return 'radius';
    if (/color|background|fill|strokeColor/i.test(property)) return 'color';
    if (/border|outline|stroke/i.test(property)) return 'stroke';
    if (/transition|animation|duration/.test(property)) return 'motion';
    if (/width|height|padding|margin|gap|^top$|^right$|^bottom$|^left$/i.test(property)) return 'spacing';
    return 'other';
  };
  function utility(token) {
    const parts = token.split(/:(?![^\[]*\])/); const base = parts.pop();
    if (/^(?:flex(?:-row)?|inline-flex|box-border|group|shrink-0|items-.+|justify-.+|pointer-events-.+|overflow-.+|select-none|cursor-.+|absolute|relative)$/.test(base)) return { category: 'layout', property: base.split('-')[0], variants: parts, base };
    const rules = [[/^shadow/, 'shadow'], [/^(?:backdrop-)?blur/, 'blur'], [/^opacity-/, 'opacity'], [/^z-/, 'layer'], [/^rounded/, 'radius'], [/^(?:font-|leading-|tracking-|text-(?:type-|xs|sm|base|lg|xl|\dxl|center|left|right))/, 'typography'], [/^(?:bg-|text-|fill-|stroke-color-|icon-)/, 'color'], [/^(?:border|outline|ring)/, 'stroke'], [/^(?:transition|duration|ease|animate|will-change)/, 'motion'], [/^(?:w-|h-|size-|min-w-|min-h-|max-w-|max-h-|p[trblxy]?-|m[trblxy]?-|gap-|top-|right-|bottom-|left-)/, 'spacing']];
    if (/^\[/.test(base)) { const prop = base.slice(1).split(':')[0]; return { category: categoryFor(prop, base), property: prop, variants: parts, base }; }
    return { category: rules.find(([r]) => r.test(base))?.[1] ?? 'other', property: base.split('-')[0], variants: parts, base };
  }
  const adapters = [];
  for (const relative of scope.adapterSources ?? []) {
    const sf = await ast(relative);
    walk(sf, n => {
      if (!ts.isPropertyAssignment(n)) return;
      const segments = []; for (let p = n; p; p = p.parent) if (ts.isPropertyAssignment(p)) segments.unshift(p.name.getText(sf).replace(/^['"]|['"]$/g, ''));
      const namespaces = { colors: ['bg', 'text', 'fill', 'stroke', 'border'], fontFamily: ['font'], fontSize: ['text'], spacing: ['p','px','py','pt','pr','pb','pl','m','mx','my','mt','mr','mb','ml','gap','w','h','min-w','min-h'], borderRadius: ['rounded'], boxShadow: ['shadow'], borderWidth: ['border'], backdropBlur: ['backdrop-blur'], opacity: ['opacity'], zIndex: ['z'] };
      const i = segments.findIndex(p => namespaces[p]);
      if (i < 0 || i === segments.length - 1 || ts.isObjectLiteralExpression(n.initializer)) return;
      const name = segments.slice(i + 1).filter(p => p !== 'DEFAULT').join('-');
      const refs = unique([...n.initializer.getText(sf).matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]));
      for (const prefix of namespaces[segments[i]]) adapters.push({ utility: prefix + (name ? '-' + name : ''), refs, ...evidence(sf, n) });
    });
  }
  const elements = [], issues = new Map(), gaps = [];
  for (const spec of scope.elements) {
    const { sf, matches } = await locate({ ...spec.locator, file: spec.file });
    const env = bindings[spec.file]?.props ?? {};
    const facts = [], unresolved = [], sources = [], states = [];
    const add = (node, property, value, conditions, type) => {
      const u = type === 'utility' ? utility(value) : null;
      const adapterCandidates = u ? adapters.filter(a => a.utility === u.base.split('/')[0]) : [];
      facts.push({ id: 'fact-' + hash(JSON.stringify([spec.file, spec.id, property, value, conditions])), property: u?.property ?? property, value,
        category: property === 'icon' ? 'icon' : u?.category ?? categoryFor(property, value), type,
        variants: u?.variants ?? [], conditions, active: !conditions.some(c => c.active === false), evidence: evidence(sf, node), adapterCandidates,
        refs: unique([...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1]).concat(adapterCandidates.flatMap(a => a.refs))) });
    };
    const strings = (n, conditions, visited = new Set()) => {
      if (!n) return;
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { for (const token of n.text.split(/\s+/).filter(Boolean)) add(n, 'className', token, conditions, 'utility'); return; }
      if (ts.isConditionalExpression(n)) {
        const v = known(n.condition, env), exp = n.condition.getText(sf);
        strings(n.whenTrue, [...conditions, { expression: exp, active: v ?? null }], visited);
        strings(n.whenFalse, [...conditions, { expression: `!(${exp})`, active: v === undefined ? null : !v }], visited); return;
      }
      if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) { strings(n.right, [...conditions, { expression: n.left.getText(sf), active: known(n.left, env) ?? null }], visited); return; }
      if (ts.isCallExpression(n) && ['cn', 'clsx', 'classnames'].includes(n.expression.getText(sf))) { n.arguments.forEach(a => strings(a, conditions, visited)); return; }
      if (ts.isParenthesizedExpression(n)) { strings(n.expression, conditions, visited); return; }
      if (ts.isIdentifier(n) && !visited.has(n.text)) {
        // Resolve only unique immutable top-level strings; local shadowing remains unresolved.
        const decls = []; walk(sf, x => { if ((ts.isVariableDeclaration(x) || ts.isParameter(x) || ts.isBindingElement(x)) && x.name?.getText(sf) === n.text) decls.push(x); });
        if (decls.length === 1 && ts.isVariableDeclaration(decls[0]) && decls[0].initializer && decls[0].parent?.parent?.parent === sf && (decls[0].parent.flags & ts.NodeFlags.Const)) { strings(decls[0].initializer, conditions, new Set([...visited, n.text])); return; }
      }
      unresolved.push({ ...evidence(sf, n), reason: 'dynamic-class-expression', active: !conditions.some(c => c.active === false) });
    };
    for (const n of matches) {
      sources.push(evidence(sf, n)); const conditions = branchConditions(n, sf, env);
      if (spec.kind === 'icon') add(n.tagName, 'icon', n.tagName.getText(sf), conditions, 'component');
      for (const p of n.attributes.properties) {
        if (ts.isJsxSpreadAttribute(p)) { unresolved.push({ ...evidence(sf, p), reason: 'spread-props', active: true }); continue; }
        const name = p.name.getText(sf), init = p.initializer;
        const expr = init && ts.isJsxExpression(init) ? init.expression : init;
        if (name === 'className') strings(expr, conditions);
        if (name === 'style' && expr) {
          if (ts.isObjectLiteralExpression(expr)) for (const property of expr.properties) {
            if (ts.isPropertyAssignment(property)) add(property, property.name.getText(sf).replace(/['"]/g, ''), ts.isStringLiteral(property.initializer) ? property.initializer.text : property.initializer.getText(sf), conditions, 'inline');
            else unresolved.push({ ...evidence(sf, property), reason: 'dynamic-style-property', active: true });
          } else unresolved.push({ ...evidence(sf, expr), reason: 'dynamic-style-object', active: true });
        }
        if (['width', 'height'].includes(name) && expr) add(p, name, ts.isStringLiteral(expr) ? expr.text : expr.getText(sf), conditions, 'attribute');
        if (/^on|^disabled$|^aria-|^data-/.test(name)) states.push({ name, expression: expr?.getText(sf) ?? 'true', evidence: evidence(sf, p) });
      }
    }
    const openingEvidence = await Promise.all(spec.opening.evidence.map(anchor));
    const element = { ...spec, evidenceLevel: 'source-located', runtime: 'unverified', sources, facts, unresolved, bindings: bindings[spec.file] ?? null,
      opening: { ...spec.opening, status: 'source-inferred', evidence: openingEvidence }, states, issueIds: [] };
    elements.push(element);
    for (const f of facts.filter(f => f.active)) {
      let rule, title, next, status = 'queued';
      if (f.category === 'layer' && /^z-\[\d+\]$/.test(f.value)) { rule = 'literal-layer'; title = ['浮层层级直接写成数值', 'Literal overlay layer']; next = ['核对共享浮层层级，再确定是否迁移。', 'Check the shared overlay layer contract before mapping.']; }
      if (f.category === 'shadow' && /^shadow-\[/.test(f.value) && !f.refs.length) { rule = 'literal-shadow'; title = ['投影未引用样式 Token', 'Shadow bypasses a style Token']; next = ['与已有投影对照，确认复用或保留组件差异。', 'Compare existing shadows; reuse or preserve a scoped difference.']; }
      if (f.category === 'color' && /^(?:text|bg|fill|border)-(?:white|black)(?:\/\d+)?$/.test(f.value)) { rule = 'literal-color'; title = ['颜色直接写在元素上', 'Direct color on the element']; next = ['结合底色和状态匹配语义；不按色值直接合并。', 'Match by surface and state, not equal color alone.']; }
      if (spec.kind === 'text-input' && /^text-.*icon-/.test(f.value)) { rule = 'text-uses-icon-role'; title = ['输入框文字使用了图标颜色', 'Input text uses an icon color']; next = ['确认是否应复用文字语义，保留禁用态差异。', 'Review a text role while preserving disabled state.']; status = 'needs-user-decision'; }
      if (rule) {
        const id = 'issue-' + hash(JSON.stringify([scope.repositoryId ?? root, spec.file, spec.sharedOwner ?? spec.id, f.evidence.excerpt, rule, f.property, f.value]));
        if (!issues.has(id)) issues.set(id, { id, rule, category: f.category, title, next, status, verdict: 'source-observation', occurrences: [], shared: Boolean(spec.sharedOwner), source: f.evidence });
        const issue = issues.get(id);
        if (!issue.occurrences.some(o => o.elementId === spec.id && o.factId === f.id)) issue.occurrences.push({ elementId: spec.id, factId: f.id });
        element.issueIds.push(id);
      }
    }
    if (['button', 'text-input'].includes(spec.kind) && facts.some(f => f.active && /(?:^|:)outline-none$/.test(f.value))) {
      const id = 'issue-' + hash([scope.repositoryId ?? root, spec.file, spec.id, 'focus-check'].join(':'));
      issues.set(id, { id, rule: 'focus-check', category: 'stroke', title: ['移除了轮廓，需核验键盘焦点', 'Outline removed; verify keyboard focus'], next: ['页面中 Tab 聚焦，检查是否有替代指示；目前不判定缺陷。', 'Use Tab in the actual page; this is not a confirmed defect.'], status: 'blocked-runtime', verdict: 'runtime-check', shared: false, occurrences: [{ elementId: spec.id, factId: null }], source: sources[0] });
      element.issueIds.push(id);
    }
    element.issueIds = unique(element.issueIds);
  }
  // Named style owners are indexed without assuming selector reachability or final cascade.
  const definitions = [];
  for (const relative of scope.styleSources ?? []) {
    const f = await file(relative);
    for (const m of f.text.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) definitions.push({ name: m[1], value: m[2].trim(), file: relative, line: f.text.slice(0, m.index).split('\n').length, reachability: 'not-computed' });
  }
  for (const e of elements) {
    for (const f of e.facts) {
      f.classRules = [];
      if (f.type === 'utility' && /^[a-z][\w-]*$/.test(f.value)) for (const relative of scope.styleSources ?? []) {
        const source = await file(relative);
        for (const rule of source.text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
          const selector = rule[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
          if (!new RegExp('\\.' + f.value + '(?![\\w-])').test(selector)) continue;
          f.classRules.push({ file: relative, line: source.text.slice(0, rule.index).split('\n').length, selector, declaration: rule[2].trim(), reachability: 'not-computed' });
          f.refs = unique([...f.refs, ...[...rule[2].matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1])]);
        }
      }
      const queue = [...f.refs], visited = new Set(); f.definitionCandidates = [];
      while (queue.length) {
        const name = queue.shift(); if (visited.has(name)) continue; visited.add(name);
        for (const d of definitions.filter(d => d.name === name)) { f.definitionCandidates.push(d); queue.push(...[...d.value.matchAll(/var\(\s*(--[\w-]+)/g)].map(m => m[1])); }
      }
    }
    if (e.inheritsFrom) {
      const parent = elements.find(p => p.id === e.inheritsFrom);
      if (!parent) throw new Error(`Missing inherited element: ${e.inheritsFrom}`);
      const childMatch = await locate({ ...e.locator, file: e.file }), parentMatch = await locate({ ...parent.locator, file: parent.file });
      if (e.file !== parent.file || !childMatch.matches.every(c => parentMatch.matches.some(p => p.parent.pos <= c.pos && p.parent.end >= c.end))) throw new Error('Inherited element must have an evidenced JSX ancestor');
      e.inheritanceStatus = 'analyst-linked-source-parent';
    }
  }
  for (const a of scope.contextEvidence ?? []) await anchor(a);
  for (const exclusion of scope.exclusions ?? []) for (const a of exclusion.evidence ?? []) await anchor(a);
  const issuesArray = [...issues.values()];
  for (const f of files.values()) if (await readFile(path.join(root, f.file), 'utf8') !== f.text) throw new Error(`Source changed during reconnaissance: ${f.file}`);
  const baseline = [...files.values()].map(f => ({ file: f.file, sha256: hash(f.text) })).sort((a,b) => a.file.localeCompare(b.file));
  let commit = null; try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch {}
  const activeFacts = elements.flatMap(e => e.facts.filter(f => f.active));
  gaps.push('运行时、CSS 级联和 Light/Dark 最终值尚未验证。', '范围由人工标注；未自动证明全项目元素覆盖、Token 未使用或可删除。', '动态 class / style、外部组件与共享调用方未自动求值；见元素详情。');
  return {
    schemaVersion: 1, kind: 'module-reconnaissance', id: 'recon-' + hash(JSON.stringify([scope.id, baseline])), generatedAt: new Date().toISOString(),
    project: scope.project, root, scopeId: scope.id, nodes: scope.nodes, baseline: { commit, files: baseline }, elements, issues: issuesArray,
    exclusions: scope.exclusions ?? [], coverage: { mode: 'bounded-analyst-scope', runtimeVerified: 0, gaps, sourceFiles: files.size },
    summary: { elements: elements.length, issueRoots: issues.size, affectedOccurrences: issuesArray.reduce((n, i) => n + i.occurrences.length, 0),
      activeStyleFacts: activeFacts.length, inactiveStyleFacts: elements.flatMap(e => e.facts.filter(f => !f.active)).length,
      unresolvedExpressions: elements.reduce((n,e) => n + e.unresolved.length, 0),
      categories: Object.fromEntries(Object.keys(CATEGORIES).map(c => [c, activeFacts.filter(f => f.category === c).length])) },
    receipt: { completed: 0, awaitingAcceptance: 0, needsUserDecision: issuesArray.filter(i => i.status === 'needs-user-decision').map(i => i.id),
      blocked: issuesArray.filter(i => i.status === 'blocked-runtime').map(i => i.id), queued: issuesArray.filter(i => i.status === 'queued').map(i => i.id), excludedIssues: [], retainedExceptions: [], sourceChanges: 0 },
  };
}

export async function writeRecon(report, output) {
  const absolute = path.resolve(output);
  if (absolute === report.root || absolute.startsWith(report.root + path.sep)) throw new Error('Recon output must be outside the scanned repository');
  let parent = path.dirname(absolute);
  while (true) {
    try { const resolvedParent = await realpath(parent); if (resolvedParent === report.root || resolvedParent.startsWith(report.root + path.sep)) throw new Error('Output parent resolves into scanned repository'); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; const next = path.dirname(parent); if (next === parent) throw error; parent = next; }
  }
  await mkdir(absolute, { recursive: true });
  // Resolve the output parent after mkdir to reject symlink aliases into the scanned repository.
  const resolved = await realpath(absolute);
  if (resolved === report.root || resolved.startsWith(report.root + path.sep)) throw new Error('Recon output must be outside the scanned repository');
  const template = await readFile(new URL('../../assets/element-recon-template.html', import.meta.url), 'utf8');
  const data = JSON.stringify({ ...report, categoryLabels: CATEGORIES }).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  const { applyArtifactTheme, ensureArtifactEntries } = await import('./artifact-theme.mjs');
  const html = await applyArtifactTheme(template.replace('__RECON_DATA__', () => data), 'A');
  const files = { html: path.join(resolved, 'module-recon.html'), json: path.join(resolved, 'element-recon.json') };
  for (const target of Object.values(files)) {
    try { if (!(await lstat(target)).isFile()) throw new Error('Refusing non-regular report output: ' + target); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await writeFile(files.html, html);
  await writeFile(files.json, JSON.stringify(report, null, 2) + '\n');
  await ensureArtifactEntries(resolved);
  return files;
}
