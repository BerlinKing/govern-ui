import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {generateFramework} from '../framework.mjs';

// Use an existing installation; never install dependencies from the test.
export async function runBrowserTests(){
 const runtime=process.env.GOVERNUI_PLAYWRIGHT||'playwright';
 const {chromium}=await import(path.isAbsolute(runtime)?pathToFileURL(runtime).href:runtime);
 const dir=await mkdtemp(path.join(tmpdir(),'govern-framework-'));
 await generateFramework({schema:'governui.framework-input/1',project:'empty-fixture',scope:'test only',baseline:'fixture-empty'},dir);
 const catalog=JSON.parse(await readFile(new URL('../../assets/atomic-framework-catalog.json',import.meta.url),'utf8'));
 const server=createServer(async(req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile(path.join(dir,'framework.html')))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
 browser=await chromium.launch({headless:true,...(process.env.GOVERNUI_CHROME?{executablePath:process.env.GOVERNUI_CHROME}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}`);
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('governui-framework-empty-fixture-v2')));
 const choose=async id=>page.locator(`[data-atom="${id}"]`).click();
 assert.equal((await read()).categories.length,12);assert.equal(await page.locator('input[type="checkbox"]').count(),0);
 for(const c of catalog.categories){
  await choose(c.id);assert.equal(await page.locator('tbody tr').count(),c.roles.length);
  assert.equal(await page.locator('[data-action="binding"]').count(),c.roles.length);
  assert.equal(await page.locator('#adoption').inputValue(),'undecided');assert.equal(await page.locator('[data-action="lock"]').isDisabled(),true);
  await page.locator('[data-action="binding"]').first().click();
  for(const f of c.fields)assert.ok(await page.locator('#b-'+f.id).inputValue(),`${c.id}.${f.id} seeded`);
  await page.locator('#token-meaning').fill(`Purpose for ${c.id}`);await page.locator('button[type="submit"]').click();
  assert.equal(await page.locator('dialog').isVisible(),false,c.id);
  const row=(await read()).categories.find(x=>x.id===c.id).rows[0];assert.equal(row.meaning[0],`Purpose for ${c.id}`);assert.ok(row.binding);
 }
 await choose('color');const count=(await read()).categories.find(c=>c.id==='color').rows.length;
 await page.locator('[data-action="add"]').click();await page.locator('[data-action="cancel"]').click();assert.equal((await read()).categories.find(c=>c.id==='color').rows.length,count);
 await page.locator('[data-action="add"]').click();
 for(const [k,v] of Object.entries({label:'Test accent',name:'--test-accent',meaning:'Test-only role',location:'Fixture',scope:'Test'}))await page.locator('#token-'+k).fill(v);
 await page.locator('#b-light').fill('invalid-color');await page.locator('button[type="submit"]').click();assert.ok(await page.locator('#error').innerText());
 await page.locator('#b-light').fill('#12345680');await page.locator('button[type="submit"]').click();assert.equal(await page.locator('dialog').isVisible(),false);
 const added=(await read()).categories.find(c=>c.id==='color').rows.at(-1);assert.equal(added.binding.values.light,'#12345680');
 await page.reload();await choose('color');assert.equal((await read()).categories.find(c=>c.id==='color').rows.length,count+1);
 await page.locator(`[data-action="remove-role"][data-id="${added.id}"]`).click();assert.equal((await read()).categories.find(c=>c.id==='color').rows.length,count);
 await page.locator('[data-action="undo-remove"]').click();assert.equal((await read()).categories.find(c=>c.id==='color').rows.length,count+1);
 await choose('blur');await page.locator('#adoption').selectOption('unused');assert.equal(await page.locator('[data-action="lock"]').isDisabled(),true);
 await page.locator('#decision-reason').fill('Test scope does not use blur');await page.locator('[data-action="lock"]').click();await page.locator('[data-action="confirm-lock"]').click();
 const locked=(await read()).categories.find(c=>c.id==='blur');assert.equal(locked.locked,true);
 await page.reload();await choose('blur');assert.equal(await page.locator('#adoption').isDisabled(),true);
 await page.locator('[data-action="revision"]').click();await page.locator('[data-action="binding"]').first().click();await page.locator('#token-meaning').fill('Revised meaning');await page.locator('button[type="submit"]').click();
 const revised=(await read()).categories.find(c=>c.id==='blur');assert.equal(revised.version,locked.version+1);assert.deepEqual(revised.history,locked.history);
 const dl=page.waitForEvent('download');await page.locator('#export').click();const json=JSON.parse(await readFile(await(await dl).path(),'utf8'));
 assert.equal(json.categories.length,12);assert.equal(json.authorization,'framework-only-no-code-writes');
 const md=page.waitForEvent('download');await page.locator('#manual').click();assert.ok((await readFile(await(await md).path(),'utf8')).includes('--test-accent'));
 await page.locator('#lang').click();assert.equal(await page.locator('html').getAttribute('lang'),'en');
 for(const width of [1440,1024,768,390]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow ${width}`)}
 assert.deepEqual(errors,[]);console.log('PASS: 12 unified editors, seeded values, validation, cancel/add/delete/undo, persistence, confirmation/revisions, JSON/MD, language, 4 viewports; zero page errors');
 }finally{await browser?.close();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true})}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await runBrowserTests();
