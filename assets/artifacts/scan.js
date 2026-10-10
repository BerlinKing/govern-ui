/* Fixed inventory view. No repository-specific values or demo fixtures belong here. */
const DATA = JSON.parse(document.querySelector('#artifact-data').textContent);
const ROOT = document.querySelector('#app');
const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories = [['color','颜色','Color'],['typography','字体排版','Typography'],['icons','图标与资产','Icons & assets'],['shadow','投影','Shadow'],['stroke','描边','Stroke'],['radius','圆角','Radius'],['spacing','间距尺寸','Spacing'],['opacity','透明度','Opacity'],['blur','模糊','Blur'],['layer','层级','Layers'],['motion','动效','Motion'],['other','待归类','Unclassified']];
const glyphs = {
 color:'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.4-3.4 1.5 1.5 0 0 1 1.1-2.6H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z"/><circle cx="7.5" cy="10" r=".8"/><circle cx="10.5" cy="6.8" r=".8"/><circle cx="15" cy="7.5" r=".8"/>',
 icons:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="m6.5 14 4 7h-8l4-7Z"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 shadow:'<rect x="8" y="8" width="13" height="13" rx="2" fill="currentColor" opacity=".2" stroke="none"/><rect x="3" y="3" width="13" height="13" rx="2"/>',
 radius:'<path d="M4 20V12a8 8 0 0 1 8-8h8M4 4h3m-3 0v3M17 20h3v-3"/>',
 blur:'<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="6" stroke-dasharray=".1 3" opacity=".65"/><circle cx="12" cy="12" r="9" stroke-dasharray=".1 3.5" opacity=".4"/>',
 stroke:'<rect x="4" y="4" width="16" height="16" rx="1"/>',
 typography:'<path d="M3 20 9 4l6 16M5 14h8M17 10h5m-2.5 0v10"/>',
 spacing:'<path d="M3 4v16M21 4v16M6 12h12m-9-3-3 3 3 3m6-6 3 3-3 3"/>',
 opacity:'<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor"/>',
 layer:'<path d="m12 3 9 5-9 5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
 motion:'<path d="m9 5 10 7-10 7ZM3 7v10"/>',other:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3v.1"/>'
};
const icon = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${glyphs[id] || glyphs.other}</svg>`;
let lang='zh', cat='color', source='tokens', moduleFilter='', query='', page=0;
const tr = (zh,en) => lang==='zh'?zh:en;
const allTokens = [...(DATA.tokens||[]),...(DATA.icons||[]).map(t=>({...t,category:'icons',asset:true}))];
const direct = DATA.directStyles||[];
const features = t => {
 if(DATA.moduleMap){const files=[t.file,...(t.files||[]),...(t.usageFiles||[]),...(t.usage?.examples||[]).map(e=>e.file)].filter(Boolean);return DATA.moduleMap.modules.filter(m=>files.some(f=>m.sourceBoundaries.some(p=>f===p||f.startsWith(p+'/')))).map(m=>m.name)}
 return t.usage?.features || [];
};
const modules = [...new Set([...allTokens,...direct].flatMap(features))].sort((a,b)=>[...allTokens,...direct].filter(t=>features(t).includes(b)).length-[...allTokens,...direct].filter(t=>features(t).includes(a)).length);
const moduleCard=m=>`<button class="module-card ${moduleFilter===m?'active':''}" data-module="${esc(m)}"><header><strong>${esc(m)}</strong></header><footer><span>${allTokens.filter(t=>features(t).includes(m)).length} ${tr('项 Token / 资产','Tokens / assets')}</span><span>${direct.filter(t=>features(t).includes(m)).length} ${tr('组直接样式','direct style groups')}</span></footer></button>`;
const list = () => (source==='tokens'?allTokens:direct).filter(t=>t.category===cat&&(!moduleFilter||features(t).includes(moduleFilter))&&JSON.stringify([t.name,t.value,t.file,t.usage]).toLowerCase().includes(query.toLowerCase()));
const metric = (n,label) => `<div class="metric"><strong>${Number(n).toLocaleString()}</strong><span>${label}</span></div>`;
function value(t){return t.resolvedValue ?? t.value ?? t.source ?? ''}
function safeStyle(v){return !/[;{}<>]|url\s*\(|expression\s*\(|var\s*\(/i.test(v)}
function specimen(t){
 const v=String(value(t));
 if(t.asset){return /^data:image\/(svg\+xml|png|webp|jpeg);base64,/.test(t.preview||'')?`<img src="${esc(t.preview)}" alt="${esc(t.name)}">`:`<span class="pill">${tr('图形未解析','Preview unavailable')}</span>`}
 const property={color:'background-color',radius:'border-radius',shadow:'box-shadow',opacity:'opacity',blur:'filter',stroke:'border-width',spacing:'width'}[t.category];
 let rendered=v;
 if(t.category==='color'&&/^[-\d.]+\s+[-\d.]+%\s+[-\d.]+%/.test(v))rendered=`hsl(${v})`;
 if(property&&safeStyle(rendered)&&CSS.supports(property,rendered)){
   if(t.category==='color')return `<span class="swatch checker large" style="--sw:${esc(rendered)}"></span>`;
   return `<span class="spec" style="border:1px solid #A9B5C6;background:#D8E4FF;${property}:${esc(rendered)};max-width:100%"></span>`;
 }
 if(t.category==='typography'&&safeStyle(v)&&CSS.supports('font-size',v))return `<span style="font-size:clamp(10px,${esc(v)},40px)">Aa 文字</span>`;
 return `<code>${esc(v)}</code>`;
}
function evidence(t){
 const locations=[...(t.examples||[]),...(t.usage?.examples||[])];
 return `<details><summary>${tr('功能位置与源码','Locations & source')}</summary><p>${esc(features(t).join(' · ')||tr('功能归属未识别','Function not identified'))}</p><p>${esc([...(t.usage?.components||[]),...(t.usage?.states||[])].join(' · '))}</p><p><code>${esc(t.file||t.files?.join(' · ')||'')} ${t.line?':'+t.line:''}</code></p>${locations.map(e=>`<p><code>${esc(e.file)}:${esc(e.line)}</code> ${esc(e.property||e.selector||'')}</p>`).join('')}<p>${esc(t.usage?.evidenceLevels?.join(' · ')||'source-derived')} · ${tr('页面未验证','Runtime unverified')}</p>${t.asset?`<p>${esc(t.sourceStatus)} · ${esc(t.kind)}</p>`:''}${t.aliasChain?.length?`<p>${tr('别名链','Alias chain')}: ${esc(t.aliasChain.join(' → '))}</p>`:''}</details>`;
}
function rows(){const matches=list(),slice=matches.slice(page*60,(page+1)*60);return `<div class="sheet-head"><h3>${categories.find(c=>c[0]===cat)[lang==='zh'?1:2]}</h3><span class="muted">${matches.length} ${tr('项','items')}</span></div><div class="sample-grid">${slice.map(t=>`<article class="sample-card" data-source-id="${esc(t.id)}"><div class="sample-visual">${specimen(t)}</div><div class="sample-info"><code>${esc(t.name||t.property||t.properties?.join(', ')||t.value)}</code><p>${esc(value(t))}</p><small>${esc(t.scope||'')} ${source==='hard'?`${t.occurrences} ${tr('处','occurrences')}`:''}</small>${evidence(t)}</div></article>`).join('')}</div>${!matches.length?`<div class="empty">${tr('当前扫描与筛选范围内没有记录','No records in this scan/filter scope')}</div>`:''}<div class="actions section"><button class="btn" data-go="prev" ${page===0?'disabled':''}>${tr('上一页','Previous')}</button><span>${page+1} / ${Math.max(1,Math.ceil(matches.length/60))}</span><button class="btn" data-go="next" ${(page+1)*60>=matches.length?'disabled':''}>${tr('下一页','Next')}</button></div>`}
function render(){
 if(DATA.pending){ROOT.innerHTML=`<div class="page-head"><h1>${document.title.split(' · ')[0]}</h1></div><div class="artifact-empty"><h2>尚未生成此产物</h2><p class="sub">由 Codex 完成对应阶段后更新。此页不代表已审计或已治理。</p><a class="btn section" href="scan.html">返回扫描报告</a></div>`;return}
 const count=(items)=>items.filter(t=>!moduleFilter||features(t).includes(moduleFilter));
 ROOT.innerHTML=`<div class="page-head"><div><div class="eyebrow">A / INVENTORY</div><h1>${tr('扫描报告','Scan report')}</h1><p class="sub">${esc(DATA.project.name)} · ${tr('源码扫描 · 页面未验证','Source scan · Runtime unverified')}</p></div><div class="actions"><button class="btn" data-go="lang">${lang==='zh'?'EN':'中文'}</button><button class="btn" data-go="export">${tr('导出扫描数据','Export scan')}</button></div></div>
 <section class="panel metrics">${metric(DATA.tokens.length,tr('Token 定义','Token definitions'))}${metric(direct.reduce((n,t)=>n+t.occurrences,0),tr('硬编码使用处','Direct occurrences'))}${metric(DATA.icons.length,tr('图标与资产','Icons & assets'))}${metric(DATA.project.scannedFiles,tr('扫描文件','Scanned files'))}</section>
 <section class="section"><div class="section-title"><h2>${tr(DATA.moduleMap?'功能模块':'源码归属',DATA.moduleMap?'Modules':'Source attribution')}</h2><span class="muted">${tr('源码归属 · 可跨模块使用','Source attribution · May span modules')}</span></div><div class="modules"><button class="module-card ${!moduleFilter?'active':''}" data-module=""><header><strong>${tr('全部','All')}</strong></header><footer>${allTokens.length} ${tr('项 Token / 资产','Tokens / assets')}</footer></button>${modules.map(moduleCard).join('')}</div></section>
 <section class="section"><div class="toolbar"><h2>${tr('原子样式','Atomic styles')}</h2><label class="search"><input id="search" aria-label="Search" placeholder="${tr('搜索 Token、功能位置','Search Token, location')}" value="${esc(query)}"></label></div><div class="source-tabs"><button data-source="tokens" class="${source==='tokens'?'active':''}">${tr('Token 与资产','Tokens & assets')}</button><button data-source="hard" class="${source==='hard'?'active':''}">${tr('源码直接样式值','Direct style values')}</button></div><div class="catalog"><aside class="side" aria-label="${tr('原子类型','Categories')}">${categories.map(([id,zh,en])=>`<button data-cat="${id}" class="${cat===id?'active':''}" aria-pressed="${cat===id}"><span class="cat-mark">${icon(id)}</span>${tr(zh,en)}<span class="cat-count">${count(source==='tokens'?allTokens:direct).filter(t=>t.category===id).length}</span></button>`).join('')}</aside><div class="sheet" id="sample-area">${rows()}</div></div></section><div class="bottom-bar"><span class="muted">${tr('未发现引用不等于可以删除','No reference found does not mean safe to delete')}</span><a class="btn" href="token-spec.html">${tr('设计 Token 规范','Token specification')} →</a></div><details class="artifact-foot"><summary>${tr('扫描范围与完整记录','Scan scope & full record')}</summary><p>${esc(DATA.generatedAt)} · ${esc(DATA.libraryVersion)}</p><a href="style-library-detail.html">${tr('查看完整源码明细与别名映射','Full source details & alias mappings')}</a></details>`;
}
document.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;if(el.hasAttribute('data-cat'))cat=el.dataset.cat;if(el.hasAttribute('data-module'))moduleFilter=el.dataset.module;if(el.hasAttribute('data-source'))source=el.dataset.source;const go=el.dataset.go;if(go==='lang')lang=lang==='zh'?'en':'zh';if(go==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(DATA,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='scan-data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return}page=go==='next'?page+1:go==='prev'?Math.max(0,page-1):0;render()});
document.addEventListener('input',e=>{if(e.target.id==='search'){query=e.target.value;page=0;document.querySelector('#sample-area').innerHTML=rows()}});
render();
