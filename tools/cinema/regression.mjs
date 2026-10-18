/**
 * Headless regression for the CareerCinema story.
 *
 * Needs a dev server (default http://localhost:3000) and Chrome. Verifies the
 * things a picture cannot: scene indexing at every rest pose, clean URL behavior,
 * the chapter cross-fade (no blank gaps), rail jumps, gallery dots/keyboard,
 * accept/reject state, and the ultrawide/short-viewport world fit.
 *
 * Usage:
 *   node tools/cinema/regression.mjs [--url http://localhost:3000/] [--w 1440] [--h 900]
 *                                    [--scene 1 --scene 2 …] [--chrome <path>] [--port 9414]
 *
 * Exit code 0 = all checks pass. Console/page errors on the page fail the run.
 */
import { spawn } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, rmSync } from "node:fs";

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
const width = Number(opt("w", 1440));
const height = Number(opt("h", 900));
const chromePath = opt("chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");
const port = Number(opt("port", 9414));
const scenes = all("scene").map(Number).filter((n) => Number.isFinite(n));
const sceneList = scenes.length ? scenes : [1, 2, 3, 4, 5, 6, 7, 8];
const profile = join(process.env.TEMP ?? ".", `cinema-regression-${port}`);
// Wipe the profile: leftover localStorage (a previous run's locale clicks) must
// not turn into a false failure for the no-persistence assertion.
rmSync(profile, { recursive: true, force: true });
mkdirSync(profile, { recursive: true });

const CHAPTER_TITLES = [
  "Turn your experience into a resume built for the role.", "Your experience starts making sense.", "Every claim keeps its source.", "See the fit clearly.",
  "Improve the language without changing the truth.", "Choose the presentation. Keep the substance.", "Watch your evidence become a document.", "Your professional resume is ready.",
];

// Mirrors SCENE_DISTANCES / progressForUnit() in src/lib/career-cinema.ts: the
// story spends 1.2 viewports on the opening frame, 0.6 on each middle move and
// a full viewport on the finale (≈5.8 viewports of travel in total).
const SCENE_DISTANCES = [1.2, 0.6, 0.6, 0.6, 0.6, 0.6, 0.6, 1.0];
const UNIT_TRAVEL = SCENE_DISTANCES.reduce((sum, step) => sum + step, 0);
const progressForUnit = (unit) => {
  const clamped = Math.max(0, Math.min(SCENE_DISTANCES.length, unit));
  const index = Math.min(SCENE_DISTANCES.length - 1, Math.floor(clamped));
  let start = 0;
  for (let step = 0; step < index; step += 1) start += SCENE_DISTANCES[step];
  return (start + (clamped - index) * SCENE_DISTANCES[index]) / UNIT_TRAVEL;
};

// Mirrors worldFit() in CareerCinema.tsx and the --world-fit steps in the CSS.
const FIT = [
  { w: 1440, h: 900, scale: 1 },
  { w: 1920, h: 1080, scale: 1.1 },
  { w: 1024, h: 800, scale: 0.82 },
  { w: 1440, h: 760, scale: 0.92 },
  { w: 768, h: 1024, scale: 0.68 },
  { w: 844, h: 390, scale: 0.55 },
  { w: 430, h: 932, scale: 0.32 },
  { w: 390, h: 844, scale: 0.32 },
];

// ── Assertion harness ───────────────────────────────────────────────────────
const failures = [];
let checks = 0;
const check = (label, condition, detail = "") => {
  checks += 1;
  if (!condition) failures.push(detail ? `${label} — ${detail}` : label);
};

// ── Chrome + CDP plumbing ───────────────────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
chrome.on("exit", (code) => { if (code && code !== 0) process.stderr.write(`[chrome exited ${code}]\n`); });

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
/** Mocked signed-in user served for /auth/me; null means guest (401). */
let authUser = null;
let session;
let loadedResolve = null;

ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
    return;
  }
  if (message.method === "Page.loadEventFired" && loadedResolve) loadedResolve();
  if (message.method === "Runtime.consoleAPICalled" && (message.params.type === "error" || message.params.type === "warning")) {
    const text = (message.params.args ?? []).map((a) => a.value ?? a.description ?? a.type).join(" ");
    consoleMessages.push(`[${message.params.type}] ${String(text).slice(0, 220)}`);
  }
  if (message.method === "Runtime.exceptionThrown") {
    const details = message.params.exceptionDetails;
    pageErrors.push(String(details.exception?.description ?? details.text).slice(0, 220));
  }
  // Auth mock: the story personalizes only when /auth/me returns a session.
  if (message.method === "Fetch.requestPaused") {
    const body = authUser
      ? JSON.stringify({ status: 200, success: true, message: "OK", data: { user: authUser } })
      : JSON.stringify({ status: 401, success: false, message: "Unauthorized", data: null });
    void send("Fetch.fulfillRequest", {
      requestId: message.params.requestId,
      responseCode: authUser ? 200 : 401,
      responseHeaders: [
        { name: "Content-Type", value: "application/json" },
        { name: "Access-Control-Allow-Origin", value: "http://localhost:3000" },
        { name: "Access-Control-Allow-Credentials", value: "true" },
      ],
      body: Buffer.from(body).toString("base64"),
    }).catch(() => { /* page can move on without us */ });
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

const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: false });
  if (result.exceptionDetails) throw new Error(`page evaluate failed: ${result.exceptionDetails.text}`);
  return result.result?.value;
};

const { targetId } = await send("Target.createTarget", { url: "about:blank" }, false);
const attached = await send("Target.attachToTarget", { targetId, flatten: true }, false);
session = attached.sessionId;

await send("Page.enable");
await send("Runtime.enable");
// The only intercepted request is the auth probe; everything else flows free.
await send("Fetch.enable", { patterns: [{ urlPattern: "*auth/me*" }] });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "no-preference" }] });

async function setViewport(w, h) {
  await send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false });
}

async function navigate(targetUrl) {
  const loaded = new Promise((resolve) => { loadedResolve = resolve; });
  await send("Page.navigate", { url: targetUrl });
  await Promise.race([loaded, sleep(30000)]);
  loadedResolve = null;
  // Hydration: the film element exists.
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate(`!!document.querySelector('[class*="__film"]')`)) break;
    await sleep(300);
  }
  // The loop must have replaced the SSR transform with a real frame. Headless
  // Chrome only ticks rAF once the page produces frames, so nudge the scroll.
  const realTransform = `/^scale\\([\\d.]+\\)/.test(document.querySelector('[class*="__world"]')?.style.transform ?? '')`;
  let pokes = 0;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate(realTransform)) break;
    if (attempt % 6 === 5 && pokes < 6) {
      pokes += 1;
      await evaluate(`window.scrollTo(0, window.scrollY + 3)`);
    }
    await sleep(400);
  }
  await sleep(600);
}

/** Wait until the camera stops trending (breathe keeps it oscillating). */
async function waitSettled(timeoutMs = 20000) {
  let previous = null;
  let stable = 0;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await sleep(700);
    const raw = await evaluate(`(document.querySelector('[class*="__world"]')?.style.transform.match(/translate3d\\(([^)]+)\\)/) ?? ['','0px,0px,0px'])[1]`);
    const [px, py] = String(raw).split(",").map((value) => Number.parseFloat(value));
    if (previous) {
      if (Math.hypot(px - previous[0], py - previous[1]) < 2.5) stable += 1;
      else stable = 0;
    }
    previous = [px, py];
    if (stable >= 2) return true;
  }
  return false;
}

const scrollToUnit = (unit, behavior = "instant") => evaluate(`(() => {
  const film = document.querySelector('[class*="__film"]');
  const travel = film.offsetHeight - window.innerHeight;
  window.scrollTo({ top: Math.round(${progressForUnit(unit)} * travel), behavior: "${behavior}" });
  return Math.round(window.scrollY);
})()`);

const probe = () => evaluate(`JSON.stringify({
  scene: document.querySelector('[class*="__stage"]')?.dataset.scene ?? null,
  review: document.querySelector('[class*="__stage"]')?.dataset.review ?? null,
  hash: window.location.hash,
  scrollY: Math.round(window.scrollY),
  scale: (() => {
    const match = (document.querySelector('[class*="__world"]')?.style.transform ?? '').match(/^scale\\(([\\d.]+)\\)/);
    return match ? Number(match[1]) : null;
  })(),
  h1: document.querySelector('h1')?.textContent?.trim() ?? null,
  chapter: (() => {
    const containers = Array.from(document.querySelectorAll('[class*="__chapter"]'))
      .filter((node) => node.querySelector('[class*="__chapterBadge"]'));
    const visible = containers.find((node) => Number(node.style.opacity || 0) > 0.5);
    return visible ? {
      opacity: Number(Number(visible.style.opacity).toFixed(3)),
      badge: visible.querySelector('[class*="__chapterBadge"]')?.textContent?.trim() ?? null,
      title: visible.querySelector('h1, h2')?.textContent?.trim() ?? null,
    } : null;
  })(),
  chapterSum: Number(Array.from(document.querySelectorAll('[class*="__chapter"]'))
    .filter((node) => node.querySelector('[class*="__chapterBadge"]'))
    .reduce((sum, node) => sum + Number(node.style.opacity || 0), 0).toFixed(3)),
  galleryOpacity: Number(document.querySelector('[class*="__galleryBar"]')?.style.opacity ?? 1),
})`).then(JSON.parse);

// ── 1. Rest poses: scene index, clean URL, chapter header, world fit ─────────
await setViewport(width, height);
await navigate(url);

for (const scene of sceneList) {
  await scrollToUnit(scene - 1);
  await sleep(500);
  await waitSettled();
  const state = await probe();
  const index = scene - 1;
  check(`scene ${scene}: live index`, state.scene === String(index), `got ${state.scene}`);
  check(`scene ${scene}: URL stays clean`, state.hash === "", `got ${state.hash}`);
  check(`scene ${scene}: chapter visible`, state.chapter !== null && state.chapter.opacity >= 0.98, `got ${JSON.stringify(state.chapter)}`);
  check(`scene ${scene}: chapter badge`, state.chapter?.badge === String(scene).padStart(2, "0"), `got ${state.chapter?.badge}`);
  check(`scene ${scene}: chapter copy`, state.chapter?.title === CHAPTER_TITLES[index], `got ${state.chapter?.title}`);
  check(`scene ${scene}: single narrative block`, state.chapterSum <= 1.001, `combined opacity ${state.chapterSum}`);
  const expectedScale = FIT.find((entry) => entry.w === width && entry.h === height)?.scale ?? null;
  if (expectedScale !== null) {
    check(`scene ${scene}: world fit scale`, Math.abs(state.scale - expectedScale) < 0.005, `got ${state.scale}, want ${expectedScale}`);
  }
  if (scene === 1) {
    check("scene 1: page h1 is the hero headline", state.h1 === CHAPTER_TITLES[0], `got ${state.h1}`);
    const mid = await evaluate(`Number(document.querySelector('[class*="midCta"]')?.style.opacity ?? 1)`);
    check("scene 1: persistent CTA visible", mid >= 0.98, `got ${mid}`);
    const demo = await evaluate(`document.querySelector('[class*="heroDemo"]')?.tagName ?? null`);
    check("scene 1: tour control present", demo === "BUTTON", `got ${demo}`);
  }
  if (scene === 5) {
    const marks = await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__diffNew"]').length`);
    check("scene 5: two evidence highlights", marks === 2, `got ${marks}`);
    const mid = await evaluate(`Number(document.querySelector('[class*="midCta"]')?.style.opacity ?? 0)`);
    check("scene 5: persistent CTA visible", mid >= 0.98, `got ${mid}`);
  }
  if (scene === 6) check("scene 6: gallery visible", state.galleryOpacity >= 0.98, `got ${state.galleryOpacity}`);
  if (scene === 8) {
    const cta = await evaluate(`(() => {
      const obj = Array.from(document.querySelectorAll('[class*="__obj"]')).find((node) => (node.textContent || '').includes('Your experience.'));
      return obj ? Number(Number(obj.style.opacity || 0).toFixed(3)) : null;
    })()`);
    check("scene 8: closing panel visible", cta !== null && cta >= 0.98, `got ${cta}`);
    const rows = await evaluate(`Array.from(document.querySelectorAll('[class*="outputRow"]')).map((node) => node.tagName).join(',')`);
    check("scene 8: four action rows", rows === "BUTTON,BUTTON,BUTTON,BUTTON", `got ${rows}`);
    const scrub = await evaluate(`getComputedStyle(document.querySelector('[class*="scrubber"]')).display`);
    check("scrubber hidden without ?scrub", scrub === "none", `got ${scrub}`);
    const guestSheet = await evaluate(`document.querySelector('[class*="__sheet"] header span')?.textContent ?? null`);
    check("scene 8: guest sheet is illustrative", guestSheet === "ALEX MORGAN", `got ${guestSheet}`);
  }
}

// ── 2. Narrative handoffs: one block at a time, clear gaps in between ───────
for (const mid of [0.5, 4.5]) {
  await scrollToUnit(mid);
  await sleep(500);
  await waitSettled();
  const state = await probe();
  check(`handoff @ ${mid}: transformation gap stays clear`, state.chapterSum <= 0.02, `combined opacity ${state.chapterSum}`);
}
for (const mid of [0.2, 3.2]) {
  await scrollToUnit(mid);
  await sleep(500);
  await waitSettled();
  const state = await probe();
  check(`handoff @ ${mid}: never two blocks at once`, state.chapterSum <= 1.001, `combined opacity ${state.chapterSum}`);
  check(`handoff @ ${mid}: a narrative block is present`, state.chapterSum >= 0.2, `combined opacity ${state.chapterSum}`);
}

// ── 3. In-story jump control ────────────────────────────────────────────────
await scrollToUnit(0);
await sleep(500);
await waitSettled();
await evaluate(`document.querySelector('[class*="heroSecondary"]')?.click()`);
await sleep(900);
await waitSettled();
{
  const state = await probe();
  check("story jump: hero secondary lands on scene 2", state.scene === "1", `got ${state.scene}`);
  check("story jump: URL stays clean", state.hash === "", `got ${state.hash}`);
}

// ── 3b. Chrome: 01 / 08 counter and motion pause ────────────────────────────
await scrollToUnit(6);
await sleep(500);
await waitSettled();
{
  const counter = await evaluate(`document.querySelector('[class*="progressCount"]')?.textContent?.trim() ?? null`);
  check("progress: counter reads 07 / 08", counter === "07 / 08", `got ${counter}`);
  await evaluate(`document.querySelector('[class*="motionToggle"]')?.click()`);
  await sleep(300);
  const paused = await evaluate(`document.querySelector('[class*="__stage"]')?.dataset.motion ?? null`);
  const pressed = await evaluate(`document.querySelector('[class*="motionToggle"]')?.getAttribute('aria-pressed')`);
  check("pause: stage enters calm mode", paused === "paused", `got ${paused}`);
  check("pause: control reports pressed", pressed === "true", `got ${pressed}`);
  await evaluate(`document.querySelector('[class*="motionToggle"]')?.click()`);
  await sleep(300);
  const running = await evaluate(`document.querySelector('[class*="__stage"]')?.dataset.motion ?? null`);
  const released = await evaluate(`document.querySelector('[class*="motionToggle"]')?.getAttribute('aria-pressed')`);
  check("pause: control resumes", running === "run", `got ${running}`);
  check("pause: control reports released", released === "false", `got ${released}`);
}

// ── 3c. Auto-demo: play starts the tour, any input cancels ──────────────────
await scrollToUnit(0);
await sleep(500);
await waitSettled();
{
  const beforeY = await evaluate(`window.scrollY`);
  await evaluate(`document.querySelector('[class*="heroDemo"]')?.click()`);
  let playing = await evaluate(`document.querySelector('[class*="heroDemo"]')?.getAttribute('aria-pressed')`);
  check("demo: click starts the tour", playing === "true", `aria-pressed=${playing}`);
  for (let poke = 0; poke < 8; poke += 1) {
    await evaluate(`window.scrollTo({ top: window.scrollY + 3, behavior: "instant" })`);
    await sleep(90);
  }
  const afterY = await evaluate(`window.scrollY`);
  check("demo: advances the runway", afterY - beforeY > 30, `${beforeY} → ${afterY}`);
  await evaluate(`window.dispatchEvent(new WheelEvent('wheel'))`);
  await sleep(250);
  playing = await evaluate(`document.querySelector('[class*="heroDemo"]')?.getAttribute('aria-pressed')`);
  check("demo: any input cancels", playing === "false", `aria-pressed=${playing}`);
}

// ── 4. Gallery: dots and arrow keys ─────────────────────────────────────────
await scrollToUnit(5);
await sleep(500);
await waitSettled();
{
  const before = await evaluate(`document.querySelector('[class*="__galleryMeta"] strong')?.textContent ?? null`);
  await evaluate(`(() => {
    const dots = Array.from(document.querySelectorAll('[class*="__galleryDots"] button'));
    const next = dots.find((dot) => dot.getAttribute('aria-pressed') !== 'true');
    next?.click();
    return !!next;
  })()`);
  await sleep(1400);
  const after = await evaluate(`document.querySelector('[class*="__galleryMeta"] strong')?.textContent ?? null`);
  const pressed = await evaluate(`Array.from(document.querySelectorAll('[class*="__galleryDots"] button')).map((dot) => dot.getAttribute('aria-pressed')).join(',')`);
  check("gallery dot: template changed", before && after && before !== after, `${before} → ${after}`);
  check("gallery dot: exactly one pressed", (pressed.match(/true/g) ?? []).length === 1, `got ${pressed}`);

  await evaluate(`document.querySelector('[class*="__galleryBar"] > button:last-child')?.focus()`);
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await sleep(1400);
  const afterKey = await evaluate(`document.querySelector('[class*="__galleryMeta"] strong')?.textContent ?? null`);
  check("gallery ArrowLeft: steps back round-robin", afterKey !== after, `stayed at ${afterKey}`);
}

// ── 5. Accept / reject review state ─────────────────────────────────────────
await scrollToUnit(4);
await sleep(500);
await waitSettled();
await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[1]?.click()`);
await sleep(600);
{
  const state = await probe();
  check("accept: stage state", state.review === "accepted", `got ${state.review}`);
  const chip = await evaluate(`!!document.querySelector('[data-panel="suggestion"] [class*="__acceptChip"]')`);
  check("accept: confirmation chip", chip === true, `got ${chip}`);
  const pressed = await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[1]?.getAttribute('aria-pressed')`);
  check("accept: button pressed", pressed === "true", `got ${pressed}`);
}
await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[0]?.click()`);
await sleep(600);
{
  const state = await probe();
  check("reject: stage state", state.review === "rejected", `got ${state.review}`);
}

// ── 6. Deep link opens at the right chapter (cold load) ─────────────────────
await navigate("about:blank");
await navigate(`${url}#scene-04`);
{
  await waitSettled();
  const state = await probe();
  check("deep link: chapter index", state.scene === "3", `got ${state.scene}`);
  check("deep link: URL cleaned", state.hash === "", `got ${state.hash}`);
  const expected = await evaluate(`(() => {
    const film = document.querySelector('[class*="__film"]');
    return Math.round(${progressForUnit(3)} * (film.offsetHeight - window.innerHeight));
  })()`);
  check("deep link: scroll position", Math.abs(state.scrollY - expected) < 80, `got ${state.scrollY}, want ~${expected}`);
}

// ── 6b. Personalization: a signed-in session flows into the sample resume ──
authUser = {
  id: "u-mock", name: "Rifat Ahmed", email: "rifat.ahmed@example.com", role: "USER",
  emailVerified: true, twoFactorEnabled: false, isActive: true, createdAt: "2026-01-01T00:00:00.000Z",
  profile: { id: "p-mock", firstName: "Rifat", lastName: "Ahmed", avatarUrl: null, headline: null },
};
await navigate(url);
await waitSettled();
{
  const sheetName = await evaluate(`document.querySelector('[class*="__sheet"] header span')?.textContent ?? null`);
  check("personal: sheet carries the user name", sheetName === "RIFAT AHMED", `got ${sheetName}`);
  const note = await evaluate(`document.querySelector('[class*="__hero"] small')?.textContent ?? ""`);
  check("personal: hero note is signed-in", note.includes("Rifat"), note);
  const status = await evaluate(`document.querySelector('[class*="__finalPanel"] p[aria-live]')?.textContent ?? ""`);
  check("personal: final status is signed-in", status.includes("Rifat"), status);
  const cta = JSON.parse(await evaluate(`(() => {
    const link = document.querySelector('a.bottom-cta-button');
    const sheet = document.querySelector('.cta-resume-preview__sheet strong');
    return JSON.stringify({ href: link?.getAttribute('href') ?? null, name: sheet?.textContent ?? null });
  })()`));
  check("personal: bottom CTA opens the resume flow", cta.href === "/dashboard/documents/new", `got ${cta.href}`);
  check("personal: CTA sheet carries the user name", cta.name === "Rifat Ahmed", `got ${cta.name}`);
}
authUser = null;

// ── 6c. Story locale: bn via ?lang, the pill persists, switching back to EN ─
await navigate("about:blank");
await navigate(`${url}?lang=bn`);
await waitSettled();
{
  const state = await probe();
  check("locale bn: chapter title", state.chapter?.title === "অভিজ্ঞতা থেকে তৈরি হোক চাকরির রেজুমে।", `got ${state.chapter?.title}`);
  check("locale bn: badge numerals", state.chapter?.badge === "০১", `got ${state.chapter?.badge}`);
  const demo = await evaluate(`document.querySelector('[class*="heroDemo"]')?.textContent?.trim() ?? null`);
  check("locale bn: tour control label", demo === "ট্যুর চালান", `got ${demo}`);
  const storedParam = await evaluate(`window.localStorage.getItem('profileai:story-locale')`);
  check("locale bn: url param does not persist", storedParam === null, `got ${storedParam}`);
  await evaluate(`document.querySelectorAll('[class*="localeSwitch"] button')[1]?.click()`);
  await sleep(300);
  const storedClick = await evaluate(`window.localStorage.getItem('profileai:story-locale')`);
  check("locale: pill choice persists", storedClick === "bn", `got ${storedClick}`);
  await evaluate(`document.querySelectorAll('[class*="localeSwitch"] button')[0]?.click()`);
  await sleep(400);
  const state2 = await probe();
  check("locale: switch back to EN title", state2.chapter?.title === "Turn your experience into a resume built for the role.", `got ${state2.chapter?.title}`);
  const storedEn = await evaluate(`window.localStorage.getItem('profileai:story-locale')`);
  check("locale: EN choice persisted", storedEn === "en", `got ${storedEn}`);
}

// ── 7. World fit across viewports ───────────────────────────────────────────
for (const entry of FIT) {
  if (entry.w === width && entry.h === height) continue; // covered by the rest poses
  await setViewport(entry.w, entry.h);
  await navigate("about:blank"); // force a full load at the new metrics
  await navigate(url);
  const reading = JSON.parse(await evaluate(`(() => {
    const match = (document.querySelector('[class*="__world"]')?.style.transform ?? '').match(/^scale\\(([\\d.]+)\\)/);
    return JSON.stringify({ scale: match ? Number(match[1]) : null, innerW: window.innerWidth, innerH: window.innerHeight, scrollW: document.documentElement.scrollWidth });
  })()`));
  check(`fit ${entry.w}×${entry.h}: scale`, reading.scale !== null && Math.abs(reading.scale - entry.scale) < 0.005,
    `got ${reading.scale}, want ${entry.scale} (viewport ${reading.innerW}×${reading.innerH})`);
  check(`fit ${entry.w}×${entry.h}: no horizontal overflow`, reading.scrollW <= reading.innerW + 1,
    `scrollWidth ${reading.scrollW} vs innerWidth ${reading.innerW}`);
}

// ── 7b. Handoff + integration: 1:1 scroll, C-V, view() entrances, spine ─────
await setViewport(width, height);
await navigate("about:blank");
await navigate(url);
await waitSettled();
{
  const behavior = await evaluate(`getComputedStyle(document.documentElement).scrollBehavior`);
  check("speed: document scrolls 1:1", behavior === "auto", `got ${behavior}`);
}
await scrollToUnit(7.5);
// Frame-starved headless rAF only ticks while evaluate keeps the page busy.
const waitExit = async (want, attempts = 24) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await sleep(180);
    const value = await evaluate(`window.scrollY > -1 && (document.querySelector('[class*="__stage"]')?.dataset.exit ?? null)`);
    if (value === want) return true;
  }
  return false;
};
{
  const flagged = await waitExit("1");
  check("exit: stage flags the run-out tail", flagged, `stayed null`);
  await evaluate(`window.scrollY > -1 && void 0`);
  await sleep(500);
  const exit = JSON.parse(await evaluate(`JSON.stringify({
    exit: document.querySelector('[class*="__stage"]')?.dataset.exit ?? null,
    rail: Number(getComputedStyle(document.querySelector('[class*="progressRail"]')).opacity),
    cta: Number(getComputedStyle(document.querySelector('[class*="midCta"]')).opacity),
    scale: Number((document.querySelector('[class*="__world"]')?.style.transform ?? '').match(/^scale\\(([\\d.]+)\\)/)?.[1] ?? 1),
  })`));
  check("exit: progress line fades out with the world", exit.rail < 0.06, `got ${exit.rail}`);
  check("exit: persistent CTA fades out with the world", exit.cta < 0.06, `got ${exit.cta}`);
  check("exit: world eases back before the handoff", exit.scale < 0.99, `got ${exit.scale}`);
}
await scrollToUnit(7);
{
  const cleared = await waitExit("0");
  check("exit: scrolling back reinstates the chrome", cleared, `stayed "1"`);
}
await evaluate(`window.scrollTo(0, document.documentElement.scrollHeight)`);
await sleep(900);
{
  const zone = JSON.parse(await evaluate(`(() => {
    const section = document.querySelector('#static-zone > *:nth-child(4)');
    const style = section ? getComputedStyle(section) : null;
    return JSON.stringify({
      cv: style?.contentVisibility ?? null,
      timeline: style ? String(style.animationTimeline) : null,
      bridge: document.querySelector('.static-zone__bridge')?.textContent.includes('THE PRODUCT') ?? false,
      proof: document.querySelectorAll('.showcase-section, .story-section, .templates-section').length,
      proofHeadings: ['showcase-title', 'story-title', 'templates-title'].every((id) => (document.getElementById(id)?.textContent?.trim().length ?? 0) > 0),
      proofPapers: document.querySelectorAll('.template-paper').length,
      spine: document.querySelectorAll('.story-spine__tick').length,
      footerCta: document.querySelector('a.bottom-cta-button')?.getAttribute('href') ?? null,
    });
  })()`));
  check("reading zone: offscreen sections skip layout", zone.cv === "auto", `got ${zone.cv}`);
  check("reading zone: entrances are scroll-linked", zone.timeline?.includes("view()") === true, `got ${zone.timeline}`);
  check("reading zone: floor bridge leads the way", zone.bridge === true, `got ${zone.bridge}`);
  check("reading zone: proof sections present", zone.proof === 3, `got ${zone.proof}`);
  check("reading zone: proof headings are labelled", zone.proofHeadings === true, `got ${zone.proofHeadings}`);
  check("reading zone: three template papers", zone.proofPapers === 3, `got ${zone.proofPapers}`);
  check("reading zone: progress spine covers the page", zone.spine >= 12, `got ${zone.spine}`);
  check("reading zone: guest CTA routes to registration", zone.footerCta === "/register", `got ${zone.footerCta}`);
}

// ── 8. Console must stay clean ──────────────────────────────────────────────
const realErrors = [...new Set(consoleMessages.filter((message) => message.startsWith("[error]")))];
check("no console errors", realErrors.length === 0, realErrors.slice(0, 4).join(" | "));
check("no page exceptions", pageErrors.length === 0, pageErrors.slice(0, 4).join(" | "));

// ── Report ──────────────────────────────────────────────────────────────────
ws.close();
chrome.kill();

if (failures.length) {
  console.error(`✗ cinema regression: ${failures.length} of ${checks} checks failed:`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}
console.log(`✓ cinema regression OK (${checks} checks, ${FIT.length === 1 ? "" : `${FIT.length} viewports, `}scenes ${sceneList.join(",")})`);
