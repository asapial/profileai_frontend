import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = resolve(root, "src/app");
const sourceRoot = resolve(root, "src");

async function filesUnder(directory, accept) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesUnder(path, accept));
    else if (accept(path)) files.push(path);
  }
  return files;
}

function routeFromPage(path) {
  const segments = relative(appRoot, dirname(path))
    .split(/[\\/]/)
    .filter(segment => segment && !/^\(.+\)$/.test(segment));
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

function routePattern(route) {
  const escaped = route
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\[\\\[\\\.\\\.\\\.(\w+)\\\]\\\]/g, ".*")
    .replace(/\\\[\\\.\\\.\\\.(\w+)\\\]/g, ".+")
    .replace(/\\\[(\w+)\\\]/g, "[^/]+");
  return new RegExp(`^${escaped}$`);
}

const pages = await filesUnder(appRoot, path => path.endsWith("page.tsx"));
const patterns = pages.map(routeFromPage).map(routePattern);
const sources = await filesUnder(sourceRoot, path => /\.(?:ts|tsx)$/.test(path));
const broken = [];
const linkPattern = /(?:href\s*[:=]\s*|router\.(?:push|replace)\(\s*)\{?([`'"])(\/(?!\/).*?)\1/g;

for (const path of sources) {
  const source = await readFile(path, "utf8");
  for (const match of source.matchAll(linkPattern)) {
    const raw = match[2];
    const route = raw
      .replace(/\$\{[^}]+\}/g, "value")
      .split(/[?#]/, 1)[0]
      .replace(/\/$/, "") || "/";
    if (route.startsWith("/api/") || /\.[a-z0-9]+$/i.test(route)) continue;
    if (patterns.some(pattern => pattern.test(route))) continue;
    const line = source.slice(0, match.index).split("\n").length;
    broken.push(`${relative(root, path)}:${line} ${raw}`);
  }
}

assert.deepEqual(broken, [], `Broken internal routes:\n${broken.join("\n")}`);
console.log(`Internal routes: ${pages.length} pages and ${sources.length} source files passed.`);
