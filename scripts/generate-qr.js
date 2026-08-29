import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "qr-codes");
const FONT_DIR = path.join(__dirname, "fonts");
const FONT_FILE = path.join(FONT_DIR, "Vazirmatn-Medium.ttf");
const FONT_URL =
  "https://github.com/rastikerdar/vazirmatn/raw/v33.003/fonts/ttf/Vazirmatn-Medium.ttf";

const CAFE_NAME = "کافه ژوان";
const QR_SIZE = 640;
const PADDING = 36;
const LABEL_HEIGHT = 168;
const SITE =
  process.env.QR_BASE_URL ||
  "https://yovngvng.github.io/Cafe-Menu-Vue-Main/";

const TABLES = [1, 2, 3, 4, 5];
const LOCATIONS = [
  { key: "salon", label: "سالن", query: "" },
  { key: "outdoor", label: "فضای باز", query: "outdoor" },
];

function menuUrl(table, locationQuery) {
  const base = SITE.endsWith("/") ? SITE : `${SITE}/`;
  const params = new URLSearchParams({ table: String(table) });
  if (locationQuery) params.set("location", locationQuery);
  return `${base}?${params.toString()}`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function ensureFont() {
  if (existsSync(FONT_FILE)) return FONT_FILE;
  await mkdir(FONT_DIR, { recursive: true });
  const response = await fetch(FONT_URL);
  if (!response.ok) {
    throw new Error(`Could not download Vazirmatn font (${response.status})`);
  }
  await writeFile(FONT_FILE, Buffer.from(await response.arrayBuffer()));
  return FONT_FILE;
}

function labelSvg({ width, height, cafe, tableLabel, typeLabel, fontPath }) {
  const fontUri = path.resolve(fontPath).replaceAll("\\", "/");
  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: "VazirmatnQR";
        src: url("file:///${fontUri}");
      }
      .line {
        font-family: "VazirmatnQR", "Tahoma", "Arial", sans-serif;
        fill: #0a192f;
        text-anchor: middle;
        direction: rtl;
      }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text class="line" x="${width / 2}" y="48" font-size="34" font-weight="700">${escapeXml(cafe)}</text>
  <text class="line" x="${width / 2}" y="96" font-size="28">${escapeXml(tableLabel)}</text>
  <text class="line" x="${width / 2}" y="138" font-size="26" fill="#5a4a1a">${escapeXml(typeLabel)}</text>
</svg>`);
}

async function buildCard({ table, location }) {
  const url = menuUrl(table, location.query);
  const qrBuffer = await QRCode.toBuffer(url, {
    type: "png",
    width: QR_SIZE,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#0a192f", light: "#ffffff" },
  });

  const canvasWidth = QR_SIZE + PADDING * 2;
  const canvasHeight = QR_SIZE + PADDING + LABEL_HEIGHT;
  const fontPath = await ensureFont();
  const svg = labelSvg({
    width: canvasWidth,
    height: LABEL_HEIGHT,
    cafe: CAFE_NAME,
    tableLabel: `میز ${table}`,
    typeLabel: location.label,
    fontPath,
  });

  const output = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite([
      { input: qrBuffer, top: PADDING, left: PADDING },
      { input: svg, top: PADDING + QR_SIZE, left: 0 },
    ])
    .png()
    .toBuffer();

  const fileName = `${location.key}-table-${table}.png`;
  const filePath = path.join(OUT_DIR, fileName);
  await writeFile(filePath, output);
  console.log(`wrote ${fileName}  →  ${url}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await ensureFont();
  for (const location of LOCATIONS) {
    for (const table of TABLES) {
      await buildCard({ table, location });
    }
  }
  console.log(`\nQR images saved in: ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
