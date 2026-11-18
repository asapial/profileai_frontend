/**
 * Headless regression for the CareerCinema story.
 *
 * Needs a dev server (default http://localhost:3000) and Chrome. Verifies the
 * things a picture cannot: scene indexing at every rest pose, clean URL behavior,
 * the chapter cross-fade (no blank gaps), rail jumps, template choices/keyboard,
 * accept/reject state, and the ultrawide/short-viewport world fit.
 *
 * Usage:
 *   node tools/cinema/regression.mjs [--url http://localhost:3000/] [--w 1440] [--h 900]
 *                                    [--scene 1 --scene 2 …] [--chrome <path>] [--port 9414]
 *
 * Exit code 0 = all checks pass. Console/page errors on the page fail the run.
 */
import { spawn } from "node:child_process";
import { resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { mkdirSync, rmSync, readFileSync } from "node:fs";

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
const profile = resolve(tmpdir(), `cinema-regression-${port}`);
if (!Number.isInteger(port) || !profile.startsWith(resolve(tmpdir()) + sep)) throw new Error("Invalid temporary browser profile");
// Wipe the profile: leftover localStorage (a previous run's locale clicks) must
// not turn into a false failure for the no-persistence assertion.
rmSync(profile, { recursive: true, force: true });
mkdirSync(profile, { recursive: true });

const CHAPTER_TITLES = [
  "Your experience. A tailored resume.", "Your work, connected.", "Every claim keeps its source.", "See the fit clearly.",
  "Stronger words. Same truth.", "Choose your resume style.", "Evidence becomes a resume.", "Ready for your next move.",
];

// Mirrors SCENE_DISTANCES / progressForUnit() in src/lib/career-cinema.ts: the
// allocation is read from the source so retiming cannot leave browser checks behind.
const SCENE_DISTANCES = JSON.parse(readFileSync(new URL('../../src/lib/career-cinema.ts', import.meta.url), 'utf8').match(/SCENE_DISTANCES = (\[[^\]]+\])/)[1]);
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
  { w: 768, h: 1024, scale: 0.58 },
  { w: 844, h: 390, scale: 0.55 },
  { w: 430, h: 932, scale: 0.78 },
  { w: 390, h: 844, scale: 0.78 },
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
  // Match the stable WebGL backend used by the native scene acceptance checks.
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
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
process.on("exit", () => { chrome.kill(); });
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
    const { resolve, reject, timer } = pending.get(message.id);
    clearTimeout(timer);
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
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 30000);
    pending.set(id, { resolve, reject, timer });
    ws.send(JSON.stringify(payload));
  });
}

const evaluate = async (expression) => {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: false });
  if (result.exceptionDetails) throw new Error(`page evaluate failed: ${result.exceptionDetails.text}`);
  return result.result?.value;
};

const { targetId } = await send("Target.createTarget", { url: "about:blank", newWindow: true }, false);
const attached = await send("Target.attachToTarget", { targetId, flatten: true }, false);
session = attached.sessionId;

await send("Page.enable");
await send("Runtime.enable");
await send("Page.bringToFront");
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
  if (targetUrl === "about:blank") return;
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
    // A legacy world pose can stay still while the native 3D camera is moving.
    // Paint a real frame and wait for the shared scroll unit as well.
    await send("Page.captureScreenshot", { format: "jpeg", quality: 10, captureBeyondViewport: false });
    const position = JSON.parse(await evaluate(`JSON.stringify({
      unit: Number(document.querySelector('[data-resume-preview]')?.dataset.unit),
      progress: (() => {const film=document.querySelector('[class*="__film"]');return film?Math.max(0,Math.min(1,-film.getBoundingClientRect().top/Math.max(1,film.offsetHeight-innerHeight))):0;})(),
    })`));
    let remaining = position.progress * UNIT_TRAVEL, wanted = 0;
    for (let index = 0; index < SCENE_DISTANCES.length; index += 1) {
      const step = SCENE_DISTANCES[index];
      if (remaining <= step || index === SCENE_DISTANCES.length - 1) { wanted = index + Math.max(0,Math.min(1,remaining/step)); break; }
      remaining -= step;
    }
    const arrived = Number.isFinite(position.unit) && Math.abs(position.unit - wanted) < .001;
    const raw = await evaluate(`(document.querySelector('[class*="__world"]')?.style.transform.match(/translate3d\\(([^)]+)\\)/) ?? ['','0px,0px,0px'])[1]`);
    const [px, py] = String(raw).split(",").map((value) => Number.parseFloat(value));
    if (previous) {
      if (arrived && Math.hypot(px - previous[0], py - previous[1]) < 2.5) stable += 1;
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
  window.scrollTo({ top: Math.round(film.getBoundingClientRect().top + scrollY + ${progressForUnit(unit)} * travel), behavior: "${behavior}" });
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
    const containers = Array.from(document.querySelectorAll('[data-chapter]'));
    const visible = containers.find((node) => Number(node.style.opacity || 0) > 0.5);
    return visible ? {
      opacity: Number(Number(visible.style.opacity).toFixed(3)),
      badge: visible.querySelector('[class*="__chapterBadge"]')?.textContent?.trim() ?? null,
      title: visible.querySelector('h1, h2')?.textContent?.trim() ?? null,
    } : null;
  })(),
  chapterSum: Number(Array.from(document.querySelectorAll('[data-chapter]'))
    .reduce((sum, node) => sum + Number(node.style.opacity || 0), 0).toFixed(3)),
  galleryOpacity: Number(document.querySelector('[data-template-gallery]')?.style.opacity ?? 0),
})`).then(JSON.parse);

// ── 1. Rest poses: scene index, clean URL, chapter header, world fit ─────────
await setViewport(width, height);
await navigate(url);

for (const scene of sceneList) {
  console.log(`Checking scene ${scene}…`);
  await scrollToUnit(scene - 1);
  await sleep(500);
  await waitSettled();
  const state = await probe();
  const index = scene - 1;
  check(`scene ${scene}: live index`, state.scene === String(index), `got ${state.scene}`);
  check(`scene ${scene}: URL stays clean`, state.hash === "", `got ${state.hash}`);
  check(`scene ${scene}: chapter visible`, state.chapter !== null && state.chapter.opacity >= 0.98, `got ${JSON.stringify(state.chapter)}`);
  check(`scene ${scene}: chapter number removed`, state.chapter?.badge === null, `got ${state.chapter?.badge}`);
  check(`scene ${scene}: chapter copy`, state.chapter?.title === CHAPTER_TITLES[index], `got ${state.chapter?.title}`);
  check(`scene ${scene}: single narrative block`, state.chapterSum <= 1.001, `combined opacity ${state.chapterSum}`);
  const expectedScale = FIT.find((entry) => entry.w === width && entry.h === height)?.scale ?? null;
  if (expectedScale !== null) {
    check(`scene ${scene}: world fit scale`, Math.abs(state.scale - expectedScale) < 0.005, `got ${state.scale}, want ${expectedScale}`);
  }
  if (scene === 1) {
    check("scene 1: page h1 is the hero headline", state.h1 === CHAPTER_TITLES[0], `got ${state.h1}`);
    const mid = await evaluate(`Number(document.querySelector('[class*="midCta"]')?.style.opacity ?? 1)`);
    check("scene 1: persistent CTA waits for the hero", mid <= 0.02, `got ${mid}`);
    const demo = await evaluate(`document.querySelector('[class*="heroDemo"]')?.tagName ?? null`);
    check("scene 1: tour control present", demo === "BUTTON", `got ${demo}`);
  }
  if (scene === 3) {
    const graph = await evaluate(`(() => {
      const graph = document.querySelector('[data-neural-graph]');
      return { opacity: Number(graph?.style.opacity), inert: graph?.inert,
        neurons: graph?.querySelectorAll('[data-neuron]').length,
        inputs: graph?.querySelectorAll('[data-neural-input]').length,
        outputs: graph?.querySelectorAll('[data-neural-output]').length,
        selected: graph?.dataset.selectedInput,
        route: graph?.querySelector('[data-neural-route]')?.getAttribute('d') };
    })()`);
    check("neural: graph holds at the evidence scene", graph.opacity >= .99 && graph.inert === false);
    check("neural: five layers contain forty neurons", graph.neurons === 40);
    check("neural: eight real source inputs", graph.inputs === 8);
    check("neural: six career outputs", graph.outputs === 6);
    check("neural: metric evidence is selected initially", graph.selected === "chip-metric");
    await evaluate(`document.querySelector('[data-neural-input="chip-react"]').click()`);
    await sleep(180);
    const selected = await evaluate(`(() => ({
      input: document.querySelector('[data-neural-graph]')?.dataset.selectedInput,
      output: document.querySelector('[data-neural-output="card-skills"]')?.getAttribute('aria-pressed'),
      source: document.querySelector('[data-neural-graph] [aria-live]')?.textContent,
      route: document.querySelector('[data-neural-route]')?.getAttribute('d'),
    }))()`);
    check("neural: source selection updates the active output", selected.input === "chip-react" && selected.output === "true");
    check("neural: source detail follows the selected evidence", selected.source?.includes("Customer Dashboard") === true);
    check("neural: source selection changes its path", selected.route !== graph.route);
    await evaluate(`document.querySelector('[data-neural-input="chip-typescript"]').focus()`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await sleep(180);
    check("neural: sources work with the keyboard", await evaluate(`document.querySelector('[data-neural-graph]')?.dataset.selectedInput`) === "chip-typescript");
    await evaluate(`document.querySelector('[data-neural-output="card-projects"]').click()`);
    await sleep(180);
    check("neural: output selection traces back to a source", await evaluate(`document.querySelector('[data-neural-graph]')?.dataset.selectedInput`) === "chip-python");
    await evaluate(`document.querySelector('[data-neural-input="chip-metric"]').click()`);
  }
  if (scene === 1 || scene === 4) {
    const graphHidden = await evaluate(`(() => { const graph=document.querySelector('[data-neural-graph]'); return Number(graph?.style.opacity) === 0 && graph?.inert === true; })()`);
    check(`scene ${scene}: neural controls retire outside their scene`, graphHidden);
  }
  if (scene === 4) {
    const alignment = await evaluate(`(() => {
      const root = document.querySelector('[data-alignment]');
      return { opacity: Number(root?.style.opacity), inert: root?.inert,
        cards: root?.querySelectorAll('[data-alignment-card]').length,
        rows: root?.querySelectorAll('[data-alignment-row]').length,
        routes: root?.querySelectorAll('[data-alignment-route]').length,
        source: root?.querySelector('[data-alignment-source]')?.textContent };
    })()`);
    check("alignment: approved cards and job panel hold at rest", alignment.opacity >= .99 && alignment.inert === false);
    check("alignment: five evidence cards", alignment.cards === 5);
    check("alignment: five job requirements", alignment.rows === 5);
    check("alignment: four supported connections", alignment.routes === 4);
    check("alignment: selected match includes its source", alignment.source?.includes("Customer Dashboard") === true);
    check("alignment: missing evidence has no connector", await evaluate(`!document.querySelector('[data-alignment-route="3"]')`) === true);
    await evaluate(`document.querySelector('[data-alignment-row="1"]').click()`);
    await sleep(200);
    check("alignment: requirement selects its supporting card", await evaluate(`document.querySelector('[data-alignment]')?.dataset.selectedCard`) === "card-experience");
    await evaluate(`document.querySelector('[data-alignment-row="3"]').click()`);
    await sleep(200);
    const missing = await evaluate(`(() => ({card:document.querySelector('[data-alignment]')?.dataset.selectedCard, source:document.querySelector('[data-alignment-source]')?.textContent}))()`);
    check("alignment: evidence gap stays explicit", missing.card === "none" && missing.source?.includes("No supporting source") === true);
    await evaluate(`document.querySelector('[data-alignment-row="2"]').focus({preventScroll:true})`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    await sleep(200);
    check("alignment: requirement works with the keyboard", await evaluate(`document.querySelector('[data-alignment]')?.dataset.selectedCard`) === "card-projects");
    await evaluate(`document.querySelector('[data-alignment-card="card-education"]').click()`);
    await sleep(200);
    check("alignment: unused evidence creates no invented match", await evaluate(`document.querySelector('[data-alignment]')?.dataset.selectedRow`) === "none");
    await evaluate(`document.querySelector('[data-alignment-row="0"]').click()`);
  }
  if (scene === 1 || scene === 5) {
    check(`scene ${scene}: alignment controls retire outside their scene`, await evaluate(`(() => { const root=document.querySelector('[data-alignment]');return Number(root?.style.opacity)===0 && root?.inert===true; })()`));
  }
  if (scene === 5) {
    const tailoring = await evaluate(`(() => {const root=document.querySelector('[data-tailoring]');return {opacity:Number(root?.style.opacity),inert:root?.inert,source:root?.querySelector('[data-tailoring-evidence]')?.textContent,routes:root?.querySelectorAll('[data-tailoring-route]').length,core:root?.querySelector('[data-tailoring-core]')?.textContent};})()`);
    check("tailoring: approved workbench is fully readable", tailoring.opacity >= .99 && tailoring.inert === false);
    check("tailoring: original wording is preserved", await evaluate(`document.querySelector('[data-tailoring] [data-panel="original"] blockquote')?.textContent`) === "Worked on frontend development tasks and fixed bugs.");
    check("tailoring: source evidence remains visible", tailoring.source?.includes("Customer Dashboard") && tailoring.source?.includes("Improved 31%"));
    check("tailoring: original and evidence meet the AI node", tailoring.routes === 3 && tailoring.core?.includes("Grounded in your evidence"));
    check("tailoring: old orbiting sphere retires", await evaluate(`getComputedStyle(document.querySelector('[data-object="orb"]')).visibility`) === "hidden");
    const marks = await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__diffNew"]').length`);
    check("scene 5: two evidence highlights", marks === 2, `got ${marks}`);
    const mid = await evaluate(`Number(document.querySelector('[class*="midCta"]')?.style.opacity ?? 0)`);
    check("scene 5: persistent CTA visible", mid >= 0.98, `got ${mid}`);
  }
  if (scene === 4 || scene === 6) check(`scene ${scene}: tailoring controls retire outside their scene`, await evaluate(`(() => {const root=document.querySelector('[data-tailoring]');return Number(root?.style.opacity)===0 && root?.inert===true;})()`));
  if (scene === 6) check("scene 6: gallery visible", state.galleryOpacity >= 0.98, `got ${state.galleryOpacity}`);

  if (scene === 7) {
    const assembly = await evaluate(`(() => {const root=document.querySelector('[data-assembly]'),room=document.querySelector('[data-template-gallery]');return {opacity:Number(root?.style.opacity),inert:root?.inert,placed:root?.dataset.placed,active:root?.dataset.activeSection,phases:[...root.querySelectorAll('[data-assembly-card]')].map(card=>card.dataset.phase),progress:root.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow'),mode:room?.dataset.mode,floor:Number(room.style.getPropertyValue('--gallery-floor')),canvases:document.querySelectorAll('[data-gallery-canvas]').length};})()`);
    check("assembly: approved interface fully visible", assembly.opacity >= .99 && assembly.inert === false);
    check("assembly: actual section counter matches progress", assembly.placed === "2" && assembly.progress === "40" && assembly.active === "projects");
    check("assembly: two placed, one active, two next", assembly.phases.join(",") === "placed,placed,placing,next,next");
    check("assembly: gallery paper and floor remain in one room", assembly.mode === "assembly" && assembly.floor === 1 && assembly.canvases === 1);
    check("assembly: old blocks and sphere retire", await evaluate(`[...document.querySelectorAll('[data-object^="block-"],[data-object="orb"]')].every(node=>getComputedStyle(node).visibility==='hidden')`));
    await evaluate(`document.querySelector('[data-assembly-card="skills"]').focus({preventScroll:true})`);
    await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
    await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (await evaluate(`document.querySelector('[data-assembly]')?.dataset.inspected`) === "skills") break;
      await send("Page.captureScreenshot", { format: "jpeg", quality: 10, captureBeyondViewport: false });
      await sleep(160);
    }
    check("assembly: native keyboard inspects a section", await evaluate(`document.querySelector('[data-assembly]')?.dataset.inspected`) === "skills");
    check("assembly: inspection preserves actual progress", await evaluate(`document.querySelector('[data-assembly]')?.dataset.placed`) === "2");
  }
  if (scene === 8) {
    const cta = await evaluate(`(() => {
      const obj = document.querySelector('[data-resume-preview]');
      return obj ? Number(Number(obj.style.opacity || 0).toFixed(3)) : null;
    })()`);
    check("scene 8: closing panel visible", cta !== null && cta >= 0.98, `got ${cta}`);
    const rows = await evaluate(`Array.from(document.querySelectorAll('[data-preview-output]')).map((node) => node.tagName).join(',')`);
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

// ── 3b. The film has no corner metadata or page progress dots ──────────────
await scrollToUnit(6);
await sleep(500);
await waitSettled();
{
  const chrome = await evaluate(`document.querySelectorAll('[class*="progressCount"],[class*="motionToggle"],[class*="metaRow"],[class*="metaSkip"],.story-spine').length`);
  check("film: removed corner controls stay absent", chrome === 0, `got ${chrome}`);
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
    const choices = Array.from(document.querySelectorAll('[data-gallery-choice]'));
    const next = choices.find((choice) => choice.getAttribute('aria-pressed') !== 'true');
    next?.click();
    return !!next;
  })()`);
  await sleep(1400);
  const after = await evaluate(`document.querySelector('[class*="__galleryMeta"] strong')?.textContent ?? null`);
  const pressed = await evaluate(`Array.from(document.querySelectorAll('[data-gallery-choice]')).map((choice) => choice.getAttribute('aria-pressed')).join(',')`);
  check("gallery choice: template changed", before && after && before !== after, `${before} → ${after}`);
  check("gallery choice: exactly one pressed", (pressed.match(/true/g) ?? []).length === 1, `got ${pressed}`);
  check("gallery: seven actual catalog designs", await evaluate(`document.querySelectorAll('[data-gallery-choice]').length`) === 7);
  check("gallery: removed progress dots stay absent", await evaluate(`document.querySelectorAll('[class*="__galleryDots"]').length`) === 0);

  await evaluate(`document.querySelector('[data-template-gallery] [class*="__controls"] > button:last-child')?.focus({preventScroll:true})`);
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowLeft", code: "ArrowLeft", windowsVirtualKeyCode: 37 });
  await sleep(1400);
  const afterKey = await evaluate(`document.querySelector('[class*="__galleryMeta"] strong')?.textContent ?? null`);
  check("gallery ArrowLeft: steps back round-robin", afterKey !== after, `stayed at ${afterKey}`);
}

// The gallery selection is the physical page used by the next stage.
const chosenCatalog = await evaluate(`document.querySelector('[data-template-gallery]').dataset.selectedTemplate`);
await scrollToUnit(6); await sleep(500); await waitSettled();
check("assembly: gallery selection carries forward", await evaluate(`document.querySelector('[data-assembly]')?.dataset.selectedTemplate`) === chosenCatalog);
await scrollToUnit(6.4); await sleep(300); await waitSettled();
check("assembly: final section completes before handoff", await evaluate(`document.querySelector('[data-assembly]')?.dataset.placed==='5' && document.querySelector('[data-assembly] [role="progressbar"]')?.getAttribute('aria-valuenow')==='100'`));

// ── 5. Accept / reject review state ─────────────────────────────────────────
await scrollToUnit(4);
await sleep(500);
await waitSettled();
await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[1]?.click()`);
await sleep(600);
{
  const state = await probe();
  check("accept: stage state", state.review === "accepted", `got ${state.review}`);
  check("accept: native tailoring state", await evaluate(`document.querySelector('[data-tailoring]')?.dataset.decision`) === "accepted");
  const chip = await evaluate(`!!document.querySelector('[data-panel="suggestion"] [class*="__acceptChip"]')`);
  check("accept: confirmation chip", chip === true, `got ${chip}`);
  const pressed = await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[1]?.getAttribute('aria-pressed')`);
  check("accept: button pressed", pressed === "true", `got ${pressed}`);
  check("accept: catalog preview contains the reviewed sentence", await evaluate(`(() => {const source=document.querySelector('[data-catalog-template] img')?.getAttribute('src') ?? '';return source.startsWith('data:image/svg+xml') && decodeURIComponent(source).includes('reusable React components') && decodeURIComponent(source).includes('improving load performance by 31%');})()`));
}
await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[0]?.click()`);
await sleep(600);
{
  const state = await probe();
  check("reject: stage state", state.review === "rejected", `got ${state.review}`);
  check("reject: native tailoring state", await evaluate(`document.querySelector('[data-tailoring]')?.dataset.decision`) === "rejected");
  check("reject: catalog preview restores the original content", await evaluate(`document.querySelector('[data-catalog-template] img')?.getAttribute('src')?.startsWith('/templates/story/')`) === true);
}
await evaluate(`document.querySelectorAll('[data-panel="suggestion"] [class*="__reviewActions"] button')[1]?.focus({preventScroll:true})`);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
await sleep(200);
check("tailoring: keyboard accepts a reviewed suggestion", await evaluate(`document.querySelector('[data-tailoring]')?.dataset.decision`) === "accepted");

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
    return Math.round(film.getBoundingClientRect().top + scrollY + ${progressForUnit(3)} * (film.offsetHeight - window.innerHeight));
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
  const status = await evaluate(`document.querySelector('[data-preview-actions] p[aria-live]')?.textContent ?? ""`);
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
  check("locale bn: scene numbers stay removed", state.chapter?.badge === null, `got ${state.chapter?.badge}`);
  const demo = await evaluate(`document.querySelector('[class*="heroDemo"]')?.textContent?.trim() ?? null`);
  check("locale bn: tour control label", demo === "ট্যুর চালান", `got ${demo}`);
  const storedParam = await evaluate(`window.localStorage.getItem('profileai:story-locale')`);
  check("locale bn: url param does not persist", storedParam === null, `got ${storedParam}`);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await evaluate(`document.querySelectorAll('[class*="localeSwitch"] button')[1]?.click()`);
  await sleep(300);
  const storedClick = await evaluate(`window.localStorage.getItem('profileai:story-locale')`);
  check("locale: pill choice persists", storedClick === "bn", `got ${storedClick}`);
  await evaluate(`document.querySelectorAll('[class*="localeSwitch"] button')[0]?.click()`);
  await sleep(400);
  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await sleep(150);
  await scrollToUnit(0);
  await waitSettled();
  const state2 = await probe();
  check("locale: switch back to EN title", state2.chapter?.title === CHAPTER_TITLES[0], `got ${state2.chapter?.title}`);
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
  await waitSettled();
  await evaluate(`window.scrollY > -1 && void 0`);
  await sleep(500);
  const exit = JSON.parse(await evaluate(`JSON.stringify({
    exit: document.querySelector('[class*="__stage"]')?.dataset.exit ?? null,
    rail: document.querySelectorAll('[class*="progressRail"]').length,
    cta: Number(getComputedStyle(document.querySelector('[class*="midCta"]')).opacity),
    scale: Number((document.querySelector('[class*="__world"]')?.style.transform ?? '').match(/^scale\\(([\\d.]+)\\)/)?.[1] ?? 1),
  })`));
  check("exit: removed progress line stays absent", exit.rail === 0, `got ${exit.rail}`);
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
      timeline: String(getComputedStyle(document.querySelector('.static-section-heading')).animationTimeline),
      bridge: document.querySelector('#static-zone')?.firstElementChild?.classList.contains('trust-section') ?? false,
      proof: document.querySelectorAll('.showcase-section, .story-section, .templates-section').length,
      proofHeadings: ['showcase-title', 'story-title', 'templates-title'].every((id) => (document.getElementById(id)?.textContent?.trim().length ?? 0) > 0),
      proofPapers: document.querySelectorAll('.template-paper').length,
      spine: document.querySelectorAll('.story-spine__tick').length,
      footerCta: document.querySelector('a.bottom-cta-button')?.getAttribute('href') ?? null,
    });
  })()`));
  check("reading zone: sections retain natural heights", zone.cv === "visible", `got ${zone.cv}`);
  check("reading zone: entrances are scroll-linked", zone.timeline?.includes("view()") === true, `got ${zone.timeline}`);
  check("reading zone: the evidence claim leads the way", zone.bridge === true, `got ${zone.bridge}`);
  check("reading zone: proof sections present", zone.proof === 3, `got ${zone.proof}`);
  check("reading zone: proof headings are labelled", zone.proofHeadings === true, `got ${zone.proofHeadings}`);
  check("reading zone: three template papers", zone.proofPapers === 3, `got ${zone.proofPapers}`);
  check("reading zone: progress dots stay removed", zone.spine === 0, `got ${zone.spine}`);
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
