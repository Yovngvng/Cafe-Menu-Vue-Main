import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "qr-assets", "logo.png.png");
const fallback = path.join(root, "qr-assets", "logo.png");
const src = fs.existsSync(source) ? source : fallback;
const outDir = path.join(root, "public");

if (!fs.existsSync(src)) {
  console.error("logo not found", source, fallback);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });

await sharp(src).resize(32, 32, { fit: "cover" }).png().toFile(path.join(outDir, "favicon.png"));
await sharp(src).resize(180, 180, { fit: "cover" }).png().toFile(path.join(outDir, "apple-touch-icon.png"));
await sharp(src).resize(192, 192, { fit: "cover" }).png().toFile(path.join(outDir, "icon-192.png"));
await sharp(src).resize(512, 512, { fit: "cover" }).png().toFile(path.join(outDir, "icon-512.png"));
console.log("icons written from", path.basename(src));
