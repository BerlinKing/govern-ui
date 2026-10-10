import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export async function iconPackageRoot(repo,asset){
 let entry;
 try{entry=createRequire(path.resolve(repo,asset.file)).resolve(asset.source)}catch{
  const roots=JSON.parse(process.env.GOVERN_UI_ICON_PACKAGE_ROOTS||'{}');
  const root=roots[asset.source];if(!root)throw new Error('package-not-installed');
  const pkg=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
  if(pkg.name!==asset.source)throw new Error('package-name-mismatch');
  return root;
 }
 let root=path.dirname(entry);
 for(let i=0;i<6;i++,root=path.dirname(root)){try{if(JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).name===asset.source)return root}catch{}}
 throw new Error('package-root-unresolved');
}
// Statically read Radix's literal SVG primitives. Never evaluate dependency code.
export function radixPreview(content,name){
 if(!/^[A-Za-z_$][\w$]*$/.test(name))return null;
 const start=content.indexOf('var '+name+' =');if(start<0)return null;
 const end=content.indexOf('\n});',start);if(end<0)return null;
 const body=content.slice(start,end),viewBox=body.match(/viewBox:\s*"([\d. -]+)"/)?.[1];
 if(!viewBox)return null;
 const allowed=new Set(['d','fill','stroke','fillRule','clipRule','strokeWidth','strokeLinecap','strokeLinejoin','opacity','fillOpacity','cx','cy','r','x','y','width','height','rx','ry','points','x1','x2','y1','y2','transform']);
 const nodes=[];
 for(const m of body.matchAll(/createElement\("(path|circle|rect|line|polyline|polygon|ellipse)",\s*\{([^}]+)\}/g)){
  const attrs=[];
  for(const a of m[2].matchAll(/(\w+):\s*("(?:[^"\\]|\\.)*"|color|[\d.]+)/g)){
   if(!allowed.has(a[1]))continue;
   const value=a[2]==='color'?'currentColor':a[2][0]==='"'?JSON.parse(a[2]):a[2];
   if(/url\(|javascript:/i.test(value))return null;
   attrs.push(`${a[1].replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${esc(value)}"`);
  }
  nodes.push(`<${m[1]} ${attrs.join(' ')}/>`);
 }
 if(!nodes.length)return null;
 return 'data:image/svg+xml;base64,'+Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">${nodes.join('')}</svg>`).toString('base64');
}
export async function iconUsage(repo,asset,symbol){
 let ts;try{ts=createRequire(import.meta.url)(process.env.GOVERN_UI_TYPESCRIPT||'typescript')}catch{return {sizes:[],sizeEvidence:[],sizeStatus:'parser-unavailable'}}
 const source=await readFile(path.join(repo,asset.file),'utf8'),file=ts.createSourceFile(asset.file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const evidence=[];
 function walk(n){
  if((ts.isJsxSelfClosingElement(n)||ts.isJsxOpeningElement(n))&&n.tagName.getText(file)===symbol.local){
   const classes=[],dimensions={};let dynamic=false;
   for(const a of n.attributes.properties){if(!ts.isJsxAttribute(a)){dynamic=true;continue}const key=a.name.getText(file),init=a.initializer;
    let value=init&&ts.isStringLiteral(init)?init.text:init&&ts.isJsxExpression(init)&&init.expression&&(ts.isStringLiteral(init.expression)||ts.isNumericLiteral(init.expression))?init.expression.text:null;
    if(key==='className'&&value!==null)classes.push(...value.split(/\s+/));
    else if(['size','width','height'].includes(key)&&value!==null)dimensions[key]=/^\d+(\.\d+)?$/.test(value)?value+'px':value;
    else if(['className','style','size','width','height'].includes(key))dynamic=true;
   }
   const expressions=[];
   for(const c of classes){const m=c.match(/^(size|w|h)-(\d+(?:\.\d+)?|\[(\d+(?:\.\d+)?(?:px|rem|em))\])$/);if(m){dimensions[m[1]==='w'?'width':m[1]==='h'?'height':'size']=m[3]||`calc(var(--spacing) * ${m[2]})`;expressions.push(c)}}
   // Tailwind numeric utilities retain the spacing expression: no assumed root font or config.
   let size=dimensions.size||(dimensions.width&&dimensions.width===dimensions.height?dimensions.width:null);
   const base=process.env.GOVERN_UI_ICON_SPACING?.match(/^(\d+(?:\.\d+)?)(px|rem|em)$/),factor=size?.match(/^calc\(var\(--spacing\) \* ([\d.]+)\)$/);
   if(base&&factor)size=Number(base[1])*Number(factor[1])+base[2];
   evidence.push({file:asset.file,line:file.getLineAndCharacterOfPosition(n.getStart(file)).line+1,expression:n.getText(file),size,width:dimensions.width,height:dimensions.height,dynamic,classes:expressions,spacingBasis:base?process.env.GOVERN_UI_ICON_SPACING:null});
  }ts.forEachChild(n,walk);
 }walk(file);
 return {sizes:[...new Set(evidence.map(e=>e.size).filter(s=>s&&/^\d+(?:\.\d+)?(?:px|rem|em)$/.test(s)))],sizeEvidence:evidence,sizeStatus:evidence.length?'source-declarations':'consumer-unresolved'};
}
