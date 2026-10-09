import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtemp, readFile, writeFile, cp, readdir, symlink } from 'node:fs/promises';
import os from 'node:os';
import vm from 'node:vm';
import { reconRepository, writeRecon } from '../lib/element-recon.mjs';

const fixture = fileURLToPath(new URL('./fixtures/element-recon', import.meta.url));
const options = { typescript: process.env.GOVERN_UI_TYPESCRIPT };
const opening = { location: ['右下角','Bottom right'], preconditions: ['项目已打开','Project open'], steps: [['打开控件','Open controls']], evidence: [{ file:'controls.tsx',contains:'data-feature="zoom"' }] };
const element = (id, tag, extra={}) => ({ id, nodeId:'zoom', title:[id,id], file:'controls.tsx',kind:'surface',locator:{tag},opening,contextLabel:['默认','Default'],...extra });
const scope = { schemaVersion:1,id:'pilot',repositoryId:'fixture',project:'Fixture',nodes:[{id:'canvas',title:['Canvas','Canvas']},{id:'zoom',parentId:'canvas',title:['缩放','Zoom']}],entries:[{file:'entry.tsx',tag:'Controls',targetFile:'controls.tsx'}],styleSources:['tokens.css'],adapterSources:['tailwind.config.ts'],elements:[element('input','input',{kind:'text-input'}),element('panel','Panel',{sharedOwner:'shared-panel'}),element('second-consumer','Panel',{sharedOwner:'shared-panel'}),element('hint','span',{inheritsFrom:'panel'}),element('other','button',{kind:'button'})] };

test('source facts retain module, element, branches, aliases and shared root identity',async()=>{
  const report=await reconRepository(fixture,scope,options);
  assert.equal(report.elements.length,5);
  const input=report.elements[0];
  assert.equal(input.facts.find(f=>f.value==='text-white/35').active,false);
  assert.equal(report.issues.some(i=>i.rule==='literal-color'),false,'inactive literal is not a cleanup issue');
  const text=input.facts.find(f=>f.value==='text-color-icon-primary');
  assert.deepEqual(text.refs,['--icon-primary']);
  assert.equal(text.definitionCandidates.length,2,'retain conflicting modes without guessing cascade');
  assert.ok(input.facts.find(f=>f.value==='font-ui').refs.includes('--font-ui-current'));
  assert.equal(report.issues.find(i=>i.rule==='literal-shadow').occurrences.length,2);
  assert.equal(report.issues.filter(i=>i.rule==='literal-shadow').length,1,'one shared declaration, two affected elements');
  assert.equal(report.issues.some(i=>i.source.excerpt==='w-11'),false,'a fixed size is not automatically a problem');
  assert.equal(report.issues.find(i=>i.rule==='focus-check').verdict,'runtime-check');
  assert.ok(report.elements.at(-1).unresolved.length>0);
  assert.equal(report.coverage.runtimeVerified,0);
  assert.equal(report.receipt.completed,0);
  assert.equal(report.receipt.needsUserDecision.length+report.receipt.blocked.length+report.receipt.queued.length,report.summary.issueRoots);
  assert.ok(report.elements.every(e=>e.opening.status==='source-inferred'));
});

test('IDs survive added blank lines; stale or ambiguous anchors stop instead of guessing',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'govern-recon-test-'));await cp(fixture,dir,{recursive:true});
  const before=await reconRepository(dir,scope,options);
  const original=await readFile(path.join(dir,'controls.tsx'),'utf8');await writeFile(path.join(dir,'controls.tsx'),'\n\n'+original);
  const after=await reconRepository(dir,scope,options);
  assert.deepEqual(after.issues.map(i=>i.id),before.issues.map(i=>i.id));
  assert.notEqual(after.id,before.id,'report fingerprint captures source drift');
  await assert.rejects(()=>reconRepository(dir,{...scope,elements:[element('missing','Missing')]},options),/found 0/);
  await assert.rejects(()=>reconRepository(dir,{...scope,elements:[element('bad','Panel',{locator:{tag:'Panel',count:2}})]},options),/found 1/);
});

test('read-only run, portable HTML, escaping, cycle validation, out-of-scope output refusal',async()=>{
  const before=await Promise.all((await readdir(fixture)).map(async f=>[f,await readFile(path.join(fixture,f),'utf8')]));
  const report=await reconRepository(fixture,{...scope,project:'</script><script>bad()</script>'},options);
  const dir=await mkdtemp(path.join(os.tmpdir(),'govern-recon-output-'));
  const files=await writeRecon(report,dir),html=await readFile(files.html,'utf8');
  assert.ok(!html.includes('</script><script>bad()'));
  assert.ok(!/<script[^>]+src=|<link[^>]+href=/i.test(html));
  for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
  assert.ok(!html.includes('__RECON_DATA__'));
  await assert.rejects(()=>writeRecon(report,path.join(fixture,'forbidden-output')),/outside/);
  assert.ok(!(await readdir(fixture)).includes('forbidden-output'));
  const alias=path.join(dir,'repository-alias');await symlink(fixture,alias);
  await assert.rejects(()=>writeRecon(report,path.join(alias,'forbidden-output')),/scanned repository/);
  await assert.rejects(()=>reconRepository(fixture,{...scope,nodes:[{id:'zoom',parentId:'zoom'}]},options),/cycle/);
  for(const [f,content]of before)assert.equal(await readFile(path.join(fixture,f),'utf8'),content);
});
