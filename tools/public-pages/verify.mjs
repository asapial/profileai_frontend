/** Public page regression: native controls, content, theme art and real layouts. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, basename, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const option = (key, fallback) => args.includes('--' + key) ? args[args.indexOf('--' + key) + 1] : fallback;
const helper = option('helper', process.env.PROFILEAI_BROWSER_HELPER);
if (!helper) throw Error('Pass --helper <cdp.mjs>');
const { Browser, sleep } = await import(pathToFileURL(resolve(helper)).href);
const output = resolve(option('out', '../tmp/public-pages-verified'));
mkdirSync(output, { recursive: true });
const browser = await Browser.launch();
const routes = ['templates', 'pricing', 'help', 'privacy', 'terms'];
const wantedWidths = option('widths', '').split(',').filter(Boolean).map(Number);
const viewports = (option('quick', '') ? [[1440, 900]] : [[1440, 900], [768, 1024], [390, 844]]).filter(([width]) => !wantedWidths.length || wantedWidths.includes(width));
const report = { views: [], checks: [], failures: [], runtimeErrors: [] };
const check = (name, success, detail) => { report.checks.push({ name, success, detail }); if (!success) report.failures.push({ name, detail }); };
const click = async (page, selector) => {
  await page.eval(selector => {
    const button = [...document.querySelectorAll(selector)].find(element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0);
    if (!button) throw Error('Missing visible control: ' + selector);
    button.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, selector);
  // Entry motion can start after scrolling/capturing a long page. Read the
  // native hit coordinates once that finite entry has settled.
  await sleep(700);
  const point = await page.eval(selector => {
    const button = [...document.querySelectorAll(selector)].find(element => element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0);
    const rect = button.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }, selector);
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
};
const settle = async page => {
  await page.eval(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('main img')].map(image => { image.loading = 'eager'; return image.decode().catch(() => false); }));
    await Promise.all([...document.querySelectorAll('[data-public-environment]')].map(async element => {
      const src = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/)?.[1];
      if (!src) throw Error('Missing physical environment');
      const image = new Image(); image.src = src; await image.decode();
    }));
  });
  await sleep(550);
};

try {
  for (const [width, height] of viewports) for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ width, height, mobile: width < 600 });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('theme','${theme}')` });
    for (const route of routes) {
      await page.goto(`http://localhost:3000/${route}`, { settleMs: 900 });
      await settle(page);
      const state = await page.eval(() => ({
        main: document.querySelectorAll('main').length,
        heading: document.querySelector('main h1')?.innerText,
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        rooms: [...document.querySelectorAll('[data-public-environment]')].map(element => ({ kind: element.dataset.publicEnvironment, art: getComputedStyle(element).backgroundImage, rect: { width: element.clientWidth, height: element.clientHeight } })),
        brokenImages: [...document.querySelectorAll('main img')].filter(image => !image.naturalWidth).map(image => image.src),
        headingLines: [...document.querySelectorAll('main h1,main h2,main h3')].filter(element => element.getBoundingClientRect().height > 0).map(element => ({ text: element.textContent, lines: Math.round(element.getBoundingClientRect().height / parseFloat(getComputedStyle(element).lineHeight)) })),
        policySections: [...document.querySelectorAll('[data-policy-section]')].map(section => section.id),
        height: document.documentElement.scrollHeight,
      }));
      report.views.push({ route, theme, width, ...state });
      check(`${route}/${theme}/${width}: layout and assets`, state.main === 1 && !!state.heading && !state.overflow && state.theme === theme && state.rooms.length > 0 && state.rooms.every(room => room.kind === route && room.art.includes(`-${theme}`) && room.rect.width > 100 && room.rect.height > 100) && state.brokenImages.length === 0, state);
      check(`${route}/${theme}/${width}: headings fit`, state.headingLines.every(heading => heading.lines <= 2), state.headingLines.filter(heading => heading.lines > 2));
      await page.screenshot({ path: `${output}/${route}-${theme}-${width}-fold.jpg`, quality: 88 });
      await page.screenshot({ path: `${output}/${route}-${theme}-${width}-page.jpg`, quality: 83, fullPage: true });

      if (route === 'templates') {
        check(`templates/${theme}/${width}: native A4 and reflection`, await page.eval(() => {
          const papers = [...document.querySelectorAll('[class*="exhibitFace"]')].filter(element => element.getBoundingClientRect().width > 0);
          // Perspective changes the screen projection; the actual paper must
          // retain A4 dimensions before that intentional 3D transform.
          return papers.length > 0 && papers.every(element => Math.abs(element.clientWidth / element.clientHeight - 210 / 297) < .01) && papers.some(element => getComputedStyle(element).webkitBoxReflect !== 'none');
        }));
        const original = await page.eval(() => document.querySelector('[aria-live="polite"]')?.textContent);
        await click(page, 'button[aria-label="Next template"]'); await sleep(120);
        check(`templates/${theme}/${width}: carousel`, await page.eval(() => document.querySelector('[aria-live="polite"]')?.textContent) !== original);
        await click(page, 'button[aria-label^="Preview "]'); await sleep(180);
        check(`templates/${theme}/${width}: accessible preview`, await page.eval(() => !!document.querySelector('[role="dialog"][aria-modal="true"]') && !!document.querySelector('[role="dialog"] h2')));
        if (width === 1440) await page.screenshot({ path: `${output}/template-preview-${theme}.jpg`, quality: 88 });
        await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(150);
        check(`templates/${theme}/${width}: Escape and focus return`, await page.eval(() => !document.querySelector('[role="dialog"]') && document.activeElement?.getAttribute('aria-label')?.startsWith('Preview ')));
        await page.eval(() => document.querySelector('input[placeholder="Search templates"]').focus());
        await page.send('Input.insertText', { text: 'no-such-template-741' }); await sleep(150);
        check(`templates/${theme}/${width}: empty search`, await page.eval(() => document.querySelector('main').innerText.includes('No matching layouts')));
        await page.goto('http://localhost:3000/templates', { settleMs: 500 }); await settle(page);
        await click(page, 'button[aria-label^="Save "]'); await sleep(100);
        const shortlist = await page.eval(() => JSON.parse(localStorage.getItem('profileai:template-shortlist') ?? '[]'));
        check(`templates/${theme}/${width}: persistent shortlist`, shortlist.length > 0);
        await page.eval(() => localStorage.removeItem('profileai:template-shortlist'));
      }
      if (route === 'pricing') {
        const prices = await page.eval(() => [...document.querySelectorAll('[class*="planPrice"] strong')].map(element => element.textContent));
        check(`pricing/${theme}/${width}: original monthly prices`, JSON.stringify(prices) === JSON.stringify(['৳0', '৳299', '৳599']), prices);
        await page.eval(() => [...document.querySelectorAll('[aria-label="Billing interval"] button')].find(button => button.textContent === 'Yearly').click()); await sleep(100);
        const annual = await page.eval(() => ({ prices: [...document.querySelectorAll('[class*="planPrice"] strong')].map(element => element.textContent), actions: [...document.querySelectorAll('main a[href*="plan="]')].map(link => link.getAttribute('href')) }));
        check(`pricing/${theme}/${width}: annual amounts and route parameters`, JSON.stringify(annual.prices) === JSON.stringify(['৳0', '৳2,990', '৳5,990']) && annual.actions.length === 3 && annual.actions.every(href => href.endsWith('billing=yearly')), annual);
        await click(page, 'main details summary');
        check(`pricing/${theme}/${width}: FAQ disclosure`, await page.eval(() => document.querySelector('main details').open));
      }
      if (route === 'help') {
        await page.eval(() => document.querySelector('#help-search').focus()); await page.send('Input.insertText', { text: 'two-factor' }); await sleep(100);
        check(`help/${theme}/${width}: article search`, await page.eval(() => [...document.querySelectorAll('main [class*="articleList"] h3')].some(element => element.textContent.toLowerCase().includes('two-factor'))));
        await page.send('Input.insertText', { text: ' no-such-guide-741' }); await sleep(100);
        check(`help/${theme}/${width}: empty search`, await page.eval(() => document.querySelector('main').innerText.includes('No matching guides')));
        await page.eval(() => [...document.querySelectorAll('main button')].find(button => button.textContent === 'Reset search').click()); await sleep(100);
        check(`help/${theme}/${width}: reset search`, await page.eval(() => document.querySelector('#help-search').value === '' && document.querySelectorAll('main [class*="articleList"] li').length > 3));
        const opposite = theme === 'dark' ? 'light' : 'dark';
        await click(page, `header button[aria-label="Switch to ${opposite} mode"]`); await sleep(180);
        check(`help/${theme}/${width}: live theme switch`, await page.eval(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light') === opposite);
        await click(page, `header button[aria-label="Switch to ${theme} mode"]`); await sleep(180);
        if (width < 1024) {
          await click(page, 'button[aria-label="Open navigation"]'); await sleep(550);
          check(`help/${theme}/${width}: mobile navigation`, await page.eval(() => { const menu = document.querySelector('[data-slot="sheet-content"]'); if (!menu) return false; const rect = menu.getBoundingClientRect(); return rect.width > 150 && rect.left >= 0 && rect.right <= innerWidth + 1 && menu.textContent.includes('Templates'); }));
          if (width === 390) await page.screenshot({ path: `${output}/mobile-navigation-${theme}.jpg`, quality: 88 });
          await page.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
          await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); await sleep(550);
          check(`help/${theme}/${width}: navigation keyboard dismissal`, await page.eval(() => !document.querySelector('[data-slot="sheet-content"]')));
        }
      }
      if (route === 'privacy' || route === 'terms') {
        const sections = route === 'privacy' ? ['overview','information','uses','ai-processing','sharing','retention','choices','security'] : ['overview','acceptance','accounts','ai-content','subscriptions','acceptable-use','ownership','termination','accessibility'];
        check(`${route}/${theme}/${width}: all policy sections retained`, JSON.stringify(state.policySections) === JSON.stringify(sections), state.policySections);
        check(`${route}/${theme}/${width}: contents anchors resolve`, await page.eval(() => [...document.querySelectorAll('aside a[href^="#"]')].every(link => document.getElementById(link.hash.slice(1)))));
      }
      report.runtimeErrors.push(...page.consoleErrors.splice(0));
      console.log(JSON.stringify({ route, theme, width, failures: report.failures.length }));
    }
    await page.close();
  }
  const page = await browser.newPage({ width: 390, height: 844, mobile: true, reducedMotion: true });
  for (const route of routes) {
    await page.goto(`http://localhost:3000/${route}`, { settleMs: 600 }); await settle(page);
    check(`${route}: reduced motion remains visible`, await page.eval(() => {
      const heading = document.querySelector('main h1');
      return !!heading && getComputedStyle(heading).opacity === '1' && document.getAnimations().every(animation => animation.playState !== 'running');
    }));
  }
  report.runtimeErrors.push(...page.consoleErrors); await page.close();
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  const directory = resolve(browser.dir);
  if (!directory.startsWith(resolve(tmpdir()) + sep) || !basename(directory).startsWith('ad-chrome-')) throw Error('Unexpected temporary browser profile');
  await browser.close();
}
console.log(JSON.stringify({ views: report.views.length, checks: report.checks.length, failures: report.failures.length, runtimeErrors: report.runtimeErrors.length, output }));
if (report.failures.length || report.runtimeErrors.length) process.exitCode = 1;
