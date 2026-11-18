import catalog from "./home-template-catalog.json";
import sample from "./home-resume-sample.json";
import { safeInterpolate } from "./resume/interpolate";
import { ILLUSTRATIVE_IDENTITY, type StoryIdentity } from "./story-identity";
import { TAILORING_PARTS, type TailoringDecision } from "./career-tailoring";

export const HOME_TEMPLATES = catalog;
export type HomeTemplate = (typeof HOME_TEMPLATES)[number];
export const DEFAULT_HOME_TEMPLATE = "orbit";
export const homeTemplate = (id: string) => HOME_TEMPLATES.find((template) => template.slug === id) ?? HOME_TEMPLATES[3]!;
export const homeTemplateAsset = (template: HomeTemplate) => `/templates/story/${template.slug}.png`;

export function homeResumeData(identity: StoryIdentity = ILLUSTRATIVE_IDENTITY, decision: TailoringDecision = "pending") {
  const words = identity.name.trim().split(/\s+/);
  const bullets = decision === "accepted" ? [TAILORING_PARTS.map((part) => part.text).join(""), sample.experience[0]!.bullets[2]!] : sample.experience[0]!.bullets;
  return { ...sample, firstName: words[0] ?? "Alex", lastName: words.slice(1).join(" "), email: identity.email,
    experience: [{ ...sample.experience[0]!, bullets }] };
}

/** These catalog layouts are XHTML-compatible. Scalar values are escaped by
 * the shared interpolator; SVG image contexts cannot execute document scripts. */
export function homeTemplateSvg(template: HomeTemplate, identity: StoryIdentity = ILLUSTRATIVE_IDENTITY, decision: TailoringDecision = "pending") {
  const html = safeInterpolate(template.htmlLayout, homeResumeData(identity, decision));
  const css = template.cssStyles.replace(/\]\]>/g, "]]]]><![CDATA[>");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="794" height="1123"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:794px;height:1123px;background:#fff;overflow:hidden;color-scheme:light"><style><![CDATA[*{box-sizing:border-box}html,body{margin:0;width:794px;min-height:1123px;background:#fff}${css}]]></style>${html}</div></foreignObject></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
