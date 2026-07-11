/**
 * Tiny Handlebars-lite interpolator shared between:
 *   - the public resume viewer (`src/app/r/[slug]/ResumeViewer.tsx`)
 *   - the in-app "Generated preview" card
 *   - the in-app editor's right-rail live preview
 *
 * Templates use a small subset of Handlebars:
 *   - {{var}}                        — simple variable
 *   - {{{var}}}                      — triple-stash (same as {{var}} here,
 *                                       React dangerouslySetInnerHTML already
 *                                       renders the result as HTML)
 *   - {{#if cond}}…{{/if}}           — conditional block
 *   - {{#each list}}…{{/each}}       — iteration over an array
 *   - {{this}} / {{this.field}}      — current item inside an each
 *
 * If templates grow to use partials/helpers, swap this for a real
 * Handlebars build at build time.
 */

function getPath(obj: unknown, path: string): unknown {
  if (obj == null) return undefined;
  const parts = path.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

/**
 * Templates seeded in `seedTemplates.ts` historically used:
 *   - `{{bio}}`     instead of `{{summary}}`
 *   - `{{desc}}`    instead of `{{#each bullets}}<li>{{this}}</li>{{/each}}`
 *   - `{{institution}}` instead of `{{school}}`
 *   - `{{title}}`   instead of `{{role}}`
 *   - `{{startDate}}` / `{{endDate}}` instead of `{{from}}` / `{{to}}`
 *
 * The AI + editor emit the modern names. To keep both templates and data
 * sources working without a DB migration, the interpolator aliases the
 * legacy names to the modern ones when the original lookup is empty.
 */
const TOP_LEVEL_ALIASES: Record<string, string> = {
  bio: "summary",
};

const ITEM_ALIASES: Record<string, string> = {
  institution: "school",
  title: "role",
  startDate: "from",
  endDate: "to",
};

/**
 * `desc` is special-cased: if the item has no `desc` but has `bullets`
 * (string[]), join them with newlines so the `{{desc}}` token in classic
 * templates still renders something useful.
 */
function applyItemAliases(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj == null || typeof obj !== "object") return obj;
  const out: Record<string, unknown> = { ...obj };
  for (const [legacy, modern] of Object.entries(ITEM_ALIASES)) {
    if (out[legacy] == null && out[modern] != null) {
      out[legacy] = out[modern];
    }
  }
  if (out.desc == null && Array.isArray(out.bullets)) {
    const bullets = out.bullets.filter((b) => typeof b === "string" && b.trim());
    if (bullets.length) out.desc = bullets.join("\n");
  }
  return out;
}

// `scope` is a chain of data objects, outermost first. Lookups walk from the
// innermost (most recent) scope outward, so `{{this.x}}` inside an each sees
// the current item while `{{name}}` still sees the top-level contentData.
function lookupValue(
  scope: Record<string, unknown>[],
  path: string,
): unknown {
  if (!path) return undefined;
  if (path === "this") {
    for (let s = scope.length - 1; s >= 0; s--) {
      const obj = scope[s];
      if (obj != null && "this" in obj) {
        return (obj as Record<string, unknown>)["this"];
      }
    }
    return undefined;
  }
  if (path.startsWith("this.")) {
    const rest = path.slice(5);
    for (let s = scope.length - 1; s >= 0; s--) {
      const obj = scope[s];
      if (obj != null && "this" in obj) {
        const aliased = applyItemAliases(
          (obj as Record<string, unknown>)["this"] as Record<string, unknown>
        );
        return getPath(aliased, rest);
      }
    }
    return undefined;
  }
  for (let s = scope.length - 1; s >= 0; s--) {
    const obj = scope[s];
    if (obj != null && path in obj) {
      return (obj as Record<string, unknown>)[path];
    }
  }
  // Top-level legacy alias fallback (e.g. `{{bio}}` → `summary`).
  if (TOP_LEVEL_ALIASES[path]) {
    const aliased = TOP_LEVEL_ALIASES[path];
    for (let s = scope.length - 1; s >= 0; s--) {
      const obj = scope[s];
      if (obj != null && aliased in obj) {
        return (obj as Record<string, unknown>)[aliased];
      }
    }
  }
  return getPath(scope[scope.length - 1], path);
}

function htmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderScalar(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return htmlEscape(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return htmlEscape(JSON.stringify(v));
}

export function interpolate(
  template: string,
  scope: Record<string, unknown>[],
): string {
  return interpolateWithTokens(template, scope).html;
}

/**
 * Same engine as `interpolate`, but additionally collects the list of
 * variable tokens it produced so the editor can wrap them inline.
 *
 * Each token emitted looks like:
 *   {
 *     start: number,        // char index in returned html where this token starts
 *     end: number,          // exclusive end index
 *     path: string,         // the path as written in the template (e.g. "summary",
 *                           // "this.company", "skills") — this is the *legacy*
 *                           // name pre-alias; resolve it via the data you passed in
 *     inIteration: boolean, // true if produced inside an {{#each}}
 *   }
 *
 * Note: indices refer to positions in the **post-interpolation** HTML string
 * (i.e. already with values substituted). The ranges therefore surround the
 * *resolved* value, not the original token text — perfect for wrapping the
 * rendered text in a contenteditable span without ambiguity.
 */
export function interpolateWithTokens(
  template: string,
  scope: Record<string, unknown>[],
): { html: string; tokens: InterpolatedToken[] } {
  let out = "";
  const tokens: InterpolatedToken[] = [];
  let i = 0;
  const N = template.length;
  let eachDepth = 0;

  const findClosing = (
    startAfter: number,
    open: string,
    close: string,
  ): number => {
    let depth = 1;
    let j = startAfter;
    while (j < N) {
      const nextOpen = template.indexOf(open, j);
      const nextClose = template.indexOf(close, j);
      if (nextClose === -1) return -1;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        j = nextOpen + open.length;
      } else {
        depth--;
        if (depth === 0) return nextClose;
        j = nextClose + close.length;
      }
    }
    return -1;
  };

  while (i < N) {
    const ifMatch = template.slice(i).match(/^\{\{#if\s+([^{}]+)\}\}/);
    if (ifMatch) {
      const condPath = ifMatch[1].trim();
      const blockStart = i + ifMatch[0].length;
      const blockEnd = findClosing(blockStart, "{{#if", "{{/if}}");
      if (blockEnd === -1) {
        out += template.slice(i);
        return { html: out, tokens };
      }
      const inner = template.slice(blockStart, blockEnd);
      const truthy = Boolean(lookupValue(scope, condPath));
      if (truthy) {
        const sub = interpolateWithTokens(inner, scope);
        out += sub.html;
        tokens.push(
          ...sub.tokens.map((t) => ({ ...t, inIteration: eachDepth > 0 })),
        );
      }
      i = blockEnd + "{{/if}}".length;
      continue;
    }

    const eachMatch = template.slice(i).match(/^\{\{#each\s+([^{}]+)\}\}/);
    if (eachMatch) {
      const listPath = eachMatch[1].trim();
      const blockStart = i + eachMatch[0].length;
      const blockEnd = findClosing(blockStart, "{{#each", "{{/each}}");
      if (blockEnd === -1) {
        out += template.slice(i);
        return { html: out, tokens };
      }
      const inner = template.slice(blockStart, blockEnd);
      const list = lookupValue(scope, listPath);
      if (Array.isArray(list)) {
        for (const item of list) {
          const nextScope =
            item != null && typeof item === "object"
              ? [
                  ...scope,
                  { this: item, ...(item as Record<string, unknown>) },
                ]
              : [...scope, { this: item as unknown }];
          eachDepth++;
          const sub = interpolateWithTokens(inner, nextScope);
          eachDepth--;
          out += sub.html;
          tokens.push(...sub.tokens.map((t) => ({ ...t, inIteration: true })));
        }
      }
      i = blockEnd + "{{/each}}".length;
      continue;
    }

    const commentMatch = template.slice(i).match(/^\{\{![^]*?\}\}/);
    if (commentMatch) {
      i += commentMatch[0].length;
      continue;
    }

    const varMatch = template
      .slice(i)
      .match(/^\{\{\{\s*([^{}]+)\s*\}\}|^\{\{\s*([^{}]+)\s*\}\}/);
    if (varMatch) {
      const rawPath = (varMatch[1] ?? varMatch[2] ?? "").trim();
      if (
        rawPath.startsWith("#") ||
        rawPath.startsWith("/") ||
        rawPath.startsWith("!")
      ) {
        out += template[i];
        i++;
        continue;
      }
      const value = lookupValue(scope, rawPath);
      const rendered = renderScalar(value);
      const start = out.length;
      out += rendered;
      const end = out.length;
      // Only record non-empty tokens to avoid spamming the editor with
      // empty placeholder nodes. Comments and structure ({{!…}}) are skipped.
      if (rendered.length > 0) {
        tokens.push({
          start,
          end,
          path: rawPath,
          inIteration: eachDepth > 0,
        });
      }
      i += varMatch[0].length;
      continue;
    }

    out += template[i];
    i++;
  }
  return { html: out, tokens };
}

export type InterpolatedToken = {
  start: number;
  end: number;
  path: string;
  inIteration: boolean;
};

/**
 * Safely interpolate a template against contentData, returning a friendly
 * fallback HTML if the template throws or returns empty.
 */
export function safeInterpolate(
  template: string,
  data: Record<string, unknown> | null | undefined,
  fallback?: string,
): string {
  try {
    const out = interpolate(template, [data ?? {}]);
    return out || (fallback ?? "");
  } catch {
    return (
      fallback ??
      `<p style="color:#b91c1c;padding:24px">This resume could not be rendered.</p>`
    );
  }
}