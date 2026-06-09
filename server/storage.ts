import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./_core/env.js";
import crypto from "crypto";
import { Readable } from "stream";

let configured = false;

function getCloudinary() {
  if (!configured) {
    if (!ENV.cloudinaryCloudName || !ENV.cloudinaryApiKey || !ENV.cloudinaryApiSecret) {
      throw new Error(
        "Cloudinary config missing: set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
      );
    }
    cloudinary.config({
      cloud_name: ENV.cloudinaryCloudName,
      api_key: ENV.cloudinaryApiKey,
      api_secret: ENV.cloudinaryApiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}

function bufferToStream(buffer: Buffer): Readable {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

function buildPublicId(relKey: string): string {
  // Strip extension — Cloudinary manages that
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const normalized = relKey.replace(/^\/+/, "").replace(/\.[^/.]+$/, "");
  return `${normalized}_${hash}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const cl = getCloudinary();
  const publicId = buildPublicId(relKey);

  const buffer = Buffer.isBuffer(data)
    ? data
    : Buffer.from(data as Uint8Array | string);

  // Determine resource type
  const resourceType: "image" | "raw" | "auto" = contentType.startsWith("image/")
    ? "image"
    : "raw";

  const uploadResult = await new Promise<{ public_id: string; secure_url: string }>(
    (resolve, reject) => {
      const stream = cl.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: resourceType,
          // Auto-quality + format for images (reduces file size by ~50-80%)
          ...(resourceType === "image"
            ? { quality: "auto", fetch_format: "auto" }
            : {}),
          folder: "tharaka-nithi",
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result as { public_id: string; secure_url: string });
        }
      );
      bufferToStream(buffer).pipe(stream);
    }
  );

  return { key: uploadResult.public_id, url: uploadResult.secure_url };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const cl = getCloudinary();
  const url = cl.url(relKey, { secure: true });
  return { key: relKey, url };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const cl = getCloudinary();
  // Signed URL valid for 1 hour
  const url = cl.url(relKey, {
    secure: true,
    sign_url: true,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
  return url;
}

