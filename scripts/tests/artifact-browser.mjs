import assert from 'node:assert/strict';
import {readFile,mkdtemp} from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createServer} from 'node:http';
import {generateArtifact} from '../artifacts.mjs';
const {chromium}=await import(pathToFileURL(process.env.GOVERNUI_PLAYWRIGHT).href);
const out=process.env.GOVERNUI_ARTIFACT_OUTPUT||await mkdtemp(path.join(tmpdir(),'governui-visual-test-'));
const reportDir=process.env.GOVERNUI_REPORT_DIR;
if(!reportDir)throw Error('GOVERNUI_REPORT_DIR must identify generated real A/B reports');
const c={schema:'governui.artifact/1',artifact:'C',project:'Explicit test fixture',scope:'UI test only',baseline:'test-fixture',frameworkRevision:'fixture-v1',groups:[{id:'test1',module:'Test module',title:'Test confirmation group',status:'needs-attention',reason:'Test-only fixture',current:'#FFFFFF',proposed:'#F5F5F5',target:'--test',occurrences:[{file:'fixture.css',line:1,location:'Test panel'}]}]};
await generateArtifact(c,out);
await generateArtifact({...c,artifact:'D',status:'partial',conclusion:'Explicit UI test fixture',metrics:{tokensChanged:2,filesChanged:1,linesAdded:2,linesRemoved:2},modules:[{name:'Test module',status:'partial',summary:'Test-only summary'}],captures:[],residuals:['Runtime unverified'],deliverables:[]},out);
const server=createServer(async(req,res)=>{try{const file=path.basename(new URL(req.url,'http://local').pathname)||'scan.html';const dir=['governance-audit.html','governance-report.html'].includes(file)?out:reportDir;res.setHeader('Content-Type','text/html;charset=utf-8');res.end(await readFile(path.join(dir,file)))}catch{res.statusCode=404;res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.GOVERNUI_CHROME});
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const file of ['scan.html','token-spec.html','governance-audit.html','governance-report.html']){
  await page.goto(`http://127.0.0.1:${server.address().port}/${file}`);
  assert.equal(await page.locator('.artifact-header nav a').count(),4);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(246, 247, 249)');
  for(const width of [1440,1024,768,390]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${file}: ${width}`);if(width===1440||width===390)await page.screenshot({path:path.join(out,file.replace('.html',`-${width}.png`)),fullPage:false})}
 }
 await page.goto(`http://127.0.0.1:${server.address().port}/scan.html`);
 for(const cat of ['color','typography','icons','shadow','stroke','radius','spacing','opacity','blur','layer','motion','other']){await page.locator(`[data-cat="${cat}"]`).click();await page.locator('[data-source="hard"]').click();await page.locator('[data-source="tokens"]').click()}
 await page.locator('[data-cat="color"]').click();await page.locator('#search').fill('unlikely-no-results');assert.equal(await page.locator('.sample-card').count(),0);await page.locator('#search').fill('');
 const download=page.waitForEvent('download');await page.locator('[data-go="export"]').click();assert.ok(JSON.parse(await readFile(await(await download).path(),'utf8')).tokens.length);
 await page.goto(`http://127.0.0.1:${server.address().port}/governance-audit.html`);await page.locator('.review-module>summary').click();await page.locator('.issue>summary').click();await page.locator('select[name="action"]').selectOption('删除');await page.locator('button[type="submit"]').click();assert.equal(await page.locator('.issue').count(),0);const dl=page.waitForEvent('download');await page.locator('#export').click();const decision=JSON.parse(await readFile(await(await dl).path(),'utf8'));assert.equal(decision.authorization,'none');assert.equal(decision.decisions.test1.action,'删除');
 assert.deepEqual(errors,[]);console.log('PASS: A/B real data + C/D explicit fixtures; shared CSS, four viewports, category/search/export, draft decisions; screenshots: '+out);
}finally{await browser.close();await new Promise(r=>server.close(r))}
