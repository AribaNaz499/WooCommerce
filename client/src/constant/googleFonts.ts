export const ADMINS_GOOGLE_FONTS: string[] = [
  // Classic scripts (your list)… trimmed duplicates
  "Tangerine",
  "Great Vibes",
  "Alex Brush",
  "Parisienne",
  "Carattere",
  "Courgette",
  "Satisfy",
  "Cookie",
  "Dancing Script",
  "Lobster",
  "Pacifico",
  "Handlee",
  "Kaushan Script",
  "Allura",
  "Windsong",
  "Yellowtail",
  "Homemade Apple",
  "Rouge Script",
  "Delius Swash Caps",
  "Marck Script",
  "Grand Hotel",
  "Monsieur La Doulaise",
  "Bilbo",
  "Bilbo Swash Caps",
  "Bonbon",
  "Charm",
  "Crafty Girls",
  "Damion",
  "Dawning of a New Day",
  "Griffy",
  "La Belle Aurore",
  "Leckerli One",
  "Lovers Quarrel",
  "Meow Script",
  "Mrs Saint Delafield",
  "Mrs Sheppards",
  "Mystery Quest",
  "Playball",
  "Princess Sofia",
  // Additions
  "Pinyon Script",
  "Sacramento",
  "Norican",
  "Mr Dafoe",
  "Arizonia",
  "Yesteryear",
  "Italianno",
  "Meddon",
  "Qwigley",
  "Vibur",
  "Bad Script",
  "Gloria Hallelujah",
  "Indie Flower",
  "Nothing You Could Do",
  "Caveat",
  "Caveat Brush",
  "Amatic SC",
  "Gochi Hand",
  "Kalam",
  "Permanent Marker",
  "Rock Salt",
  "Sedgwick Ave",
  "Sedgwick Ave Display",
  "Patrick Hand",
  "Patrick Hand SC",
  "Sriracha",
  "Beth Ellen",
  "Shadows Into Light",
  "Shadows Into Light Two",
  "Reenie Beanie",
  "Nanum Pen Script",
  "Covered By Your Grace",
  "Just Another Hand",
  "Allison",
  "Clicker Script",
  "MonteCarlo",
  "The Nautigal",
  "Waterfall",
  "Libre Baskerville",
  "Playfair Display",
];

// Optional weight hints for a FEW families only (keeps CSS small).
const WEIGHT_HINTS: Record<string, number[]> = {
  "Playfair Display": [400, 700],
  "Libre Baskerville": [400, 700],
  "Dancing Script": [400, 600, 700],
  Caveat: [400, 600, 700],
  "Amatic SC": [400, 700],
  Kalam: [300, 400, 700],
};

const loadedGoogleFontUrls = new Set<string>();
const googleFontCssCache = new Map<string, Promise<string>>();
const googleFontEmbedCssCache = new Map<string, Promise<string>>();
const googleFontFileCache = new Map<string, Promise<string>>();

const hashUrl = (url: string): string => {
  let h = 0;
  for (let i = 0; i < url.length; i += 1) {
    h = (h * 31 + url.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
};

const isTrustedGoogleFontsUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "fonts.googleapis.com" &&
      parsed.pathname.startsWith("/css2")
    );
  } catch {
    return false;
  }
};

const fetchGoogleFontCss = (url: string): Promise<string> => {
  const cached = googleFontCssCache.get(url);
  if (cached) return cached;

  const promise = (async () => {
    if (!isTrustedGoogleFontsUrl(url)) {
      throw new Error("Untrusted Google Fonts URL");
    }
    const res = await fetch(url, {
      credentials: "omit",
      cache: "force-cache",
    });
    if (!res.ok) {
      throw new Error(`Failed to load Google Fonts CSS (${res.status})`);
    }
    return await res.text();
  })();

  googleFontCssCache.set(url, promise);
  promise.catch(() => {
    googleFontCssCache.delete(url);
  });
  return promise;
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read font blob"));
    reader.readAsDataURL(blob);
  });

const fetchGoogleFontFileAsDataUrl = (url: string): Promise<string> => {
  const cached = googleFontFileCache.get(url);
  if (cached) return cached;

  const promise = (async () => {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "fonts.gstatic.com") {
      throw new Error("Untrusted font asset URL");
    }
    const res = await fetch(url, {
      credentials: "omit",
      cache: "force-cache",
    });
    if (!res.ok) {
      throw new Error(`Failed to load Google font file (${res.status})`);
    }
    const blob = await res.blob();
    return await blobToDataUrl(blob);
  })();

  googleFontFileCache.set(url, promise);
  promise.catch(() => {
    googleFontFileCache.delete(url);
  });
  return promise;
};

const inlineGoogleFontCss = (url: string): Promise<string> => {
  const cached = googleFontEmbedCssCache.get(url);
  if (cached) return cached;

  const promise = (async () => {
    let cssText = await fetchGoogleFontCss(url);
    const regex = /url\((['"]?)([^"')]+)\1\)/g;
    const replacements = Array.from(cssText.matchAll(regex));
    await Promise.all(
      replacements.map(async ([fullMatch, , assetUrl]) => {
        const absoluteUrl = assetUrl.startsWith("https://")
          ? assetUrl
          : new URL(assetUrl, url).href;
        const dataUrl = await fetchGoogleFontFileAsDataUrl(absoluteUrl);
        cssText = cssText.replace(fullMatch, `url(${dataUrl})`);
      }),
    );
    return cssText;
  })();

  googleFontEmbedCssCache.set(url, promise);
  promise.catch(() => {
    googleFontEmbedCssCache.delete(url);
  });
  return promise;
};

const ensurePreconnect = () => {
  if (typeof document === "undefined") return;

  if (!document.getElementById("gf-preconnect-apis")) {
    const a = document.createElement("link");
    a.id = "gf-preconnect-apis";
    a.rel = "preconnect";
    a.href = "https://fonts.googleapis.com";
    a.crossOrigin = "anonymous";
    document.head.appendChild(a);
  }
  if (!document.getElementById("gf-preconnect-static")) {
    const a = document.createElement("link");
    a.id = "gf-preconnect-static";
    a.rel = "preconnect";
    a.href = "https://fonts.gstatic.com";
    a.crossOrigin = "anonymous";
    document.head.appendChild(a);
  }
};

export async function ensureGoogleFontsLoaded(urls: string[]): Promise<void> {
  if (typeof document === "undefined") return;

  ensurePreconnect();

  await Promise.all(
    urls.map(async (url) => {
      if (!url) return;
      if (loadedGoogleFontUrls.has(url)) return;

      const id = "gf-css-" + hashUrl(url);
      const existingStyle = document.getElementById(id);
      if (existingStyle) {
        loadedGoogleFontUrls.add(url);
        return;
      }

      try {
        const cssText = await fetchGoogleFontCss(url);
        const existingAfterFetch = document.getElementById(id);
        if (existingAfterFetch) {
          loadedGoogleFontUrls.add(url);
          return;
        }
        const style = document.createElement("style");
        style.id = id;
        style.setAttribute("data-gf-url", encodeURIComponent(url));
        style.textContent = cssText;
        document.head.appendChild(style);
        loadedGoogleFontUrls.add(url);
      } catch {
        const existingLink = document.querySelector(`link[data-gf-url="${encodeURIComponent(url)}"]`);
        if (existingLink) {
          loadedGoogleFontUrls.add(url);
          return;
        }
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = url;
        link.setAttribute("data-gf-url", encodeURIComponent(url));
        document.head.appendChild(link);
        loadedGoogleFontUrls.add(url);
      }
    }),
  );
}

/** Build a CSS URL from families with optional weights. */
function buildUrl(families: string[]): string {
  const q = families
    .map((name) => {
      const fam = name.trim().replace(/\s+/g, "+");
      const weights = WEIGHT_HINTS[name];
      return weights?.length
        ? `family=${fam}:wght@${Array.from(new Set(weights)).sort().join(";")}`
        : `family=${fam}`;
    })
    .join("&");
  return `https://fonts.googleapis.com/css2?${q}&display=swap`;
}

/** Split families into multiple URLs, each under a safe max length. */
export function buildGoogleFontsUrls(
  families: string[],
  maxUrlLen = 1800 // keep below typical limits
): string[] {
  const uniq = Array.from(new Set(families)); // dedupe
  const urls: string[] = [];
  let buf: string[] = [];

  for (const f of uniq) {
    const test = buildUrl([...buf, f]);
    if (test.length > maxUrlLen) {
      if (buf.length === 0) {
        // Single family already exceeds: still push to avoid infinite loop.
        urls.push(test);
        buf = [];
      } else {
        urls.push(buildUrl(buf));
        buf = [f];
      }
    } else {
      buf.push(f);
    }
  }
  if (buf.length) urls.push(buildUrl(buf));
  return urls;
}

/** Idempotently inject link tags. */
export function loadGoogleFontsOnce(urls: string[]): void {
  void ensureGoogleFontsLoaded(urls);
}

export async function getGoogleFontEmbedCss(families: string[]): Promise<string> {
  const urls = buildGoogleFontsUrls(families);
  if (!urls.length) return "";

  await ensureGoogleFontsLoaded(urls);
  const cssParts = await Promise.all(
    urls.map(async (url) => {
      try {
        return await inlineGoogleFontCss(url);
      } catch {
        return "";
      }
    }),
  );

  return cssParts.filter(Boolean).join("\n");
}

/** Convenience: load a large list safely. */
export function loadAdminFonts(): void {
  const urls = buildGoogleFontsUrls(ADMINS_GOOGLE_FONTS);
  loadGoogleFontsOnce(urls);
}

// ======================= Example usage =======================
// 1) Load globally in your app entry (_app.tsx, main.tsx, or Layout)
/// import { useEffect } from "react";
/// import { loadAdminFonts } from "./fonts/googleFonts";
/// useEffect(() => { loadAdminFonts(); }, []);
//
// 2) Or load per-screen:
//   loadGoogleFontsOnce(buildGoogleFontsUrls(["Great Vibes","Playfair Display"]));
//
// 3) Use in styles:
//   <div style={{ fontFamily: "'Great Vibes', cursive" }}>Hello</div>
