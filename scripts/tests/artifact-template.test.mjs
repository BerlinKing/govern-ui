import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {theme,renderArtifact,applyArtifactTheme,ARTIFACT_VERSION} from '../lib/artifact-theme.mjs';
import {generateArtifact} from '../artifacts.mjs';
test('fixed template is data-independent, offline, escaped and versioned',async()=>{
 const {css,hash}=await theme();
 const lock=JSON.parse(await readFile(new URL('../../assets/artifacts/template-lock.json',import.meta.url),'utf8'));
 assert.equal(hash,lock.styleHash);assert.equal(ARTIFACT_VERSION,lock.version);
 for(const id of ['A','B','C','D']){
  const html=await renderArtifact(id,{pending:true,project:'</script><script>alert(1)</script>'});
  assert.ok(html.includes(css));assert.ok(html.includes(hash));assert.equal((html.match(/aria-current="page"/g)||[]).length,1);
  assert.ok(!html.includes('</script><script>alert(1)'));
  assert.ok(!/<script[^>]+src=|<link[^>]+href=/i.test(html));
  const js=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];assert.doesNotThrow(()=>new Function(js));
 }
 const compat=await applyArtifactTheme('<html><head></head><body><main>editor</main></body></html>','B');assert.ok(compat.includes(css));assert.ok(compat.includes('<main>editor</main>'));
});
test('C decisions and D outcomes remain separate from authorization and source writes',async()=>{
 const out=await mkdtemp(path.join(tmpdir(),'govern-artifact-test-'));
 try{
  const c={schema:'governui.artifact/1',artifact:'C',project:'test-fixture',scope:'test only',baseline:'fixture',groups:[{id:'g1',module:'Test module',title:'Test role',status:'needs-attention',occurrences:[]}]};
  const f=await generateArtifact(c,out),html=await readFile(f.html,'utf8');
  assert.ok(html.includes('recorded-not-authorized'));assert.ok(!html.includes('320'));
  await assert.rejects(()=>generateArtifact({...c,groups:[...c.groups,...c.groups]},out),/Invalid audit group/);
  const d={...c,artifact:'D',status:'partial',conclusion:'Test outcome, not a real cleanup',metrics:{tokensChanged:0,filesChanged:0,linesAdded:0,linesRemoved:0},modules:[],captures:[],residuals:['unverified'],deliverables:[]};
  await generateArtifact(d,out);await assert.rejects(()=>generateArtifact({...d,status:'complete'},out),/conflicts/);
  await assert.rejects(()=>generateArtifact({...d,deliverables:[{file:'https://example.com'}]},out),/local relative/);
 }finally{await rm(out,{recursive:true,force:true})}
});
