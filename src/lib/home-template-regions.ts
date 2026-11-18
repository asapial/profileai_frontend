import { safeInterpolate } from "./resume/interpolate";
import { homeResumeData, type HomeTemplate } from "./home-templates";
import { DEFAULT_ASSEMBLY_REGIONS, type AssemblyRegions } from "./career-assembly";
import type { StoryIdentity } from "./story-identity";
import type { TailoringDecision } from "./career-tailoring";

/** A script-free, isolated copy of the actual A4 layout supplies section bounds.
 * Personal values use the same escaped interpolator as the on-page paper. */
export function measureHomeTemplate(template: HomeTemplate, identity: StoryIdentity, decision: TailoringDecision, signal: AbortSignal): Promise<AssemblyRegions> {
  return new Promise((resolve) => {
    if (signal.aborted) { resolve(DEFAULT_ASSEMBLY_REGIONS); return; }
    const frame = document.createElement("iframe");
    frame.title = "Template layout measurement"; frame.tabIndex = -1; frame.setAttribute("aria-hidden", "true");
    frame.setAttribute("sandbox", "allow-same-origin");
    frame.style.cssText = "position:fixed;left:-10000px;top:0;width:794px;height:1123px;visibility:hidden;pointer-events:none;border:0";
    let settled = false;
    const finish = (regions: AssemblyRegions) => {
      if (settled) return; settled = true;
      clearTimeout(timer); signal.removeEventListener("abort", abort); frame.remove(); resolve(regions);
    };
    const abort = () => finish(DEFAULT_ASSEMBLY_REGIONS);
    const timer = setTimeout(abort, 4000);
    signal.addEventListener("abort", abort, { once: true });
    frame.onload = async () => {
      try {
        const doc = frame.contentDocument;
        if (!doc) { finish(DEFAULT_ASSEMBLY_REGIONS); return; }
        await doc.fonts.ready;
        const selectors = [".ut-summary", ".ut-experience", ".ut-projects", ".ut-skills", ".ut-education"];
        finish(selectors.map((selector, index) => {
          const bounds = doc.querySelector(selector)?.getBoundingClientRect();
          if (!bounds || bounds.width < 1 || bounds.height < 1) return DEFAULT_ASSEMBLY_REGIONS[index]!;
          return { x: Math.max(0, bounds.x / 794), y: Math.max(0, bounds.y / 1123),
            width: Math.min(1, bounds.width / 794), height: Math.min(1, bounds.height / 1123) };
        }));
      } catch { finish(DEFAULT_ASSEMBLY_REGIONS); }
    };
    frame.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:;"><style>html,body{margin:0;width:794px;height:1123px;overflow:hidden;background:#fff}*{box-sizing:border-box}' + template.cssStyles + '</style></head><body>' + safeInterpolate(template.htmlLayout, homeResumeData(identity, decision)) + '</body></html>';
    document.body.appendChild(frame);
  });
}
