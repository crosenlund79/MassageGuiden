// End-to-end smoke test against the production build (vite preview).
// Usage: npm run build && npm run e2e
// Uses the Playwright/Chromium that is installed globally on the machine.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';

const { chromium } = createRequire(import.meta.url)('playwright');
const BASE = process.env.E2E_URL ?? 'http://127.0.0.1:4173/';

let server;
if (!process.env.E2E_URL) {
  server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE)).ok) break; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
}

const results = [];
const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✔' : '✘'} ${name}${extra ? ` – ${extra}` : ''}`);
};

const textIs = (pg, sel, text) =>
  pg.waitForFunction(([s, t]) => document.querySelector(s)?.textContent?.trim() === t, [sel, text], { timeout: 3000 }).then(() => true, () => false);

/** Taps a muscle at a point where it is actually the topmost element (like a real user would). */
async function tapMuscle(pg, id, scope = '') {
  const pt = await pg.evaluate(([id, scope]) => {
    const svg = document.querySelector(`${scope} .atlas-figure svg`);
    for (const el of svg.querySelectorAll(`path[data-muscle="${id}"]`)) {
      const r = el.getBoundingClientRect();
      for (let fy = 0.5; fy > 0.05 && fy < 0.95; fy = fy >= 0.5 ? 1 - fy + 0.05 : 1 - fy) {
        for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
          const x = r.left + r.width * fx, y = r.top + r.height * fy;
          const hit = document.elementFromPoint(x, y);
          if (hit?.getAttribute('data-muscle') === id) return { x, y };
        }
      }
    }
    return null;
  }, [id, scope]);
  if (!pt) return false;
  await pg.mouse.click(pt.x, pt.y);
  return true;
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

try {
  // --- launch & navigation
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('app loads', (await page.locator('h1').first().innerText()).includes('massage'));
  for (const [label, heading] of [['Massagegreb', 'Greb fra hæftet'], ['Muskelatlas', 'Kroppens muskler'], ['Quiz', 'Træn din anatomi'], ['Favoritter', 'Favoritter og noter'], ['Forside', 'massage']]) {
    await page.locator('.sidebar nav a', { hasText: label }).click();
    const ok = await page.waitForFunction((h) => document.querySelector('h1')?.textContent?.includes(h), heading, { timeout: 3000 }).then(() => true, () => false);
    check(`nav → ${label}`, ok);
  }

  // --- search
  await page.locator('.hero input').fill('trapezius');
  await page.locator('.hero input').press('Enter');
  await page.waitForSelector('.tech-row');
  const hits = await page.locator('.tech-row').count();
  check('search "trapezius" finds techniques', hits >= 3, `${hits} hits`);
  await page.locator('.tech-toolbar input').fill('kappemusklen');
  check('search by Danish muscle name', (await page.locator('.tech-row').count()) === hits);

  // --- region browsing
  await page.goto(BASE + '#/greb?region=ansigt');
  check('region filter shows only that region', (await page.locator('.region-block').count()) === 1 && (await page.locator('.gap-row').count()) === 1);

  // --- technique page, favorite, note, persistence
  await page.goto(BASE + '#/greb/ryg-2');
  await page.waitForSelector('h1');
  check('technique page shows real content', (await page.locator('h1').innerText()).includes('trapezius') && (await page.locator('blockquote').innerText()).includes('Petrissage af øvre Trapezius'));
  await page.locator('.fav-btn').click();
  await page.locator('.note-card textarea').fill('Blødt tryk, frem og tilbage.');
  await page.waitForSelector('text=Gemt lokalt');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.querySelector('.note-card textarea')?.value?.length > 0);
  check('note persists after reload', (await page.locator('.note-card textarea').inputValue()) === 'Blødt tryk, frem og tilbage.');
  check('favorite persists after reload', (await page.locator('.fav-btn').getAttribute('aria-pressed')) === 'true');
  await page.locator('.pager .next').click();
  check('next technique navigation', page.url().endsWith('/greb/ryg-3'));
  await page.locator('.muscle-link').first().click();
  check('technique → muscle link', page.url().endsWith('/atlas/levator-scapulae') && (await page.locator('#mp-h').innerText()) === 'Skulderbladsløfteren');

  // --- atlas: click a muscle & search
  await page.goto(BASE + '#/atlas');
  await page.locator('.segmented button', { hasText: 'Forfra' }).click();
  await page.locator('path[data-muscle="deltoideus"]').first().click({ force: true });
  check('clicking a muscle opens detail panel', (await page.locator('#mp-h').innerText()) === 'Deltamusklen');
  check('selected muscle is highlighted', (await page.locator('path.m-selected[data-muscle="deltoideus"]').count()) >= 2);
  check('related techniques listed', (await page.locator('.mini-tech a').count()) >= 1);
  await page.locator('.atlas-layout input[type=search]').fill('flynder');
  await page.locator('.suggest button').first().click();
  check('muscle search selects muscle', await textIs(page, '#mp-h', 'Flyndermusklen'));
  const vb1 = await page.locator('.atlas-stage svg').getAttribute('viewBox');
  await page.locator('.zoom-controls button[aria-label="Zoom ind"]').click();
  const vb2 = await page.locator('.atlas-stage svg').getAttribute('viewBox');
  check('zoom changes viewBox', vb1 !== vb2);

  // --- cursor-centred wheel zoom: the figure point under the cursor must not move
  await page.locator('.zoom-controls .zoom-reset').click();
  const userAt = (cx, cy) => page.evaluate(([x, y]) => {
    const svg = document.querySelector('.atlas-stage svg');
    const p = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM().inverse());
    return { x: p.x, y: p.y };
  }, [cx, cy]);
  const stageBox = await page.locator('.atlas-stage svg').boundingBox();
  const spots = [[0.25, 0.2], [0.7, 0.35], [0.5, 0.8], [0.15, 0.65]];
  let maxDrift = 0;
  const scrollBefore = await page.evaluate(() => window.scrollY);
  for (const [fx, fy] of spots) {
    const cx = stageBox.x + stageBox.width * fx, cy = stageBox.y + stageBox.height * fy;
    await page.mouse.move(cx, cy);
    const before = await userAt(cx, cy);
    for (const dy of [-120, -120, -60, 100]) { await page.mouse.wheel(0, dy); await page.waitForTimeout(40); }
    const after = await userAt(cx, cy);
    maxDrift = Math.max(maxDrift, Math.hypot(after.x - before.x, after.y - before.y));
  }
  check('wheel zoom keeps the point under the cursor fixed (4 positions)', maxDrift < 0.5, `max drift ${maxDrift.toFixed(3)} units`);
  check('wheel zoom does not scroll the page', (await page.evaluate(() => window.scrollY)) === scrollBefore);
  // zoom limits: many wheel-ins stop at the minimum width, and the anchor still holds
  const cx0 = stageBox.x + stageBox.width * 0.4, cy0 = stageBox.y + stageBox.height * 0.3;
  await page.mouse.move(cx0, cy0);
  const b0 = await userAt(cx0, cy0);
  for (let i = 0; i < 25; i++) await page.mouse.wheel(0, -200);
  await page.waitForTimeout(60);
  const vbw = Number((await page.locator('.atlas-stage svg').getAttribute('viewBox')).split(' ')[2]);
  const b1 = await userAt(cx0, cy0);
  check('zoom-in limit respected and anchored', vbw >= 39 && Math.hypot(b1.x - b0.x, b1.y - b0.y) < 0.5, `viewBox width ${vbw.toFixed(1)}`);
  await page.locator('.zoom-controls .zoom-reset').click();

  // --- every drawn muscle has a tappable area (not fully hidden under other shapes)
  await page.goto(BASE + '#/atlas');
  await page.locator('.zoom-controls .zoom-reset').click();
  await page.locator('.toggle input').check();
  for (const v of ['Forfra', 'Bagfra']) {
    await page.locator('.segmented button', { hasText: v }).click();
    await page.waitForTimeout(200);
    const report = await page.evaluate(() => {
      const svg = document.querySelector('.atlas-stage svg');
      const ids = [...new Set([...svg.querySelectorAll('path[data-muscle]')].map((p) => p.getAttribute('data-muscle')))];
      const unreachable = [];
      for (const id of ids) {
        let hits = 0;
        for (const el of svg.querySelectorAll(`path[data-muscle="${id}"]`)) {
          const r = el.getBoundingClientRect();
          for (let i = 1; i < 12; i++) for (let j = 1; j < 12; j++) {
            const hit = document.elementFromPoint(r.left + (r.width * i) / 12, r.top + (r.height * j) / 12);
            if (hit?.getAttribute('data-muscle') === id) hits++;
          }
        }
        if (hits < 4) unreachable.push(`${id}(${hits})`);
      }
      return { count: ids.length, unreachable };
    });
    check(`${v}: all ${report.count} muscles tappable`, report.unreachable.length === 0, report.unreachable.join(', '));
  }
  await page.locator('.toggle input').uncheck();

  // --- quiz: Find musklen (answer correctly by clicking the target)
  await page.goto(BASE + '#/quiz');
  await page.locator('.segmented button', { hasText: /^5$/ }).click();
  await page.locator('.mode-card').nth(0).locator('button').click();
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector('.prompt');
    const target = await page.locator('.prompt').innerText();
    let clicked = false;
    for (const v of ['Forfra', 'Bagfra']) {
      await page.locator('.quiz-stage .segmented button', { hasText: v }).click();
      const ids = await page.locator('.quiz-stage path[data-muscle]').evaluateAll((els) => els.map((e) => e.getAttribute('data-muscle')));
      const expected = await page.locator('.prompt').getAttribute('data-muscle');
      if (expected && ids.includes(expected)) {
        clicked = await tapMuscle(page, expected, '.quiz-stage');
        if (clicked) break;
      }
    }
    if (!clicked) throw new Error('target muscle not found in either view: ' + target);
    await page.waitForSelector('.feedback.ok');
    await page.locator('.quiz-shell .btn-sage').click();
  }
  check('find quiz completes with summary', (await page.locator('h1').innerText()).includes('5 af 5'));

  // --- quiz feedback colours: wrong = chosen RED + correct GREEN together; correct = GREEN
  await page.locator('text=Til quiz-oversigt').click();
  await page.locator('.segmented button', { hasText: /^Alle/ }).click();
  await page.locator('.mode-card').nth(0).locator('button').click();
  let wrongChecked = 0, splitSeen = 0, correctChecked = 0;
  const total = Number((await page.locator('.quiz-head').innerText()).match(/af (\d+)/)[1]);
  for (let i = 0; i < total; i++) {
    await page.waitForSelector('.prompt');
    const expected = await page.locator('.prompt').getAttribute('data-muscle');
    const answerRight = i % 3 === 2;
    if (answerRight) {
      for (const v of ['Forfra', 'Bagfra']) {
        await page.locator('.quiz-stage .segmented button', { hasText: v }).click();
        if (await tapMuscle(page, expected, '.quiz-stage')) break;
      }
      await page.waitForSelector('.feedback');
      const green = await page.locator(`.quiz-stage path.m-correct[data-muscle="${expected}"]`).count();
      if (green > 0 && (await page.locator('.quiz-stage path.m-wrong').count()) === 0) correctChecked++;
    } else {
      // tap some other muscle in the current view
      if (i % 3 === 1) {
        // answer from the opposite side of the body – forces the side-by-side feedback for one-sided muscles
        const on = await page.locator('.quiz-stage .segmented button.on').innerText();
        await page.locator('.quiz-stage .segmented button', { hasText: on === 'Forfra' ? 'Bagfra' : 'Forfra' }).click();
      }
      const candidates = await page.evaluate((exp) => [...new Set([...document.querySelectorAll('.quiz-stage path[data-muscle]')].map((p) => p.dataset.muscle))].filter((id) => id !== exp), expected);
      let other = null;
      for (const c of candidates.sort(() => Math.random() - 0.5)) { if (await tapMuscle(page, c, '.quiz-stage')) { other = c; break; } }
      await page.waitForSelector('.feedback.bad');
      const red = await page.locator(`.quiz-stage path.m-wrong[data-muscle="${other}"]`).count();
      const green = await page.locator(`.quiz-stage path.m-correct[data-muscle="${expected}"]`).count();
      const named = (await page.locator('.feedback').innerText()).length > 40;
      if (await page.locator('.fig-wrap.split').count()) splitSeen++;
      if (red > 0 && green > 0 && named) wrongChecked++;
      else console.log('  feedback problem', JSON.stringify({ expected, other, red, green, named, split: await page.locator('.fig-wrap.split').count() }));
      await page.waitForTimeout(400); // feedback must stay until "Next"
      if ((await page.locator('.quiz-stage path.m-wrong').count()) === 0) wrongChecked = -999;
    }
    await page.locator('.quiz-shell .btn-sage').click();
  }
  const wrongTotal = [...Array(total).keys()].filter((i) => i % 3 !== 2).length;
  check(`wrong answers show chosen muscle red + correct green, all muscles (${total} questions)`, wrongChecked === wrongTotal, `${wrongChecked}/${wrongTotal}, side-by-side views ${splitSeen}`);
  check('side-by-side views shown when correct muscle is on the other side', splitSeen > 0, `${splitSeen} times`);
  check('correct answers show the muscle green', correctChecked === total - wrongTotal, `${correctChecked}/${total - wrongTotal}`);
  await page.locator('text=Til quiz-oversigt').click();
  await page.locator('.segmented button', { hasText: /^5$/ }).click();

  // --- quiz: Navngiv musklen (deliberately answer wrong once, then retry)
  await page.locator('.mode-card').nth(1).locator('button').click();
  let wrongDone = false;
  for (let i = 0; i < 5; i++) {
    await page.waitForSelector('.option');
    const expected = await page.locator('.options').getAttribute('data-muscle');
    const opts = page.locator('.option');
    const n = await opts.count();
    check(`name quiz q${i + 1} has 4 options`, n === 4);
    for (let k = 0; k < n; k++) {
      const id = await opts.nth(k).getAttribute('data-muscle');
      if (!wrongDone ? id !== expected : id === expected) { await opts.nth(k).click(); break; }
    }
    if (!wrongDone) {
      check('wrong answer shows correct answer', (await page.locator('.option.correct').count()) === 1 && (await page.locator('.feedback.bad').count()) === 1);
      wrongDone = true;
    }
    await page.locator('.quiz-shell .btn-sage').click();
  }
  check('name quiz summary', (await page.locator('h1').innerText()).includes('4 af 5'));
  await page.locator('text=Øv de 1 forkerte igen').click();
  check('retry incorrect starts 1-question round', (await page.locator('.quiz-head').innerText()).includes('1 af 1'));
  await page.locator('text=Afslut').click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.list-item .badge-source');
  check('quiz history persists after reload', (await page.locator('.list-item .badge-source').count()) >= 2);

  // --- language: DA ⇄ EN, persistent, never touches personal data
  await page.goto(BASE + '#/greb/ryg-2', { waitUntil: 'networkidle' });
  await page.locator('.sidebar .lang-switch button', { hasText: 'EN' }).click();
  check('EN: technique page translated', await page.waitForFunction(() => document.querySelector('h1')?.textContent?.includes('Petrissage of the upper trapezius'), null, { timeout: 3000 }).then(() => true, () => false));
  check('EN: navigation translated', (await page.locator('.sidebar nav').innerText()).includes('Techniques') && (await page.locator('.sidebar nav').innerText()).includes('Favourites'));
  check('EN: Danish caption kept as source quote', (await page.locator('blockquote').innerText()).includes('Petrissage af øvre Trapezius'));
  check('EN: user note unchanged', (await page.locator('.note-card textarea').inputValue()) === 'Blødt tryk, frem og tilbage.');
  check('EN: favourite kept', (await page.locator('.fav-btn').getAttribute('aria-pressed')) === 'true');
  check('EN: html lang attribute', (await page.evaluate(() => document.documentElement.lang)) === 'en');
  await page.reload({ waitUntil: 'networkidle' });
  check('EN persists after reload', await textIs(page, 'h1', 'Petrissage of the upper trapezius'));
  await page.goto(BASE + '#/atlas/soleus', { waitUntil: 'networkidle' });
  check('EN: muscle name + Latin available', (await textIs(page, '#mp-h', 'Soleus')) && (await page.locator('.muscle-panel .latin').innerText()) === 'M. soleus');
  await page.goto(BASE + '#/quiz', { waitUntil: 'networkidle' });
  await page.waitForSelector('.list-item .badge-source', { timeout: 5000 }).catch(() => {});
  check('EN: quiz history kept', (await page.locator('.list-item .badge-source').count()) >= 2 && (await page.locator('h1').innerText()) === 'Train your anatomy');
  const enLeak = await page.evaluate(() => document.querySelector('main').innerText.match(/\b(Spørgsmål|Forfra|Bagfra|Tilføj|Massagegreb|Seneste runder|Øv disse)\b/g));
  check('EN: no Danish UI words on quiz page', !enLeak, String(enLeak));
  await page.locator('.sidebar .lang-switch button', { hasText: 'DA' }).click();
  check('DA restored', await textIs(page, 'h1', 'Træn din anatomi'));

  // --- terminology preference persists
  await page.locator('.settings .segmented button', { hasText: 'Latin' }).click();
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'networkidle' });
  check('terminology preference persists', await textIs(page, '.settings .segmented button.on', 'Latin'));

  // --- mobile layout
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await mobile.goto(BASE, { waitUntil: 'networkidle' });
  check('mobile tab bar visible', await mobile.locator('.tabbar').isVisible());
  check('sidebar hidden on mobile', !(await mobile.locator('.sidebar').isVisible()));
  await mobile.locator('.tabbar a', { hasText: 'Atlas' }).click();
  await mobile.waitForSelector('.atlas-stage svg');
  const pt = await mobile.evaluate(() => { const r = document.querySelector('path[data-muscle="pectoralis-major"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await mobile.touchscreen.tap(pt.x, pt.y);
  check('tap selects muscle on mobile', await textIs(mobile, '#mp-h', 'Den store brystmuskel'));
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check('no horizontal scroll on mobile', !overflow);
  await mobile.close();

  // --- offline after first load (service worker)
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const swReady = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return false;
    const reg = await Promise.race([navigator.serviceWorker.ready, new Promise((r) => setTimeout(() => r(null), 8000))]);
    return Boolean(reg);
  });
  check('service worker active', swReady);
  await page.reload({ waitUntil: 'networkidle' }); // let the SW control the page
  await context.setOffline(true);
  await page.goto(BASE + '#/greb/arm-5', { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('h1', { timeout: 5000 });
  check('works offline after first load', (await page.locator('h1').innerText()).includes('brachioradialis'));
  await context.setOffline(false);
} catch (e) {
  check('unexpected failure', false, e.message);
} finally {
  const relevant = errors.filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
  check('no runtime errors in console', relevant.length === 0, relevant.join(' | '));
  await browser.close();
  server?.kill();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
}
