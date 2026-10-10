import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const assets = new URL('../../assets/artifacts/', import.meta.url);
export const ARTIFACT_VERSION = 'governui.artifacts/1.1.0';
export const ARTIFACTS = [
  ['A', 'scan.html', '扫描报告'], ['B', 'token-spec.html', '设计 Token 规范'],
  ['C', 'governance-audit.html', '治理审计'], ['D', 'governance-report.html', '治理报告'],
];
export const escapeHTML = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const scriptJSON = v => JSON.stringify(v).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
export async function theme() {
  const css = await readFile(new URL('styles.css', assets), 'utf8');
  const bridge = await readFile(new URL('compat.css', assets), 'utf8');
  const hash = createHash('sha256').update(css + '\n' + bridge).digest('hex');
  const lock = JSON.parse(await readFile(new URL('template-lock.json', assets), 'utf8'));
  if (lock.version !== ARTIFACT_VERSION || lock.styleHash !== hash) throw new Error('Fixed HTML template hash mismatch: restore packaged assets or deliberately version and verify the template update');
  return { css: css + '\n' + bridge, hash };
}
export function navigation(active) {
  return `<header class="header artifact-header"><a class="brand" href="scan.html">GovernUI</a></header><nav class="artifact-steps" aria-label="产物导航">${ARTIFACTS.map(([id,file,label]) => `<a href="${file}" ${id===active?'aria-current="page"':''}><span class="letter">${id}</span><strong>${label}</strong></a>`).join('')}</nav>`;
}
// Compatibility renderers keep their tested editors/evidence, but may not own a second visual shell.
export async function applyArtifactTheme(html, active) {
  const {css,hash} = await theme();
  return html.replace('</head>', `<meta name="governui-template" content="${ARTIFACT_VERSION}"><meta name="governui-style-sha256" content="${hash}"><style id="governui-fixed-styles">${css}</style></head>`)
    .replace(/<body([^>]*)>/, `<body$1 data-artifact="${active}" data-compat="true">${navigation(active)}`);
}
export async function renderArtifact(active, data) {
  const {css,hash} = await theme();
  const template = await readFile(new URL('shell.html', assets), 'utf8');
  const js = await readFile(new URL(!data.pending && ['C','D'].includes(active)?'audit-result.js':'scan.js', assets), 'utf8');
  const values = {VERSION:ARTIFACT_VERSION, TITLE:ARTIFACTS.find(x=>x[0]===active)[2], ARTIFACT:active, CSS:css, NAV:navigation(active), DATA:scriptJSON(data), JS:js};
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]).replace('</head>', `<meta name="governui-style-sha256" content="${hash}"></head>`);
}
export async function ensureArtifactEntries(out) {
  await mkdir(out, {recursive:true});
  const {hash} = await theme();
  for (const [id, file] of ARTIFACTS) {
    try { await readFile(path.join(out,file)); }
    catch (e) { if(e.code!=='ENOENT') throw e; await writeFile(path.join(out,file),await renderArtifact(id,{pending:true})); }
  }
  await writeFile(path.join(out,'artifact-template.json'),JSON.stringify({schema:'governui.template-manifest/1',version:ARTIFACT_VERSION,styleHash:hash,entries:ARTIFACTS.map(([id,file])=>({id,file}))},null,2)+'\n');
}
