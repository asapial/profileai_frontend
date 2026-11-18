"use client";

import { useEffect, useId, useRef } from "react";
import type { MascotMood } from "./AuthMascotContext";
import type { NativePuppet } from "./createNativePuppet";
import styles from "./AuthPuppet.module.css";

/** Decorative animation observes control metadata, never password contents. */
export function AuthPuppet() {
  const hostRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useId().replaceAll(":", "");
  const url = (name: string) => "url(#" + id + "-" + name + ")";
  useEffect(() => {
    const host = hostRef.current, svg = svgRef.current, scope = host?.closest("[data-auth-page]");
    if (!host || !svg || !scope) return;
    const head = svg.querySelector<SVGGElement>("[data-head]")!;
    const face = svg.querySelector<SVGGElement>("[data-face]")!;
    const body = svg.querySelector<SVGGElement>("[data-body]")!;
    const pupils = [...svg.querySelectorAll<SVGGElement>("[data-pupil]")];
    const eyes = [...svg.querySelectorAll<SVGGElement>("[data-eye]")];
    const hands = [...svg.querySelectorAll<SVGGElement>("[data-hand]")];
    const sleeves = [...svg.querySelectorAll<SVGPathElement>("[data-sleeve]")];
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false, visible = true, raf = 0, last = 0, elapsed = 0, nextBlink = 2.4, blinkStart = -5, blinks = 0, frames = 0;
    let native: NativePuppet | undefined, nativeTried = false, dark = document.documentElement.classList.contains("dark");
    let mood: MascotMood = "idle", field: HTMLInputElement | null = null, pointer: { x: number; y: number } | null = null;
    const aim = { x: 0, y: 0, cover: 0, vx: 0, vy: 0, vc: 0 };
    const neckX = { value: 0, velocity: 0 }, neckY = { value: 0, velocity: 0 }, torsoX = { value: 0, velocity: 0 };
    const eyeX = { value: 0, velocity: 0 }, eyeY = { value: 0, velocity: 0 };
    const clamp = (n: number) => Math.max(-1, Math.min(1, n));
    function request() { if (!disposed && visible && !document.hidden && !raf) raf = requestAnimationFrame(draw); }
    function fallback() {
      native?.dispose(); native = undefined;
      host!.dataset.rig = "svg-fallback"; host!.dataset.renderState = "fallback"; request();
    }
    function initialize() {
      if (nativeTried || disposed || !visible) return; nativeTried = true;
      void import("./createNativePuppet").then(({ createNativePuppet }) => {
        if (disposed) return;
        try { native = createNativePuppet(host!, fallback); request(); } catch (error) { host!.dataset.rendererError = error instanceof Error ? error.message : "Renderer unavailable"; fallback(); }
      }).catch(fallback);
    }
    function follow(axis: { value: number; velocity: number }, target: number, dt: number, stiffness: number, damping: number) {
      if (reduced.matches) { axis.value = target; axis.velocity = 0; return axis.value; }
      for (let i = 0; i < 4; i++) { const step = dt / 4; axis.velocity += ((target - axis.value) * stiffness - axis.velocity * damping) * step; axis.value += axis.velocity * step; }
      return axis.value;
    }
    function draw(time: number) {
      raf = 0; if (disposed) return;
      if (!reduced.matches && last && time - last < 1000 / 30) { request(); return; }
      const dt = Math.min(.05, last ? (time - last) / 1000 : .033); last = time; elapsed += dt;
      const r = host!.getBoundingClientRect(), rect = field?.isConnected ? field.getBoundingClientRect() : null;
      const target = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : pointer;
      const tx = reduced.matches || mood === "cover" ? 0 : target ? clamp((target.x - r.left - r.width / 2) / Math.max(innerWidth * .35, 180)) : Math.sin(elapsed * .35) * .09;
      const ty = reduced.matches || mood === "cover" ? 0 : target ? clamp((target.y - r.top - r.height * .35) / Math.max(innerHeight * .35, 180)) : -.04 + Math.sin(elapsed * .27) * .035;
      const tc = mood === "cover" ? 1 : 0;
      if (reduced.matches) { aim.x = tx; aim.y = ty; aim.cover = tc; aim.vx = aim.vy = aim.vc = 0; }
      else {
        for (let i = 0; i < 4; i++) {
          const step = dt / 4;
          aim.vx += ((tx - aim.x) * 90 - aim.vx * 18) * step; aim.x += aim.vx * step;
          aim.vy += ((ty - aim.y) * 90 - aim.vy * 18) * step; aim.y += aim.vy * step;
          aim.vc += ((tc - aim.cover) * 110 - aim.vc * 21) * step; aim.cover += aim.vc * step;
        }
      }
      const c = Math.max(0, Math.min(1, aim.cover)), breathe = reduced.matches ? 0 : Math.sin(elapsed * 1.8);
      const nx = follow(neckX, aim.x, dt, 46, 14), ny = follow(neckY, aim.y, dt, 46, 14);
      const bodyYaw = follow(torsoX, nx, dt, 22, 12) * .055;
      const ex = follow(eyeX, tx, dt, 175, 24), ey = follow(eyeY, ty, dt, 175, 24);
      if (!reduced.matches && !tc && elapsed > nextBlink) { blinkStart = elapsed; nextBlink = elapsed + (blinks % 3 === 1 ? 3.3 : 4.6); blinks++; }
      const blinkAge = elapsed - blinkStart, blink = !tc && blinkAge > 0 && blinkAge < .17 ? Math.sin(blinkAge / .17 * Math.PI) : 0;
      const hx = aim.x * 8, hy = aim.y * 4 + breathe * .65, roll = -aim.x * 5;
      const headYaw = aim.x * .235, headPitch = aim.y * .14 + c * .055, neckYaw = nx * .13, neckPitch = ny * .05 + c * .025;
      if (native) {
        try {
          native.draw({ headYaw, headPitch, neckYaw, neckPitch, torsoYaw: bodyYaw, roll: -aim.x * .045 + breathe * .003, eyeYaw: ex * .26 - (headYaw + neckYaw) * .45, eyePitch: ey * .15 - (headPitch + neckPitch) * .3, cover: c, breath: breathe, blink, time: elapsed, dark });
          if (host!.dataset.gpuReady === "true") { host!.dataset.rig = "native-webgl2"; host!.dataset.renderState = "ready"; }
        } catch { fallback(); }
      }
      if (!native) {
      head.setAttribute("transform", "translate(" + hx.toFixed(2) + " " + hy.toFixed(2) + ") rotate(" + roll.toFixed(2) + " 180 232)");
      face.setAttribute("transform", "translate(" + (aim.x * 3).toFixed(2) + " " + (aim.y * 2).toFixed(2) + ")");
      body.setAttribute("transform", "translate(180 360) scale(1 " + (1 + breathe * .006).toFixed(4) + ") translate(-180 -360)");
      pupils.forEach(pupil => pupil.setAttribute("transform", "translate(" + (aim.x * 8).toFixed(2) + " " + (aim.y * 6).toFixed(2) + ")"));
      eyes.forEach((eye, i) => eye.setAttribute("transform", "translate(" + (i ? 220 : 140) + " 162) scale(1 " + Math.max(.06, 1 - blink * .94).toFixed(3) + ")"));
      hands.forEach((hand, i) => {
        const sign = i ? 1 : -1, restX = i ? 255 : 105, eyeX = i ? 220 : 140;
        const x = restX + (eyeX + hx - restX) * c, y = 314 + (168 + hy - 314) * c;
        hand.setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") rotate(" + (180 * (1 - c) + sign * c * 9).toFixed(2) + ") scale(" + (1 + c * .28).toFixed(3) + ")");
        const sx = i ? 231 : 129, wristY = y + (c * 2 - 1) * 18;
        sleeves[i].setAttribute("d", "M" + sx + " 268 C" + (sx + sign * 26) + " " + (282 - c * 28) + " " + (x + sign * (12 + c * 22)).toFixed(2) + " " + (wristY + 24 - c * 30).toFixed(2) + " " + x.toFixed(2) + " " + wristY.toFixed(2));
      });
      }
      host!.dataset.headYaw = (headYaw + neckYaw).toFixed(4); host!.dataset.headPitch = (headPitch + neckPitch).toFixed(4);
      host!.dataset.neckYaw = neckYaw.toFixed(4); host!.dataset.neckPitch = neckPitch.toFixed(4);
      host!.dataset.handCover = c.toFixed(4); host!.dataset.blinks = String(blinks);
      host!.dataset.blink = blink.toFixed(4);
      host!.dataset.frameCount = String(++frames);
      if (!reduced.matches || native && host!.dataset.gpuReady !== "true") request();
    }
    function inspect() {
      const active = document.activeElement;
      field = active instanceof HTMLInputElement && active.autocomplete.includes("password") ? active : null;
      if (!field && active instanceof HTMLButtonElement && (active.classList.contains("ax-eye") || /password|confirmation/i.test(active.getAttribute("aria-label") ?? ""))) field = active.closest("div")?.querySelector<HTMLInputElement>('input[autocomplete*="password"]') ?? null;
      if (field && !scope!.contains(field)) field = null;
      mood = field ? field.type === "password" ? "cover" : "peek" : "idle"; host!.dataset.pose = mood; request();
    }
    const afterFocus = () => queueMicrotask(() => { if (!disposed) inspect(); });
    const move = (event: PointerEvent) => { if (event.pointerType !== "touch") { pointer = { x: event.clientX, y: event.clientY }; request(); } };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) { pointer = null; request(); } };
    const observer = new MutationObserver(inspect); observer.observe(scope, { attributes: true, subtree: true, attributeFilter: ["type"] });
    const intersection = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; if (!visible) { cancelAnimationFrame(raf); raf = 0; } else { last = 0; initialize(); request(); } }); intersection.observe(host);
    const size = new ResizeObserver(() => { native?.resize(); request(); }); size.observe(host);
    const theme = new MutationObserver(() => { dark = document.documentElement.classList.contains("dark"); request(); }); theme.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else { last = 0; request(); } };
    const preference = () => { last = 0; request(); };
    scope.addEventListener("focusin", inspect); scope.addEventListener("focusout", afterFocus);
    window.addEventListener("pointermove", move, { passive: true }); window.addEventListener("pointerout", leave, { passive: true }); document.addEventListener("visibilitychange", visibility); reduced.addEventListener("change", preference);
    inspect(); request();
    return () => { disposed = true; cancelAnimationFrame(raf); observer.disconnect(); intersection.disconnect(); size.disconnect(); theme.disconnect(); native?.dispose(); scope.removeEventListener("focusin", inspect); scope.removeEventListener("focusout", afterFocus); window.removeEventListener("pointermove", move); window.removeEventListener("pointerout", leave); document.removeEventListener("visibilitychange", visibility); reduced.removeEventListener("change", preference); };
  }, []);
  return <div ref={hostRef} className={styles.puppet} data-auth-puppet data-rig="svg-fallback" data-render-state="loading" data-pose="idle" aria-hidden="true">
    <svg ref={svgRef} viewBox="0 0 360 460" focusable="false">
      <defs>
        <linearGradient id={id + "-hood"} x1=".15" y1="0" x2=".85" y2="1"><stop stopColor="#ead9f6"/><stop offset=".5" stopColor="#c2a2dc"/><stop offset="1" stopColor="#9373b8"/></linearGradient>
        <radialGradient id={id + "-cream"} cx=".3" cy=".23" r=".9"><stop stopColor="#fff4e7"/><stop offset=".72" stopColor="#efddcd"/><stop offset="1" stopColor="#d4b9ad"/></radialGradient>
        <linearGradient id={id + "-plum"} x1="0" x2="1" y2="1"><stop stopColor="#916987"/><stop offset=".55" stopColor="#65465f"/><stop offset="1" stopColor="#463148"/></linearGradient>
        <linearGradient id={id + "-strap"} x2=".8" y2="1"><stop stopColor="#c99cba"/><stop offset="1" stopColor="#825c7c"/></linearGradient>
        <radialGradient id={id + "-eye"} cx=".3" cy=".22" r=".85"><stop stopColor="#fff"/><stop offset=".72" stopColor="#faf8fb"/><stop offset="1" stopColor="#ddd4e3"/></radialGradient>
        <radialGradient id={id + "-iris"} cx=".35" cy=".25"><stop stopColor="#62505f"/><stop offset=".6" stopColor="#302632"/><stop offset="1" stopColor="#17131e"/></radialGradient>
        <radialGradient id={id + "-cheek"}><stop stopColor="#e8a6b7" stopOpacity=".75"/><stop offset="1" stopColor="#e8a6b7" stopOpacity="0"/></radialGradient>
        <linearGradient id={id + "-metal"} x2=".8" y2="1"><stop stopColor="#fff5e9"/><stop offset=".45" stopColor="#d0bdac"/><stop offset=".7" stopColor="#eee0d2"/><stop offset="1" stopColor="#ac928a"/></linearGradient>
        <linearGradient id={id + "-reflection"} x2="0" y2="1"><stop stopColor="white" stopOpacity=".4"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
        <mask id={id + "-fade"}><rect x="0" y="400" width="360" height="60" fill={url("reflection")}/></mask>
        <filter id={id + "-soft"} x="-.3" y="-.5" width="1.6" height="2"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <ellipse cx="180" cy="400" rx="79" ry="11" fill="#261832" opacity=".2" filter={url("soft")}/>
      <g id={id + "-character"}>
        <ellipse cx="151" cy="381" rx="27" ry="16" fill={url("hood")}/><ellipse cx="209" cy="381" rx="27" ry="16" fill={url("hood")}/>
        <path d="M130 383Q151 389 175 381M185 381Q208 389 232 383" fill="none" stroke="#8f6fa7" strokeOpacity=".35" strokeWidth="2"/>
        <g data-body>
          <path d="M125 277Q126 243 180 243Q234 243 235 277L232 330Q225 358 180 359Q135 358 128 332Z" fill={url("hood")}/>
          <path d="M131 280Q180 268 229 280L234 336Q236 365 211 367H149Q124 365 126 338Z" fill={url("plum")}/>
          <path d="M143 251L147 292M217 251L213 292" fill="none" stroke="#4f384d" strokeWidth="17" strokeLinecap="round" opacity=".35"/>
          <path d="M142 250L146 291M218 250L214 291" fill="none" stroke={url("strap")} strokeWidth="13" strokeLinecap="round"/>
          <circle cx="146" cy="291" r="7" fill="#513a50"/><circle cx="214" cy="291" r="7" fill="#513a50"/>
          <circle cx="146" cy="289" r="6" fill={url("metal")}/><circle cx="214" cy="289" r="6" fill={url("metal")}/>
          <rect x="158" y="308" width="44" height="39" rx="13" fill={url("strap")} stroke="#c29ab5" strokeWidth="1"/>
          <path d="M17 49V16H34C43 16 48 21 48 29S42 42 34 42H26V49H17ZM26 24V34H34C37.8 34 40 32.2 40 29S37.8 24 34 24H26Z" fill="#f5e3ff" fillRule="evenodd" transform="translate(159 307) scale(.62)"/>
          <path d="M136 339Q180 353 224 339" fill="none" stroke="#a67d96" strokeOpacity=".5" strokeWidth="1.2" strokeDasharray="2.2 3"/>
        </g>
        <g data-head>
          <ellipse cx="65" cy="161" rx="13" ry="18" fill={url("cream")}/><ellipse cx="295" cy="161" rx="13" ry="18" fill={url("cream")}/>
          <path d="M65 154C58 98 103 59 176 59C249 55 294 102 294 156C301 217 260 255 180 256C103 259 66 220 65 154Z" fill={url("hood")} stroke="#ad8dc4" strokeWidth="1"/>
          <path d="M88 155C86 111 123 85 180 85C239 84 274 114 272 159C274 207 240 237 180 238C119 239 88 210 88 155Z" fill={url("cream")}/>
          <path d="M155 65C126 56 137 32 163 36C186 43 198 27 204 27C224 47 208 69 181 70Z" fill={url("hood")} stroke="#c5a6df" strokeWidth="1"/>
          <path d="M149 47Q174 58 201 40" fill="none" stroke="#f1e4fa" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round"/>
          <g data-face>
            <ellipse cx="119" cy="195" rx="21" ry="13" fill={url("cheek")}/><ellipse cx="241" cy="195" rx="21" ry="13" fill={url("cheek")}/>
            {[140,220].map((x,index)=><g data-eye key={x} transform={"translate("+x+" 162)"}>
              <ellipse rx="25" ry="31" fill="#a8867f" opacity=".35"/>
              <ellipse rx="23.4" ry="29.5" fill={url("eye")}/>
              <g data-pupil><ellipse cx={index?1:3} cy="1" rx="11.5" ry="16" fill={url("iris")}/><ellipse cx={index?-2:0} cy="-6" rx="3.7" ry="4.4" fill="#fff"/><circle cx={index?5:7} cy="8" r="1.6" fill="#bbaabd"/></g>
            </g>)}
            <path d="M161 202Q180 221 200 201" fill="none" stroke="#624450" strokeWidth="4.4" strokeLinecap="round"/>
          </g>
        </g>
        <path data-sleeve d="M129 268C103 282 93 301 105 296" fill="none" stroke={url("hood")} strokeWidth="27" strokeLinecap="round"/>
        <path data-sleeve d="M231 268C257 282 267 301 255 296" fill="none" stroke={url("hood")} strokeWidth="27" strokeLinecap="round"/>
        {[0,1].map(i=><g key={i} data-hand transform={"translate("+(i?255:105)+" 314) rotate(180)"}>
          <ellipse cy="-5" rx="20.5" ry="25" fill={url("cream")} stroke="#ddc8bf" strokeWidth=".7"/>
          <ellipse cx={i?-15:15} cy="2" rx="7" ry="10" fill={url("cream")}/>
          <rect x="-20" y="13" width="40" height="12" rx="6" fill={url("hood")}/>
          <path d="M-14 18H14" stroke="#ead9f6" strokeWidth="1" strokeOpacity=".65"/>
        </g>)}
      </g>
      <g mask={url("fade")} opacity=".22"><use href={"#"+id+"-character"} transform="translate(0 800) scale(1 -1)"/></g>
    </svg>
  </div>;
}
