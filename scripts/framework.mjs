#!/usr/bin/env node
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { applyArtifactTheme, ensureArtifactEntries } from './lib/artifact-theme.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const safeJSON = value => JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

export async function generateFramework(input, out) {
  if (input?.schema !== 'governui.framework-input/1') throw new Error('Expected governui.framework-input/1');
  for (const key of ['project', 'scope', 'baseline']) if (typeof input[key] !== 'string' || !input[key].trim()) throw new Error(`${key} is required`);
  const catalog = JSON.parse(await readFile(path.join(root, 'assets/atomic-framework-catalog.json'), 'utf8'));
  const ids = new Set([...catalog.categories.map(c => c.id), 'unclassified']);
  for (const [id, observation] of Object.entries(input.observations || {})) {
    if (!ids.has(id)) throw new Error(`Unknown observation category: ${id}`);
    if (!['detected', 'not-detected-in-scope', 'unverified'].includes(observation.status)) throw new Error(`Invalid observation status: ${id}`);
    if (!Number.isInteger(observation.count) || observation.count < 0 || (observation.status === 'detected' && observation.count === 0)) throw new Error(`Invalid observation count: ${id}`);
    if (!Array.isArray(observation.samples) || observation.samples.some(s => typeof s.value !== 'string' || typeof s.file !== 'string')) throw new Error(`Invalid source samples: ${id}`);
  }
  for (const key of ['colorSeed', 'colorSources']) if (input[key] != null && !Array.isArray(input[key])) throw new Error(`${key} must be an array`);
  for (const source of input.colorSources || []) {
    for (const key of ['id', 'name', 'file', 'light', 'dark']) if (typeof source[key] !== 'string' || !source[key]) throw new Error(`Invalid color source: ${key}`);
    if (![source.light, source.dark].every(v => /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v))) throw new Error('Color source values must be hex colors');
  }
  for (const row of input.colorSeed || []) for (const key of ['id', 'name', 'meaning', 'location', 'scope']) if (typeof row[key] !== 'string' || !row[key]) throw new Error(`Invalid color seed: ${key}`);
  if (input.styleSources != null && !Array.isArray(input.styleSources)) throw new Error('styleSources must be an array');
  const sourceIds = new Set((input.colorSources || []).map(s => `color:${s.id}`));
  for (const source of input.styleSources || []) {
    const category = catalog.categories.find(c => c.id === source.category);
    if (!category) throw new Error(`Unknown style category: ${source.category}`);
    for (const key of ['id', 'name', 'owner']) if (typeof source[key] !== 'string' || !source[key].trim()) throw new Error(`Invalid style source: ${key}`);
    const id = `${source.category}:${source.id}`;
    if (sourceIds.has(id)) throw new Error(`Duplicate style source: ${id}`);
    sourceIds.add(id);
    const fields = new Set(category.fields.map(f => f.id));
    const validFields = obj => obj && typeof obj === 'object' && !Array.isArray(obj) && Object.entries(obj).every(([key, value]) => fields.has(key) && typeof value === 'string' && value.trim());
    if (!validFields(source.values) || !Object.keys(source.values).length) throw new Error(`Invalid typed source values: ${id}`);
    if (source.displayValues && !validFields(source.displayValues)) throw new Error(`Invalid source display values: ${id}`);
    for (const values of Object.values(source.modePreviews || {})) if (!validFields(values)) throw new Error(`Invalid source mode preview: ${id}`);
    if (!Array.isArray(source.evidence) || !source.evidence.length || source.evidence.some(e => typeof e.file !== 'string' || !e.file || typeof e.expression !== 'string' || !Number.isInteger(e.line) || e.line < 1)) throw new Error(`Source evidence is required: ${id}`);
    if (source.iconGeometry) {
      const geometry = source.iconGeometry;
      if (source.category !== 'icons' || !/^[\d.\s-]+$/.test(geometry.viewBox) || !Array.isArray(geometry.paths) || !geometry.paths.length) throw new Error(`Invalid icon geometry: ${id}`);
      for (const p of geometry.paths) if (typeof p.d !== 'string' || !p.d || ['fill', 'stroke'].some(k => p[k] && !/^(?:none|currentColor|#[\da-f]{3,8})$/i.test(p[k]))) throw new Error(`Unsafe icon geometry: ${id}`);
    }
  }
  const defaults = JSON.parse(await readFile(path.join(root, 'assets/framework-defaults.json'), 'utf8'));
  const generated = [], css = [':root {'], dark = ['.dark {'];
  const paths = {navigation:'M5 12h14 M12 5l7 7-7 7',action:'M12 5v14 M5 12h14',status:'M5 12l4 4L19 6'};
  for (const category of catalog.categories) {
    const roles = [...category.roles];
    if (category.id === 'color') for (const row of input.colorSeed || []) if (!roles.some(r => r.name === row.name)) roles.push(row);
    for (const role of roles) {
      const fallback = defaults[role.name] || defaults[category.roles[0].name];
      const values = {...fallback.values};
      const candidate = category.id === 'color' && (input.colorSources || []).find(s => s.id === (input.colorSeed || []).find(r => r.id === role.id)?.candidate);
      if (candidate) Object.assign(values, {light:candidate.light, dark:candidate.dark});
      const line = css.length + 1;
      for (const [field,value] of Object.entries(values)) {
        if (category.id === 'color') { (field === 'dark' ? dark : css).push(`  ${role.name}: ${value};`); continue; }
        const name = field === 'value' ? role.name : `${role.name}-${field}`;
        css.push(`  ${name}: ${field === 'source' ? `url("${value}")` : value};`);
      }
      const source = {id:'generated:'+role.name, category:category.id, name:role.name, roleName:role.name, owner:'framework-styles.css', values, displayValues:{...values}, generated:true,
        evidence:[{file:'framework-styles.css',line,expression:JSON.stringify(values)}], notes:['生成的默认样式，可直接调整。','Generated defaults, ready to edit.']};
      if (category.id === 'icons') source.iconGeometry = {viewBox:'0 0 24 24',paths:[{d:paths[role.id],fill:'none',stroke:'currentColor',strokeWidth:2,strokeLinecap:'round',strokeLinejoin:'round'}]};
      generated.push(source);
    }
  }
  css.push('}', ...dark, '}');
  input = {...input, generatedStyles:generated};
  const template = await readFile(path.join(root, 'assets/framework-template.html'), 'utf8');
  const html = await applyArtifactTheme(template.replace('__FRAMEWORK_CATALOG__', () => safeJSON(catalog)).replace('__FRAMEWORK_INPUT__', () => safeJSON(input)), 'B');
  await mkdir(out, { recursive: true });
  const output = path.join(out, 'framework.html');
  await writeFile(output, html);
  await writeFile(path.join(out,'token-spec.html'), html);
  await ensureArtifactEntries(out);
  await writeFile(path.join(out,'framework-styles.css'), css.join('\n')+'\n');
  await writeFile(path.join(out,'framework-styles.json'), JSON.stringify({schema:'governui.generated-styles/1',styles:generated},null,2)+'\n');
  await writeFile(path.join(out,'generated-icons.svg'), `<svg xmlns="http://www.w3.org/2000/svg">${Object.entries(paths).map(([id,d])=>`<symbol id="${id}" viewBox="0 0 24 24"><path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>`).join('')}</svg>`);

  return { output, categories: catalog.categories.length, roles: catalog.categories.reduce((n, c) => n + c.roles.length, 0) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), inputPath = args[args.indexOf('--input') + 1], out = args[args.indexOf('--out') + 1];
  if (!args.includes('--input') || !args.includes('--out') || !inputPath || !out || inputPath.startsWith('--') || out.startsWith('--')) {
    console.error('Usage: node scripts/framework.mjs --input <framework-input.json> --out <directory>');
    process.exitCode = 1;
  } else {
    try { console.log(JSON.stringify(await generateFramework(JSON.parse(await readFile(inputPath, 'utf8')), path.resolve(out)))); }
    catch (error) { console.error(error.message); process.exitCode = 1; }
  }
}
