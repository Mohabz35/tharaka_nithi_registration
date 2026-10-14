import { Router, Request, Response } from "express";
import { getWinnerById, getEventBySlug, getEventPhotos } from "../db.js";

const shareRouter = Router();

const SITE_URL = process.env.PUBLIC_SITE_URL || "https://www.faceoftharakanithi.app";
const DEFAULT_IMAGE = `${SITE_URL}/ri_logo_transparent.png`;

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

export default shareRouter;
