import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { storagePut } from "./storage.js";
import { ENV } from "./_core/env.js";

const FRAME_CONFIG = {
  x: 90,
  y: 260,
  width: 530,
  height: 1240,
};

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "assets",
  "contestant_profile_template.png"
);

const SITE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://www.faceoftharakanithi.app";

let cachedTemplateBuffer: Buffer | null = null;

async function loadTemplate(): Promise<Buffer> {
  if (cachedTemplateBuffer) return cachedTemplateBuffer;

  if (ENV.contestantTemplateUrl) {
    const res = await fetch(ENV.contestantTemplateUrl);
    if (res.ok) {
      cachedTemplateBuffer = Buffer.from(await res.arrayBuffer());
      return cachedTemplateBuffer;
    }
  }

  const staticUrl = `${SITE_URL}/assets/contestant_profile_template.png`;
  try {
    const res = await fetch(staticUrl);
    if (res.ok) {
      cachedTemplateBuffer = Buffer.from(await res.arrayBuffer());
      return cachedTemplateBuffer;
    }
  } catch {}

  try {
    cachedTemplateBuffer = await fs.readFile(TEMPLATE_PATH);
    return cachedTemplateBuffer;
  } catch {}

  throw new Error("Template not found. Set CONTESTANT_TEMPLATE_URL env var.");
}

export const contestantRouter = router({
  generatePoster: publicProcedure
    .input(
      z.object({
        photoBase64: z.string().describe("Base64 encoded photo"),
        name: z.string().min(1).max(100),
        category: z.enum(["Adult", "Teen", "Little Stars"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const photoBuffer = Buffer.from(input.photoBase64, "base64");

        const processedPhoto = await sharp(photoBuffer)
          .resize(FRAME_CONFIG.width, FRAME_CONFIG.height, {
            fit: "cover",
            position: "center",
          })
          .png()
          .toBuffer();

        const templateBuffer = await loadTemplate();

        const finalImageBuffer = await sharp(templateBuffer)
          .composite([
            {
              input: processedPhoto,
              top: FRAME_CONFIG.y,
              left: FRAME_CONFIG.x,
            },
          ])
          .png()
          .toBuffer();

        const safeName = input.name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        const filename = `${safeName}_${Date.now()}.png`;
        const { url, key } = await storagePut(
          `posters/${filename}`,
          finalImageBuffer,
          "image/png"
        );

        return {
          success: true,
          imageUrl: url,
          imageKey: key,
          filename,
          name: input.name,
          category: input.category,
          message: "Poster generated successfully!",
        };
      } catch (error) {
        console.error("Error generating poster:", error);
        throw new Error("Failed to generate poster. Please try again.");
      }
    }),
});
