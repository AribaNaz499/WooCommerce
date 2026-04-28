import { Box, Container, Grid, Typography, Chip, Button, LinearProgress } from "@mui/material";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import TableBgImg from "/assets/images/table.png";
import LandingButton from "../../../components/LandingButton/LandingButton";
import { loadStripe } from "@stripe/stripe-js";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useSlide1 } from "../../../context/Slide1Context";
import { useSlide2 } from "../../../context/Slide2Context";
import { useSlide3 } from "../../../context/Slide3Context";
import { useSlide4 } from "../../../context/Slide4Context";
import { CardGiftcard, EmojiEvents } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { type SizeKey } from "../../../stores/cartStore";
import { getMockupConfig } from "../../../lib/mockup";
import { getCardSnapshot } from "../../../lib/cardSnapshotStore";
import { toJpeg, toPng } from "html-to-image";
import {
  buildTenUpSlides,
  buildTwoUpSlides,
  buildFixedGridSlides,
  isBusinessCardPrintSize,
  isBusinessCardsCategory,
  isBusinessLeafletsCategory,
  isCandlesCategory,
  isCoastersCategory,
  isNotebooksCategory,
  isMirrorPrintCategory,
  mirrorSlides,
  isCardsCategory,
  isLeafletTwoUpSize,
  isNotebookTwoUpSize,
  isParallelCardSize,
  getLeafletTwoUpPageMm,
  getNotebookTwoUpPageMm,
  getPageMmForSize,
  isInviteTwoUpSize,
  getInviteTwoUpPageMm,
  isMugWrapSize,
  getMugWrapPageMm,
} from "../../../lib/pdfTwoUp";
import { supabase } from "../../../supabase/supabase";
import { USER_ROUTES } from "../../../constant/route";
import MainLayout from "../../../layout/MainLayout";
import { COLORS } from "../../../constant/color";
import { removeWhiteBg } from "../../../lib/lib";
import {
  clearSlidesFromIdb,
  clearSlidesFromIdbByPrefix,
  loadSlidesFromIdb,
  loadSlidesFromIdbByKey,
  saveSlidesToIdb,
  saveSlidesToIdbByKey,
} from "../../../lib/idbSlides";
import { API_BASE } from "../../../lib/apiBase";
import {
  buildGoogleFontsUrls,
  getGoogleFontEmbedCss,
  loadGoogleFontsOnce,
} from "../../../constant/googleFonts";
import { isIosTouchDevice } from "../../../lib/platform";
import { renderTemplateSlideToCanvas } from "../../../lib/templateSlideCanvas";
import { clearSubscriptionPreviewPayload, readSubscriptionPreviewPayload } from "../../../lib/subscriptionPreview";
import Slide1 from "../Preview/component/Slide1/Slide1";
import Slide2 from "../Preview/component/Slide2/Slide2";
import Slide3 from "../Preview/component/Slide3/Slide3";
import Slide4 from "../Preview/component/Slide4/Slide4";

// ------------------ ENV ------------------
const STRIPE_PK =
  import.meta.env.VITE_STRIPE_PK ||
  import.meta.env.VITE_STRIP_PUBLIC_KEY ||
  "pk_test_51S5Pnw6w4VLajVLTFff76bJmNdN9UKKAZ2GKrXL41ZHlqaMxjXBjlCEly60J69hr3noxGXv6XL2Rj4Gp4yfPCjAy00j41t6ReK";
const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : Promise.resolve(null);
const PREPARED_SLIDES_PREFIX = "prepared:";

// ------------------ Types ------------------
type SelectedVariant = {
  key: SizeKey;
  title: string;
  price: number;
  isOnSale?: boolean;
  category?: string;
};

type SelectedProduct = {
  id?: string | number;
  type?: "card" | "template";
  title?: string;
  category?: string;
  img?: string;
  accessplan?: string;
  accessPlan?: string;
};

type RawSlide = { id: number; label?: string; elements: any[]; bgColor?: string | null };
type PreviewConfig = { mmWidth?: number; mmHeight?: number };
type LegacyMediaConfig = {
  bgSrc: string;
  boxWidth: number;
  boxHeight: number;
  qrLeft: number;
  qrTop: number;
  qrSize: number;
  linkLeft: number;
  linkTop: number;
  linkWidth: number;
};
type LegacyRuntimeSnapshot = {
  capturedAt?: number;
  slide1?: Record<string, any>;
  slide2?: Record<string, any>;
  slide3?: Record<string, any>;
  slide4?: Record<string, any>;
};

type PriceTables = { actual: any; sale: any };
type SizeDef = { key: any; title: string; sub?: string };

type UserPlan = {
  plan_code: "free" | "bundle" | "pro" | string;
  isPremium: boolean;
  premium_expires_at: string | null;
  email?: string | null;
};

const LEGACY_CARD_CAPTURE = { w: 500, h: 700 };
const TRANSPARENT_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
const LEGACY_SLIDE_CAPTURE = { w: 500, h: 700 };
const LEGACY_MEDIA_CONFIGS: Record<number, { video: LegacyMediaConfig; audio: LegacyMediaConfig }> = {
  2: {
    video: { bgSrc: "/assets/images/video-qr-tips.png", boxWidth: 350, boxHeight: 200, qrLeft: 28, qrTop: 33, qrSize: 68, linkLeft: 205, linkTop: 60, linkWidth: 110 },
    audio: { bgSrc: "/assets/images/audio-qr-tips.png", boxWidth: 350, boxHeight: 200, qrLeft: 28, qrTop: 33, qrSize: 68, linkLeft: 205, linkTop: 60, linkWidth: 110 },
  },
  3: {
    video: { bgSrc: "/assets/images/video-qr-tips.png", boxWidth: 300, boxHeight: 200, qrLeft: 2, qrTop: 50, qrSize: 68, linkLeft: 190, linkTop: 78, linkWidth: 105 },
    audio: { bgSrc: "/assets/images/audio-qr-tips.png", boxWidth: 300, boxHeight: 200, qrLeft: 2, qrTop: 50, qrSize: 68, linkLeft: 190, linkTop: 78, linkWidth: 105 },
  },
  4: {
    video: { bgSrc: "/assets/images/video-qr-tips.png", boxWidth: 485, boxHeight: 180, qrLeft: 58, qrTop: 49, qrSize: 68, linkLeft: 355, linkTop: 71, linkWidth: 105 },
    audio: { bgSrc: "/assets/images/audio-qr-tips.png", boxWidth: 485, boxHeight: 190, qrLeft: 65, qrTop: 57, qrSize: 68, linkLeft: 355, linkTop: 71, linkWidth: 105 },
  },
};

const lc = (s: unknown) => (s == null ? "" : String(s).trim().toLowerCase());
const clipText = (value: unknown, max = 20) => {
  const text = String(value ?? "").trim();
  return text.length > max ? `${text.slice(0, max)}.....` : text;
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });

const toDataUrlSafe = async (src: string): Promise<string> => {
  if (!src || src.startsWith("data:") || src.startsWith("blob:")) return src;
  try {
    const absolute =
      src.startsWith("/") && typeof window !== "undefined" ? `${window.location.origin}${src}` : src;
    const resp = await fetch(absolute, { mode: "cors" });
    if (!resp.ok) return src;
    const blob = await resp.blob();
    return await blobToDataUrl(blob);
  } catch {
    return src;
  }
};

const mapAlign = (value: unknown): "left" | "center" | "right" => {
  const raw = String(value ?? "").toLowerCase().trim();
  if (raw === "start") return "left";
  if (raw === "end") return "right";
  if (raw === "left" || raw === "right") return raw;
  return "center";
};

const pushImageElement = (elements: any[], input: any, type: "image" | "sticker" = "image") => {
  const src = String(
    input?.src ??
    input?.sticker ??
    input?.image ??
    input?.url ??
    input?.originalSrc ??
    "",
  ).trim();
  if (!src) return;

  elements.push({
    id: input?.id ?? `${type}-${elements.length + 1}`,
    type,
    src,
    x: toNum(input?.x ?? input?.left, 0),
    y: toNum(input?.y ?? input?.top, 0),
    width: Math.max(1, toNum(input?.width, 1)),
    height: Math.max(1, toNum(input?.height, 1)),
    zIndex: toNum(input?.zIndex, type === "sticker" ? 50 : 1),
    rotation: toNum(input?.rotation, 0),
  });
};

const pushTextElement = (elements: any[], input: any, overrides?: Record<string, unknown>) => {
  const text = String(input?.text ?? input?.value ?? "").trimEnd();
  if (!text) return;

  elements.push({
    id: input?.id ?? `text-${elements.length + 1}`,
    type: "text",
    text,
    x: toNum(input?.x ?? input?.position?.x, 0),
    y: toNum(input?.y ?? input?.position?.y, 0),
    width: Math.max(1, toNum(input?.width ?? input?.size?.width, 1)),
    height: Math.max(1, toNum(input?.height ?? input?.size?.height, 1)),
    zIndex: toNum(input?.zIndex, 2),
    rotation: toNum(input?.rotation, 0),
    fontSize: Math.max(1, toNum(input?.fontSize, 16)),
    fontFamily: String(input?.fontFamily ?? "Roboto"),
    color: String(input?.fontColor ?? input?.color ?? "#000000"),
    fontWeight: input?.fontWeight ?? 400,
    lineHeight: toNum(input?.lineHeight, 1.2),
    align: mapAlign(input?.textAlign),
    ...overrides,
  });
};

const addLegacyMediaElements = async (
  elements: any[],
  slideIndex: number,
  kind: "video" | "audio",
  url: string | null | undefined,
  position: any,
) => {
  const mediaUrl = String(url ?? "").trim();
  if (!mediaUrl) return;
  const config = LEGACY_MEDIA_CONFIGS[slideIndex]?.[kind];
  if (!config) return;

  const qrUrl = String(position?.url || mediaUrl).trim();
  const qrDataUrl = qrUrl
    ? await QRCode.toDataURL(qrUrl, { width: config.qrSize * 4, margin: 1 })
    : "";
  const baseX = toNum(position?.x, 0);
  const baseY = toNum(position?.y, 0);

  pushImageElement(elements, {
    id: `${kind}-bg-${slideIndex}`,
    src: config.bgSrc,
    x: baseX,
    y: baseY,
    width: config.boxWidth,
    height: config.boxHeight,
    zIndex: toNum(position?.zIndex, 20),
  });

  if (qrDataUrl) {
    pushImageElement(elements, {
      id: `${kind}-qr-${slideIndex}`,
      src: qrDataUrl,
      x: baseX + config.qrLeft,
      y: baseY + config.qrTop,
      width: config.qrSize,
      height: config.qrSize,
      zIndex: toNum(position?.zIndex, 21),
    });
  }

  pushTextElement(
    elements,
    {
      id: `${kind}-link-${slideIndex}`,
      text: clipText(mediaUrl),
      x: baseX + config.linkLeft,
      y: baseY + config.linkTop,
      width: config.linkWidth,
      height: 36,
      zIndex: toNum(position?.zIndex, 22),
      fontSize: 10,
      fontFamily: "Arial",
      color: "#000000",
      fontWeight: 400,
      textAlign: "left",
      verticalAlign: "top",
      lineHeight: 1.1,
    },
    { align: "left" },
  );
};

const readSelectedProductSnapshot = (): SelectedProduct | null => {
  try {
    const raw = JSON.parse(localStorage.getItem("selectedProduct") || "null");
    return raw && typeof raw === "object" ? (raw as SelectedProduct) : null;
  } catch {
    return null;
  }
};

const hasMatchingTemplatePreviewSession = (options?: {
  previewKey?: string | null;
  productId?: string | number | null;
}) => {
  try {
    const storedKey = String(sessionStorage.getItem("templ_preview_key") || "").trim();
    if (!storedKey) return false;

    const expectedKey = String(options?.previewKey ?? "").trim();
    if (expectedKey) return storedKey === expectedKey;

    const productId = String(options?.productId ?? "").trim();
    if (productId) return storedKey.startsWith(`${productId}::`);

    return false;
  } catch {
    return false;
  }
};

const readInitialRawSlides = (options?: {
  previewKey?: string | null;
  productId?: string | number | null;
}): RawSlide[] => {
  if (!hasMatchingTemplatePreviewSession(options)) return [];
  try {
    const cachedSlides = (globalThis as any).__rawSlidesCache;
    if (Array.isArray(cachedSlides) && cachedSlides.length) {
      return cachedSlides as RawSlide[];
    }
  } catch { }

  try {
    const storedSlides = sessionStorage.getItem("templ_preview_slides");
    if (!storedSlides) return [];
    const parsed = JSON.parse(storedSlides);
    return Array.isArray(parsed) ? (parsed as RawSlide[]) : [];
  } catch {
    return [];
  }
};

const readInitialPreviewConfig = (options?: {
  previewKey?: string | null;
  productId?: string | number | null;
}): PreviewConfig | null => {
  if (!hasMatchingTemplatePreviewSession(options)) return null;
  try {
    const cachedCfg = (globalThis as any).__previewConfigCache;
    if (cachedCfg && typeof cachedCfg === "object") {
      return cachedCfg as PreviewConfig;
    }
  } catch { }

  try {
    const storedCfg = sessionStorage.getItem("templ_preview_config");
    return storedCfg ? (JSON.parse(storedCfg) as PreviewConfig) : null;
  } catch {
    return null;
  }
};

const resolveSubscriptionPreviewKey = (previewKey?: string | null) => {
  const explicitKey = String(previewKey ?? "").trim();
  if (explicitKey) return explicitKey;
  try {
    return String(sessionStorage.getItem("templ_preview_key") || "").trim();
  } catch {
    return "";
  }
};

const singularizeCategory = (name?: string) => {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower.endsWith("ss")) return trimmed;
  if (lower.endsWith("s")) return trimmed.slice(0, -1);
  return trimmed;
};

const buildPdfFileName = (category?: string, ext: "pdf" | "png" = "pdf") => {
  const label = singularizeCategory(category) || "design";
  const clean = label
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return `personalised ${clean || "design"} ${ext}`;
};

const buildUniqueExportFileName = (
  category?: string,
  ext: "pdf" | "png" = "pdf",
  suffix?: string | number | null,
) => {
  const base = buildPdfFileName(category, ext).replace(/\s+pdf$/i, "").replace(/\s+png$/i, "");
  const token = String(suffix ?? Date.now())
    .trim()
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${token}.${ext}`;
};

const sortSlidePayloadKeys = (slides: Record<string, string>) =>
  Object.keys(slides)
    .filter((key) => slides[key])
    .sort((a, b) => {
      const na = Number((a.match(/(\d+)/) || [])[1] || Number.POSITIVE_INFINITY);
      const nb = Number((b.match(/(\d+)/) || [])[1] || Number.POSITIVE_INFINITY);
      if (na !== nb) return na - nb;
      return a.localeCompare(b, undefined, { sensitivity: "base" });
    });

const loadImageDimensions = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        width: Math.max(1, img.naturalWidth || img.width || 1),
        height: Math.max(1, img.naturalHeight || img.height || 1),
      });
    img.onerror = () => reject(new Error("Failed to load export image"));
    img.src = src;
  });

const triggerBrowserDownload = (href: string, fileName: string) => {
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const toTitleCase = (value?: string) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const buildEmailSubject = (category?: string) => {
  const label = toTitleCase(String(category ?? "").trim() || "PNG");
  return `Your personalised ${label} file(s) are attached.`;
};

const readLegacyCardRuntimeSnapshot = (): LegacyRuntimeSnapshot | null => {
  try {
    const raw = sessionStorage.getItem("card_runtime_snapshot");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as LegacyRuntimeSnapshot) : null;
  } catch {
    return null;
  }
};

const getItemAccessPlan = (p: any): "free" | "bundle" | "pro" => {
  const v = lc(p?.accessplan ?? p?.accessPlan ?? p?.plan ?? p?.plan_code ?? p?.code);
  if (v === "pro" || v === "premium") return "pro";
  if (v === "bundle") return "bundle";
  return "free";
};

const normalizeItemType = (type?: string) => {
  if (!type) return "";
  const t = type.toLowerCase().trim();
  if (t === "templet") return "template";
  if (t === "templates") return "template";
  if (t === "cards") return "card";
  return t;
};

const normalizeFontFamily = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const quoted = raw.match(/['"]([^'"]+)['"]/);
  if (quoted?.[1]) return quoted[1].trim();
  const first = raw.split(",")[0]?.trim() ?? "";
  return first.replace(/^['"]|['"]$/g, "").trim();
};

const resolveTextFontFamily = (entry: any) =>
  normalizeFontFamily(
    entry?.fontFamily ??
    entry?.font_family ??
    entry?.["font-family"] ??
    entry?.fontFamily1 ??
    entry?.fontFamily2 ??
    entry?.fontFamily3 ??
    entry?.fontFamily4 ??
    entry?.style?.fontFamily ??
    entry?.style?.font_family ??
    entry?.style?.["font-family"] ??
    "",
  );

const firstDefinedValue = (...values: any[]) => {
  for (const value of values) {
    if (value === 0 || value === false) return value;
    if (typeof value === "string") {
      if (value.trim()) return value;
      continue;
    }
    if (value != null) return value;
  }
  return undefined;
};

const resolveTextWeight = (entry: any): string | number => {
  const raw = firstDefinedValue(
    entry?.fontWeight,
    entry?.font_weight,
    entry?.["font-weight"],
    entry?.style?.fontWeight,
    entry?.style?.font_weight,
    entry?.style?.["font-weight"],
  );
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return entry?.bold ? 700 : 400;
    const weight = Number(trimmed);
    if (Number.isFinite(weight) && weight > 0) return weight;
    return trimmed;
  }
  return entry?.bold ? 700 : 400;
};

const resolveTextStyle = (entry: any): string => {
  const raw = firstDefinedValue(
    entry?.fontStyle,
    entry?.font_style,
    entry?.["font-style"],
    entry?.style?.fontStyle,
    entry?.style?.font_style,
    entry?.style?.["font-style"],
  );
  if (typeof raw === "string") return raw.trim() || (entry?.italic ? "italic" : "normal");
  return entry?.italic ? "italic" : "normal";
};

const resolveTextDecoration = (entry: any): string => {
  const raw = firstDefinedValue(
    entry?.textDecoration,
    entry?.text_decoration,
    entry?.["text-decoration"],
    entry?.style?.textDecoration,
    entry?.style?.text_decoration,
    entry?.style?.["text-decoration"],
  );
  if (typeof raw === "string") return raw.trim() || "none";
  if (entry?.underline) return "underline";
  return "none";
};

const resolveTextColor = (entry: any): string =>
  String(firstDefinedValue(entry?.color, entry?.fill, entry?.style?.color, entry?.style?.fill, "#111111"));

const resolveTextRotation = (entry: any): number =>
  toNum(firstDefinedValue(entry?.rotation, entry?.rotate, entry?.style?.rotation, entry?.style?.rotate, 0), 0);

const resolveTextCurve = (entry: any): number =>
  toNum(firstDefinedValue(entry?.curve, entry?.arc, entry?.style?.curve, entry?.style?.arc, 0), 0);

const collectFontsFromRawSlides = (slides: RawSlide[]) => {
  const fonts = new Set<string>();
  (slides ?? []).forEach((sl) => {
    (sl?.elements ?? []).forEach((el: any) => {
      if (String(el?.type ?? "").toLowerCase() !== "text") return;
      const fam = resolveTextFontFamily(el);
      if (!fam) return;
      const lower = fam.toLowerCase();
      if (["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"].includes(lower)) return;
      fonts.add(fam);
    });
  });
  return Array.from(fonts);
};

const GENERIC_FONT_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
]);

const collectFontsFromNode = (node: HTMLElement | null) => {
  if (!node) return [];
  const fonts = new Set<string>();
  const walk = (el: HTMLElement) => {
    const fontFamily = getComputedStyle(el).fontFamily || "";
    fontFamily.split(",").forEach((value) => {
      const family = normalizeFontFamily(value);
      if (!family || GENERIC_FONT_FAMILIES.has(family.toLowerCase())) return;
      fonts.add(family);
    });
    Array.from(el.children).forEach((child) => {
      if (child instanceof HTMLElement) walk(child);
    });
  };
  walk(node);
  return Array.from(fonts);
};

export const isProductInBundle = (
  product: { id?: string | number; type?: string } | null,
  bundleKeySet: Set<string>
): boolean => {
  if (!product?.id || !product?.type) return false;
  const normalizedType = normalizeItemType(product.type);
  const key = `${normalizedType}:${String(product.id).trim()}`;
  return bundleKeySet.has(key);
};

// ------------------ EXACT Size Config (same as ProductPopup) ------------------
const getSizeDefsForCategory = (categoryName?: string): SizeDef[] => {
  const name = (categoryName ?? "").trim().toLowerCase();

  if (name.includes("invite")) {
    return [
      { key: "a5", title: "A5", sub: "Prints 2 invites per A4 sheet" },
      { key: "a4", title: "A4", sub: "Prints 1 invite per A4 sheet" },
      { key: "half_us_letter", title: "Half US Letter", sub: "Prints 2 invites per US Letter sheet" },
      { key: "us_letter", title: "US Letter", sub: "Prints 1 invite per US Letter sheet" },
    ];
  }

  if (name.includes("business card")) {
    return [
      { key: "a4", title: "A4" },
      { key: "us_letter", title: "US Letter" },
    ];
  }

  if (name.includes("business leaflet")) {
    return [
      { key: "a5", title: "A5", sub: "Prints 2 per A4 sheet" },
      { key: "a4", title: "A4", sub: "Prints 1 per A4 sheet" },
      { key: "half_us_letter", title: "Half US Letter", sub: "Prints 2 per US Letter sheet" },
      { key: "us_letter", title: "US Letter", sub: "Prints 1 per US Letter sheet" },
    ];
  }

  if (name.includes("candle")) {
    return [
      { key: "a4", title: "A4", sub: "6 labels per A4 sheet (70mm × 70mm)" },
      { key: "us_tabloid", title: "US Tabloid", sub: "6 labels per sheet (70mm × 70mm)" },
    ];
  }

  if (
    name.includes("clothing") ||
    name.includes("sticker") ||
    name.includes("wall art") ||
    name.includes("photo art") ||
    name.includes("bag")
  ) {
    return [
      { key: "a4", title: "A4" },
      { key: "a3", title: "A3" },
      { key: "us_letter", title: "US Letter" },
      { key: "us_tabloid", title: "US Tabloid (11 × 17 in)" },
    ];
  }

  if (name.includes("notebook")) {
    return [
      { key: "a5", title: "A5", sub: "Prints 2 per A4 landscape sheet" },
      { key: "a4", title: "A4", sub: "Prints 1 per A4 portrait sheet" },
      { key: "half_us_letter", title: "Half US Letter", sub: "Prints 2 per US Letter landscape sheet" },
      { key: "us_letter", title: "US Letter", sub: "Prints 1 per US Letter portrait sheet" },
    ];
  }

  if (name.includes("mug")) return [{ key: "mug_wrap_11oz", title: "228mm × 88.9mm wrap (11oz mug)" }];
  if (name.includes("coaster"))
    return [{ key: "coaster_95", title: "89mm × 89mm (6 per sheet: 2 × 3)" }];

  return [
    { key: "a5", title: "A3" },
    { key: "a4", title: "A4" },
    { key: "us_letter", title: "US Letter" },
    { key: "us_tabloid", title: "US Tabloid (11 × 17 in)" },
  ];
};

// ------------------ UI ------------------
const isActivePay = {
  display: "flex",
  gap: "4px",
  justifyContent: "space-between",
  alignItems: "center",
  bgcolor: COLORS.seconday,
  p: "3px",
  borderRadius: 2,
  boxShadow: "3px 7px 8px #eff1f1ff",
};

// ------------------ Helpers ------------------
const toNum = (v: unknown, fallback = 0) => {
  if (v == null) return fallback;
  const s = String(v).trim();
  if (!s) return fallback;
  if (s.toUpperCase() === "EMPTY") return fallback;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
};

const toPercent = (v?: string) => {
  const n = Number(String(v ?? "").replace("%", "").trim());
  return Number.isFinite(n) ? n : 0;
};

const getValidSlides = (slides?: Record<string, any> | null) =>
  Object.fromEntries(
    Object.entries(slides ?? {}).filter(
      ([, value]) => typeof value === "string" && value.startsWith("data:image/"),
    ),
  ) as Record<string, string>;

const buildPreparedSlidesKey = (productKey?: string, category?: string, cardSize?: string) =>
  `${PREPARED_SLIDES_PREFIX}${lc(productKey)}:${lc(category)}:${lc(cardSize)}`;

const waitForNextPaint = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });

// Some rows/flows may have uppercase keys, some lowercase. Support both.
const KEY_FALLBACK: Record<string, string> = {
  A5: "a5",
  A4: "a4",
  A3: "a3",
  US_LETTER: "us_letter",
  HALF_US_LETTER: "half_us_letter",
  US_TABLOID: "us_tabloid",
  MUG_WRAP_11OZ: "mug_wrap_11oz",
  COASTER_95: "coaster_95",
};

const readActualPrice = (tables: PriceTables | null, key: any, categoryName?: string) => {
  const actual = tables?.actual ?? {};
  const raw1 = actual?.[key];
  const raw2 = actual?.[String(key).toUpperCase?.() ?? ""];
  const raw3 = actual?.[KEY_FALLBACK[String(key).toUpperCase()] ?? ""];
  const direct = raw1 ?? raw2 ?? raw3;
  if (direct != null && String(direct).trim() !== "") return toNum(direct, 0);

  if (lc(categoryName).includes("candle")) {
    if (String(key).toLowerCase() === "us_letter") {
      return toNum(actual?.us_tabloid ?? actual?.US_TABLOID, 0);
    }
    if (String(key).toLowerCase() === "us_tabloid") {
      return toNum(actual?.us_letter ?? actual?.US_LETTER, 0);
    }
  }

  return 0;
};

async function getAccessToken() {
  const s1 = await supabase.auth.getSession();
  const t1 = s1.data?.session?.access_token;
  if (t1) return t1;

  const s2 = await supabase.auth.refreshSession();
  return s2.data?.session?.access_token || "";
}

async function fetchBundleItemKeySet(): Promise<Set<string>> {
  const { data, error } = await supabase.from("bundle_items").select("item_type,item_id");
  if (error) throw error;

  const keys = new Set<string>();
  (data ?? []).forEach((r: any) => {
    const type = r.item_type === "cards" ? "card" : r.item_type === "templets" ? "template" : r.item_type;
    keys.add(`${type}:${r.item_id}`);
  });

  return keys;
}

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState<SizeKey>("a4" as SizeKey);
  const [loading, setLoading] = useState(false);
  const [checkoutProgress, setCheckoutProgress] = useState({
    active: false,
    value: 0,
    label: "",
  });

  const [variant, setVariant] = useState<SelectedVariant | null>(null);
  const [product, setProduct] = useState<SelectedProduct | null>(null);
  const [priceTables, setPriceTables] = useState<PriceTables | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);

  const [, setUserPlan] = useState<UserPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(false);

  const [bundleKeySet, setBundleKeySet] = useState<Set<string>>(new Set());
  const [bundleKeyLoading, setBundleKeyLoading] = useState(false);

const location: any = useLocation() as {
  state?: {
    slides?: Record<string, string>;
    previewOnly?: boolean;
    runtimeCardSnapshot?: LegacyRuntimeSnapshot;
    snapshotKey?: string;
    previewKey?: string;
  };
};  const { state } = location;

  const { user, plan } = useAuth();
  const slide1State = useSlide1();
  const slide2State = useSlide2();
  const slide3State = useSlide3();
  const slide4State = useSlide4();
  const navigate = useNavigate();
  const subscriptionPreviewKey = useMemo(
    () => resolveSubscriptionPreviewKey(state?.previewKey),
    [state?.previewKey],
  );

  const setCheckoutProgressStep = useCallback((value: number, label: string) => {
    setCheckoutProgress({
      active: true,
      value: Math.max(0, Math.min(100, Math.round(value))),
      label,
    });
  }, []);

  const clearCheckoutProgress = useCallback(() => {
    setCheckoutProgress({
      active: false,
      value: 0,
      label: "",
    });
  }, []);

  const selectedProductSnapshot = useMemo(() => readSelectedProductSnapshot(), []);
  const [slidesObj, setSlidesObj] = useState<Record<string, string>>(() => {
    if ((state as any)?.runtimeCardSnapshot) {
      return {};
    }
    return getValidSlides((state as any)?.slides);
  }); const [subscriptionPreviewSlides, setSubscriptionPreviewSlides] = useState<Record<string, string>>(() =>
    readSubscriptionPreviewPayload(resolveSubscriptionPreviewKey(state?.previewKey) || undefined),
  );
  const [rawSlides, setRawSlides] = useState<RawSlide[]>(() =>
    readInitialRawSlides({
      previewKey: state?.previewKey,
      productId: selectedProductSnapshot?.id,
    }),
  );
  const [previewConfig, setPreviewConfig] = useState<PreviewConfig | null>(() =>
    readInitialPreviewConfig({
      previewKey: state?.previewKey,
      productId: selectedProductSnapshot?.id,
    }),
  );
  const [iosLegacyCardPreviewSrc, setIosLegacyCardPreviewSrc] = useState("");
  const [captureSupportEnabled, setCaptureSupportEnabled] = useState(false);
  const [legacyCardCaptureEnabled, setLegacyCardCaptureEnabled] = useState(false);
  const processingPaidSessionRef = useRef<string | null>(null);
  const isIosWebKit = useMemo(() => isIosTouchDevice(), []);

  const clearPaidQueryParams = useCallback(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    let changed = false;
    ["paid", "session_id", "category"].forEach((k) => {
      if (params.has(k)) {
        params.delete(k);
        changed = true;
      }
    });
    if (!changed) return;
    const clean = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", clean);
  }, []);

  const isPreviewOnly = useMemo(() => {
    if (state?.previewOnly) {
      try {
        if (sessionStorage.getItem("slides_preview_only") === "0") return false;
      } catch { }
      return true;
    }
    try {
      return sessionStorage.getItem("slides_preview_only") === "1";
    } catch {
      return false;
    }
  }, [state?.previewOnly]);

  const isLegacyCardProduct = useMemo(() => {
    const normalizedType = normalizeItemType(product?.type);
    if (normalizedType === "card") return true;
    if (normalizedType) return false;
    try {
      return sessionStorage.getItem("card_preview_downloaded") === "1";
    } catch {
      return false;
    }
  }, [product?.type]);

  const activeTemplatePreviewSession = useMemo(
    () =>
      !isLegacyCardProduct &&
      hasMatchingTemplatePreviewSession({
        previewKey: state?.previewKey,
        productId: product?.id ?? selectedProductSnapshot?.id,
      }),
    [isLegacyCardProduct, product?.id, selectedProductSnapshot?.id, state?.previewKey],
  );

  const subscriptionPreviewSlide1 =
    activeTemplatePreviewSession ? subscriptionPreviewSlides?.slide1 || "" : "";

  // FIXED: Complete buildLegacyCardRawSlidesFromState function
 const buildLegacyCardRawSlidesFromState = useCallback(async (): Promise<RawSlide[]> => {
  const navigationSnapshot = (state as any)?.runtimeCardSnapshot ?? null;

  let idbSnapshot: any = null;

  try {
    const snapshotKey = String((state as any)?.snapshotKey || "").trim();

    if (snapshotKey) {
      const saved = await getCardSnapshot(snapshotKey);

      if (saved && typeof saved === "object") {
        const savedAt = Number(saved?.capturedAt ?? 0);
        const ageMs = Date.now() - savedAt;

        if (ageMs < 10 * 60 * 1000) {
          idbSnapshot = saved;
        } else {
          console.warn("IndexedDB snapshot is too old, ignoring:", ageMs, "ms");
        }
      }
    }
  } catch (e) {
    console.error("Error reading IndexedDB card snapshot:", e);
  }

  let sessionSnapshot: any = null;

  try {
    const raw = sessionStorage.getItem("card_runtime_snapshot");

    if (raw) {
      const parsed = JSON.parse(raw);
      const savedAt = Number(parsed?.capturedAt ?? 0);
      const ageMs = Date.now() - savedAt;

      if (ageMs < 5 * 60 * 1000) {
        sessionSnapshot = parsed;
      } else {
        console.warn("sessionStorage snapshot is too old, ignoring:", ageMs, "ms");
        sessionStorage.removeItem("card_runtime_snapshot");
      }
    }
  } catch (e) {
    console.error("Error reading sessionStorage snapshot:", e);
  }

  let backupSnapshot: any = null;

  try {
    const raw = localStorage.getItem("card_runtime_snapshot_backup");

    if (raw) {
      const parsed = JSON.parse(raw);
      const savedAt = Number(parsed?.capturedAt ?? 0);
      const ageMs = Date.now() - savedAt;

      if (ageMs < 10 * 60 * 1000) {
        backupSnapshot = parsed;
      } else {
        console.warn("localStorage backup snapshot is too old, ignoring:", ageMs, "ms");
        localStorage.removeItem("card_runtime_snapshot_backup");
      }
    }
  } catch (e) {
    console.error("Error reading localStorage backup snapshot:", e);
  }

  const finalSnapshot =
    navigationSnapshot ??
    idbSnapshot ??
    sessionSnapshot ??
    backupSnapshot;

  if (!finalSnapshot) {
    console.error("❌ No runtime snapshot found anywhere!");
    toast.error("Design data not found. Please go back to preview and try again.");
    return [];
  }

  const hasSlideData =
    finalSnapshot?.slide1 != null ||
    finalSnapshot?.slide2 != null ||
    finalSnapshot?.slide3 != null ||
    finalSnapshot?.slide4 != null;

  if (!hasSlideData) {
    console.error("❌ Snapshot found but has no slide data:", finalSnapshot);
    toast.error("Snapshot data is empty. Please go back and try again.");
    return [];
  }

  console.log(
    "✅ Building slides from snapshot, source:",
    navigationSnapshot
      ? "navigation_state"
      : idbSnapshot
      ? "indexedDB"
      : sessionSnapshot
      ? "sessionStorage"
      : "localStorage_backup",
    "capturedAt:",
    finalSnapshot.capturedAt,
  );

  const slideConfigs = [
    { id: 1, key: "slide1" as const },
    { id: 2, key: "slide2" as const },
    { id: 3, key: "slide3" as const },
    { id: 4, key: "slide4" as const },
  ];

  const slides = await Promise.all(
    slideConfigs.map(async ({ id, key }) => {
      const slideData = finalSnapshot[key];

      if (!slideData || typeof slideData !== "object") {
        console.warn(`⚠️ No data for ${key}, returning empty slide`);

        return {
          id,
          label: key,
          bgColor: "#ffffff",
          elements: [],
        } satisfies RawSlide;
      }

      const elements: any[] = [];

      for (const entry of slideData.layout?.elements ?? []) {
        pushImageElement(elements, entry, "image");
      }

      for (const entry of slideData.layout?.textElements ?? []) {
        pushTextElement(elements, entry);
      }

      for (const entry of slideData.layout?.stickers ?? []) {
        pushImageElement(elements, entry, "sticker");
      }

      const selectedSet = new Set(
        (slideData.selectedImg ?? []).map((imgId: any) => String(imgId)),
      );

      for (const image of slideData.draggableImages ?? []) {
        if (selectedSet.size && !selectedSet.has(String(image?.id))) continue;
        pushImageElement(elements, image, "image");
      }

      if (slideData.multipleTextValue) {
        const texts = slideData.texts ?? [];

        for (let i = 0; i < texts.length; i++) {
          const text = texts[i];

          pushTextElement(elements, {
            ...text,
            width: 470,
            height: 210,
            x: 8,
            y: 8 + i * 220,
            lineHeight: text?.lineHeight ?? slideData.lineHeight,
            letterSpacing: text?.letterSpacing ?? slideData.letterSpacing,
          });
        }
      } else if (
        slideData.selectedLayout === "oneText" &&
        String(slideData.oneTextValue ?? "").trim()
      ) {
        pushTextElement(elements, {
          id: `single-text-${id}`,
          text: slideData.oneTextValue,
          x: 10,
          y: 10,
          width: 465,
          height: 680,
          fontSize: slideData.fontSize,
          fontFamily: slideData.fontFamily,
          fontColor: slideData.fontColor,
          fontWeight: slideData.fontWeight,
          textAlign: slideData.textAlign,
          lineHeight: slideData.lineHeight,
          letterSpacing: slideData.letterSpacing,
        });
      } else {
        for (const text of slideData.textElements ?? []) {
          pushTextElement(elements, text);
        }
      }

      if (slideData.isAIimage && slideData.selectedAIimageUrl) {
        pushImageElement(
          elements,
          {
            id: `ai-${id}`,
            src: slideData.selectedAIimageUrl,
            x: slideData.aimage?.x,
            y: slideData.aimage?.y,
            width: slideData.aimage?.width,
            height: slideData.aimage?.height,
            zIndex: 10,
          },
          "image",
        );
      }

      for (const sticker of slideData.selectedStickers ?? []) {
        pushImageElement(elements, sticker, "sticker");
      }

      await addLegacyMediaElements(
        elements,
        id,
        "video",
        slideData.selectedVideoUrl,
        slideData.qrPosition,
      );

      await addLegacyMediaElements(
        elements,
        id,
        "audio",
        slideData.selectedAudioUrl,
        slideData.qrAudioPosition,
      );

      return {
        id,
        label: key,
        bgColor: slideData.bgColor ?? "#ffffff",
        elements,
      } satisfies RawSlide;
    }),
  );

  return slides;
}, [state]);// ✅ Only depends on navigation state - not live slide contexts
  // This prevents re-runs caused by unrelated context updates


  useEffect(() => {
    setSubscriptionPreviewSlides(readSubscriptionPreviewPayload(subscriptionPreviewKey || undefined));
  }, [subscriptionPreviewKey]);

useEffect(() => {
  let mounted = true;
 
  const loadSlides = async () => {
    const routeSlides = getValidSlides((state as any)?.slides);
    if (Object.keys(routeSlides).length) {
      if (mounted) setSlidesObj(routeSlides);
      return;
    }
 
    try {
      const globalSlides = (globalThis as any).__slidesCache;
      if (globalSlides && Object.keys(globalSlides).length) {
        if (mounted) setSlidesObj(globalSlides);
        return;
      }
    } catch {}
 
    try {
      const fromSession = JSON.parse(sessionStorage.getItem("slides") || "{}");
      if (mounted && fromSession && Object.keys(fromSession).length) {
        setSlidesObj(fromSession);
        return;
      }
    } catch {}
 
    if (isPreviewOnly) {
      if (mounted) setSlidesObj({});
      return;
    }
 
    try {
      const fromLocal = JSON.parse(localStorage.getItem("slides_backup") || "{}");
      if (mounted) setSlidesObj(fromLocal || {});
      if (fromLocal && Object.keys(fromLocal).length) return;
    } catch {
      if (mounted) setSlidesObj({});
    }
 
    try {
      const fromIdb = await loadSlidesFromIdb();
      if (mounted && fromIdb) {
        setSlidesObj(fromIdb);
        return;
      }
    } catch {
      if (mounted) setSlidesObj({});
    }
  };
 
  loadSlides();
  return () => { mounted = false; };
}, [isPreviewOnly, state]); 

  useEffect(() => {
    let alive = true;

    if (activeTemplatePreviewSession) {
      try {
        const cachedSlides = (globalThis as any).__rawSlidesCache;
        if (Array.isArray(cachedSlides) && cachedSlides.length) {
          setRawSlides(cachedSlides);
        } else {
          const storedSlides = sessionStorage.getItem("templ_preview_slides");
          if (storedSlides) setRawSlides(JSON.parse(storedSlides));
        }
      } catch { }

      try {
        const cachedCfg = (globalThis as any).__previewConfigCache;
        if (cachedCfg && typeof cachedCfg === "object") {
          setPreviewConfig(cachedCfg);
        } else {
          const storedCfg = sessionStorage.getItem("templ_preview_config");
          if (storedCfg) setPreviewConfig(JSON.parse(storedCfg));
        }
      } catch { }

      return () => {
        alive = false;
      };
    }

    if (!(isIosWebKit && isLegacyCardProduct)) {
      setRawSlides([]);
      setPreviewConfig(null);
      return () => {
        alive = false;
      };
    }

    const legacyPreviewConfig = {
      mmWidth: LEGACY_SLIDE_CAPTURE.w,
      mmHeight: LEGACY_SLIDE_CAPTURE.h,
    } satisfies PreviewConfig;

    const buildLegacySlides = async () => {
      try {
        const nextSlides = await buildLegacyCardRawSlidesFromState();
        if (!alive) return;
        setRawSlides(nextSlides);
        setPreviewConfig(legacyPreviewConfig);
        try {
          sessionStorage.setItem("rawSlidesCount", String(nextSlides.length || 0));
        } catch { }
      } catch {
        if (!alive) return;
        setRawSlides([]);
        setPreviewConfig(legacyPreviewConfig);
      }
    };

    void buildLegacySlides();

    return () => {
      alive = false;
    };
  }, [activeTemplatePreviewSession, buildLegacyCardRawSlidesFromState, isIosWebKit, isLegacyCardProduct]);

  // Rest of the component remains the same...
  // (I'm omitting the rest due to length, but it continues unchanged)

  const visibleRawSlides = useMemo(
    () => (rawSlides.length ? rawSlides.slice(0, 1) : []),
    [rawSlides],
  );
  const preferCanvasCaptureForSafari = isIosWebKit && rawSlides.length > 0;

  useEffect(() => {
    if (isPreviewOnly && isLegacyCardProduct) return;
    const sourceSlides = captureSupportEnabled ? rawSlides : visibleRawSlides;
    if (!sourceSlides.length) return;
    const fonts = collectFontsFromRawSlides(sourceSlides);
    if (!fonts.length) return;
    loadGoogleFontsOnce(buildGoogleFontsUrls(fonts));
  }, [captureSupportEnabled, rawSlides, visibleRawSlides]);

  const firstSlideUrl = subscriptionPreviewSlide1 || slidesObj?.slide1 || "";
  const captureWidth = Math.max(1, Math.round(Number(previewConfig?.mmWidth) || 800));
  const captureHeight = Math.max(1, Math.round(Number(previewConfig?.mmHeight) || 600));

  const slideNodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const setSlideNodeRef = (i: number) => (el: HTMLDivElement | null) => {
    slideNodeRefs.current[i] = el;
  };
  const previewSurfaceRef = useRef<HTMLDivElement | null>(null);
  const legacyCardNodeRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const setLegacyCardNodeRef = (i: number) => (el: HTMLDivElement | null) => {
    legacyCardNodeRefs.current[i] = el;
  };
  const [previewSurfaceSize, setPreviewSurfaceSize] = useState({ w: 0, h: 0 });
  const captureFontEmbedCssCacheRef = useRef<Map<string, Promise<string>>>(new Map());

  useEffect(() => {
    slideNodeRefs.current = {};
    legacyCardNodeRefs.current = {};
    setCaptureSupportEnabled(false);
    setLegacyCardCaptureEnabled(false);
  }, [isLegacyCardProduct, rawSlides]);

  useEffect(() => {
    if (!previewSurfaceRef.current || typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const cr = entry.contentRect;
      setPreviewSurfaceSize({ w: cr.width, h: cr.height });
    });
    obs.observe(previewSurfaceRef.current);
    return () => obs.disconnect();
  }, []);

  const resolveCaptureFontEmbedCss = useCallback(async (fonts: string[]) => {
    const normalizedFonts = Array.from(
      new Set(
        (fonts ?? [])
          .map((font) => normalizeFontFamily(font))
          .filter((font) => font && !GENERIC_FONT_FAMILIES.has(font.toLowerCase())),
      ),
    ).sort();

    if (!normalizedFonts.length) return "";

    const cacheKey = normalizedFonts.join("|");
    const cached = captureFontEmbedCssCacheRef.current.get(cacheKey);
    if (cached) return await cached;

    const promise = getGoogleFontEmbedCss(normalizedFonts).catch(() => "");
    captureFontEmbedCssCacheRef.current.set(cacheKey, promise);
    return await promise;
  }, []);

  const ensureCaptureSupportReady = useCallback(async () => {
    if (!rawSlides.length && !isLegacyCardProduct) return;
    if (rawSlides.length && !captureSupportEnabled) {
      setCaptureSupportEnabled(true);
    }
    if (isLegacyCardProduct && !legacyCardCaptureEnabled) {
      setLegacyCardCaptureEnabled(true);
    }
    await waitForNextPaint();
    const rawNodesReady = rawSlides.length
      ? Object.keys(slideNodeRefs.current).length >= rawSlides.length
      : true;
    const legacyNodesReady = isLegacyCardProduct
      ? Object.keys(legacyCardNodeRefs.current).length >= 4
      : true;
    if (!rawNodesReady || !legacyNodesReady) {
      await waitForNextPaint();
    }
    if ((document as any)?.fonts?.ready) {
      try {
        await (document as any).fonts.ready;
      } catch { }
    }
  }, [captureSupportEnabled, isLegacyCardProduct, legacyCardCaptureEnabled, rawSlides]);

  const renderSlide = useCallback((slide?: RawSlide, opts?: { stripBackground?: boolean; transparentCanvas?: boolean }) => {
    if (!slide) return null;
    const stripBackground = opts?.stripBackground === true;
    const ordered = [...(slide.elements || [])]
      .filter((el: any) => {
        if (!stripBackground) return true;
        const id = String(el?.id ?? "").toLowerCase();
        const width = toNum(el?.width, 0);
        const height = toNum(el?.height, 0);
        const isFullFrameImage =
          String(el?.type ?? "").toLowerCase() === "image" &&
          toNum(el?.x, 0) === 0 &&
          toNum(el?.y, 0) === 0 &&
          width >= captureWidth - 1 &&
          height >= captureHeight - 1 &&
          Number(el?.zIndex ?? 1) <= 0;
        return !(id === "bg-image" || id.startsWith("bg-") || isFullFrameImage);
      })
      .sort((a, b) => {
        const zA = Number(a?.zIndex ?? 1) + (a?.type === "text" ? 100000 : 0);
        const zB = Number(b?.zIndex ?? 1) + (b?.type === "text" ? 100000 : 0);
        return zA - zB;
      });
    return (
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          bgcolor: opts?.transparentCanvas ? "transparent" : slide.bgColor ?? "transparent",
        }}
      >
        {ordered.map((el: any) => {
          const baseStyle: any = {
            position: "absolute",
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
            zIndex: el.zIndex ?? 1,
          };

          if (el.type === "image") {
            return (
              <Box
                key={el.id}
                component="img"
                src={el.src}
                alt=""
                sx={{ ...baseStyle, objectFit: "cover", display: "block" }}
              />
            );
          }

          if (el.type === "sticker") {
            return (
              <Box
                key={el.id}
                component="img"
                src={el.src}
                alt=""
                sx={{ ...baseStyle, objectFit: "contain", display: "block" }}
              />
            );
          }

          if (el.type === "text") {
            const align = el.align ?? "center";
            const justify =
              align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
            const rotation = resolveTextRotation(el);
            const curve = Math.max(-200, Math.min(200, resolveTextCurve(el)));
            const hasCurve = Math.abs(curve) > 0.5;
            const safeW = Math.max(1, toNum(el?.width, 1));
            const safeH = Math.max(1, toNum(el?.height, 1));
            const curvePx = (curve / 100) * (safeH / 2);
            const midY = safeH / 2;
            const textAnchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
            const startOffset = align === "left" ? "0%" : align === "right" ? "100%" : "50%";
            const curveId = `sub-curve-${slide?.id ?? "s"}-${el?.id ?? "t"}`;
            const lineHeight = Math.max(1, toNum(el?.lineHeight ?? el?.line_height, 1.16));
            const fontFamily = resolveTextFontFamily(el) || "Arial";
            const fontWeight = resolveTextWeight(el);
            const fontStyle = resolveTextStyle(el);
            const textDecoration = resolveTextDecoration(el);
            const textColor = resolveTextColor(el);
            return (
              <Box
                key={el.id}
                sx={{
                  ...baseStyle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: justify,
                  textAlign: align,
                  transform: rotation ? `rotate(${rotation}deg)` : "none",
                  transformOrigin: "center",
                  fontWeight,
                  fontStyle,
                  fontSize: el.fontSize,
                  fontFamily,
                  color: textColor,
                  textDecoration,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "break-word",
                  wordBreak: "break-word",
                  lineHeight: String(lineHeight),
                  overflow: "visible",
                }}
              >
                {hasCurve ? (
                  <Box
                    component="svg"
                    viewBox={`0 0 ${safeW} ${safeH}`}
                    sx={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
                  >
                    <defs>
                      <path
                        id={curveId}
                        d={`M 0 ${midY} Q ${safeW / 2} ${midY - curvePx} ${safeW} ${midY}`}
                      />
                    </defs>
                    <text
                      fill={textColor}
                      fontFamily={fontFamily}
                      fontSize={toNum(el?.fontSize, 20)}
                      fontWeight={fontWeight}
                      fontStyle={fontStyle}
                      textDecoration={textDecoration}
                      textAnchor={textAnchor}
                      dominantBaseline="middle"
                      direction="ltr"
                      unicodeBidi="plaintext"
                    >
                      <textPath
                        href={`#${curveId}`}
                        startOffset={startOffset}
                        style={{
                          fill: textColor,
                          fontFamily,
                          fontSize: toNum(el?.fontSize, 20),
                          fontWeight,
                          fontStyle,
                          textDecoration,
                        }}
                      >
                        {String(el?.text ?? "")}
                      </textPath>
                    </text>
                  </Box>
                ) : (
                  String(el?.text ?? "")
                )}
              </Box>
            );
          }

          return null;
        })}
      </Box>
    );
  }, [captureHeight, captureWidth]);

 const captureSlidesFromDom = useCallback(
  async (format: "jpeg" | "png", maxDim = 1600) => {
    const out: string[] = [];

    for (let i = 0; i < rawSlides.length; i++) {
      const node = slideNodeRefs.current[i];
      if (!node) continue;

      const fonts = Array.from(
        new Set([
          ...collectFontsFromRawSlides([rawSlides[i]]),
          ...collectFontsFromNode(node),
        ]),
      );
      const fontEmbedCSS = await resolveCaptureFontEmbedCss(fonts);

      const rect = node.getBoundingClientRect();
      const maxSide = Math.max(rect.width || 0, rect.height || 0);
      const ratio = maxSide ? maxDim / maxSide : 1.5;
      const pixelRatio = Math.min(2, Math.max(0.5, ratio));

      if (format === "png") {
        const png = await toPng(node, {
          pixelRatio,
          backgroundColor: "transparent",
          cacheBust: true,
          skipFonts: !fontEmbedCSS,
          fontEmbedCSS: fontEmbedCSS || undefined,
        });

        out.push(png);
      } else {
        const jpg = await toJpeg(node, {
          quality: 0.78,
          pixelRatio,
          backgroundColor: "#ffffff",
          cacheBust: true,
          skipFonts: !fontEmbedCSS,
          fontEmbedCSS: fontEmbedCSS || undefined,
        });

        out.push(jpg);
      }

      if (i < rawSlides.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return out;
  },
  [rawSlides, resolveCaptureFontEmbedCss],
);

  const prepareRawSlideForCanvas = useCallback(async (slide: RawSlide) => {
    const elements = await Promise.all(
      (slide?.elements ?? []).map(async (element: any) => {
        if (element?.type !== "image" && element?.type !== "sticker") return element;
        const src = String(element?.src ?? "");
        return {
          ...element,
          src: (await toDataUrlSafe(src)) || src || TRANSPARENT_PIXEL,
        };
      }),
    );

    return {
      ...slide,
      elements,
    } as RawSlide;
  }, []);

  const captureSlidesFromCanvasRenderer = useCallback(
    async (format: "jpeg" | "png", maxDim = 1600) => {
      const out: string[] = [];
      const maxSide = Math.max(captureWidth, captureHeight, 1);
      const ratio = maxSide ? maxDim / maxSide : 1.5;
      const pixelRatio = Math.min(format === "png" ? 3 : 2.5, Math.max(1, ratio));

      for (let i = 0; i < rawSlides.length; i++) {
        const preparedSlide = await prepareRawSlideForCanvas(rawSlides[i]);
        const canvas = await renderTemplateSlideToCanvas(preparedSlide as any, {
          width: captureWidth,
          height: captureHeight,
          pixelRatio,
          backgroundColor: format === "png" ? "transparent" : "#ffffff",
        });
        const dataUrl =
          format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.88);
        out.push(dataUrl);
        if (i < rawSlides.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      return out;
    },
    [captureHeight, captureWidth, prepareRawSlideForCanvas, rawSlides],
  );

  const captureProvidedRawSlidesFromCanvas = useCallback(
    async (
      slides: RawSlide[],
      format: "jpeg" | "png",
      maxDim = 1600,
      dims?: { width: number; height: number },
    ) => {
      const out: string[] = [];
      const width = Math.max(1, Math.round(dims?.width || captureWidth));
      const height = Math.max(1, Math.round(dims?.height || captureHeight));
      const maxSide = Math.max(width, height, 1);
      const ratio = maxSide ? maxDim / maxSide : 1.5;
      const pixelRatio = Math.min(format === "png" ? 3 : 2.5, Math.max(1, ratio));

      for (let i = 0; i < slides.length; i++) {
        const preparedSlide = await prepareRawSlideForCanvas(slides[i]);
        const canvas = await renderTemplateSlideToCanvas(preparedSlide as any, {
          width,
          height,
          pixelRatio,
          backgroundColor: format === "png" ? "transparent" : "#ffffff",
        });
        const dataUrl =
          format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.88);
        out.push(dataUrl);
        if (i < slides.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      return out;
    },
    [captureHeight, captureWidth, prepareRawSlideForCanvas],
  );

const captureLegacyCardSlidesFromDom = useCallback(
  async (maxDim = 1600) => {
    const out: string[] = [];

    for (let i = 0; i < 4; i++) {
      const node = legacyCardNodeRefs.current[i];
      if (!node) continue;

      const fontEmbedCSS = await resolveCaptureFontEmbedCss(collectFontsFromNode(node));

      const rect = node.getBoundingClientRect();
      const maxSide = Math.max(rect.width || 0, rect.height || 0);
      const ratio = maxSide ? maxDim / maxSide : 1.5;
      const pixelRatio = Math.min(2, Math.max(0.5, ratio));

      const jpg = await toJpeg(node, {
        quality: 0.9,
        pixelRatio,
        backgroundColor: "#ffffff",
        cacheBust: true,
        skipFonts: !fontEmbedCSS,
        fontEmbedCSS: fontEmbedCSS || undefined,
      });

      out.push(jpg);

      if (i < 3) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    return out;
  },
  [resolveCaptureFontEmbedCss],
);
  useEffect(() => {
    if (!isIosWebKit || !isLegacyCardProduct) {
      setIosLegacyCardPreviewSrc("");
      return;
    }
    if (firstSlideUrl) return;

    let alive = true;

    const buildCardPreview = async () => {
      try {
        await ensureCaptureSupportReady();
        const captured = preferCanvasCaptureForSafari
          ? await captureSlidesFromCanvasRenderer("png", 1800)
          : await captureLegacyCardSlidesFromDom(1800);
        if (!alive) return;
        setIosLegacyCardPreviewSrc(String(captured?.[0] || ""));
      } catch {
        if (!alive) return;
        setIosLegacyCardPreviewSrc("");
      }
    };

    void buildCardPreview();

    return () => {
      alive = false;
    };
  }, [
    captureLegacyCardSlidesFromDom,
    captureSlidesFromCanvasRenderer,
    ensureCaptureSupportReady,
    firstSlideUrl,
    isIosWebKit,
    isLegacyCardProduct,
    preferCanvasCaptureForSafari,
  ]);

  const storeSlidesPayload = useCallback((next: Record<string, string>) => {
    setSlidesObj(next);
    (globalThis as any).__slidesCache = next;
    try {
      sessionStorage.setItem("slides_preview_only", "0");
      sessionStorage.setItem("rawSlidesCount", String(Object.keys(next).length));
    } catch { }

    try {
      sessionStorage.removeItem("slides");
    } catch { }

    try {
      void saveSlidesToIdb(next);
    } catch { }
  }, []);

  const readCapturedSlidesFromStorage = useCallback(() => {
    try {
      const stored = sessionStorage.getItem("capturedSlides");
      if (!stored) return [] as string[];
      const capturedKey = sessionStorage.getItem("capturedSlidesKey") || "";
      const previewKey = sessionStorage.getItem("templ_preview_key") || "";
      if (capturedKey && previewKey && capturedKey !== previewKey) return [] as string[];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed)
        ? parsed.filter((u) => typeof u === "string" && u.startsWith("data:image/"))
        : [];
    } catch {
      return [] as string[];
    }
  }, []);

  // ✅ read local selections
  useEffect(() => {
    try {
      const rawV = localStorage.getItem("selectedVariant");
      if (rawV) {
        const parsed = JSON.parse(rawV) as SelectedVariant;
        if (parsed?.key) {
          setVariant(parsed);
          const normalizedKey =
            KEY_FALLBACK[String(parsed.key).toUpperCase()] ??
            String(parsed.key).trim().toLowerCase();
          setSelectedPlan(normalizedKey as SizeKey);
        }
      }
    } catch { }

    try {
      const rawP = localStorage.getItem("selectedPrices");
      if (rawP) {
        const parsed = JSON.parse(rawP) as PriceTables;
        if (parsed?.actual) setPriceTables(parsed);
      }
    } catch { }

    try {
      const rawProd = localStorage.getItem("selectedProduct");
      if (rawProd) {
        const parsed = JSON.parse(rawProd) as SelectedProduct;
        setProduct(parsed);
      }
    } catch { }
  }, []);

  // ✅ load bundle_items once
  useEffect(() => {
    (async () => {
      try {
        setBundleKeyLoading(true);
        const setKeys = await fetchBundleItemKeySet();
        setBundleKeySet(setKeys);
      } catch (e) {
        console.error(e);
      } finally {
        setBundleKeyLoading(false);
      }
    })();
  }, []);

  // ✅ category used for sizes + mockup
  const categoryName = useMemo(() => {
    const lsCat = (() => {
      try {
        return localStorage.getItem("selectedCategory") || "";
      } catch {
        return "";
      }
    })();

    return variant?.category || product?.category || lsCat || "default";
  }, [variant?.category, product?.category]);

  useEffect(() => {
    try {
      localStorage.setItem("selectedCategory", String(categoryName));
    } catch { }
  }, [categoryName]);

  const isMugsCategory = useMemo(() => lc(categoryName).includes("mug"), [categoryName]);
  const categoryLabel = useMemo(
    () => singularizeCategory(product?.category || categoryName),
    [product?.category, categoryName]
  );

  const mugPreview = useMemo(() => {
    if (!isMugsCategory) return "";
    if (subscriptionPreviewSlide1) return subscriptionPreviewSlide1;
    if (slidesObj?.slide1) return slidesObj.slide1;
    try {
      const slides = JSON.parse(sessionStorage.getItem("slides") || "{}");
      return slides.slide1 || "";
    } catch {
      return "";
    }
  }, [isMugsCategory, slidesObj, subscriptionPreviewSlide1]);

  // ✅ EXACT sizes (no filter)
  const sizeDefs = useMemo(() => {
    const defs = getSizeDefsForCategory(categoryName);
    if (!lc(categoryName).includes("candle")) return defs;
    return defs.map((opt) =>
      String(opt.key).toLowerCase() === "us_tabloid"
        ? { ...opt, key: "us_letter", title: "US Letter" }
        : opt,
    );
  }, [categoryName]);

  // ✅ Build plans from EXACT sizeDefs (no sale)
  const plans = useMemo(() => {
    return sizeDefs.map((opt) => {
      const price = readActualPrice(priceTables, opt.key, categoryName);
      return {
        id: opt.key,
        title: opt.title,
        sub: opt.sub,
        price,
        disabled: price <= 0,
      };
    });
  }, [sizeDefs, priceTables]);

  // ✅ Ensure selectedPlan exists
  useEffect(() => {
    if (!plans.length) return;

    const exists = plans.some((p) => String(p.id) === String(selectedPlan));
    if (exists) return;

    const firstAvail = plans.find((p) => !p.disabled)?.id;
    const fallback = plans[0]?.id;
    setSelectedPlan((firstAvail ?? fallback ?? "a4") as any);
  }, [plans, selectedPlan]);

  const mock = useMemo(() => getMockupConfig(categoryName), [categoryName]);
  const [mockupOk, setMockupOk] = useState(false);
  const allowMockup = !isMugsCategory;

  useEffect(() => {
    let alive = true;

    if (!allowMockup || !mock?.mockupSrc || (!isMugsCategory && mugPreview)) {
      setMockupOk(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      if (alive) setMockupOk(true);
    };
    img.onerror = () => {
      if (alive) setMockupOk(false);
    };
    img.src = mock.mockupSrc;

    return () => {
      alive = false;
    };
  }, [mock?.mockupSrc, mugPreview, isMugsCategory, allowMockup]);

  const useMockupBackground = allowMockup && Boolean(mock?.mockupSrc) && mockupOk;
  const mockupAspectRatio = useMockupBackground ? "818 / 600" : undefined;

  // ✅ load user plan
  useEffect(() => {
    (async () => {
      try {
        setPlanLoading(true);
        const token = await getAccessToken();
        if (!token) {
          setUserPlan({ plan_code: "free", isPremium: false, premium_expires_at: null });
          return;
        }

        const res = await fetch(`${API_BASE}/me/plan`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          setUserPlan({ plan_code: "free", isPremium: false, premium_expires_at: null });
          return;
        }

        const data = (await res.json()) as UserPlan;
        setUserPlan(data);
      } catch {
        setUserPlan({ plan_code: "free", isPremium: false, premium_expires_at: null });
      } finally {
        setPlanLoading(false);
      }
    })();
  }, []);

  const planCode = plan;

  const selectedItemAccessPlan = useMemo(() => getItemAccessPlan(product), [product]);

  const productKey = useMemo(
    () => (product?.id && product?.type ? `${product.type}:${product.id}` : ""),
    [product]
  );

  const isInBundleItems = useMemo(() => isProductInBundle(product, bundleKeySet), [product, bundleKeySet]);

  const getCheckoutPreparation = useCallback(
    (cardSize?: string | null) => {
      const effectiveCardSize =
        String(cardSize ?? "").trim() || localStorage.getItem("selectedSize") || selectedPlan;
      const isTwoUpLandscape = isCardsCategory(categoryName) && isParallelCardSize(effectiveCardSize);
      const isInviteTwoUp =
        /invite/i.test(String(categoryName ?? "")) && isInviteTwoUpSize(effectiveCardSize);
      const isLeafletTwoUp =
        isBusinessLeafletsCategory(categoryName) && isLeafletTwoUpSize(effectiveCardSize);
      const isTenUpBusinessCards =
        isBusinessCardsCategory(categoryName) && isBusinessCardPrintSize(effectiveCardSize);
      const isCandlesGrid = isCandlesCategory(categoryName);
      const isCoastersGrid = isCoastersCategory(categoryName);
      const isNotebookTwoUp =
        isNotebooksCategory(categoryName) && isNotebookTwoUpSize(effectiveCardSize);
      const isMugWrap = isMugsCategory && isMugWrapSize(effectiveCardSize);
      const isStickerForPdf = /sticker/i.test(String(categoryName ?? ""));
      const isBagCategory = /bag|tote/i.test(String(categoryName ?? ""));
      const isClothingCategory = /clothing|clothes|apparel/i.test(String(categoryName ?? ""));
      const isBagOrClothingForPdf = isBagCategory || isClothingCategory;
      const isNotebookCategory = isNotebooksCategory(categoryName);
      const clothingBgRemoveOpts = {
        threshold: 28,
        alphaThreshold: 6,
        minBrightness: 160,
        satThreshold: 32,
        whiteOnly: false,
        requireWhiteBg: false,
        softness: 18,
        mode: "edge" as const,
      };
      const bagBgRemoveOpts = {
        threshold: 18,
        alphaThreshold: 8,
        minBrightness: 245,
        satThreshold: 10,
        whiteMinChannel: 240,
        whiteOnly: true,
        requireWhiteBg: true,
      };
      const bgRemoveOpts =
        !isCandlesGrid &&
          !isCoastersGrid &&
          !isMugWrap &&
          (isBagOrClothingForPdf || isNotebookCategory)
          ? isClothingCategory
            ? clothingBgRemoveOpts
            : bagBgRemoveOpts
          : !isCandlesGrid && !isCoastersGrid && !isMugWrap && isStickerForPdf
            ? { threshold: 28, alphaThreshold: 8, minBrightness: 228, satThreshold: 18 }
            : null;
      const isTransparentPdf =
        isStickerForPdf ||
        isBagOrClothingForPdf ||
        isCoastersGrid ||
        isMugWrap ||
        isNotebookCategory;

      return {
        cardSize: effectiveCardSize,
        isTwoUpLandscape,
        isInviteTwoUp,
        isLeafletTwoUp,
        isTenUpBusinessCards,
        isCandlesGrid,
        isCoastersGrid,
        isNotebookTwoUp,
        isMugWrap,
        bgRemoveOpts,
        isTransparentPdf,
        captureFormat: (isTransparentPdf ? "png" : "jpeg") as "png" | "jpeg",
        outputFormat: (isTransparentPdf ? "png" : "pdf") as "png" | "pdf",
        pageOrientation:
          isTwoUpLandscape || isLeafletTwoUp || isNotebookTwoUp || isInviteTwoUp || isMugWrap
            ? "landscape"
            : undefined,
      };
    },
    [categoryName, isMugsCategory, selectedPlan],
  );

  const isBundleAndMatched = planCode === "bundle" && isInBundleItems;

  const isProUser = planCode === "pro";
  const isProOnlyCard = selectedItemAccessPlan === "pro";
  const proOnlyLocked = isProOnlyCard && !isProUser;

  const requiresPayment = useMemo(() => {
    if (planLoading || bundleKeyLoading) return true;

    if (planCode === "pro") return false;

    if (planCode === "bundle") return !isInBundleItems;

    return true;
  }, [planCode, planLoading, bundleKeyLoading, isInBundleItems]);

  const getSlidesPayload = async () => {
    if (slidesObj && Object.keys(slidesObj).length) return slidesObj;
    try {
      const globalSlides = (globalThis as any).__slidesCache;
      if (globalSlides && Object.keys(globalSlides).length) return globalSlides;
    } catch { }
    try {
      const fromSession = JSON.parse(sessionStorage.getItem("slides") || "{}");
      if (fromSession && Object.keys(fromSession).length) return fromSession;
    } catch {
      return slidesObj ?? {};
    }
    try {
      const fromIdb = await loadSlidesFromIdb();
      if (fromIdb && Object.keys(fromIdb).length) return fromIdb;
    } catch { }
    if (isPreviewOnly) return {};
    try {
      return JSON.parse(localStorage.getItem("slides_backup") || "{}");
    } catch {
      return slidesObj ?? {};
    }
  };

  const clearPreviewStorage = useCallback(() => {
    try {
      sessionStorage.removeItem("slides");
      sessionStorage.removeItem("slides_preview_only");
      sessionStorage.removeItem("rawSlidesCount");
      sessionStorage.removeItem("capturedSlides");
      sessionStorage.removeItem("capturedSlidesKey");
      sessionStorage.removeItem("templ_preview_slides");
      sessionStorage.removeItem("templ_preview_key");
      sessionStorage.removeItem("templ_preview_category");
      sessionStorage.removeItem("templ_preview_config");
      sessionStorage.removeItem("slides_mirrored");
      sessionStorage.removeItem("slides_mirrored_category");
      sessionStorage.removeItem("card_preview_downloaded");
      sessionStorage.removeItem("card_runtime_snapshot");
    } catch { }

    clearSubscriptionPreviewPayload();

    try {
      localStorage.removeItem("slides_backup");
    } catch { }

    try {
      void clearSlidesFromIdb();
      void clearSlidesFromIdbByPrefix(PREPARED_SLIDES_PREFIX);
    } catch { }

    try {
      delete (globalThis as any).__slidesCache;
      delete (globalThis as any).__preparedSlidesCache;
      delete (globalThis as any).__rawSlidesCache;
      delete (globalThis as any).__previewConfigCache;
    } catch { }
  }, []);

  const syncLocalSelection = (p: { id: any; title: string; price: number }) => {
    try {
      const newVariant: SelectedVariant = {
        key: p.id,
        title: p.title,
        price: p.price,
        isOnSale: false,
        category: categoryName,
      } as any;

      localStorage.setItem("selectedVariant", JSON.stringify(newVariant));
      localStorage.setItem("selectedSize", String(p.id));
      localStorage.setItem("selectedCategory", String(categoryName));
    } catch { }
  };

  const startOneTimeStripeCheckout = async (p: { title: string; price: number }) => {
    setLoading(true);
    setCheckoutProgressStep(18, "Preparing secure checkout...");
    try {
      if (!STRIPE_PK) throw new Error("Stripe key missing in env");
      const prep = getCheckoutPreparation(selectedPlan);
      const [stripe, preparedSlides] = await Promise.all([
        stripePromise,
        ensureSlidesPayload(prep.captureFormat),
      ]);
      if (!stripe) throw new Error("Stripe not available");
      const validPreparedSlides = getValidSlides(preparedSlides);
      if (!Object.keys(validPreparedSlides).length) {
        throw new Error("Could not prepare your design for checkout");
      }

      setCheckoutProgressStep(42, "Creating Stripe checkout session...");

      const successUrl = `${window.location.origin}${location.pathname}?paid=1&session_id={CHECKOUT_SESSION_ID}&category=${encodeURIComponent(
        categoryName
      )}`;
      const cancelUrl = `${window.location.origin}${location.pathname}`;

      const res = await fetch(`${API_BASE}/checkout/one-time/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: p.title,
          price: p.price,
          user: {
            email: user?.email,
            name: user?.user_metadata?.full_name || "User",
            id: user?.id,
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            variantKey: selectedPlan,
            category: categoryName,
            accessplan: selectedItemAccessPlan,
            productKey,
          },
        }),
      });

      const json = await res.json().catch(async () => {
        const text = await res.text().catch(() => "");
        return { error: text };
      });
      if (!res.ok) {
        throw new Error(
          json?.error ||
          `Checkout API failed (${res.status}). Check VITE_API_BASE and backend /checkout/one-time/create.`
        );
      }
      const { id } = json;

      setCheckoutProgressStep(88, "Redirecting to Stripe...");
      toast.success("Redirecting to payment...");
      await stripe.redirectToCheckout({ sessionId: id });
    } catch (e: any) {
      toast.error(e?.message || "Payment failed!");
    } finally {
      setLoading(false);
      clearCheckoutProgress();
    }
  };

  const ensureSlidesPayload = useCallback(
    async (format: "jpeg" | "png") => {
      if (isPreviewOnly && isLegacyCardProduct && rawSlides.length > 0) {
        await ensureCaptureSupportReady();
        const freshList = preferCanvasCaptureForSafari
          ? await captureSlidesFromCanvasRenderer(format, format === "png" ? 2400 : 1600)
          : await captureLegacyCardSlidesFromDom(1600);
        if (freshList.length) {
          const freshPayload = Object.fromEntries(freshList.map((u, idx) => [`slide${idx + 1}`, u]));
          storeSlidesPayload(freshPayload);
          return freshPayload;
        }
      }

      const hasRuntimeSnapshot = Boolean((state as any)?.runtimeCardSnapshot);
      const current = await getSlidesPayload();
      const currentKeys = Object.keys(current || {}).filter((k) => current[k]);
      const bypassStoredIosPreviewSlides = preferCanvasCaptureForSafari;
      const expectedCount = (() => {
        if (rawSlides.length) return rawSlides.length;
        if (isLegacyCardProduct) return currentKeys.length > 0 ? currentKeys.length : 4;
        try {
          const n = Number(sessionStorage.getItem("rawSlidesCount") || "0");
          return Number.isFinite(n) && n > 0 ? n : 0;
        } catch {
          return 0;
        }
      })();
      const needPng = format === "png";
      const hasEnough = expectedCount ? currentKeys.length >= expectedCount : currentKeys.length > 0;
      const hasPng = !needPng
        ? true
        : currentKeys.every((k) => String(current[k] || "").startsWith("data:image/png"));

      if (hasEnough && hasPng && !bypassStoredIosPreviewSlides) {
        return current;
      }

      const capturedList = readCapturedSlidesFromStorage();
      const capturedEnough = expectedCount ? capturedList.length >= expectedCount : capturedList.length > 0;
      const capturedHasPng =
        !needPng || capturedList.every((u) => String(u || "").startsWith("data:image/png"));
      if (!hasRuntimeSnapshot && !bypassStoredIosPreviewSlides && capturedEnough && capturedHasPng) {
        const next = Object.fromEntries(capturedList.map((u, idx) => [`slide${idx + 1}`, u]));
        storeSlidesPayload(next);
        return next;
      }

      if (!rawSlides.length && !isLegacyCardProduct) return current;

      await ensureCaptureSupportReady();
      const list = rawSlides.length
        ? preferCanvasCaptureForSafari
          ? await captureSlidesFromCanvasRenderer(format, needPng ? 2400 : 1600)
          : await captureSlidesFromDom(format, needPng ? 2400 : 1600)
        : await captureLegacyCardSlidesFromDom(1600);
      if (!list.length) return current;

      const next = Object.fromEntries(list.map((u, idx) => [`slide${idx + 1}`, u]));
      storeSlidesPayload(next);
      return next;
    },
    [
      captureSlidesFromCanvasRenderer,
      captureLegacyCardSlidesFromDom,
      captureSlidesFromDom,
      ensureCaptureSupportReady,
      getSlidesPayload,
      isLegacyCardProduct,
      isPreviewOnly,
      preferCanvasCaptureForSafari,
      readCapturedSlidesFromStorage,
      rawSlides.length,
      state,
      storeSlidesPayload,
    ]
  );

  const getPreparedSlidesCacheKey = useCallback(
    (cardSize?: string | null) => buildPreparedSlidesKey(productKey || "state", categoryName, cardSize || selectedPlan),
    [categoryName, productKey, selectedPlan],
  );

  const loadPreparedSlidesPayload = useCallback(
    async (cardSize?: string | null) => {
      const key = getPreparedSlidesCacheKey(cardSize);
      try {
        const cache = (globalThis as any).__preparedSlidesCache;
        const cached = cache?.[key];
        const valid = getValidSlides(cached);
        if (Object.keys(valid).length) return valid;
      } catch { }

      try {
        const fromIdb = await loadSlidesFromIdbByKey(key);
        const valid = getValidSlides(fromIdb);
        if (!Object.keys(valid).length) return null;
        const cache = (globalThis as any).__preparedSlidesCache ?? {};
        cache[key] = valid;
        (globalThis as any).__preparedSlidesCache = cache;
        return valid;
      } catch {
        return null;
      }
    },
    [getPreparedSlidesCacheKey],
  );

  const storePreparedSlidesPayload = useCallback(
    (cardSize: string | null | undefined, slides: Record<string, string>) => {
      const valid = getValidSlides(slides);
      if (!Object.keys(valid).length) return;
      const key = getPreparedSlidesCacheKey(cardSize);
      try {
        const cache = (globalThis as any).__preparedSlidesCache ?? {};
        cache[key] = valid;
        (globalThis as any).__preparedSlidesCache = cache;
      } catch { }

      try {
        void saveSlidesToIdbByKey(key, valid);
      } catch { }
    },
    [getPreparedSlidesCacheKey],
  );

  const prepareDeliverySlides = useCallback(
    async (
      cardSize?: string | null,
      onProgress?: (value: number, label: string) => void,
    ) => {
      const prep = getCheckoutPreparation(cardSize);
      const bypassPreparedCache = isPreviewOnly && isLegacyCardProduct;
      const cached = bypassPreparedCache ? null : await loadPreparedSlidesPayload(prep.cardSize);
      if (!bypassPreparedCache && cached && Object.keys(cached).length) {
        return {
          slides: cached,
          outputFormat: prep.outputFormat,
          pageOrientation: prep.pageOrientation,
        };
      }

      const rawSlidesData = await ensureSlidesPayload(prep.captureFormat);
      onProgress?.(40, "Applying print layout...");

      const slidesAlreadyMirrored = (() => {
        try {
          return sessionStorage.getItem("slides_mirrored") === "1";
        } catch {
          return false;
        }
      })();
      const mirrorPrint = isMirrorPrintCategory(categoryName) && !slidesAlreadyMirrored;
      const baseSlides = mirrorPrint ? await mirrorSlides(rawSlidesData) : rawSlidesData;
      if (slidesAlreadyMirrored) {
        try {
          sessionStorage.removeItem("slides_mirrored");
          sessionStorage.removeItem("slides_mirrored_category");
        } catch { }
      }

      const processedCandleSlides = prep.isCandlesGrid
        ? await (async () => {
          const entries = await Promise.all(
            Object.entries(baseSlides as Record<string, string>).map(async ([k, v]) => {
              const src = typeof v === "string" ? v : "";
              if (!src) return [k, v] as const;
              const cleaned = await removeWhiteBg(src, {
                threshold: 24,
                alphaThreshold: 8,
                minBrightness: 235,
                satThreshold: 16,
                mode: "all",
              });
              return [k, cleaned] as const;
            }),
          );
          return Object.fromEntries(entries);
        })()
        : baseSlides;

      const processedCoasterSlides = prep.isCoastersGrid
        ? await (async () => {
          const entries = await Promise.all(
            Object.entries(baseSlides as Record<string, string>).map(async ([k, v]) => {
              const src = typeof v === "string" ? v : "";
              if (!src) return [k, v] as const;
              const cleaned = await removeWhiteBg(src, {
                threshold: 24,
                alphaThreshold: 8,
                minBrightness: 235,
                satThreshold: 16,
                mode: "edge",
                whiteOnly: true,
                requireWhiteBg: true,
              });
              return [k, cleaned] as const;
            }),
          );
          return Object.fromEntries(entries);
        })()
        : baseSlides;

      const coasterSlides = prep.isCoastersGrid
        ? (() => {
          const keys = Object.keys(processedCoasterSlides)
            .filter((k) => processedCoasterSlides[k])
            .sort();
          const limited = keys.slice(0, 2);
          return Object.fromEntries(limited.map((k) => [k, processedCoasterSlides[k]]));
        })()
        : processedCoasterSlides;

      const processedMugSlides = prep.isMugWrap
        ? await (async () => {
          const entries = await Promise.all(
            Object.entries(baseSlides as Record<string, string>).map(async ([k, v]) => {
              const src = typeof v === "string" ? v : "";
              if (!src) return [k, v] as const;
              const cleaned = await removeWhiteBg(src, {
                threshold: 18,
                alphaThreshold: 8,
                minBrightness: 245,
                satThreshold: 10,
                whiteMinChannel: 240,
                whiteOnly: true,
                requireWhiteBg: true,
                mode: "edge",
              });
              return [k, cleaned] as const;
            }),
          );
          return Object.fromEntries(entries);
        })()
        : baseSlides;

      const bgRemoveOpts = prep.bgRemoveOpts;
      const processedBgSlides = bgRemoveOpts
        ? await (async () => {
          const entries = await Promise.all(
            Object.entries(baseSlides as Record<string, string>).map(async ([k, v]) => {
              const src = typeof v === "string" ? v : "";
              if (!src) return [k, v] as const;
              const cleaned = await removeWhiteBg(src, bgRemoveOpts);
              return [k, cleaned] as const;
            }),
          );
          return Object.fromEntries(entries);
        })()
        : baseSlides;

      const notebookSlides = (() => {
        if (!prep.isNotebookTwoUp) return baseSlides;
        const sourceSlides = processedBgSlides;
        const keys = Object.keys(sourceSlides).filter((k) => sourceSlides[k]);
        if (keys.length >= 2) return sourceSlides;
        if (keys.length === 1) {
          const k = keys[0];
          return { [k]: sourceSlides[k], [`${k}-copy`]: sourceSlides[k] };
        }
        return sourceSlides;
      })();

      const leafletSlides = (() => {
        if (!prep.isLeafletTwoUp) return baseSlides;
        const keys = Object.keys(baseSlides).filter((k) => baseSlides[k]).sort();
        if (keys.length === 0) return baseSlides;
        if (keys.length === 1) {
          const k = keys[0];
          return { slide1: baseSlides[k], slide2: baseSlides[k] };
        }
        const frontKey = keys[0];
        const backKey = keys[1];
        return {
          slide1: baseSlides[frontKey],
          slide2: baseSlides[frontKey],
          slide3: baseSlides[backKey],
          slide4: baseSlides[backKey],
        };
      })();

      const slides = prep.isTenUpBusinessCards
        ? await buildTenUpSlides(baseSlides, {
          columns: 2,
          rows: 5,
          gapPx: 10,
          marginPx: 0,
          orientation: "portrait",
          fit: "cover",
          pageMm: getPageMmForSize(prep.cardSize),
        })
        : prep.isCandlesGrid
          ? await buildFixedGridSlides(processedCandleSlides, {
            columns: 2,
            rows: 3,
            labelMm: { w: 70, h: 70 },
            gapMm: 0,
            distribute: true,
            fit: "contain",
            pageMm: getPageMmForSize(prep.cardSize),
            fillMode: "sequence",
          })
          : prep.isCoastersGrid
            ? await buildFixedGridSlides(coasterSlides, {
              columns: 2,
              rows: 1,
              labelMm: { w: 89, h: 89 },
              gapMm: 0,
              distribute: false,
              fit: "contain",
              pageMm: { w: 229, h: 89 },
              background: "transparent",
              outputFormat: "png",
              fillMode: "sequence",
            })
            : prep.isMugWrap
              ? await buildFixedGridSlides(processedMugSlides, {
                columns: 1,
                rows: 1,
                labelMm: getMugWrapPageMm(prep.cardSize),
                gapMm: 0,
                distribute: false,
                fit: "cover",
                pageMm: getMugWrapPageMm(prep.cardSize),
                background: "transparent",
                outputFormat: "png",
              })
              : prep.isInviteTwoUp
                ? await buildFixedGridSlides(baseSlides, {
                  columns: 2,
                  rows: 1,
                  labelMm: getPageMmForSize(prep.cardSize),
                  gapMm: 0,
                  distribute: false,
                  fit: "contain",
                  pageMm: getInviteTwoUpPageMm(prep.cardSize),
                })
                : prep.isNotebookTwoUp
                  ? await buildTwoUpSlides(notebookSlides, {
                    gapPx: 0,
                    orientation: "landscape",
                    fit: "contain",
                    pairStrategy: "sequential",
                    swapPairs: false,
                    pageMm: getNotebookTwoUpPageMm(prep.cardSize),
                    background: "transparent",
                    outputFormat: "png",
                  })
                  : prep.isLeafletTwoUp
                    ? await buildTwoUpSlides(leafletSlides, {
                      gapPx: 0,
                      orientation: "landscape",
                      fit: "cover",
                      pairStrategy: "sequential",
                      swapPairs: false,
                      pageMm: getLeafletTwoUpPageMm(prep.cardSize),
                    })
                    : prep.isTwoUpLandscape
                      ? await buildTwoUpSlides(baseSlides, {
                        gapPx: 0,
                        orientation: "landscape",
                        fit: "cover",
                        pairStrategy: "outer-inner",
                        swapPairs: true,
                        pageMm: getPageMmForSize(prep.cardSize),
                        pageTitle: ({ pageIndex }) => {
                          if (pageIndex === 1) return "";
                          if (pageIndex === 2) return "";
                          return null;
                        },
                      })
                      : processedBgSlides;

      const validSlides = getValidSlides(slides as Record<string, string>);
      if (!Object.keys(validSlides).length) {
        throw new Error("No valid slides found");
      }

      if (!bypassPreparedCache) {
        storePreparedSlidesPayload(prep.cardSize, validSlides);
      }
      return {
        slides: validSlides,
        outputFormat: prep.outputFormat,
        pageOrientation: prep.pageOrientation,
      };
    },
    [
      categoryName,
      ensureSlidesPayload,
      getCheckoutPreparation,
      isLegacyCardProduct,
      isPreviewOnly,
      loadPreparedSlidesPayload,
      storePreparedSlidesPayload,
    ],
  );

  const prefetchCaptureFormat = useMemo<"png" | "jpeg">(() => {
    const isTransparentCapture =
      /sticker|bag|tote|clothing|clothes|apparel|notebook/i.test(String(categoryName ?? "")) ||
      isCoastersCategory(categoryName) ||
      isMugsCategory;
    return isTransparentCapture ? "png" : "jpeg";
  }, [categoryName, isMugsCategory]);

  useEffect(() => {
    if (isPreviewOnly) return;
    const skipLegacyIosPrefetch = isIosWebKit && isLegacyCardProduct && Boolean(firstSlideUrl);
    if (skipLegacyIosPrefetch) return;
    let cancelled = false;
    let frameId: number | null = null;

    const run = async () => {
      try {
        const current = await getSlidesPayload();
        const currentKeys = Object.keys(current || {}).filter((k) => current[k]);
        const expectedCount = rawSlides.length
          ? rawSlides.length
          : isLegacyCardProduct
            ? currentKeys.length > 0
              ? currentKeys.length
              : 4
            : 0;
        const bypassStoredIosPreviewSlides = preferCanvasCaptureForSafari;
        const hasEnough = expectedCount ? currentKeys.length >= expectedCount : currentKeys.length > 0;
        const hasPng =
          prefetchCaptureFormat !== "png" ||
          currentKeys.every((k) => String(current[k] || "").startsWith("data:image/png"));
        if (!bypassStoredIosPreviewSlides && hasEnough && hasPng && !isPreviewOnly) return;

        const capturedList = readCapturedSlidesFromStorage();
        const capturedEnough = expectedCount
          ? capturedList.length >= expectedCount
          : capturedList.length > 0;
        const capturedHasPng =
          prefetchCaptureFormat !== "png" ||
          capturedList.every((u) => String(u || "").startsWith("data:image/png"));
        if (!bypassStoredIosPreviewSlides && capturedEnough && capturedHasPng) {
          if (!cancelled) {
            const next = Object.fromEntries(capturedList.map((u, idx) => [`slide${idx + 1}`, u]));
            storeSlidesPayload(next);
          }
          return;
        }

        if (!rawSlides.length && !isLegacyCardProduct) return;

        await ensureCaptureSupportReady();
        const list = rawSlides.length
          ? preferCanvasCaptureForSafari
            ? await captureSlidesFromCanvasRenderer(
              prefetchCaptureFormat,
              prefetchCaptureFormat === "png" ? 2400 : 1600
            )
            : await captureSlidesFromDom(prefetchCaptureFormat, prefetchCaptureFormat === "png" ? 2400 : 1600)
          : await captureLegacyCardSlidesFromDom(1600);
        if (cancelled || !list.length) return;
        const next = Object.fromEntries(list.map((u, idx) => [`slide${idx + 1}`, u]));
        storeSlidesPayload(next);
      } catch { }
    };

    frameId = window.requestAnimationFrame(() => {
      if (!cancelled) {
        void run();
      }
    });

    return () => {
      cancelled = true;
      if (frameId != null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [
    captureLegacyCardSlidesFromDom,
    captureSlidesFromCanvasRenderer,
    captureSlidesFromDom,
    ensureCaptureSupportReady,
    getSlidesPayload,
    isLegacyCardProduct,
    isPreviewOnly,
    firstSlideUrl,
    prefetchCaptureFormat,
    preferCanvasCaptureForSafari,
    rawSlides,
    readCapturedSlidesFromStorage,
    storeSlidesPayload,
  ]);

  useEffect(() => {
    if (isPreviewOnly) return;
    let cancelled = false;
    let frameId: number | null = null;

    const run = async () => {
      try {
        if (!rawSlides.length && !isLegacyCardProduct) return;
        const current = await getSlidesPayload();
        const validCurrent = getValidSlides(current);
        if (!Object.keys(validCurrent).length) return;
        if (isLegacyCardProduct) return;
        const prep = getCheckoutPreparation(selectedPlan);
        const cached = await loadPreparedSlidesPayload(prep.cardSize);
        if (cached && Object.keys(cached).length) return;
        await prepareDeliverySlides(prep.cardSize);
      } catch {
        // Best-effort warm cache only.
      }
    };

    frameId = window.requestAnimationFrame(() => {
      if (!cancelled) {
        if (!cancelled) void run();
      }
    });

    return () => {
      cancelled = true;
      if (frameId != null) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [
    getCheckoutPreparation,
    getSlidesPayload,
    isLegacyCardProduct,
    isPreviewOnly,
    loadPreparedSlidesPayload,
    prepareDeliverySlides,
    rawSlides.length,
    selectedPlan,
  ]);

  const sendPdfDirectForSubscription = useCallback(
    async (opts?: { paid?: boolean; sessionId?: string }) => {
      setLoading(true);
      setCheckoutProgressStep(12, "Preparing your design...");
      try {
        const prep = getCheckoutPreparation(localStorage.getItem("selectedSize") || selectedPlan);
        const exportRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setCheckoutProgressStep(24, "Capturing printable preview...");

        if (isPreviewOnly && isLegacyCardProduct) {
          const existingSlides = await getSlidesPayload();
          const existingKeys = sortSlidePayloadKeys(existingSlides);
          let exportSlides = existingSlides;

          if (!existingKeys.length) {
            const freshRawSlides = await buildLegacyCardRawSlidesFromState();
            const freshList = await captureProvidedRawSlidesFromCanvas(
              freshRawSlides,
              prep.captureFormat,
              prep.captureFormat === "png" ? 2400 : 1600,
              { width: LEGACY_SLIDE_CAPTURE.w, height: LEGACY_SLIDE_CAPTURE.h },
            );
            exportSlides = Object.fromEntries(freshList.map((u, idx) => [`slide${idx + 1}`, u]));
          }

          const orderedKeys = sortSlidePayloadKeys(exportSlides);
          if (!orderedKeys.length) throw new Error("No fresh slides available for download");
          setCheckoutProgressStep(72, "Generating your file...");

          if (prep.outputFormat === "png") {
            orderedKeys.forEach((key, index) => {
              triggerBrowserDownload(
                exportSlides[key],
                buildUniqueExportFileName(categoryName, "png", `${exportRequestId}-${index + 1}`),
              );
            });
          } else {
            let pdf: jsPDF | null = null;
            for (const key of orderedKeys) {
              const src = exportSlides[key];
              const { width, height } = await loadImageDimensions(src);
              if (!pdf) {
                pdf = new jsPDF({
                  orientation: width >= height ? "landscape" : "portrait",
                  unit: "px",
                  format: [width, height],
                });
              } else {
                pdf.addPage([width, height], width >= height ? "landscape" : "portrait");
              }
              pdf.addImage(src, "JPEG", 0, 0, width, height);
            }
            pdf?.save(buildUniqueExportFileName(categoryName, "pdf", exportRequestId));
          }

          sessionStorage.setItem("pdf_generated_success", "1");
          clearPreviewStorage();
          setCheckoutProgressStep(100, "Done");
          toast.success("Fresh file downloaded successfully!", {
            id: opts?.sessionId ? `file-generated-${opts.sessionId}` : "file-generated-direct",
          });
          return;
        }

        const prepared = await prepareDeliverySlides(prep.cardSize, (value, label) =>
          setCheckoutProgressStep(value, label)
        );
        setCheckoutProgressStep(72, "Generating your file...");

        const token = await getAccessToken();
        if (!token) throw new Error("Login session not found");

        const basePayload = {
          slides: prepared.slides,
          cardSize: prep.cardSize,
          category: categoryName,
          emailSubject: buildEmailSubject(categoryName),
          email_subject: buildEmailSubject(categoryName),
          fileName: buildUniqueExportFileName(categoryName, prepared.outputFormat, exportRequestId),
          exportRequestId,
          export_request_id: exportRequestId,
          ...(prepared.outputFormat === "png" ? { outputFormat: prepared.outputFormat } : {}),
          ...(prep.pageOrientation ? { pageOrientation: prep.pageOrientation } : {}),
        };

        const res = await fetch(`${API_BASE}/pdf/send-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...basePayload,
            accessplan: selectedItemAccessPlan,
            inBundleItems: isInBundleItems,
            productKey,
            userPlan: planCode,
            paid: Boolean(opts?.paid),
            payment_session_id: opts?.sessionId ?? null,
            sessionId: opts?.sessionId ?? null,
            session_id: opts?.sessionId ?? null,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `Request failed (HTTP ${res.status})`);
        }

        setCheckoutProgressStep(94, "Sending your file to email...");
        await res.json();

        // Mark success for backup cleanup
        sessionStorage.setItem("pdf_generated_success", "1");

        clearPreviewStorage();
        setCheckoutProgressStep(100, "Done");
        toast.success("File generated & emailed to you!", {
          id: opts?.sessionId ? `file-generated-${opts.sessionId}` : "file-generated-direct",
        });
      } catch (e: any) {
        toast.error(e?.message || "Could not generate file");
      } finally {
        setLoading(false);
        clearCheckoutProgress();
      }
    },
    [
      categoryName,
      clearCheckoutProgress,
      setCheckoutProgressStep,
      selectedItemAccessPlan,
      isInBundleItems,
      productKey,
      selectedPlan,
      planCode,
      buildLegacyCardRawSlidesFromState,
      captureProvidedRawSlidesFromCanvas,
      getCheckoutPreparation,
      prepareDeliverySlides,
      clearPreviewStorage,
    ]
  );

  // Clear backup after successful PDF generation
  useEffect(() => {
    const checkAndClearBackup = () => {
      const hasGenerated = sessionStorage.getItem("pdf_generated_success");
      if (hasGenerated === "1") {
        try {
          localStorage.removeItem("card_runtime_snapshot_backup");
          localStorage.removeItem("snapshot_timestamp_backup");
          sessionStorage.removeItem("card_runtime_snapshot");
          sessionStorage.removeItem("snapshot_timestamp");
          sessionStorage.removeItem("pdf_generated_success");
          console.log("Backup cleared after successful PDF generation");
        } catch (e) {
          console.error("Error clearing backup:", e);
        }
      }
    };

    checkAndClearBackup();
  }, []);

  // ✅ Stripe return handler
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const paid = sp.get("paid") === "1";
    const sessionId = sp.get("session_id") || "";
    if (!paid || !sessionId) return;
    if (processingPaidSessionRef.current === sessionId) return;

    (async () => {
      try {
        processingPaidSessionRef.current = sessionId;
        const sentKey = `payment_email_sent_${sessionId}`;
        const sentState = sessionStorage.getItem(sentKey);
        if (sentState === "1") {
          clearCheckoutProgress();
          clearPaidQueryParams();
          return;
        }
        if (sentState === "sending") {
          setCheckoutProgressStep(42, "Finalizing your file delivery...");
          return;
        }

        setCheckoutProgressStep(18, "Verifying your payment...");
        sessionStorage.setItem(sentKey, "sending");

        const token = await getAccessToken();
        if (token) {
          const verifyRes = await fetch(`${API_BASE}/checkout/one-time/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ session_id: sessionId }),
          });

          if (!verifyRes.ok) {
            const err = await verifyRes.json().catch(() => ({}));
            throw new Error(err?.error || "Payment verification failed");
          }
        }

        setCheckoutProgressStep(42, "Payment confirmed. Generating your file...");
        await sendPdfDirectForSubscription({ paid: true, sessionId });
        sessionStorage.setItem(sentKey, "1");
        clearPaidQueryParams();
      } catch (e: any) {
        const sentKey = `payment_email_sent_${sessionId}`;
        sessionStorage.removeItem(sentKey);
        toast.error(e?.message || "Payment done but file couldn't be generated");
        clearCheckoutProgress();
        processingPaidSessionRef.current = null;
      }
    })();
  }, [
    clearCheckoutProgress,
    clearPaidQueryParams,
    location.search,
    sendPdfDirectForSubscription,
    setCheckoutProgressStep,
  ]);

  const handlePayClick = async () => {
    if (!termsAccepted) {
      toast.error("Please accept Terms & Conditions first.");
      return;
    }

    if (proOnlyLocked) {
      toast.error("This card is only for Pro users. Please upgrade to Pro.");
      navigate(USER_ROUTES.PREMIUM_PLANS);
      return;
    }

    if (planLoading || bundleKeyLoading) {
      toast.error("Please wait, loading your plan...");
      return;
    }

    if (!requiresPayment) {
      await sendPdfDirectForSubscription();
      return;
    }

    const picked = plans.find((p) => String(p.id) === String(selectedPlan));
    if (!picked || picked.disabled) {
      toast.error("No pricing configured for this product.");
      return;
    }

    syncLocalSelection({ id: picked.id, title: picked.title, price: picked.price });
    await startOneTimeStripeCheckout({ title: picked.title, price: picked.price });
  };

  const showTrophyIcon = selectedItemAccessPlan === "pro";
  const showGiftIcon =
    !showTrophyIcon && selectedItemAccessPlan === "bundle" && planCode === "bundle" && isInBundleItems;

  const isStickerCategory = useMemo(
    () => lc(categoryName).includes("sticker"),
    [categoryName]
  );
  const isCandleCategory = useMemo(
    () => lc(categoryName).includes("candle"),
    [categoryName]
  );
  const isBagCategory = useMemo(
    () => /bag|tote/i.test(String(categoryName ?? "")),
    [categoryName]
  );
  const isClothingCategory = useMemo(
    () => /clothing|clothes|apparel/i.test(String(categoryName ?? "")),
    [categoryName]
  );

  const [firstSlideProcessed, setFirstSlideProcessed] = useState(firstSlideUrl);
  const [hydratedPreviewSrc, setHydratedPreviewSrc] = useState("");

  useEffect(() => {
    let alive = true;
    let idleId: number | null = null;
    const idle = globalThis as any;

    if (!firstSlideUrl) {
      setFirstSlideProcessed("");
      return;
    }

    setFirstSlideProcessed(firstSlideUrl);

    if (!isStickerCategory && !isCandleCategory && !isBagCategory && !isClothingCategory) {
      return;
    }

    const clothingBgRemoveOpts = {
      threshold: 28,
      alphaThreshold: 6,
      minBrightness: 160,
      satThreshold: 32,
      whiteOnly: false,
      requireWhiteBg: false,
      softness: 18,
      mode: "edge" as const,
    };
    const bagBgRemoveOpts = {
      threshold: 26,
      alphaThreshold: 8,
      minBrightness: 220,
      satThreshold: 24,
      whiteMinChannel: 215,
      whiteOnly: true,
      requireWhiteBg: false,
      softness: 12,
      mode: "all" as const,
    };
    const opts = isCandleCategory
      ? { threshold: 24, alphaThreshold: 8, minBrightness: 235, satThreshold: 16, mode: "all" as const }
      : isBagCategory || isClothingCategory
        ? isClothingCategory
          ? clothingBgRemoveOpts
          : bagBgRemoveOpts
        : { threshold: 28, alphaThreshold: 8, minBrightness: 228, satThreshold: 18 };

    const run = () => {
      removeWhiteBg(firstSlideUrl, opts).then((res) => {
        if (alive) setFirstSlideProcessed(res);
      });
    };

    if (typeof idle.requestIdleCallback === "function") {
      idleId = idle.requestIdleCallback(run, { timeout: 500 });
    } else {
      idleId = window.setTimeout(run, 120);
    }

    return () => {
      alive = false;
      if (typeof idle.cancelIdleCallback === "function" && idleId != null) {
        idle.cancelIdleCallback(idleId);
      } else if (idleId != null) {
        clearTimeout(idleId);
      }
    };
  }, [firstSlideUrl, isStickerCategory, isCandleCategory, isBagCategory, isClothingCategory]);

  useEffect(() => {
    const candidate = mugPreview || firstSlideProcessed || iosLegacyCardPreviewSrc || "";
    if (!candidate) return;
    if (candidate === hydratedPreviewSrc) return;

    let cancelled = false;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      if (!cancelled) setHydratedPreviewSrc(candidate);
    };
    img.onerror = () => {
      if (!cancelled) setHydratedPreviewSrc(candidate);
    };
    img.src = candidate;

    return () => {
      cancelled = true;
    };
  }, [firstSlideProcessed, hydratedPreviewSrc, iosLegacyCardPreviewSrc, mugPreview]);

  const previewSrc = hydratedPreviewSrc || mugPreview || firstSlideProcessed || iosLegacyCardPreviewSrc || "";
  const preferLiveTemplatePreview =
    activeTemplatePreviewSession && isIosWebKit && rawSlides.length > 0 && !isLegacyCardProduct && !previewSrc;
  const showOverlayPreview = Boolean(previewSrc) && useMockupBackground && !preferLiveTemplatePreview;
  const showFlatPreview = Boolean(previewSrc) && !useMockupBackground && !preferLiveTemplatePreview;
  const showLiveTemplatePreview =
    activeTemplatePreviewSession && rawSlides.length > 0 && (preferLiveTemplatePreview || !previewSrc);
  const showLiveCardPreview = isLegacyCardProduct && !previewSrc;
  const stripLiveMockupBackground =
    isStickerCategory || isCandleCategory || isBagCategory || isClothingCategory;
  const iosStablePreviewLayerSx = isIosWebKit
    ? {
      backfaceVisibility: "hidden" as const,
      WebkitBackfaceVisibility: "hidden" as const,
      transformStyle: "preserve-3d" as const,
      WebkitTransformStyle: "preserve-3d" as const,
      willChange: "transform",
      contain: "paint" as const,
      isolation: "isolate" as const,
    }
    : {};
  const liveMockupOverlay = useMemo(() => {
    if (!useMockupBackground || !mock || !previewSurfaceSize.w || !previewSurfaceSize.h) return null;
    const overlayWidth = previewSurfaceSize.w * (toPercent(mock.overlay.width) / 100);
    const overlayHeight = previewSurfaceSize.h * (toPercent(mock.overlay.height) / 100);
    const scale = Math.min(overlayWidth / captureWidth, overlayHeight / captureHeight);
    const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
    return {
      scale: safeScale,
      width: Math.max(1, Math.round(captureWidth * safeScale)),
      height: Math.max(1, Math.round(captureHeight * safeScale)),
    };
  }, [captureHeight, captureWidth, mock, previewSurfaceSize.h, previewSurfaceSize.w, useMockupBackground]);

  const liveCardMockupOverlay = useMemo(() => {
    if (!useMockupBackground || !mock || !previewSurfaceSize.w || !previewSurfaceSize.h) return null;
    const overlayWidth = previewSurfaceSize.w * (toPercent(mock.overlay.width) / 100);
    const overlayHeight = previewSurfaceSize.h * (toPercent(mock.overlay.height) / 100);
    const scaleX = overlayWidth / LEGACY_CARD_CAPTURE.w;
    const scaleY = overlayHeight / LEGACY_CARD_CAPTURE.h;
    return {
      scaleX: Number.isFinite(scaleX) && scaleX > 0 ? scaleX : 1,
      scaleY: Number.isFinite(scaleY) && scaleY > 0 ? scaleY : 1,
      width: Math.max(1, Math.round(overlayWidth)),
      height: Math.max(1, Math.round(overlayHeight)),
    };
  }, [mock, previewSurfaceSize.h, previewSurfaceSize.w, useMockupBackground]);

  return (
    <MainLayout>
      <Box
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "start",
          flexDirection: "column",
          justifyContent: "center",
          mt: { md: 4, sm: 3, xs: 2 },
          mb: { md: 4, sm: 3, xs: 2 },
          pb: { md: 8, sm: 6, xs: 6 },
        }}
      >
        <Container maxWidth="xl">
          <Typography
            sx={{
              textAlign: "start",
              fontSize: { md: "40px", sm: "30px", xs: "20px" },
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              flexWrap: "wrap",
            }}
          >
            Please select your {categoryLabel} print size!
            {showTrophyIcon ? (
              <Chip icon={<EmojiEvents />} label="Pro" color="warning" size="small" sx={{ fontWeight: 900 }} />
            ) : null}
            {showGiftIcon ? (
              <Chip icon={<CardGiftcard />} label="Bundle" color="success" size="small" sx={{ fontWeight: 900 }} />
            ) : null}
          </Typography>

          {/* Alerts */}
          <Box sx={{ mt: 1, mb: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {isBundleAndMatched && (
              <Box sx={{ p: 1.5, bgcolor: COLORS.green, borderRadius: 2 }}>
                🎁 <b>Bundle matched!</b> This item is included in your bundle. You can generate your PDF without payment.
              </Box>
            )}
            {!isBundleAndMatched && planCode === "bundle" && (
              <Box sx={{ p: 1.5, bgcolor: COLORS.green, borderRadius: 2 }}>
                This product is not included in your bundle → payment required.
              </Box>
            )}
            {planCode === "pro" && (
              <Box sx={{ p: 1.5, bgcolor: COLORS.green, borderRadius: 2 }}>
                🏆 <b>Pro user</b>: PDF generation included ✅
              </Box>
            )}
            {planCode === "free" && (
              <Box sx={{ p: 1.5, bgcolor: COLORS.green, borderRadius: 2 }}>
                🆓 <b>Free user</b>: payment required to generate PDF.
              </Box>
            )}
            {mugPreview && (
              <Box sx={{ p: 1.5, bgcolor: COLORS.black, borderRadius: 2, color: COLORS.white }}>
                📒 <b>MUGS</b>: Preview is mirrored in the downloaded file
              </Box>
            )}
          </Box>

          <Grid container spacing={3} sx={{ alignItems: "flex-start" }}>
            {/* Left Preview */}
            <Grid
              ref={previewSurfaceRef}
              size={{ md: 7, sm: 7, xs: 12 }}
              sx={{
                backgroundImage: useMockupBackground
                  ? `url(${mock?.mockupSrc})`
                  : isMugsCategory
                    ? "none"
                    : `url(${TableBgImg})`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
                backgroundSize: "cover",
                borderRadius: 7,
                border: "1px solid gray",
                position: "relative",
                height: useMockupBackground ? "auto" : { md: mugPreview ? 350 : 600, sm: mugPreview ? 350 : 600, xs: 320 },
                aspectRatio: mockupAspectRatio,
                overflow: "hidden",
              }}
            >
              {showOverlayPreview ? (
                <Box
                  sx={{
                    position: "absolute",
                    top: mock?.overlay.top ?? "20%",
                    left: mock?.overlay.left ?? "20%",
                    width: mock?.overlay.width ?? "60%",
                    height: mock?.overlay.height ?? "60%",
                    opacity: mock?.overlay.opacity ?? 1,
                    filter: mock?.overlay.filter,
                    clipPath: mock?.overlay.clipPath,
                    WebkitClipPath: mock?.overlay.clipPath,
                    borderRadius: mock?.overlay.borderRadius ?? 0,
                    transform: isIosWebKit ? "translateZ(0)" : undefined,
                    WebkitTransform: isIosWebKit ? "translateZ(0)" : undefined,
                    backfaceVisibility: isIosWebKit ? "hidden" : undefined,
                    WebkitBackfaceVisibility: isIosWebKit ? "hidden" : undefined,
                    ...(mock?.overlay.sx as any),
                  }}
                >
                  <Box
                    component="img"
                    src={previewSrc}
                    alt="first slide"
                    sx={{
                      width: "100%",
                      height: "100%",
                      objectFit: (mock?.overlay.objectFit as any) ?? "cover",
                      display: "block",
                      userSelect: "none",
                      pointerEvents: "none",
                      transform: isIosWebKit ? "translateZ(0)" : undefined,
                      WebkitTransform: isIosWebKit ? "translateZ(0)" : undefined,
                      backfaceVisibility: isIosWebKit ? "hidden" : undefined,
                      WebkitBackfaceVisibility: isIosWebKit ? "hidden" : undefined,
                    }}
                  />
                </Box>
              ) : showFlatPreview ? (
                <Box
                  component="img"
                  src={previewSrc}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
                    transform: isIosWebKit ? "translateZ(0)" : undefined,
                    WebkitTransform: isIosWebKit ? "translateZ(0)" : undefined,
                    backfaceVisibility: isIosWebKit ? "hidden" : undefined,
                    WebkitBackfaceVisibility: isIosWebKit ? "hidden" : undefined,
                  }}
                />
              ) : showLiveTemplatePreview ? (
                useMockupBackground ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: mock?.overlay.top ?? "20%",
                      left: mock?.overlay.left ?? "20%",
                      width: mock?.overlay.width ?? "60%",
                      height: mock?.overlay.height ?? "60%",
                      opacity: mock?.overlay.opacity ?? 1,
                      filter: mock?.overlay.filter,
                      clipPath: mock?.overlay.clipPath,
                      WebkitClipPath: mock?.overlay.clipPath,
                      borderRadius: mock?.overlay.borderRadius ?? 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      ...(mock?.overlay.sx as any),
                    }}
                  >
                    {liveMockupOverlay ? (
                      <Box
                        sx={{
                          width: liveMockupOverlay.width,
                          height: liveMockupOverlay.height,
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            width: captureWidth,
                            height: captureHeight,
                            position: "absolute",
                            inset: 0,
                            transform: `scale(${liveMockupOverlay.scale})`,
                            transformOrigin: "top left",
                          }}
                        >
                          {renderSlide(rawSlides[0], {
                            stripBackground: stripLiveMockupBackground,
                            transparentCanvas: stripLiveMockupBackground,
                          })}
                        </Box>
                      </Box>
                    ) : null}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      p: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: "88%",
                        maxHeight: "100%",
                        aspectRatio: `${captureWidth} / ${captureHeight}`,
                        bgcolor: rawSlides[0]?.bgColor ?? "#ffffff",
                        borderRadius: 2,
                        boxShadow: 2,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {renderSlide(rawSlides[0])}
                    </Box>
                  </Box>
                )
              ) : showLiveCardPreview ? (
                useMockupBackground && liveCardMockupOverlay ? (
                  <Box
                    sx={{
                      position: "absolute",
                      top: mock?.overlay.top ?? "20%",
                      left: mock?.overlay.left ?? "20%",
                      width: mock?.overlay.width ?? "60%",
                      height: mock?.overlay.height ?? "60%",
                      opacity: mock?.overlay.opacity ?? 1,
                      filter: mock?.overlay.filter,
                      clipPath: mock?.overlay.clipPath,
                      WebkitClipPath: mock?.overlay.clipPath,
                      borderRadius: mock?.overlay.borderRadius ?? 0,
                      overflow: "hidden",
                      transform: isIosWebKit ? "translateZ(0)" : undefined,
                      WebkitTransform: isIosWebKit ? "translateZ(0)" : undefined,
                      ...iosStablePreviewLayerSx,
                      ...(mock?.overlay.sx as any),
                    }}
                  >
                    <Box
                      sx={{
                        width: liveCardMockupOverlay.width,
                        height: liveCardMockupOverlay.height,
                        position: "relative",
                        overflow: "hidden",
                        transform: isIosWebKit ? "translateZ(0)" : undefined,
                        WebkitTransform: isIosWebKit ? "translateZ(0)" : undefined,
                        ...iosStablePreviewLayerSx,
                      }}
                    >
                      <Box
                        sx={{
                          width: LEGACY_CARD_CAPTURE.w,
                          height: LEGACY_CARD_CAPTURE.h,
                          position: "absolute",
                          inset: 0,
                          transform: `${isIosWebKit ? "translateZ(0) " : ""}scale(${liveCardMockupOverlay.scaleX}, ${liveCardMockupOverlay.scaleY})`,
                          transformOrigin: "top left",
                          WebkitTransform: `${isIosWebKit ? "translateZ(0) " : ""}scale(${liveCardMockupOverlay.scaleX}, ${liveCardMockupOverlay.scaleY})`,
                          ...iosStablePreviewLayerSx,
                        }}
                      >
                        <Box sx={iosStablePreviewLayerSx}>
                          <Slide1 />
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "grid",
                      placeItems: "center",
                      p: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        maxWidth: { md: 360, sm: 320, xs: 220 },
                        aspectRatio: `${LEGACY_CARD_CAPTURE.w} / ${LEGACY_CARD_CAPTURE.h}`,
                        bgcolor: "#ffffff",
                        borderRadius: 2,
                        boxShadow: 2,
                        overflow: "hidden",
                        position: "relative",
                        transform: isIosWebKit ? "translateZ(0)" : undefined,
                        WebkitTransform: isIosWebKit ? "translateZ(0)" : undefined,
                        ...iosStablePreviewLayerSx,
                      }}
                    >
                      <Box sx={iosStablePreviewLayerSx}>
                        <Slide1 />
                      </Box>
                    </Box>
                  </Box>
                )
              ) : (
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(0,0,0,0.6)",
                    fontWeight: 700,
                    bgcolor: "rgba(255,255,255,0.25)",
                  }}
                >
                  No preview found
                </Box>
              )}
            </Grid>

            {/* Right - Plans */}
            <Grid
              size={{ md: 5, sm: 5, xs: 12 }}
              sx={{ display: "flex", flexDirection: "column", gap: "25px", textAlign: "start" }}
            >
              <Box sx={{ p: { md: 2, sm: 2, xs: "5px" }, bgcolor: COLORS.primary, borderRadius: 2 }}>
                <Typography variant="h5">🎉 Your {categoryLabel} design is ready for checkout!</Typography>
                <Typography sx={{ fontSize: 14, mt: 1, opacity: 0.8 }}>
                  {planLoading || bundleKeyLoading
                    ? "Checking your plan..."
                    : proOnlyLocked
                      ? "This card is Pro-only. Please upgrade to Pro to generate PDF."
                      : isBundleAndMatched
                        ? "Bundle matched by ID. You can generate your PDF without payment."
                        : planCode === "pro"
                          ? "Pro user: PDF generation included."
                          : planCode === "bundle"
                            ? "Bundle user: payment required for this item."
                            : "Free users need to complete payment to receive PDF."}
                </Typography>
              </Box>

              {checkoutProgress.active && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: "1px solid rgba(0,0,0,0.12)",
                    bgcolor: "rgba(86, 190, 204, 0.12)",
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 1 }}>
                    <Typography sx={{ fontWeight: 700 }}>Checkout progress</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{checkoutProgress.value}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={checkoutProgress.value}
                    sx={{
                      height: 10,
                      borderRadius: 999,
                      bgcolor: "rgba(0,0,0,0.08)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        backgroundColor: COLORS.seconday,
                      },
                    }}
                  />
                  <Typography sx={{ fontSize: 13, mt: 1, opacity: 0.85 }}>
                    {checkoutProgress.label}
                  </Typography>
                </Box>
              )}

              {!plans.length ? (
                <Typography sx={{ color: "text.secondary" }}>No sizes configured for this category.</Typography>
              ) : (
                plans.map((p) => {
                  const isSelected = String(selectedPlan) === String(p.id);
                  return (
                    <Box
                      key={String(p.id)}
                      onClick={() => {
                        if (p.disabled) return;
                        setSelectedPlan(p.id as any);
                        syncLocalSelection({ id: p.id, title: p.title, price: p.price });
                      }}
                      sx={{
                        ...isActivePay,
                        border: `3px solid ${isSelected ? "#004099" : "transparent"}`,
                        cursor: p.disabled ? "not-allowed" : "pointer",
                        opacity: proOnlyLocked ? 0.7 : p.disabled ? 0.55 : 1,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <input
                          type="radio"
                          name="plan"
                          disabled={p.disabled}
                          checked={isSelected}
                          onChange={() => {
                            if (p.disabled) return;
                            setSelectedPlan(p.id as any);
                          }}
                          style={{ width: "30px", height: "30px" }}
                        />
                        <Box>
                          <Typography sx={{ fontWeight: { md: 900, sm: 900, xs: 700 } }}>{p.title}</Typography>
                          {p.sub ? <Typography sx={{ fontSize: 12, opacity: 0.85 }}>{p.sub}</Typography> : null}
                          {p.disabled ? (
                            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>Not available</Typography>
                          ) : proOnlyLocked ? (
                            <Typography sx={{ fontSize: 13, fontWeight: 800 }}>Pro-only</Typography>
                          ) : requiresPayment ? (
                            <Typography sx={{ fontSize: { md: "auto", sm: "auto", xs: "15px" } }}>
                              £{p.price.toFixed(2)}
                            </Typography>
                          ) : (
                            <Typography sx={{ fontSize: { md: "auto", sm: "auto", xs: "15px" }, fontWeight: 900 }}>
                              Included
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {p.disabled ? (
                        <Typography variant="h5">—</Typography>
                      ) : proOnlyLocked ? (
                        <Typography variant="h5">—</Typography>
                      ) : requiresPayment ? (
                        <Typography variant="h5">£{p.price.toFixed(2)}</Typography>
                      ) : (
                        <Typography variant="h5">£0</Typography>
                      )}
                    </Box>
                  );
                })
              )}

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ width: "20px", height: "20px" }}
                />
                <Typography sx={{ fontSize: "14px", color: termsAccepted ? "gray" : "#d32f2f" }}>
                  I accept the Terms & Conditions and give my consent to proceed with the order.
                </Typography>
              </Box>

              <Button
                fullWidth
                onClick={handlePayClick}
                sx={{
                  borderRadius: "8px",
                  py: 1.5,
                  fontSize: 20,
                  textTransform: "none",
                  backgroundColor: COLORS.primary,
                  color: COLORS.black,
                  "&:hover": {
                    backgroundColor: COLORS.seconday,
                    opacity: 0.9,
                  },
                }}
              >
                {planLoading || bundleKeyLoading || loading
                  ? "Loading..."
                  : proOnlyLocked
                    ? "Go to Premium Plans"
                    : requiresPayment
                      ? "Pay & Get your File!"
                      : "Generate PDF"}
              </Button>

              {planCode === "pro" ? null : (
                <LandingButton
                  title={"Want unlimited? Upgrade to Bundle/Pro"}
                  variant="outlined"
                  personal
                  width="100%"
                  onClick={() => navigate(USER_ROUTES.PREMIUM_PLANS)}
                />
              )}
            </Grid>
          </Grid>

          {captureSupportEnabled && rawSlides.length > 0 && (
            <Box sx={{ position: "fixed", left: -10000, top: 0, opacity: 0, pointerEvents: "none" }}>
              {rawSlides.map((sl, i) => (
                <Box
                  key={sl.id ?? i}
                  ref={setSlideNodeRef(i)}
                  sx={{ width: captureWidth, height: captureHeight, position: "relative" }}
                >
                  {renderSlide(sl)}
                </Box>
              ))}
            </Box>
          )}

          {legacyCardCaptureEnabled && isLegacyCardProduct && (
            <Box sx={{ position: "fixed", left: -10000, top: 0, opacity: 0, pointerEvents: "none" }}>
              <Box sx={{ width: LEGACY_CARD_CAPTURE.w, height: LEGACY_CARD_CAPTURE.h }}>
                <Slide1 ref={setLegacyCardNodeRef(0)} />
              </Box>
              <Box sx={{ width: LEGACY_CARD_CAPTURE.w, height: LEGACY_CARD_CAPTURE.h }}>
                <Slide2 ref={setLegacyCardNodeRef(1)} />
              </Box>
              <Box sx={{ width: LEGACY_CARD_CAPTURE.w, height: LEGACY_CARD_CAPTURE.h }}>
                <Slide3 ref={setLegacyCardNodeRef(2)} />
              </Box>
              <Box sx={{ width: LEGACY_CARD_CAPTURE.w, height: LEGACY_CARD_CAPTURE.h }}>
                <Slide4 ref={setLegacyCardNodeRef(3)} />
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </MainLayout>
  );
};

export default Subscription;
