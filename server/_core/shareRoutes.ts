import { Router, Request, Response } from "express";
import { getWinnerById, getEventBySlug, getEventPhotos, getPublicModelForPortfolio, getPublishedModelPortfolioSummaries, getPublishedEvents, getPublishedWinners } from "../db.js";
import { modelSlug, parseModelSlug, EVENT_NAME } from "../../shared/const.js";

const shareRouter = Router();

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://www.faceoftharakanithi.app";
const DEFAULT_IMAGE = `${SITE_URL}/optimized/og-image.jpg`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface ShareMeta {
  title: string;
  description: string;
  imageUrl: string;
  canonicalUrl: string;
  redirectUrl: string;
  jsonLd?: Record<string, unknown>;
}

export function renderShareHtml(meta: ShareMeta): string {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const image = escapeHtml(meta.imageUrl);
  const canonical = escapeHtml(meta.canonicalUrl);
  const redirect = escapeHtml(meta.redirectUrl);
  const jsonLd = meta.jsonLd
    ? `\n  <script type="application/ld+json">${JSON.stringify(meta.jsonLd).replace(/</g, "\\u003c")}</script>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="title" content="${title}" />
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${canonical}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Tharaka Nithi Models" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${canonical}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${image}" />${jsonLd}

    <meta http-equiv="refresh" content="0;url=${redirect}" />
    <script>window.location.replace(${JSON.stringify(meta.redirectUrl)});</script>
    <style>
      body { background: #0a0508; color: #d4af37; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      a { color: #d4af37; }
    </style>
  </head>
  <body>
    <p>Redirecting to <a href="${redirect}">${title}</a>&hellip;</p>
  </body>
</html>`;
}

function notFoundHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Not Found | Tharaka Nithi Models</title>
    <meta http-equiv="refresh" content="0;url=/404" />
    <script>window.location.replace("/404");</script>
  </head>
  <body></body>
</html>`;
}

shareRouter.get("/share/winner/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res.status(400).type("html").send(notFoundHtml());
      return;
    }

    const winner = await getWinnerById(id);
    if (!winner || !winner.isPublished) {
      res.status(404).type("html").send(notFoundHtml());
      return;
    }

    const parts = [winner.placement, winner.title].filter(Boolean);
    const title = parts.length > 0 ? `${winner.fullName} - ${parts.join(", ")}` : winner.fullName;
    const description =
      winner.description ||
      `Congratulations to ${winner.fullName}, ${winner.placement ? winner.placement.toLowerCase() + " " : ""}${winner.title}. See all winners of Mr & Miss Face of Tharaka-Nithi.`;
    const imageUrl = winner.photoUrl || DEFAULT_IMAGE;
    const canonicalUrl = `${SITE_URL}/share/winner/${winner.id}`;

    res.type("html").send(
      renderShareHtml({
        title,
        description,
        imageUrl,
        canonicalUrl,
        redirectUrl: `/winners/${winner.id}`,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Person",
          name: winner.fullName,
          description,
          image: imageUrl,
          url: canonicalUrl,
        },
      })
    );
  } catch (error) {
    console.error("[Share] Winner share route error:", error);
    res.status(500).type("html").send(notFoundHtml());
  }
});

shareRouter.get("/share/event/:slug", async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const event = await getEventBySlug(slug);
    if (!event || !event.isPublished) {
      res.status(404).type("html").send(notFoundHtml());
      return;
    }

    const photos = await getEventPhotos(event.id);
    const imageUrl =
      event.coverImageUrl ||
      photos[0]?.photoUrl ||
      DEFAULT_IMAGE;
    const dateLabel = event.eventDate
      ? new Date(event.eventDate).toLocaleDateString("en-KE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";
    const title = `${event.title}${dateLabel ? ` (${dateLabel})` : ""}`;
    const description =
      event.description ||
      `Photos and highlights from ${event.title}${event.location ? ` held at ${event.location}` : ""}. Relive the moments from Royals Icon Events.`;
    const canonicalUrl = `${SITE_URL}/share/event/${event.slug}`;

    res.type("html").send(
      renderShareHtml({
        title,
        description,
        imageUrl,
        canonicalUrl,
        redirectUrl: `/events/${event.slug}`,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Event",
          name: event.title,
          description,
          image: imageUrl,
          url: canonicalUrl,
          startDate: event.eventDate ? new Date(event.eventDate).toISOString() : undefined,
          location: event.location
            ? { "@type": "Place", name: event.location, address: { "@type": "PostalAddress", addressCountry: "KE" } }
            : undefined,
        },
      })
    );
  } catch (error) {
    console.error("[Share] Event share route error:", error);
    res.status(500).type("html").send(notFoundHtml());
  }
});

shareRouter.get("/share/model/:slug", async (req: Request, res: Response) => {
  try {
    const parsed = parseModelSlug(req.params.slug);
    if (!parsed) {
      res.status(404).type("html").send(notFoundHtml());
      return;
    }

    const model = await getPublicModelForPortfolio(parsed.id);
    if (!model) {
      res.status(404).type("html").send(notFoundHtml());
      return;
    }

    const canonicalSlug = modelSlug(model.id, model.fullName);
    const categoryLabel =
      model.category === "adults" ? "Adult Category" :
      model.category === "teens" ? "Teens Category" :
      model.category === "little_stars" ? "Little Stars Category" :
      model.category;
    const talents = (model.talents || "").split(",").map((t: string) => t.trim()).filter(Boolean).slice(0, 3);
    const title = `${model.fullName} - ${categoryLabel} | ${EVENT_NAME}`;
    const description =
      model.bio ||
      `${model.fullName} from ${model.countySubLocation || "Tharaka-Nithi County"} is a ${categoryLabel.toLowerCase()} model${talents.length ? ` known for ${talents.join(", ")}` : ""}. View portfolio, showreel and booking details.`;
    const imageUrl = model.photoUrl || model.posterUrl || DEFAULT_IMAGE;
    const canonicalUrl = `${SITE_URL}/share/model/${canonicalSlug}`;

    res.type("html").send(
      renderShareHtml({
        title,
        description,
        imageUrl,
        canonicalUrl,
        redirectUrl: `/models/${canonicalSlug}`,
        jsonLd: {
          "@context": "https://schema.org",
          "@type": "Person",
          name: model.fullName,
          description,
          image: imageUrl,
          url: canonicalUrl,
          jobTitle: "Model",
        },
      })
    );
  } catch (error) {
    console.error("[Share] Model share route error:", error);
    res.status(500).type("html").send(notFoundHtml());
  }
});

const STATIC_SITEMAP_PATHS = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/gallery", priority: "0.9", changefreq: "weekly" },
  { path: "/winners", priority: "0.9", changefreq: "monthly" },
  { path: "/events", priority: "0.8", changefreq: "monthly" },
  { path: "/training", priority: "0.7", changefreq: "monthly" },
  { path: "/register", priority: "0.8", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
];

function xmlEscape(value: string): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

shareRouter.get("/sitemap.xml", async (_req: Request, res: Response) => {
  try {
    const now = new Date().toISOString().slice(0, 10);
    const urls: string[] = [];

    for (const entry of STATIC_SITEMAP_PATHS) {
      urls.push(
        `  <url><loc>${xmlEscape(SITE_URL + entry.path)}</loc><lastmod>${now}</lastmod><changefreq>${entry.changefreq}</changefreq><priority>${entry.priority}</priority></url>`
      );
    }

    try {
      const models = await getPublishedModelPortfolioSummaries();
      for (const m of models) {
        urls.push(
          `  <url><loc>${xmlEscape(`${SITE_URL}/models/${modelSlug(m.id, m.fullName)}`)}</loc><lastmod>${now}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`
        );
      }
    } catch (error) {
      console.error("[Sitemap] models error:", error);
    }

    try {
      const events = await getPublishedEvents();
      for (const e of events) {
        urls.push(
          `  <url><loc>${xmlEscape(`${SITE_URL}/events/${e.slug}`)}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`
        );
      }
    } catch (error) {
      console.error("[Sitemap] events error:", error);
    }

    try {
      const winners = await getPublishedWinners();
      for (const w of winners) {
        urls.push(
          `  <url><loc>${xmlEscape(`${SITE_URL}/winners/${w.id}`)}</loc><changefreq>yearly</changefreq><priority>0.6</priority></url>`
        );
      }
    } catch (error) {
      console.error("[Sitemap] winners error:", error);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
    res.type("application/xml").set("Cache-Control", "public, max-age=3600").send(xml);
  } catch (error) {
    console.error("[Sitemap] route error:", error);
    res.status(500).type("text").send("Sitemap unavailable");
  }
});

export default shareRouter;
