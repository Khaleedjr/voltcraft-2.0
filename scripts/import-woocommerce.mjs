#!/usr/bin/env node
/**
 * Converts a WooCommerce product export into data/catalogue.json.
 *
 *   node scripts/import-woocommerce.mjs <export.csv>
 *
 * Re-run it whenever the store changes and commit the result. Nothing else in
 * the app needs to know the catalogue came from WooCommerce — lib/catalogue.ts
 * types the JSON and everything reads through its accessors.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { argv } from "node:process";

const CSV = argv[2];
if (!CSV) {
  console.error("usage: node scripts/import-woocommerce.mjs <export.csv>");
  process.exit(1);
}

/** WooCommerce category name -> our slug. "ALL ITEMS" is a catch-all, dropped. */
const CATEGORY_SLUGS = {
  "SENSORS": "sensors",
  "MICROCONTROLLERS": "microcontrollers",
  "DISPLAY": "display",
  "ACTUATORS": "actuators",
  "CONNECTORS": "connectors",
  "ACCESORIES": "accessories", // the store's spelling; corrected on the site
  "SWITCHES": "switches",
  "POWER": "power",
  "FLUID CONTROL": "fluid-control",
};

/**
 * Products the store filed only under "ALL ITEMS", so the export gives no aisle
 * to put them in. Assigned here rather than dropped — these are editorial calls,
 * worth checking against how the shop actually thinks about them.
 */
const CATEGORY_OVERRIDES = {
  "5086": ["sensors"], // RTC Real Time Clock Module
  "5260": ["power"],   // 9V Battery
};

// --- CSV parsing (quoted fields, embedded commas and newlines) --------------
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") continue;
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const raw = readFileSync(CSV, "utf8").replace(/^﻿/, "");
const [header, ...body] = parseCsv(raw);
const records = body
  .filter((r) => r.length > 1)
  .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));

// --- helpers ---------------------------------------------------------------
const slugify = (s) =>
  s.toLowerCase().normalize("NFKD")
    .replace(/[^\w\s-]/g, " ").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 70);

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#039": "'", apos: "'", nbsp: " ", rsquo: "’", ldquo: '"', rdquo: '"', ndash: "–", mdash: "—", deg: "°", times: "×", micro: "µ", ohm: "Ω" };

function decode(s) {
  return s.replace(/&(#?\w+);/g, (m, e) => ENTITIES[e] ?? (e[0] === "#" ? String.fromCharCode(Number(e.slice(1))) : m));
}

/** Woo descriptions carry HTML, embedded <img>, and literal "\n" escapes. */
function toParagraphs(html) {
  if (!html) return [];
  return decode(
    html
      .replace(/<img[^>]*>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|tr|h\d)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((l) => l.replace(/ /g, " ").trim())
    .filter((l) => l.length > 1 && !/^[•\-\s]*$/.test(l));
}

const money = (v) => {
  const n = Number.parseFloat(String(v).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};

// --- group variations under their parent -----------------------------------
const variationsFor = new Map();
for (const r of records) {
  if (r.Type !== "variation") continue;
  const parentId = (r.Parent || "").replace(/^id:/, "").trim();
  if (!variationsFor.has(parentId)) variationsFor.set(parentId, []);
  variationsFor.get(parentId).push(r);
}

// --- build products --------------------------------------------------------
const seen = new Set();
const products = [];
const skipped = [];

for (const r of records) {
  if (r.Type === "variation") continue;
  if (r.Published !== "1") continue;

  const name = decode(r.Name || "").trim();
  if (!name) continue;

  const categories =
    CATEGORY_OVERRIDES[r.ID] ??
    (r.Categories || "")
      .split(",").map((c) => c.trim())
      .map((c) => CATEGORY_SLUGS[c.toUpperCase()])
      .filter(Boolean);
  if (categories.length === 0) { skipped.push([r.ID, name, "no category"]); continue; }

  let slug = slugify(name);
  let n = 2;
  while (seen.has(slug)) slug = `${slugify(name)}-${n++}`;
  seen.add(slug);

  const kids = variationsFor.get(r.ID) ?? [];
  const variants = kids
    .map((v) => {
      const label = [1, 2, 3]
        .map((i) => (v[`Attribute ${i} value(s)`] || "").trim())
        .filter(Boolean).join(" · ");
      const price = money(v["Sale price"]) ?? money(v["Regular price"]);
      return label && price != null ? { label, price } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.price - b.price);

  const regular = money(r["Regular price"]);
  const sale = money(r["Sale price"]);
  const price = sale ?? regular ?? (variants.length ? variants[0].price : null);
  if (price == null) { skipped.push([r.ID, name, "no price"]); continue; }

  const specs = [];
  for (const i of [1, 2, 3]) {
    const label = (r[`Attribute ${i} name`] || "").trim();
    const value = (r[`Attribute ${i} value(s)`] || "").trim();
    if (!label || !value) continue;
    const pretty = label.length <= 3 ? label.toUpperCase() : label[0].toUpperCase() + label.slice(1).toLowerCase();
    specs.push({ label: pretty, value: value.replace(/\s*,\s*/g, ", ") });
  }

  const images = (r.Images || "")
    .split(",").map((u) => u.trim())
    .filter((u) => /^https?:\/\//.test(u));

  const stockCount = r.Stock?.trim() ? Number.parseInt(r.Stock, 10) : null;

  products.push({
    slug,
    name,
    sku: (r.SKU || "").trim(),
    wooId: r.ID,
    categories,
    summary: toParagraphs(r["Short description"]).join(" ").slice(0, 240),
    description: toParagraphs(r.Description).slice(0, 14),
    price,
    compareAt: sale != null && regular != null && regular > sale ? regular : undefined,
    inStock: r["In stock?"] === "1",
    stock: Number.isFinite(stockCount) ? stockCount : null,
    specs,
    tags: (r.Tags || "").split(",").map((t) => t.trim()).filter(Boolean),
    images,
    variants: variants.length ? variants : undefined,
    featured: r["Is featured?"] === "1" || undefined,
  });
}

products.sort((a, b) => a.name.localeCompare(b.name));

const counts = {};
for (const p of products) for (const c of p.categories) counts[c] = (counts[c] ?? 0) + 1;

writeFileSync("data/catalogue.json", JSON.stringify({ products }, null, 2) + "\n");

console.log(`imported ${products.length} products`);
console.log(`  with images:   ${products.filter((p) => p.images.length).length}`);
console.log(`  with variants: ${products.filter((p) => p.variants).length}`);
console.log(`  on sale:       ${products.filter((p) => p.compareAt).length}`);
console.log(`  price range:   ₦${Math.min(...products.map((p) => p.price))} – ₦${Math.max(...products.map((p) => p.price))}`);
console.log("  per category:", counts);
if (skipped.length) {
  console.log(`\nskipped ${skipped.length} row(s) — review:`);
  for (const [id, name, why] of skipped) console.log(`  id=${id} ${JSON.stringify(name)} — ${why}`);
}
