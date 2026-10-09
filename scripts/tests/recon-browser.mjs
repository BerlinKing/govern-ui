import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

const report = path.resolve(process.argv[2]);
const { chromium } = await import(process.env.GOVERN_UI_PLAYWRIGHT || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.GOVERN_UI_CHROME ? { executablePath: process.env.GOVERN_UI_CHROME } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [], external = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', req => { if (/^https?:/.test(req.url())) external.push(req.url()); });
  await page.goto(pathToFileURL(report).href);
  const data = await page.locator('#recon-data').evaluate(e => JSON.parse(e.textContent));
  assert.equal(await page.locator('#rows tr').count(), data.issues.length);
  await page.locator('#elements-tab').click();
  assert.equal(await page.locator('#rows tr').count(), data.elements.length);
  await page.locator('[data-node="zoom"]').click();
  assert.equal(await page.locator('#rows tr').count(), 1);
  await page.locator('[data-detail]').first().click();
  assert.equal(await page.locator('dialog').evaluate(e => e.open), true);
  assert.match(await page.locator('#detail-body').innerText(), /Enter|Escape/);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('dialog').evaluate(e => e.open), false);
  await page.locator('[data-node="canvas"]').click();
  await page.locator('#issues-tab').click();
  await page.locator('#category').selectOption('shadow');
  assert.equal(await page.locator('#rows tr').count(), 1);
  await page.locator('#search').fill('no-match-for-this-search');
  assert.match(await page.locator('#rows').innerText(), /没有记录/);
  await page.locator('#search').fill('');
  await page.locator('#category').selectOption('all');
  await page.locator('#lang').click();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.match(await page.locator('#issues-tab').innerText(), /Issues/);
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  assert.equal(JSON.parse(await readFile(await download.path(), 'utf8')).id, data.id);
  await page.locator('#lang').click();
  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `outer overflow at ${width}`);
    await page.locator('[data-detail]').first().click();
    assert.equal(await page.locator('dialog').evaluate(e => e.scrollWidth <= e.clientWidth), true, `dialog overflow at ${width}`);
    await page.locator('#close').click();
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(path.dirname(report), 'recon-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.screenshot({ path: path.join(path.dirname(report), 'recon-mobile.png'), fullPage: true });
  assert.deepEqual(errors, []); assert.deepEqual(external, []);
  console.log('Recon browser passed: tree, tabs, filters, details, Escape, bilingual UI, JSON export, 4 widths, no remote requests.');
} finally { await browser.close(); }
