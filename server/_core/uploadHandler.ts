import { Router, Request, Response } from "express";
import express from "express";
import { storagePut } from "../storage.js";

const uploadRouter = Router();

uploadRouter.post("/upload", express.raw({ type: "*/*", limit: "50mb" }), async (req: Request, res: Response) => {
  try {

    // Get the file from the request body (assuming it's sent as base64 or binary)
    const fileBuffer = req.body;
    const fileName = req.headers["x-file-name"] as string || "upload";
    const mimeType = req.headers["content-type"] as string || "application/octet-stream";

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: "No file data provided" });
    }

    const fileKey = `registrations/${Date.now()}-${fileName}`;
    const { url, key } = await storagePut(fileKey, fileBuffer, mimeType);

    res.json({ url, key });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

export default uploadRouter;
