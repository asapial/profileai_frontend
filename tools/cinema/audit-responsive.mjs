/**
 * Responsive audit for the story landing page (artifacts for review).
 *
 * Usage:
 *   node tools/cinema/audit-responsive.mjs --out .cinema-audit [--sizes 390x844,…]
 *       [--zones] [--overflow] [--theme dark|light]
 *
 * For every viewport it reports horizontal-overflow offenders (visible elements
 * whose rect leaves the viewport) and — with `--zones` — writes one JPEG per
 * product-zone selector plus the top of the page.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const prefix = `--${name}`;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === prefix) return args[i + 1];
    if (args[i].startsWith(`${prefix}=`)) return args[i].slice(prefix.length + 1);
  }
  return fallback;
};

const url = opt("url", "http://localhost:3000/");
const outDir = resolve(opt("out", "./.cinema-audit"));
const theme = opt("theme", "dark");
const chromePath = opt("chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");
const port = Number(opt("port", 9430));
const profile = join(outDir, ".chrome-profile");
const sizes = opt("sizes", "390x844,768x1024,1024x768,1440x900,844x390")
  .split(",")
  .map((pair) => pair.split("x").map(Number))
  .filter(([w, h]) => w > 0 && h > 0);
const wantZones = args.includes("--zones");
const wantOverflow = args.includes("--overflow");
const zones = [
  ["top", null],
  ["bridge", ".static-zone__bridge"],
  ["trust", ".trust-section"],
  ["workspace", ".workspace-section"],
  ["allowances", ".allowances-section"],
  ["pricing", ".pricing-section"],
  ["faq", ".faq-section"],
  ["bottom-cta", ".bottom-cta"],
  ["footer", ".story-footer"],
];

mkdirSync(outDir, { recursive: true });
rmSync(profile, { recursive: true, force: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--disable-frame-rate-limit",
  "--disable-gpu-vsync",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--no-first-run",
  "--no-default-browser-check",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${port}`,
  "about:blank",
], { stdio: ["ignore", "pipe", "pipe"] });
chrome.on("exit", (code) => process.stderr.write(`[chrome exited ${code}]\n`));
chrome.on("error", (e) => process.stderr.write(`[chrome spawn error ${e.message}]\n`));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function endpoint() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return (await res.json()).webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error("Chrome debugging endpoint never became ready");
}

const ws = new WebSocket(await endpoint());
await new Promise((resolve_, reject) => {
  ws.addEventListener("open", resolve_);
  ws.addEventListener("error", reject);
});

let nextId = 1;
const pending = new Map();
const consoleMessages = [];
let session;

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve: res, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else res(message.result);
    return;
  }
  if (message.method === "Runtime.consoleAPICalled" && (message.params.type === "error" || message.params.type === "warning")) {
    const text = (message.params.args ?? []).map((a) => a.value ?? a.description ?? a.type).join(" ");
    consoleMessages.push(`[${message.params.type}] ${String(text).slice(0, 200)}`);
  }
});

function send(method, params = {}, useSession = true) {
  const id = nextId += 1;
  const payload = { id, method, params };
  if (useSession && session) payload.sessionId = session;
  return new Promise((res, reject) => {
    pending.set(id, { resolve: res, reject });
    ws.send(JSON.stringify(payload));
  });
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" }, false);
const attached = await send("Target.attachToTarget", { targetId, flatten: true }, false);
session = attached.sessionId;

await send("Page.enable");
await send("Runtime.enable");

const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text ?? "evaluate failed");
  return result.result.value;
};

const shot = async (file) => {
  const image = await send("Page.captureScreenshot", { format: "jpeg", quality: 82 });
  writeFileSync(file, Buffer.from(image.data, "base64"));
};

const OVERFLOW_PROBE = `JSON.stringify((() => {
  const docWidth = document.documentElement.scrollWidth;
  const inner = window.innerWidth;
  const offenders = [];
  const seen = new Map();
  for (const node of document.querySelectorAll('body *')) {
    const style = getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
    if (node.closest('[class*="__world"]')) continue; // the film world scales itself
    const rect = node.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.left > -4 && rect.right < inner + 4) continue;
    const key = node.className && typeof node.className === 'string'
      ? node.tagName.toLowerCase() + '.' + node.className.split(' ').slice(0, 2).join('.')
      : node.tagName.toLowerCase();
    const entry = seen.get(key) ?? { key, count: 0, left: Math.round(rect.left), right: Math.round(rect.right), text: '' };
    entry.count += 1;
    entry.left = Math.min(entry.left, Math.round(rect.left));
    entry.right = Math.max(entry.right, Math.round(rect.right));
    if (!entry.text) entry.text = (node.textContent ?? '').trim().slice(0, 40);
    seen.set(key, entry);
  }
  for (const entry of seen.values()) offenders.push(entry);
  offenders.sort((a, b) => (b.right - inner) - (a.right - inner));
  return { docWidth, inner, scrollY: Math.round(window.scrollY), offenders: offenders.slice(0, 18) };
})())`;

const report = [];

for (const [width, height] of sizes) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 720 });
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }, { name: "prefers-reduced-motion", value: "no-preference" }] });
  await send("Page.navigate", { url: `about:blank` });
  await sleep(150);
  await send("Page.navigate", { url });
  await sleep(2500);

  // Hydration + one loop frame so SSR styles settle before probing.
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = await evaluate(`!!document.querySelector('[class*="__film"]') && document.readyState === 'complete'`);
    if (ready) break;
    await sleep(300);
  }
  await evaluate(`window.scrollTo(0, window.scrollY + 3)`);
  await sleep(500);

  const entry = { viewport: `${width}x${height}`, zones: {} };
  if (wantOverflow || !wantZones) {
    entry.film = JSON.parse(await evaluate(OVERFLOW_PROBE));
    await evaluate(`window.scrollTo(0, (document.querySelector('[class*="__film"]')?.offsetHeight ?? 0) + 1)`);
    await sleep(600);
    entry.static = JSON.parse(await evaluate(OVERFLOW_PROBE));
  }
  if (wantZones) {
    for (const [label, selector] of zones) {
      if (selector) {
        await evaluate(`(() => {
          const node = document.querySelector(${JSON.stringify(selector)});
          if (!node) return false;
          window.scrollTo({ top: window.scrollY + node.getBoundingClientRect().top - 70, behavior: 'instant' });
          return true;
        })()`);
        await sleep(450);
      } else {
        await evaluate(`window.scrollTo({ top: 0, behavior: 'instant' })`);
        await sleep(500);
      }
      const file = join(outDir, `${label}-${width}x${height}.jpg`);
      await shot(file);
      entry.zones[label] = await evaluate(`Math.round(window.scrollY)`);
    }
    const overflow = JSON.parse(await evaluate(OVERFLOW_PROBE));
    entry.static = overflow;
  }
  report.push(entry);
  console.log(JSON.stringify(entry));
}

writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
if (consoleMessages.length) console.log(JSON.stringify({ console: consoleMessages.slice(0, 12) }, null, 2));
chrome.kill();
