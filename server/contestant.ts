import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { storagePut, storageGetSignedUrl } from "./storage.js";
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

const TEMPLATE_KEY = "tharaka-nithi/contestant_profile_template.png";

let cachedTemplateUrl: string | null = null;

async function loadTemplate(): Promise<Buffer> {
  if (ENV.contestantTemplateUrl) {
    const res = await fetch(ENV.contestantTemplateUrl);
    if (!res.ok) throw new Error(`Failed to fetch template: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }

  if (cachedTemplateUrl) {
    const res = await fetch(cachedTemplateUrl);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }

  try {
    const localBuffer = await fs.readFile(TEMPLATE_PATH);
    const { url } = await storagePut(TEMPLATE_KEY, localBuffer, "image/png");
    cachedTemplateUrl = url;
    return localBuffer;
  } catch {
    throw new Error("Template not found. Set CONTESTANT_TEMPLATE_URL env var or place template at public/assets/contestant_profile_template.png");
  }
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
        const filename = `${safeName}_poster.png`;
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
