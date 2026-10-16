import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import compression from "compression";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { authRouter } from "../auth.js";
import uploadRouter from "./uploadHandler.js";
import webhooksRouter from "../webhooks.js";
import shareRouter from "./shareRoutes.js";
import { rateLimit, securityHeaders } from "./security.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { serveStatic, setupVite } from "./vite.js";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export const app = express();

// Behind Vercel's proxy: trust exactly one hop so req.ip (used by rate
// limiting) reflects the real client from X-Forwarded-For.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(securityHeaders);
app.use(compression());

// JSON bodies only carry structured data (largest case: poster generator
// sending a ~6.7MB base64 image). File uploads go through /api/upload with
// its own raw parser (50mb), so they are unaffected by this limit.
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 60_000,
    max: 15,
    message: "Too many attempts. Please wait a minute and try again.",
  }),
  authRouter,
);
app.use(
  "/api/upload",
  rateLimit({
    windowMs: 60_000,
    max: 30,
    message: "Too many uploads. Please wait a minute and try again.",
  }),
  uploadRouter,
);
app.use(
  "/api",
  rateLimit({
    windowMs: 60_000,
    max: 120,
    message: "Too many requests. Please try again shortly.",
  }),
  webhooksRouter,
);
// Share meta routes: /api/share/* (Vercel rewrite target) and /share/* (direct, local dev)
app.use("/api", shareRouter);
app.use("/", shareRouter);

// tRPC API
app.use(
  "/api/trpc",
  rateLimit({
    windowMs: 60_000,
    max: 300,
    message: "Too many requests. Please try again shortly.",
  }),
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

import { initializeAdmin } from "../auth.js";
import { ensureSchema } from "../db.js";
ensureSchema().catch(console.error);
initializeAdmin().catch(console.error);

async function startServer() {
  const server = createServer(app);
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer().catch(console.error);
}
