// Optional integration check: Playwright + Chromium; run the standalone server first.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { chromium } = require('playwright');
const origin = 'http://127.0.0.1:5002';
const note = 'QA only: compare the two prints; no people participated.';
const imageName = 'PRIVATE-preview-marker.png';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=', 'base64');

async function exercise(browser, width) {
  const mobile = width <= 768;
  const context = await browser.newContext({ viewport: {width, height: 844}, hasTouch: mobile,
    isMobile: mobile, deviceScaleFactor: 1, reducedMotion: 'reduce', acceptDownloads: true });
  try {
    const problems = [], requests = [];
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    page.on('pageerror', e => problems.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') problems.push(m.text()); });
    // Never permit an off-device request from this test.
    await context.route(/^https?:/, route => {
      const req = route.request();
      if (new URL(req.url()).origin !== origin) {
        problems.push('External request to ' + new URL(req.url()).origin);
        return route.abort();
      }
      requests.push({method: req.method(), path: new URL(req.url()).pathname, body: req.postData()});
      return route.continue();
    });
    const use = l => mobile ? l.tap() : l.click();
    const btn = name => page.getByRole('button', {name, exact:true});
    const fit = async () => assert.equal(await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth), true, 'horizontal overflow at ' + width);
    const run = async counts => {
      const answer = page.waitForResponse(r => r.url() === origin + '/api/decision-lab/run');
      await use(page.locator('button[type=submit]'));
      const response = await answer;
      assert.equal(response.status(), 200);
      assert.equal(response.headers()['cache-control'], 'no-store');
      const body = await response.json();
      await page.getByRole('heading', {name:'The synthetic comparison'}).waitFor();
      assert.deepEqual(body.comparison.map(r => r.count), counts);
      assert.deepEqual(await page.locator('.chart-label strong').allTextContents(),
        counts.map(n => n + ' / 6'));
      assert.equal(await page.locator('.agent-response').count(), 6);
      assert.equal(body.method.human_participants, 0);
      assert.equal(body.method.model, null);
      assert.equal(body.method.confidence, null);
      if (mobile) {
        await page.waitForFunction(() => document.activeElement?.classList.contains('results-panel'));
        await page.waitForFunction(() => {
          const top = document.querySelector('.results-panel').getBoundingClientRect().top;
          return top >= -5 && top < innerHeight / 2;
        });
      }
      return body;
    };
    await page.goto(origin + '/decision-lab');
    await page.locator('button[type=submit]:enabled').waitFor();
    assert.ok(await page.locator('option[value=local_llm]').isDisabled());
    await fit();
    if (width === 390 || width === 1440) {
      // A real input activation raises Chromium's filechooser event. The OS dialog is automated.
      const choose = async (id, file) => {
        const event = page.waitForEvent('filechooser');
        await use(page.locator(id));
        await (await event).setFiles(file);
      };
      await use(page.locator('.image-details summary').first());
      await choose('#image-A', {name:'not-a-photo.svg', mimeType:'image/svg+xml', buffer:Buffer.from('<svg/>')});
      await page.getByRole('alert').filter({hasText:'Choose a PNG'}).waitFor();
      await choose('#image-A', {name:imageName, mimeType:'image/png', buffer:png});
      await page.waitForFunction(() => document.querySelector('.image-preview img')?.naturalWidth === 1);
      await use(page.locator('.reference-notes summary'));
      await choose('#notes-file', {name:'invalid.txt', mimeType:'text/plain', buffer:Buffer.from([255])});
      await page.getByRole('alert').filter({hasText:'UTF-8'}).waitFor();
      await choose('#notes-file', {name:'fixture.txt', mimeType:'text/plain', buffer:Buffer.from(note)});
      await page.waitForFunction(n => document.querySelector('#context').value === n, note);
      assert.equal(requests.filter(r=>r.method === 'POST').length, 0, 'picking files must not transmit them');
      const result = await run([2,1,3]);
      assert.equal(result.study.context, note);
      const posts = requests.filter(r=>r.method === 'POST');
      assert.equal(posts.length, 1);
      assert.equal(posts[0].path, '/api/decision-lab/run');
      const transmitted = JSON.parse(posts[0].body);
      assert.equal(transmitted.context, note);
      assert.deepEqual(Object.keys(transmitted).sort(), ['alternatives','audience','budget','context','mode','question','scenario']);
      assert.equal(/PRIVATE-preview|iVBORw0KGgo|blob:|data:image|fixture\.txt/.test(posts[0].body), false);
      await use(page.locator('.agent-response summary').nth(1));
      await page.locator('.agent-response[open] .evaluation').first().waitFor();
      assert.equal(await page.locator('.agent-response[open] .evaluation').count(), 2);
      await fit();
      for (const [format,label] of [['json','JSON'], ['csv','CSV'], ['txt','Report .txt']]) {
        const saved = page.waitForEvent('download');
        await use(btn(label));
        const dl = await saved;
        assert.equal(dl.suggestedFilename(), 'decision-lab-' + result.run_id + '.' + format);
        const content = await fs.readFile(await dl.path(), 'utf8');
        assert.equal(/PRIVATE-preview|iVBORw0KGgo|blob:|data:image|fixture\.txt/.test(content), false);
        assert.match(content, /not customer research/i);
        if (format === 'json') assert.deepEqual(JSON.parse(content), result);
        if (format === 'csv') assert.equal(content.trim().split(/\r?\n/).length, 7);
        if (format === 'txt') { assert.ok(content.includes(note)); assert.match(content,/REAL-WORLD VALIDATION PLAN/); }
      }
      await page.locator('#price-A').fill('1000');
      assert.equal(await page.locator('.export-row').count(), 0);
      await run([0,2,4]);
      await use(btn('Remove image'));
      assert.equal(await page.locator('.image-preview').count(), 0);
      await use(btn('+ Add third'));
      assert.equal(await page.locator('.alternative').count(), 3);
      await use(btn('Remove alternative C'));
      await use(btn('Product'));
      await run([4,2,0,0]);
      await use(btn('Clear session'));
      assert.equal(await page.locator('#audience').inputValue(), '');
      assert.equal(await page.locator('#context').inputValue(), '');
      assert.equal(await page.locator('.export-row').count(), 0);
    } else {
      // A valid single-word title must not push the chart off a narrow screen.
      if (width === 320) await page.locator('#title-A').fill('X'.repeat(100));
      await run([2,1,3]);
      await use(page.locator('.methodology summary'));
      await fit();
    }
    assert.deepEqual(problems, []);
    assert.deepEqual(await context.storageState(), {cookies:[], origins:[]});
    console.log(width + 'px: ' + (mobile ? 'touch' : 'mouse') + ', layout, rules and privacy passed');
  } finally { await context.close(); }
}
(async () => {
  const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || undefined, headless:true});
  try { for (const width of [390,1440,320,360,768,1024]) await exercise(browser, width); }
  finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
