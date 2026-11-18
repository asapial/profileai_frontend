// Run against the existing dev server. No account, search or submission actions.
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, basename, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const args = process.argv.slice(2);
const option = (key, fallback) => args.includes('--' + key) ? args[args.indexOf('--' + key) + 1] : fallback;
const helper = option('helper', process.env.PROFILEAI_BROWSER_HELPER);
if (!helper) throw Error('Pass --helper <cdp.mjs>');
const { Browser, sleep } = await import(pathToFileURL(resolve(helper)).href);
const out = resolve(option('out', '../output/howitworks-implementation-2026-11-18'));
const base = option('url', 'http://localhost:3000');
const widths = option('widths', '320,390,650,768,1024,1440,1920').split(',').map(Number);
const themes = option('themes', 'dark,light').split(',');
await mkdir(out, { recursive: true });
const report = { assertions: 0, views: [], behavior: [], failures: [], console: [], requests: [] };
const check = (pass, name, details) => { report.assertions++; if (!pass) report.failures.push({ name, details }); };

function inspect() {
  const main = document.querySelector('main');
  const visible = el => { const r = el.getBoundingClientRect(), c = getComputedStyle(el); return r.width > 0 && r.height > 0 && c.visibility !== 'hidden' && c.display !== 'none'; };
  const bad = [...main.querySelectorAll('*')].filter(el => {
    if (!visible(el) || el.closest('svg') || /srOnly/.test(el.className)) return false;
    const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1;
  }).map(el => ({ tag: el.tagName, class: el.className, text: el.textContent.slice(0, 70) }));
  const paper = main.querySelector('[data-resume-demo] img[alt^="A4"]');
  const art = main.querySelector('[data-how-hero] [role=img]');
  const ar = art.getBoundingClientRect();
  return {
    width: innerWidth, height: document.documentElement.scrollHeight,
    overflow: document.documentElement.scrollWidth > innerWidth, clipped: bad,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    headers: document.querySelectorAll('[data-site-header]').length,
    footers: document.querySelectorAll('[data-site-footer]').length,
    main: document.querySelectorAll('main#main').length,
    h1: main.querySelector('h1')?.textContent,
    guideSteps: main.querySelectorAll('ol[class*=guide]>li').length,
    modes: main.querySelectorAll('div[class*=modes]>article').length,
    faq: main.querySelectorAll('details').length,
    art: { aspect: ar.width / ar.height, position: getComputedStyle(art).backgroundPosition, image: getComputedStyle(art).backgroundImage },
    paper: { width: paper.clientWidth, height: paper.clientHeight, aspect: paper.clientWidth / paper.clientHeight, objectFit: getComputedStyle(paper).objectFit },
    images: [...main.querySelectorAll('img')].map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })),
    sections: ['step-1', 'resume-process', 'job-process', 'application-process'].map(id => {
      const el = document.getElementById(id); return { id, background: getComputedStyle(el).backgroundImage, scrollMargin: getComputedStyle(el).scrollMarginTop };
    }),
    links: [...main.querySelectorAll('a')].map(a => a.getAttribute('href')),
    activeNavigation: document.querySelector('header a[aria-current=page]')?.getAttribute('href'),
    legacyCanvas: Boolean(document.querySelector('canvas')),
  };
}

function contrast() {
  const parse = color => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d'); context.fillStyle = color; context.fillRect(0, 0, 1, 1);
    const p = context.getImageData(0, 0, 1, 1).data; return [p[0], p[1], p[2], p[3] / 255];
  };
  const lum = rgb => rgb.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const bg = node => {
    let result = [0, 0, 0, 0];
    for (let p = node; p; p = p.parentElement) {
      const c = parse(getComputedStyle(p).backgroundColor), a = result[3] + c[3] * (1 - result[3]);
      if (a) result = [...result.slice(0, 3).map((v, i) => (v * result[3] + c[i] * c[3] * (1 - result[3])) / a), a];
      if (a > .999) break;
    }
    return result;
  };
  const rows = [], root = document.querySelector('main'), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = walker.currentNode.textContent.trim(), node = walker.currentNode.parentElement;
    if (!text || node.closest('svg,option,[aria-hidden=true]') || /srOnly/.test(node.className)) continue;
    const range = document.createRange(); range.selectNodeContents(walker.currentNode);
    if (![...range.getClientRects()].some(r => r.width && r.height)) continue;
    const style = getComputedStyle(node); if (style.visibility === 'hidden') continue;
    const background = bg(node); if (background[3] < .99) continue;
    const color = parse(style.color), fg = color.slice(0, 3).map((v, i) => v * color[3] + background[i] * (1 - color[3]));
    const font = parseFloat(style.fontSize), required = font >= 24 || font >= 18.66 && parseFloat(style.fontWeight) >= 700 ? 3 : 4.5;
    rows.push({ text: text.slice(0, 85), ratio: (Math.max(lum(fg), lum(background)) + .05) / (Math.min(lum(fg), lum(background)) + .05), required, font });
  }
  return rows;
}

async function ready(page) {
  await page.eval(async () => {
    await document.fonts.ready;
    // Scroll naturally to lazy images. Changing attributes before hydration
    // would create a mismatch in the test itself.
    for (const img of document.querySelectorAll('main img')) {
      img.scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await img.decode().catch(() => {});
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    const art = document.querySelector('[data-how-hero] [role=img]');
    const url = getComputedStyle(art).backgroundImage.match(/url\(["']?([^"')]+)/)?.[1];
    if (url) { const img = new Image(); img.src = url; await img.decode(); }
  });
}

async function capture(page, selector, path) {
  const clip = await page.eval(selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: r.height, scale: 1 }; }, selector);
  const { data } = await page.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip });
  await writeFile(path, Buffer.from(data, 'base64'));
}

async function key(page, value, code, vk) {
  await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk, ...(value === 'Enter' ? { text: '\r', unmodifiedText: '\r' } : {}) });
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
}

async function behavior(page, tag, reduced) {
  const run = async (name, fn) => { check(await page.eval(fn), tag + ': ' + name); };
  await page.eval(() => document.querySelector('[aria-label="Preview Gridline template"]').click()); await sleep(240);
  await run('real catalog template changes A4 preview', () => document.querySelector('img[alt^="A4"]').src.endsWith('/gridline.png') && document.querySelector('[aria-label="Preview Gridline template"]').getAttribute('aria-pressed') === 'true');
  await page.eval(() => document.querySelector('[aria-labelledby="document-type-label"] button:nth-child(2)').click());
  await run('CV selection', () => document.querySelector('[class*=documentTitle]').textContent.includes('CV preview'));
  await page.eval(() => document.querySelector('[data-resume-demo] button[class*=button]').focus());
  await key(page, 'Enter', 'Enter', 13); await sleep(120);
  await run('keyboard accepts example wording', () => document.querySelector('[data-resume-demo] [role=status]').textContent.includes('accepted'));
  await page.eval(() => [...document.querySelectorAll('[data-resume-demo] button')].find(b => b.textContent === 'Keep original').click());
  await run('keep original', () => document.querySelector('[class*=rewrite]>p').textContent === 'Worked on frontend development tasks and fixed bugs.');
  await page.eval(() => [...document.querySelectorAll('[data-resume-demo] button')].find(b => b.textContent === 'Edit wording').click());
  await page.eval(() => { const area = document.getElementById('example-wording'); area.focus(); area.select(); });
  await page.send('Input.insertText', { text: 'Built accessible React components for the customer dashboard.' });
  await page.eval(() => document.querySelector('[data-resume-demo] form').requestSubmit()); await sleep(100);
  await run('edit and save example wording', () => document.querySelector('[class*=rewrite]>p').textContent === 'Built accessible React components for the customer dashboard.');
  await page.eval(() => document.querySelector('[data-jobs-demo] button[aria-pressed]').click());
  await run('example shortlist responds', () => document.querySelector('[data-jobs-demo] button[aria-pressed]').getAttribute('aria-pressed') === 'true' && document.querySelector('[data-jobs-demo] [role=status]').textContent.includes('Frontend Engineer'));
  await page.eval(() => document.querySelector('[data-jobs-demo] button[aria-pressed]').click());
  await run('example shortlist can be cleared', () => document.querySelector('[data-jobs-demo] button[aria-pressed]').getAttribute('aria-pressed') === 'false');
  await page.eval(() => document.querySelector('main details summary').focus()); await key(page, 'Enter', 'Enter', 13); await sleep(250);
  await run('keyboard opens FAQ', () => document.querySelector('main details').open);
  await key(page, 'Enter', 'Enter', 13);
  await page.eval(() => document.querySelector('[aria-label="Explore how ProfileAI works"] a[href="#job-process"]').click());
  await sleep(reduced ? 50 : 1200);
  await run('chapter jump keeps heading below sticky navbar and moves focus', () => {
    const section = document.getElementById('job-process'), top = section.getBoundingClientRect().top;
    return location.hash === '#job-process' && document.activeElement === section && top >= 85 && top < 130;
  });
  if (reduced) await run('reduced motion disables transitions', () => getComputedStyle(document.querySelector('main details summary>svg')).transitionDuration === '0s' && getComputedStyle(document.querySelector('[class*=paperShadow]')).animationName === 'none');
  const originalTheme = await page.eval(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  await page.eval(() => document.querySelector('header button[aria-label^="Switch to"]').click()); await sleep(180);
  const switched = await page.eval(() => ({ dark: document.documentElement.classList.contains('dark'), position: getComputedStyle(document.querySelector('[data-how-hero] [role=img]')).backgroundPosition, sample: document.querySelector('[class*=rewrite]>p').textContent }));
  check(switched.dark === (originalTheme !== 'dark') && switched.position === (switched.dark ? '0px 50%' : '100% 50%') && switched.sample.includes('accessible React'), tag + ': theme toggle updates artwork and retains demo state', switched);
  await page.eval(() => document.querySelector('header button[aria-label^="Switch to"]').click()); await sleep(180);
  if (await page.eval(() => innerWidth < 1024)) {
    await page.eval(() => document.querySelector('[aria-label="Open navigation"]').click()); await sleep(200);
    await run('mobile navigation opens with real links', () => Boolean(document.querySelector('[role=dialog] a[href="/howitworks"]')));
    await key(page, 'Escape', 'Escape', 27); await sleep(220);
    await run('Escape closes mobile navigation', () => !document.querySelector('[role=dialog]'));
  }
  report.behavior.push({ tag, reduced });
}

const browser = await Browser.launch();
try {
  for (const width of widths) for (const theme of themes) {
    const tag = `${theme}-${width}`, page = await browser.newPage({ width, height: width < 700 ? 844 : 1080, mobile: width < 700 });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('theme','${theme}')` });
    await page.send('Network.enable');
    browser.on(page.sessionId, 'Network.requestWillBeSent', e => { if (!['GET', 'OPTIONS'].includes(e.request.method) && !e.request.url.includes('/api/analytics/events')) report.requests.push({ method: e.request.method, url: e.request.url }); });
    browser.on(page.sessionId, 'Runtime.consoleAPICalled', e => { if (e.type === 'error') report.console.push({ tag, text: e.args.map(a => a.value || a.description).join(' ') }); });
    await page.goto(base + '/howitworks', { settleMs: 650 }); await ready(page); await page.send('Page.bringToFront'); await sleep(80);
    const state = await page.eval(inspect), colors = await page.eval(contrast), low = colors.filter(c => !Number.isFinite(c.ratio) || c.ratio < c.required - .05);
    check(!state.overflow && !state.clipped.length, tag + ': responsive bounds', state.clipped);
    check(state.theme === theme, tag + ': requested theme');
    check(state.headers === 1 && state.footers === 1 && state.main === 1, tag + ': landmarks');
    check(state.h1 === 'Your experience.A clearer next move.', tag + ': approved hero copy');
    check(Math.abs(state.art.aspect - 991.5 / 793) < .002 && state.art.position === (theme === 'dark' ? '0px 50%' : '100% 50%'), tag + ': complete hero scene and correct theme', state.art);
    check(state.guideSteps === 9 && state.modes === 4 && state.faq === 4, tag + ': detailed processes');
    check(state.images.every(i => i.loaded), tag + ': local assets', state.images);
    check(Math.abs(state.paper.aspect - 794 / 1123) < .006 && state.paper.objectFit === 'contain', tag + ': uncropped A4 preview', state.paper);
    check(state.sections.every(section => section.background !== 'none'), tag + ': related chapter backgrounds');
    check(low.length === 0, tag + ': text contrast', low);
    check(state.links.includes('/dashboard/jobs') && state.links.includes('/dashboard/resumes/new'), tag + ': real workspace links');
    check(state.activeNavigation === '/howitworks', tag + ': active navigation');
    check(!state.legacyCanvas, tag + ': no redundant ambient canvas');
    if ([1440, 768, 390, 320].includes(width)) {
      await page.screenshot({ path: join(out, `${tag}-full.png`), fullPage: true });
      for (const [selector, name] of [['[data-how-hero]', 'hero'], ['#resume-process', 'resume'], ['#job-process', 'jobs']]) await capture(page, selector, join(out, `${tag}-${name}.png`));
    }
    if ([1440, 390].includes(width)) await behavior(page, tag, false);
    check(page.consoleErrors.length === 0, tag + ': runtime exceptions', page.consoleErrors);
    report.views.push({ tag, ...state, contrastSamples: colors.length, lowContrast: low });
    console.log(JSON.stringify({ tag, assertions: report.assertions, failures: report.failures.length })); await page.close();
  }
  const reduced = await browser.newPage({ width: 390, height: 844, mobile: true, reducedMotion: true });
  await reduced.send('Page.addScriptToEvaluateOnNewDocument', { source: "localStorage.setItem('theme','dark')" });
  await reduced.goto(base + '/howitworks', { settleMs: 600 }); await ready(reduced); await behavior(reduced, 'reduced-motion', true); await reduced.close();
  check(report.requests.length === 0, 'Examples do not trigger state-changing requests', report.requests);
  check(report.console.length === 0, 'Browser console errors', report.console);
} finally {
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2));
  const profile = resolve(browser.dir);
  if (!profile.startsWith(resolve(tmpdir()) + sep) || !basename(profile).startsWith('ad-chrome-')) throw Error('Unexpected browser profile');
  await browser.close();
}
console.log(JSON.stringify({ views: report.views.length, assertions: report.assertions, failures: report.failures, out }));
if (report.failures.length) process.exitCode = 1;
