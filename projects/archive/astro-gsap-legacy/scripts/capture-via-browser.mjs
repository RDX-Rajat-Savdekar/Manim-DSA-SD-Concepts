#!/usr/bin/env node
/**
 * Automate Phase D frame capture via Playwright (real browser WebGL).
 *
 * Usage:
 *   npx playwright install chromium
 *   node scripts/capture-via-browser.mjs f1-amr23
 *   node scripts/capture-via-browser.mjs iron-man
 *   node scripts/capture-via-browser.mjs all
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PORT = process.env.PORT || "4321";
const BASE = `http://127.0.0.1:${PORT}`;

const IDS = ["f1-amr23", "f1-w13", "iron-man"];
const arg = process.argv[2] || "f1-amr23";
const targets = arg === "all" ? IDS : [arg];

async function captureOne(browser, id) {
  const outDir = path.join(ROOT, "public/sequences", id);
  await mkdir(outDir, { recursive: true });

  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  const url = `${BASE}/capture-sequence?id=${id}&auto=1`;
  console.log(`→ ${url}`);
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });

  await page.waitForFunction(
    () => window.__CAPTURE_DONE === true || window.__CAPTURE_ERROR,
    null,
    { timeout: 180000 }
  );

  const err = await page.evaluate(() => window.__CAPTURE_ERROR);
  if (err) throw new Error(err);

  const frames = await page.evaluate(() => window.__FRAMES);
  if (!Array.isArray(frames) || !frames.length) throw new Error("No frames captured");

  for (let i = 0; i < frames.length; i++) {
    const b64 = frames[i].replace(/^data:image\/webp;base64,/, "");
    const name = `${String(i + 1).padStart(4, "0")}.webp`;
    await writeFile(path.join(outDir, name), Buffer.from(b64, "base64"));
  }

  const manifest = {
    id,
    frameCount: frames.length,
    ext: "webp",
    pad: 4,
    prefix: "",
    width: 1280,
    height: 720,
  };
  await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`✓ ${id}: ${frames.length} frames → public/sequences/${id}/`);
  await page.close();
}

const browser = await chromium.launch({ headless: true });
try {
  for (const id of targets) {
    await captureOne(browser, id);
  }
} finally {
  await browser.close();
}
