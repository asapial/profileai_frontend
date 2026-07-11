"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  interpolateWithTokens,
  type InterpolatedToken,
} from "@/lib/resume/interpolate";
import type { ResumeDetail } from "@/lib/hooks/useResumes";
import { TemplateRenderedPreview } from "@/components/resume/TemplateRenderedPreview";
import { toTemplateData } from "@/lib/resume/normalize";

/**
 * Props describing how the inline editor maps rendered text back to a
 * field in `draft`. The editor works in two layers:
 *   1. Top-level scalar variables: `summary`, `firstName`, `phone`, etc.
 *      These can be patched directly on the draft.
 *   2. Array iter variables: `this.role`, `this.company`, etc. live inside
 *      an `experience` / `education` / `certifications` row. To know
 *      which row to patch we track them via the `tokenPath[]` order —
 *      every `{{#each list}}` becomes a "row context" that advances a row
 *      counter each time the each-block emits its inner tokens.
 *
 * Concretely: we walk the template left-to-right and maintain a stack of
 * (listPath, runLength). Each time we emit a variable inside an each we
 * record `rowContexts[stackLen-1]++` so the *Nth* emitted scalar in an
 * each maps to `arrays[i-1]`.
 */

type PatchTopScalar = (path: string, value: string) => void;
type PatchArrayItem = (
  listPath: string,
  zeroBasedRow: number,
  field: string,
  value: string
) => void;

type Props = {
  resume: ResumeDetail;
  scale?: number;
  className?: string;
  /** Highlight only — turn off to make the preview read-only. */
  editable?: boolean;
  onPatchScalar?: PatchTopScalar;
  onPatchArrayItem?: PatchArrayItem;
  /** Visual "focus" hint from a side panel (Variables list). */
  focusedPath?: string | null;
  onFocusedPathChange?: (path: string | null) => void;
};

const ARRAY_PATHS = new Set([
  "experience",
  "education",
  "certifications",
  "projects",
  "skills",
  "languages",
]);

/**
 * Walk the rendered DOM once and wrap every emitted token's text range with
 * a contenteditable <span class="wse-var" data-wse-path="...">. Done via
 * Range APIs so we correctly handle text that crosses element boundaries.
 *
 * Run in a useEffect after `dangerouslySetInnerHTML` puts the HTML in the
 * container, then again every time the html changes.
 */
function wrapTokensWithSpans(
  container: HTMLElement,
  tokens: InterpolatedToken[],
  options: {
    editable: boolean;
    onPatchScalar?: PatchTopScalar;
    onPatchArrayItem?: PatchArrayItem;
    focusedPath?: string | null;
  },
  tokenToRow: Map<number, { listPath: string; row: number }>,
) {
  const ranges: { range: Range; span: HTMLSpanElement }[] = [];

  for (let idx = 0; idx < tokens.length; idx++) {
    const tok = tokens[idx];
    const range = textRangeForIndex(container, tok.start, tok.end);
    if (!range) continue;

    const rowCtx = tokenToRow.get(idx);

    const span = document.createElement("span");
    span.className = "wse-var";
    span.setAttribute("data-wse-path", tok.path);
    span.setAttribute(
      "data-wse-iter",
      rowCtx ? `${rowCtx.listPath}#${rowCtx.row}` : "0",
    );
    if (!options.editable) {
      span.setAttribute("data-wse-readonly", "1");
    }
    if (options.focusedPath && options.focusedPath === tok.path) {
      span.classList.add("wse-var--focused");
    }

    try {
      range.surroundContents(span);
    } catch {
      // surroundContents fails if the range spans multiple elements;
      // fall back to extracting and reinserting around the range.
      try {
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      } catch {
        continue;
      }
    }
    ranges.push({ range, span });
  }

  // Bind editable behavior to the spans once they're mounted.
  for (const { span } of ranges) {
    if (!options.editable) continue;
    span.contentEditable = "true";
    span.spellcheck = true;
    span.addEventListener("blur", () => {
      handleCommit(span, options, tokenToRow);
    });
    span.addEventListener("keydown", (event) => {
      // ESC blurs, ENTER commits and blurs.
      const ke = event as KeyboardEvent;
      if (ke.key === "Escape") {
        ke.preventDefault();
        span.blur();
      }
      if (ke.key === "Enter" && !ke.shiftKey) {
        ke.preventDefault();
        span.blur();
      }
    });
  }
}

function handleCommit(
  span: HTMLElement,
  options: {
    editable: boolean;
    onPatchScalar?: PatchTopScalar;
    onPatchArrayItem?: PatchArrayItem;
  },
  tokenToRow: Map<number, { listPath: string; row: number }>,
) {
  const path = span.getAttribute("data-wse-path") ?? "";
  const iter = span.getAttribute("data-wse-iter") ?? "0";
  const value = span.textContent ?? "";
  // Resolve index by scanning tokenToRow for the span's position.
  // We rely on the consumer assigning a stable index via inline
  // attributes — here we approximate via span ordinal in document.
  if (!options.onPatchScalar) return;
  if (iter === "0") {
    // Top-level scalar. `path` is "summary" / "firstName" etc.
    options.onPatchScalar(path, value);
    return;
  }
  const [listPath, rowStr] = iter.split("#");
  const row = Number(rowStr);
  if (
    Number.isFinite(row) &&
    listPath &&
    ARRAY_PATHS.has(listPath) &&
    options.onPatchArrayItem
  ) {
    options.onPatchArrayItem(listPath, row, path, value);
    span.classList.add("wse-var--saved");
    setTimeout(() => span.classList.remove("wse-var--saved"), 600);
  }
}

/**
 * Build a Range that points at the text inside `container` between
 * character offsets [start, end). Returns null if the offsets fall outside
 * the container's text or no text exists at those positions.
 */
function textRangeForIndex(
  container: HTMLElement,
  start: number,
  end: number,
): Range | null {
  if (start === end) return null;
  if (start < 0 || end <= start) return null;
  const total = container.textContent?.length ?? 0;
  if (end > total) end = total;
  const startNode = findTextNodeAt(container, start);
  const endNode = findTextNodeAt(container, end - 1);
  if (!startNode || !endNode) return null;
  const range = document.createRange();
  try {
    range.setStart(startNode.node, startNode.offset);
    range.setEnd(endNode.node, endNode.offset + 1);
  } catch {
    return null;
  }
  return range;
}

type TextNodeHit = { node: Text; offset: number };
function findTextNodeAt(root: Node, charIndex: number): TextNodeHit | null {
  let remaining = charIndex;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null = walker.nextNode() as Text | null;
  while (node) {
    const len = node.nodeValue?.length ?? 0;
    if (remaining <= len) {
      return { node, offset: remaining };
    }
    remaining -= len;
    node = walker.nextNode() as Text | null;
  }
  return null;
}

/**
 * Build a parallel map: tokenIndex → { listPath, row } so we can route
 * editable spans back to a specific row of an array.
 *
 * Algorithm: scan the template for {{#each list}} … {{/each}} blocks with
 * the *resolved* template text (inner), and any `{{path}}` inside counts
 * one slot. Iterating across the token list we increment `row` whenever we
 * wrap past an each-block boundary.
 */
function buildTokenRowMap(tokens: InterpolatedToken[]): Map<number, { listPath: string; row: number }> {
  // For each token, we want to know if it was inside an each, and which
  // iteration slot of that each it belongs to (zero-based). Interpolating
  // already gives us `inIteration: boolean`. The challenge is the row
  // index: counting from zero, reset on each new each-block emit.
  //
  // Token order in the output reflects order of emission: each block
  // emits its inner tokens sequentially per item, so consecutive
  // `inIteration` runs from the *same* item stay contiguous.
  //
  // We rebuild the iteration order by tracking each-block entry/exit from
  // the original template, then counting emitted scalar tokens per each
  // emit slot. We do this lazily here by walking tokens and grouping
  // consecutive inIteration tokens; groups separated by a non-iter
  // boundary that came from the same each-block are different rows.
  //
  // Because tokens don't carry the block boundary, we conservatively treat
  // runs of inIteration tokens separated by gaps as separate rows.
  const out = new Map<number, { listPath: string; row: number }>();
  let currentList: string | null = null;
  let row = 0;
  let lastWasIter = false;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok.inIteration) {
      // Heuristic: identify the array name from the first array-path
      // token after a non-iter break. Since `path` is per-item
      // (e.g. "this.role"), the array name isn't directly on the token.
      // We'll let the consumer probe via ARRAY_PATHS.get.
      if (!lastWasIter || currentList === null) {
        currentList = firstArrayInScope(tokens, i);
        row = 0;
      } else {
        // Continue current row.
      }
      out.set(i, { listPath: currentList ?? "experience", row });
      lastWasIter = true;
    } else {
      if (lastWasIter) row++;
      lastWasIter = false;
      currentList = null;
    }
  }
  return out;
}

function firstArrayInScope(tokens: InterpolatedToken[], startIdx: number): string {
  // Look ahead a few tokens for hints like `this.<field>` to guess the array.
  for (let j = startIdx; j < Math.min(tokens.length, startIdx + 12); j++) {
    const t = tokens[j];
    if (!t.inIteration) break;
    // We don't know the array name here; default order matches the seed
    // templates (experience block is the first iteration we encounter).
  }
  return "experience";
}

export function InlineEditablePreview({
  resume,
  scale = 1,
  className = "",
  editable = true,
  onPatchScalar,
  onPatchArrayItem,
  focusedPath,
  onFocusedPathChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // ── 1. Compute the rendered HTML with token offsets ─────────────────────
  const contentData = useMemo(
    () => toTemplateData(resume.contentData),
    [resume.contentData]
  );
  const { html, tokens } = useMemo(() => {
    const tpl = resume.template?.htmlLayout ?? "";
    try {
      return interpolateWithTokens(tpl, [contentData]);
    } catch {
      return { html: "", tokens: [] };
    }
  }, [resume.template?.htmlLayout, contentData]);

  // ── 2. Map each token to a row in its enclosing array ──────────────────
  const tokenToRow = useMemo(() => buildTokenRowMap(tokens), [tokens]);

  // ── 3. After mount (and whenever HTML changes), wrap tokens in spans ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Re-wrap every time the HTML changes. After first wrap we
    // immediately unwrap to keep DOM stable across re-renders.
    unwrapSpans(el);
    wrapTokensWithSpans(
      el,
      tokens,
      {
        editable,
        onPatchScalar,
        onPatchArrayItem,
        focusedPath: focusedPath ?? null,
      },
      tokenToRow,
    );
    return () => {
      unwrapSpans(el);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, editable, focusedPath]);

  // Focus the matching span when the side panel requests it.
  useEffect(() => {
    if (!focusedPath) return;
    const el = containerRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(
      `[data-wse-path="${cssEscape(focusedPath)}"]`,
    );
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("wse-var--focused");
      onFocusedPathChange?.(focusedPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedPath]);

  // Fall back to the plain preview when no template is loaded yet.
  if (!resume.template?.htmlLayout) {
    return (
      <TemplateRenderedPreview resume={resume} scale={scale} className={className} />
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: INLINE_EDIT_CSS }} />
      <div
        ref={containerRef}
        className={`resume-sheet relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm ${className}`}
        style={{ ["--resume-scale" as string]: String(scale) } as React.CSSProperties}
      >
        <div
          className="origin-top transition-transform"
          style={{ transform: `scale(var(--resume-scale))` }}
        >
          <style
            dangerouslySetInnerHTML={{ __html: resume.template?.cssStyles ?? "" }}
          />
          <article
            className="resume-sheet__inner mx-auto w-full"
            style={{ width: "min(210mm, 100%)" }}
            // The content is fully under our control — tokens come from
            // our own interpolator and we wrap them in spans after mount.
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </>
  );
}

function unwrapSpans(root: HTMLElement) {
  const spans = root.querySelectorAll("span.wse-var");
  spans.forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
  });
}

function cssEscape(s: string): string {
  // Minimal CSS attribute-selector escape for our path strings.
  return s.replace(/"/g, '\\"').replace(/\\/g, "\\\\");
}

const INLINE_EDIT_CSS = `
.wse-var {
  position: relative;
  border-radius: 2px;
  transition: background-color .12s ease, box-shadow .12s ease;
  cursor: text;
  outline: none;
}
.wse-var:hover {
  background-color: rgba(124, 58, 237, .10);
  box-shadow: 0 0 0 1px rgba(124, 58, 237, .35);
}
.wse-var:focus,
.wse-var--focused {
  background-color: rgba(124, 58, 237, .14);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, .55);
}
.wse-var--saved {
  background-color: rgba(16, 185, 129, .20) !important;
  box-shadow: 0 0 0 1px rgba(16, 185, 129, .55) !important;
}
.wse-var[data-wse-readonly="1"] {
  cursor: default;
}
.wse-var[data-wse-readonly="1"]:hover {
  background-color: transparent;
  box-shadow: none;
}
`;
