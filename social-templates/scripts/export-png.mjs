#!/usr/bin/env node
/**
 * export-png.mjs
 * Batch-converts all SVGs in social-templates/svg/ to 1080×1080 PNGs.
 *
 * Usage (from repo root):
 *   npm install --save-dev sharp   # one-time
 *   node social-templates/scripts/export-png.mjs
 *
 * Output: social-templates/png/<name>.png
 *
 * Requirements: Node.js 18+, sharp ^0.33
 */

import { readdir, readFile, mkdir } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

// ── Resolve paths relative to this script ────────────────────────────────────
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const SVG_DIR   = join(__dirname, "..", "svg");
const PNG_DIR   = join(__dirname, "..", "png");

const SIZE = 1080; // px — square 1:1 social format

// ── Dynamic import of sharp (optional peer dep) ───────────────────────────────
let sharp;
try {
  ({ default: sharp } = await import("sharp"));
} catch {
  console.error(
    "\n  ✗  'sharp' is not installed.\n" +
    "     Run: npm install --save-dev sharp\n" +
    "     Then re-run this script.\n"
  );
  process.exit(1);
}

// ── Main ─────────────────────────────────────────────────────────────────────
await mkdir(PNG_DIR, { recursive: true });

const entries = (await readdir(SVG_DIR)).filter(
  (f) => extname(f).toLowerCase() === ".svg"
);

if (entries.length === 0) {
  console.error("  ✗  No SVG files found in", SVG_DIR);
  process.exit(1);
}

console.log(`\nConverting ${entries.length} SVG(s) → PNG  [${SIZE}×${SIZE} px]\n`);

let ok = 0;
let failed = 0;

for (const filename of entries) {
  const svgPath = join(SVG_DIR, filename);
  const pngName = basename(filename, extname(filename)) + ".png";
  const pngPath = join(PNG_DIR, pngName);

  try {
    const svgBuffer = await readFile(svgPath);

    await sharp(svgBuffer, { density: 144 })          // higher density → sharper text
      .resize(SIZE, SIZE, {
        fit: "contain",
        background: { r: 250, g: 247, b: 242, alpha: 1 }, // Cream fallback bg
      })
      .png({ compressionLevel: 8 })
      .toFile(pngPath);

    console.log(`  ✓  ${pngName}`);
    ok++;
  } catch (err) {
    console.error(`  ✗  ${filename}:`, err.message);
    failed++;
  }
}

console.log(`\nDone — ${ok} exported${failed ? `, ${failed} failed` : ""}.`);
console.log(`Output: ${PNG_DIR}\n`);
