import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "client", "public");
const outDir = path.join(pub, "optimized");
await mkdir(outDir, { recursive: true });

const banner = path.join(pub, "mr_miss_tharaka_nithi_banner.png");
const logo = path.join(pub, "royal_icon_events_logo_new.png");

await sharp(banner)
  .resize({ width: 1920, withoutEnlargement: true })
  .webp({ quality: 82 })
  .toFile(path.join(outDir, "banner-1920.webp"));

await sharp(banner)
  .resize({ width: 1200, height: 630, fit: "cover", position: "attention" })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(path.join(outDir, "og-image.jpg"));

await sharp(logo)
  .resize({ width: 512, withoutEnlargement: true })
  .webp({ quality: 85 })
  .toFile(path.join(outDir, "logo-512.webp"));

console.log("Optimized images written to client/public/optimized/");
