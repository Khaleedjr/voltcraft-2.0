#!/usr/bin/env node
/**
 * Pulls product photography out of the WordPress media library and into
 * public/products/, then rewrites data/catalogue.json to point at the local
 * copies. Run it when the old site is ready to be switched off.
 *
 *   node scripts/download-images.mjs
 *
 * Needs network access to voltcraft.org.ng. Safe to re-run: files already
 * downloaded are skipped.
 */
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";

const DATA = "data/catalogue.json";
const OUT_DIR = "public/products";

const catalogue = JSON.parse(readFileSync(DATA, "utf8"));
const localName = (url) => {
  const base = decodeURIComponent(url.split("/").pop() ?? "image");
  const safe = base.replace(/[^\w.-]/g, "-").toLowerCase();
  return extname(safe) ? safe : `${safe}.jpg`;
};

let downloaded = 0, skipped = 0, failed = 0;

for (const product of catalogue.products) {
  const next = [];
  for (const url of product.images) {
    if (!/^https?:\/\//.test(url)) { next.push(url); continue; }
    const name = localName(url);
    const path = join(OUT_DIR, name);
    const publicPath = `/products/${name}`;
    if (existsSync(path)) { next.push(publicPath); skipped++; continue; }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, Buffer.from(await res.arrayBuffer()));
      next.push(publicPath);
      downloaded++;
    } catch (error) {
      console.warn(`  failed ${url}: ${error.message}`);
      next.push(url); // keep the remote URL so the listing still shows something
      failed++;
    }
  }
  product.images = next;
}

writeFileSync(DATA, JSON.stringify(catalogue, null, 2) + "\n");
console.log(`downloaded ${downloaded}, already had ${skipped}, failed ${failed}`);
console.log("data/catalogue.json now points at public/products/ for anything that came down.");
console.log("Once nothing remote is left you can drop images.remotePatterns from next.config.ts.");
