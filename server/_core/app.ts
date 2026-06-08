import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import uploadRouter from "./uploadHandler";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

export async function createApp() {
  const app = express();

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use("/api/upload", express.raw({ limit: "50mb", type: "*/*" }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.use("/api", uploadRouter);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}

async function startServer() {
  const app = await createApp();
  const server = createServer(app);

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = preferredPort; // Simplified for this template

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer().catch(console.error);
}
