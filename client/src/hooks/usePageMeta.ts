import { useEffect } from "react";

const SITE_URL = "https://www.faceoftharakanithi.app";
export const DEFAULT_SHARE_IMAGE = `${SITE_URL}/optimized/og-image.jpg`;

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    const alt = attr === "name" ? "property" : "name";
    el = document.head.querySelector<HTMLMetaElement>(`meta[${alt}="${key}"]`);
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

export interface PageMetaInput {
  title: string;
  description?: string;
  image?: string;
  path?: string;
  type?: string;
}

/** Sets document title + OG/Twitter meta tags for the current page. Restores defaults on unmount. */
export function usePageMeta({ title, description, image, path, type }: PageMetaInput) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    upsertMeta("name", "title", title);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "twitter:title", title);

    if (description !== undefined) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
      upsertMeta("property", "twitter:description", description);
    }
    const imageUrl = image || DEFAULT_SHARE_IMAGE;
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "twitter:image", imageUrl);
    if (type) upsertMeta("property", "og:type", type);
    if (path) {
      const url = `${SITE_URL}${path}`;
      upsertMeta("property", "og:url", url);
      upsertMeta("property", "twitter:url", url);
      upsertCanonical(url);
    }
    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image, path, type]);
}

export { SITE_URL };
