import { ENV } from "./_core/env.js";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";

let s3Client: S3Client | null = null;

function getS3Client() {
  if (!s3Client) {
    if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey || !ENV.awsRegion || !ENV.awsS3Bucket) {
      throw new Error("AWS S3 config missing: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET");
    }
    s3Client = new S3Client({
      region: ENV.awsRegion,
      credentials: {
        accessKeyId: ENV.awsAccessKeyId,
        secretAccessKey: ENV.awsSecretAccessKey,
      },
    });
  }
  return s3Client;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const s3 = getS3Client();
  const key = appendHashSuffix(normalizeKey(relKey));
  const bucket = ENV.awsS3Bucket!;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: data,
    ContentType: contentType,
  });

  await s3.send(command);

  // Return a public URL assuming the bucket is configured for public read
  const publicUrl = `https://${bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
  
  return { key, url: publicUrl };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const bucket = ENV.awsS3Bucket!;
  const publicUrl = `https://${bucket}.s3.${ENV.awsRegion}.amazonaws.com/${key}`;
  return { key, url: publicUrl };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const s3 = getS3Client();
  const key = normalizeKey(relKey);
  const command = new GetObjectCommand({
    Bucket: ENV.awsS3Bucket!,
    Key: key,
  });

  // Generates a pre-signed URL valid for 1 hour (3600 seconds)
  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return signedUrl;
}
