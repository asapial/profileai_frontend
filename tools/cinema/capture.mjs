/**
 * Headless scene capture for the CareerCinema story (artifacts for review).
 *
 * Usage:
 *   node tools/cinema/capture.mjs --out .cinema-shots --scene 1 --scene 2 …
 *
 * Needs a dev server (default http://localhost:3000) and Chrome. Scrolls to the
 * rest position of each design scene (scene N rests at p = N-1 over an 8-unit
 * runway), waits for the damped camera to settle, then writes a JPEG and a DOM
 * probe so drift is visible in the log. For pass/fail checks use regression.mjs.
 */
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
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
const all = (name) => {
  const prefix = `--${name}`;
  const values = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === prefix) values.push(args[i + 1]);
    else if (args[i].startsWith(`${prefix}=`)) values.push(args[i].slice(prefix.length + 1));
  }
  return values;
};

const url = opt("url", "http://localhost:3000/");
const outDir = resolve(opt("out", "./.cinema-shots"));
const width = Number(opt("w", 1440));
const height = Number(opt("h", 900));
const theme = opt("theme", "dark");
const settle = Number(opt("settle", 900));
const scenes = all("scene").map(Number).filter((n) => Number.isFinite(n));
const chromePath = opt("chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");
const port = Number(opt("port", 9413));
const profile = join(outDir, ".chrome-profile");

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
  "--disable-lcd-text",
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
await new Promise((resolve, reject) => {
  ws.addEventListener("open", resolve);
  ws.addEventListener("error", reject);
});

let nextId = 1;
const pending = new Map();
const consoleMessages = [];
const pageErrors = [];
let session;

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
    return;
  }
  if (message.method === "Runtime.consoleAPICalled" && (message.params.type === "error" || message.params.type === "warning")) {
    const text = (message.params.args ?? []).map((a) => a.value ?? a.description ?? a.type).join(" ");
    consoleMessages.push(`[${message.params.type}] ${String(text).slice(0, 220)}`);
  }
  if (message.method === "Runtime.exceptionThrown") {
    const details = message.params.exceptionDetails;
    pageErrors.push(String(details.exception?.description ?? details.text).slice(0, 220));
  }
});

function send(method, params = {}, useSession = true) {
  const id = nextId += 1;
  const payload = { id, method, params };
  if (useSession && session) payload.sessionId = session;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify(payload));
  });
}

const { targetId } = await send("Target.createTarget", { url: "about:blank" }, false);
const attached = await send("Target.attachToTarget", { targetId, flatten: true }, false);
session = attached.sessionId;

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 620 });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: theme }, { name: "prefers-reduced-motion", value: "no-preference" }] });

const loaded = new Promise((resolve) => {
  const handler = (event) => {
    if (JSON.parse(event.data).method === "Page.loadEventFired") resolve();
  };
  ws.addEventListener("message", handler);
});
await send("Page.navigate", { url });
await Promise.race([loaded, sleep(30000)]);

// Wait for hydration: the cinema film element exists.
for (let attempt = 0; attempt < 80; attempt += 1) {
  const probe = await send("Runtime.evaluate", {
    expression: `!!document.querySelector('[class*="__film"]')`,
    returnByValue: true,
  });
  if (probe.result.value) break;
  await sleep(300);
}
// Headless Chrome only ticks rAF after the page produces frames, so nudge the
// scroll until the loop replaces the SSR transform with a real frame.
const realFrame = {
  expression: `/^scale\\([\\d.]+\\)/.test(document.querySelector('[class*="__world"]')?.style.transform ?? '')`,
  returnByValue: true,
};
let pokes = 0;
for (let attempt = 0; attempt < 80; attempt += 1) {
  const real = await send("Runtime.evaluate", realFrame);
  if (real.result.value) break;
  if (attempt % 6 === 5 && pokes < 6) {
    pokes += 1;
    await send("Runtime.evaluate", { expression: `window.scrollTo(0, window.scrollY + 3)`, returnByValue: true });
  }
  await sleep(400);
}
await sleep(600);

const written = [];
const readings = [];

/** Wait until the camera stops trending (the breathe keeps it oscillating). */
async function waitSettled(timeoutMs = 20000) {
  let previous = null;
  let stable = 0;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(700);
    const sample = await send("Runtime.evaluate", {
      expression: `(document.querySelector('[class*="__world"]')?.style.transform.match(/translate3d\\(([^)]+)\\)/) ?? ['','0px,0px,0px'])[1]`,
      returnByValue: true,
    });
    const [px, py] = String(sample.result.value ?? "").split(",").map((value) => Number.parseFloat(value));
    if (previous) {
      if (Math.hypot(px - previous[0], py - previous[1]) < 2.5) stable += 1;
      else stable = 0;
    }
    previous = [px, py];
    if (stable >= 2) return true;
  }
  return false;
}

for (const scene of scenes) {
  const scroll = await send("Runtime.evaluate", {
    expression: `(() => {
      const film = document.querySelector('[class*="__film"]');
      const travel = film.offsetHeight - window.innerHeight;
      // Mirrors SCENE_DISTANCES / progressForUnit() in src/lib/career-cinema.ts.
      const distances = [1.2, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 1.0];
      const unit = ${scene} - 1;
      const index = Math.min(distances.length - 1, Math.floor(unit));
      let start = 0;
      for (let i = 0; i < index; i += 1) start += distances[i];
      const total = distances.reduce((sum, step) => sum + step, 0);
      const progress = (start + (unit - index) * distances[index]) / total;
      const top = Math.round(progress * travel);
      window.scrollTo({ top, behavior: "instant" });
      return JSON.stringify({ top, travel });
    })()`,
    returnByValue: true,
  });
  await sleep(500);
  await waitSettled();
  await sleep(settle);
  const state = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      y: Math.round(window.scrollY),
      scene: document.querySelector('[class*="__stage"]')?.dataset.scene ?? null,
      hash: window.location.hash,
      worldFit: (document.querySelector('[class*="__world"]')?.style.transform ?? '').slice(0, 60),
      objs: Array.from(document.querySelectorAll('[class*="__obj"]')).map((n) => ({
        band: n.dataset.band ?? null,
        o: n.style.opacity || null,
        vis: n.style.visibility || null,
        tf: (n.style.transform || '').slice(0, 46),
        t: (n.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 22)
      })).filter((x) => x.t),
      chapter: (() => {
        const nodes = Array.from(document.querySelectorAll('[class*="__chapter"]'))
          .filter((node) => node.querySelector('[class*="__chapterBadge"]'));
        const visible = nodes.find((n) => Number(n.style.opacity || 0) > 0.5);
        return visible ? visible.textContent.replace(/\\s+/g, ' ').slice(0, 70) : null;
      })(),
      lines: Array.from(document.querySelectorAll('[class*="__line"]')).map((n) => ({
        pulse: (n.className || '').includes('linePulse'),
        o: Number(n.style.opacity || 0).toFixed(2),
        w: Math.round(Number.parseFloat(n.style.width || '0')),
        mv: (n.style.transform || '').slice(0, 34)
      })).filter((x) => Number(x.o) > 0.03)
    })`,
    returnByValue: true,
  });
  readings.push({ scene, scroll: JSON.parse(scroll.result.value), state: JSON.parse(state.result.value) });
  const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 78, fromSurface: true });
  const file = join(outDir, `scene${String(scene).padStart(2, "0")}.jpg`);
  writeFileSync(file, Buffer.from(shot.data, "base64"));
  written.push(file);
}

ws.close();
chrome.kill();

console.log(JSON.stringify({
  readings,
  shots: written,
  console: [...new Set(consoleMessages)].slice(0, 20),
  pageErrors: [...new Set(pageErrors)].slice(0, 10),
}, null, 2));
