import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc.js";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { storagePut } from "./storage.js";

const FRAME_CONFIG = {
  x: 186,
  y: 585,
  width: 1244,
  height: 1549,
};

const TEMPLATE_PATH = path.join(
  process.cwd(),
  "public",
  "assets",
  "contestant_profile_template.png"
);

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

        const templateBuffer = await fs.readFile(TEMPLATE_PATH);

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
