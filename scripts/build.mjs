// Assembles dist/ with only the files the static site actually needs to serve:
// index.html, styles/, js/, assets/, favicon.svg (referenced by index.html).
// brand/, reference/, node_modules/, tests/, and package.json are source-only
// and never copied.

import { rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(fileURLToPath(import.meta.url), "..", "..");
const dist = path.join(root, "dist");

if (existsSync(dist)) {
  rmSync(dist, { recursive: true, force: true });
}
mkdirSync(dist);

const items = ["index.html", "favicon.svg", "styles", "js", "assets"];

for (const item of items) {
  const src = path.join(root, item);
  const dest = path.join(dist, item);
  cpSync(src, dest, { recursive: true });
}

console.log(`built ${dist}`);
