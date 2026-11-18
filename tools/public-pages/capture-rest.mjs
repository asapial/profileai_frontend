/** Presentation evidence at rest; motion itself is covered by the inspector. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, basename, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
const index = process.argv.indexOf('--helper'), helper = index < 0 ? process.env.PROFILEAI_BROWSER_HELPER : process.argv[index + 1];
if (!helper) throw Error('Pass --helper <cdp.mjs>');
const { Browser, sleep } = await import(pathToFileURL(resolve(helper)).href);
const output = resolve('../tmp/public-pages-at-rest'); mkdirSync(output, { recursive: true });
const browser = await Browser.launch(), messages = [];
try {
  for (const theme of ['dark', 'light']) {
    const page = await browser.newPage({ width: 1440, height: 900, reducedMotion: true });
    browser.on(page.sessionId, 'Runtime.consoleAPICalled', event => { if (['error', 'warning'].includes(event.type)) messages.push({ theme, type: event.type, text: event.args.map(argument => argument.value ?? argument.description).join(' ') }); });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('theme','${theme}')` });
    for (const route of ['templates', 'pricing', 'help', 'privacy', 'terms']) {
      await page.goto(`http://localhost:3000/${route}`, { settleMs: 1000 });
      await page.send('Page.bringToFront');
      await page.eval(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('main img')].map(image => image.decode().catch(() => false))); await Promise.all([...document.querySelectorAll('[data-public-environment]')].map(async element => { const image = new Image(); image.src = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1]; await image.decode(); })); });
      await sleep(300);
      await page.screenshot({ path: `${output}/${route}-${theme}-fold.jpg`, quality: 91 });
      await page.screenshot({ path: `${output}/${route}-${theme}-page.jpg`, quality: 88, fullPage: true });
    }
    await page.close();
  }
  const composites = [], height = [];
  for (const [index, theme] of ['dark', 'light'].entries()) {
    const picture = await sharp(`${output}/templates-${theme}-page.jpg`).resize({ width: 960 }).jpeg({ quality: 91 }).toBuffer({ resolveWithObject: true });
    composites.push({ input: picture.data, left: index * 960, top: 0 }); height.push(picture.info.height);
  }
  await sharp({ create: { width: 1920, height: Math.max(...height), channels: 3, background: '#f7f6fb' } }).composite(composites).jpeg({ quality: 91 }).toFile(`${output}/templates-both-themes.jpg`);
} finally {
  writeFileSync(`${output}/console-messages.json`, JSON.stringify(messages, null, 2));
  const directory = resolve(browser.dir); if (!directory.startsWith(resolve(tmpdir()) + sep) || !basename(directory).startsWith('ad-chrome-')) throw Error('Unexpected browser profile');
  await browser.close();
}
console.log(JSON.stringify({ output, consoleMessages: messages.length, messages }));
