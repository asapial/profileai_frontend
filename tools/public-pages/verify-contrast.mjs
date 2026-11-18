/** Sample the real rendered pixels beneath exposed text, including 3D artwork. */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, basename, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
const args = process.argv.slice(2), option = (name, fallback) => args.includes('--' + name) ? args[args.indexOf('--' + name) + 1] : fallback;
const helper = option('helper', process.env.PROFILEAI_BROWSER_HELPER);
if (!helper) throw Error('Pass --helper <cdp.mjs>');
const { Browser, sleep } = await import(pathToFileURL(resolve(helper)).href);
const output = resolve(option('out', '../tmp/public-pages-contrast')); mkdirSync(output, { recursive: true });
const browser = await Browser.launch();
const report = { frames: [], failures: [] };
const luminance = rgb => rgb.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((total, value, index) => total + value * [.2126, .7152, .0722][index], 0);
try {
  for (const theme of ['dark', 'light']) for (const width of [1440, 768, 390]) {
    const page = await browser.newPage({ width, height: width === 768 ? 1024 : width === 390 ? 844 : 900, mobile: width < 600, reducedMotion: true });
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source: `localStorage.setItem('theme','${theme}')` });
    for (const route of ['templates', 'pricing', 'help', 'privacy', 'terms']) {
      await page.goto(`http://localhost:3000/${route}`, { settleMs: 550 });
      await page.eval(async () => {
        await document.fonts.ready;
        await Promise.all([...document.querySelectorAll('[data-public-environment]')].map(async element => { const image = new Image(); image.src = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1]; await image.decode(); }));
      });
      for (const bottom of [false, true]) {
        await page.eval(bottom => {
          const stage = document.querySelector('main > section');
          scrollTo({ top: bottom ? stage.offsetTop + stage.offsetHeight - innerHeight + 150 : 0, behavior: 'instant' });
        }, bottom);
        await sleep(80);
        const rows = await page.eval(() => {
          const root = document.querySelector('main'), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), rows = []; let node;
          while ((node = walker.nextNode())) {
            const element = node.parentElement, text = node.textContent.trim();
            if (!text || element.closest('svg,iframe,[aria-hidden="true"],script,style')) continue;
            let hidden = false;
            for (let parent = element; parent && parent !== root.parentElement; parent = parent.parentElement) { const style = getComputedStyle(parent); if (style.display === 'none' || style.visibility === 'hidden' || style.clip !== 'auto' || parseFloat(style.opacity) === 0) hidden = true; }
            if (hidden) continue;
            const style = getComputedStyle(element), font = parseFloat(style.fontSize), color = style.color.match(/[\d.]+/g)?.map(Number);
            if (!color || font < 12) continue;
            const range = document.createRange(); range.selectNodeContents(node);
            for (const rect of range.getClientRects()) if (rect.width > 3 && rect.height > 3 && rect.top > 90 && rect.bottom < innerHeight - 5 && rect.left >= 0 && rect.right <= innerWidth)
              rows.push({ text, color, required: font >= 24 || font >= 18.66 && +style.fontWeight >= 700 ? 3 : 4.5, x: rect.x, y: rect.y, w: rect.width, h: rect.height });
          }
          const sheet = document.createElement('style'); sheet.id = 'public-contrast-hide'; sheet.textContent = 'main * {color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}'; document.head.append(sheet);
          return rows;
        });
        const png = await page.screenshot({ format: 'png' });
        await page.eval(() => document.getElementById('public-contrast-hide').remove());
        const { data, info } = await sharp(Buffer.from(png, 'base64')).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const lows = [];
        for (const row of rows) {
          let minimum = 100, point;
          for (const dx of [.08, .3, .5, .7, .92]) for (const dy of [.3, .5, .7]) {
            const x = Math.min(info.width - 1, Math.round(row.x + row.w * dx)), y = Math.min(info.height - 1, Math.round(row.y + row.h * dy)), index = (y * info.width + x) * 3;
            const background = [...data.slice(index, index + 3)], alpha = row.color[3] ?? 1, foreground = row.color.slice(0, 3).map((value, channel) => value * alpha + background[channel] * (1 - alpha));
            const ratio = (Math.max(luminance(foreground), luminance(background)) + .05) / (Math.min(luminance(foreground), luminance(background)) + .05);
            if (ratio < minimum) { minimum = ratio; point = { x, y, background }; }
          }
          if (minimum < row.required - .05) lows.push({ text: row.text, minimum, required: row.required, point });
        }
        const tag = `${route}-${theme}-${width}-${bottom ? 'bottom' : 'top'}`;
        report.frames.push({ tag, rows: rows.length, lows });
        if (lows.length) report.failures.push({ tag, lows });
      }
      console.log(`${route}/${theme}/${width}: ${report.failures.filter(frame => frame.tag.startsWith(`${route}-${theme}-${width}`)).length} affected frames`);
    }
    await page.close();
  }
} finally {
  writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
  const directory = resolve(browser.dir); if (!directory.startsWith(resolve(tmpdir()) + sep) || !basename(directory).startsWith('ad-chrome-')) throw Error('Unexpected browser profile');
  await browser.close();
}
console.log(JSON.stringify({ frames: report.frames.length, failures: report.failures.length, output }));
if (report.failures.length) process.exitCode = 1;
