import {
  Box,
  IconButton,
  Typography,
  Stack,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Chip,
  Modal,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Collections, ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import * as htmlToImage from "html-to-image";
import { Rnd } from "react-rnd";

import LandingButton from "../../../components/LandingButton/LandingButton";
import ImageCropModal from "../../../components/ImageCropModal/ImageCropModal";
import { USER_ROUTES } from "../../../constant/route";
import { fetchTempletDesignById } from "../../../source/source";
import { COLORS } from "../../../constant/color";
import { CATEGORY_CONFIG, type CategoryKey } from "../../../constant/data";
import toast from "react-hot-toast";
import { safeGetStorage, safeSetLocalStorage } from "../../../lib/storage";
import AlignmentGuides from "../../../components/AlignmentGuides/AlignmentGuides";
import { useAlignGuides } from "../../../hooks/useAlignGuides";
import { buildGoogleFontsUrls, loadGoogleFontsOnce } from "../../../constant/googleFonts";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../supabase/supabase";
import {
  getTemplateDisplayFactor,
  scaleTemplateElementBy,
} from "../../../lib/templateEditorScale";
import { isIosTouchDevice } from "../../../lib/platform";

/* --------- Types --------- */
type BaseEl = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  slideId?: number;
  zIndex?: number;
  editable?: boolean;
};

type TextEl = BaseEl & {
  type: "text";
  text: string;
  bold: boolean;
  italic: boolean;
  color: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textDecoration?: string;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  rotation?: number;
  curve?: number;
};

type ImageEl = BaseEl & { type: "image"; src: string };
type StickerEl = BaseEl & { type: "sticker"; src: string };
type AnyEl = TextEl | ImageEl | StickerEl;

type Slide = { id: number; label: string; elements: AnyEl[]; bgColor?: string };

type CanvasPx = { w: number; h: number; dpi?: number };
type AdminPreview = {
  category: string;
  config: {
    mmWidth: number;
    mmHeight: number;
    slideLabels: string[];
    fitCanvas?: { width: number; height: number };
  };
  canvasPx: CanvasPx;
  slides: Slide[];
};

/* --------- Utils --------- */
// const TRANSPARENT_PX =
// "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

const cloneSlides = (slides: Slide[]): Slide[] => JSON.parse(JSON.stringify(slides));
const asNum = (v: any, d = 0) => {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return d;
};
const asStr = (v: any, d = "") => (typeof v === "string" ? v : d);
const A = <T,>(v: any): T[] => (Array.isArray(v) ? v : []);
const uuid = () => globalThis.crypto?.randomUUID?.() ?? `id_${Math.random().toString(36).slice(2)}`;
const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const makeUuid = () => globalThis.crypto?.randomUUID?.() ?? uuid();

const resolveCategoryKey = (category?: string): CategoryKey | null => {
  const c = String(category ?? "").trim().toLowerCase();
  const keys = Object.keys(CATEGORY_CONFIG) as CategoryKey[];
  const exact = keys.find((k) => k.trim().toLowerCase() === c);
  if (exact) return exact;

  if (c.includes("business card")) return "Business Cards";
  if (c.includes("business leaflet")) return "Business Leaflets";
  if (c.includes("mug")) return "Mugs";
  if (c.includes("tote")) return "Tote Bags";
  if (c.includes("photo art")) return "Photo Art";
  if (c.includes("wall art")) return "Wall Art";
  if (c.includes("notebook")) return "Notebooks";
  if (c.includes("sticker")) return "Stickers";
  if (c.includes("coaster")) return "Coasters";
  if (c.includes("invite")) return "Invites";
  if (c.includes("clothing") || c.includes("clothes") || c.includes("cloth")) return "Apparel";
  if (c.includes("apparel")) return "Apparel";

  return null;
};

const sanitizeSrc = (src?: string) => {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http")) return src;
  if (!src.startsWith("blob:")) return src;
  try {
    const u = new URL(src);
    if (u.origin === window.location.origin) return src;
  } catch { }
  return "";
};

const parseSlideId = (value: any): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const raw = value.trim();
  if (!raw) return null;
  const direct = Number(raw);
  if (Number.isFinite(direct)) return direct;
  const lower = raw.toLowerCase();
  if (lower === "front") return 1;
  if (lower === "back") return 2;
  const match = raw.match(/(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
};

const resolveSlideId = (value: any, fallback: number) => {
  const parsed = parseSlideId(value);
  return parsed == null ? fallback : parsed;
};

const readSlideBgEntry = (slideBgMap: any, sid: number, index: number, label?: string) => {
  if (!slideBgMap) return null;

  const keys = new Set<string | number>([
    sid,
    String(sid),
    `slide${sid}`,
    `Slide${sid}`,
    index + 1,
    String(index + 1),
    `slide${index + 1}`,
    `Slide${index + 1}`,
  ]);

  const rawLabel = String(label ?? "").trim();
  if (rawLabel) {
    keys.add(rawLabel);
    const normalized = rawLabel.toLowerCase().replace(/\s+/g, "");
    keys.add(normalized);
    if (normalized === "front") {
      keys.add(1);
      keys.add("1");
      keys.add("slide1");
    } else if (normalized === "back") {
      keys.add(2);
      keys.add("2");
      keys.add("slide2");
    }
  }

  for (const key of keys) {
    const entry = slideBgMap?.[key as any];
    if (entry) return entry;
  }

  if (Array.isArray(slideBgMap)) {
    return slideBgMap[index] ?? slideBgMap[sid - 1] ?? null;
  }

  return null;
};

const normalize01 = (o: any, pxW: number, pxH: number) => {
  let x = asNum(o?.x, 0),
    y = asNum(o?.y, 0),
    w = asNum(o?.width ?? o?.w, 0),
    h = asNum(o?.height ?? o?.h, 0);

  const r = (n: number) => n > 0 && n <= 1;
  if (r(x) || r(y) || r(w) || r(h)) {
    x *= pxW;
    y *= pxH;
    w *= pxW;
    h *= pxH;
  }
  return { x, y, width: w, height: h };
};

async function waitForAssets(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      const i = img as HTMLImageElement;
      if (i.complete && i.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((res) => {
        i.onload = () => res();
        i.onerror = () => res();
      });
    })
  );
  if ((document as any).fonts?.ready) {
    try {
      await (document as any).fonts.ready;
    } catch { }
  }
}

// const captureFilter = (node: unknown) => {
//   if (!(node instanceof Element)) return true;
//   if (node.classList?.contains("capture-exclude")) return false;
//   if (node.tagName?.toUpperCase() === "INPUT") {
//     const t = (node as HTMLInputElement).type?.toLowerCase?.();
//     if (t === "file" || t === "hidden") return false;
//   }
//   return true;
// };

// function hasBlobImages(root: HTMLElement) {
//   return !!root.querySelector('img[src^="blob:"]');
// }

/* --------- Persist helpers --------- */
const storageKey = (productId?: string) => `templet_editor_state:${productId ?? "state"}`;

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

const countElementsByType = (slides: Slide[], type: AnyEl["type"]): number =>
  (slides ?? []).reduce(
    (sum, sl) => sum + (Array.isArray(sl?.elements) ? sl.elements.filter((e) => e?.type === type).length : 0),
    0,
  );

const collectElementIdsByType = (slides: Slide[], type: AnyEl["type"]): Set<string> => {
  const ids = new Set<string>();
  (slides ?? []).forEach((sl) => {
    (sl?.elements ?? []).forEach((el) => {
      if (el?.type === type && typeof el.id === "string") ids.add(el.id);
    });
  });
  return ids;
};

const normalizeEditableText = (value: string) =>
  value
    .replace(/\r/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
    .replace(/\n$/, "");

const syncEditableNodeText = (node: HTMLDivElement | null, value: string) => {
  if (!node) return;
  const safe = value ?? "";
  const current = normalizeEditableText(node.innerText ?? "");
  if (current === safe) return;
  node.innerText = safe;
};

const focusContentEditableNode = (node: HTMLDivElement | null) => {
  if (!node) return;

  requestAnimationFrame(() => {
    window.setTimeout(() => {
      try {
        node.focus();
      } catch {
        return;
      }

      if (typeof window.getSelection !== "function" || typeof document.createRange !== "function") {
        return;
      }

      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }, 0);
  });
};

const insertPlainTextAtCursor = (text: string) => {
  if (typeof window.getSelection !== "function" || typeof document.createRange !== "function") {
    return false;
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
};

const resolveTextFontFamily = (entry: any): string =>
  asStr(
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
      "inherit",
    "inherit",
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
    const asWeight = Number(trimmed);
    if (Number.isFinite(asWeight) && asWeight > 0) return asWeight;
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
  String(
    firstDefinedValue(
      entry?.color,
      entry?.fill,
      entry?.style?.color,
      entry?.style?.fill,
      "#000",
    ),
  );

const normalizeFontFamily = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const quoted = raw.match(/['"]([^'"]+)['"]/);
  if (quoted?.[1]) return quoted[1].trim();
  const first = raw.split(",")[0]?.trim() ?? "";
  return first.replace(/^['"]|['"]$/g, "").trim();
};

const collectFontsFromSlides = (slides: Slide[]) => {
  const fonts = new Set<string>();
  (slides ?? []).forEach((sl) => {
    (sl?.elements ?? []).forEach((el) => {
      if (el?.type !== "text") return;
      const fam = normalizeFontFamily(resolveTextFontFamily(el));
      if (!fam) return;
      const lower = fam.toLowerCase();
      if (["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui"].includes(lower)) return;
      fonts.add(fam);
    });
  });
  return Array.from(fonts);
};

const templateDraftIdKey = (productId?: string) =>
  `template:draft:id:${String(productId ?? "state").trim() || "state"}`;

/* ------------ MAIN ------------ */
export default function TempletEditor() {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isIos = useMemo(() => isIosTouchDevice(), []);
  const isSafari = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent || "";
    return /Safari/i.test(ua) && !/Chrome|CriOS|Chromium|FxiOS|Firefox|EdgiOS|EdgA|OPiOS|OPR|Android/i.test(ua);
  }, []);

  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [adminDesign, setAdminDesign] = useState<AdminPreview | null>(null);
  const [userSlides, setUserSlides] = useState<Slide[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<{
    slideIndex: number;
    imageId: string;
    src: string;
    aspect: number;
  } | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [sidePadPx, setSidePadPx] = useState(0);
  const { user } = useAuth();

  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const slideRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const slideItemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const setSlideRef = (i: number) => (el: HTMLDivElement | null) => {
    slideRefs.current[i] = el;
  };
  const setSlideItemRef = (i: number) => (el: HTMLDivElement | null) => {
    slideItemRefs.current[i] = el;
  };
  const activeSlideRef = useRef<HTMLDivElement | null>(null);
  const editableTextRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const textTouchStartRef = useRef<Record<string, number>>({});
  const textLastTapRef = useRef<Record<string, number>>({});
  const textTapHandledRef = useRef<Record<string, number>>({});
  const lastTouchTsRef = useRef(0);

  const { productId } = useParams<{ productId: string }>();
  const { state } = useLocation() as { state?: { templetDesign?: any } };

  const didRestoreRef = useRef(false);


  function buildSlidesFromRawStores(raw: any): { design: AdminPreview; slides: Slide[] } {
    const src = raw?.raw_stores ?? raw;

    const category = asStr(src?.category ?? src?.editorCategory ?? src?.cardCategory ?? "Invites");
    const labels: string[] = Array.isArray(src?.config?.slideLabels) ? src.config.slideLabels : [];

    const dbMmWidth = asNum(src?.config?.mmWidth, asNum(src?.canvas?.mm?.w, 210));
    const dbMmHeight = asNum(src?.config?.mmHeight, asNum(src?.canvas?.mm?.h, 297));
    // const multiplier = asNum(src?.canvas?.multiplier, 2);

    const storedW =
      asNum(src?.config?.fitCanvas?.width, 0) ||
      asNum(src?.canvas?.px?.w, 0) ||
      1200;

    const storedH =
      asNum(src?.config?.fitCanvas?.height, 0) ||
      asNum(src?.canvas?.px?.h, 0) ||
      800;
    const displayFactor = getTemplateDisplayFactor(src, 1);

    const k = resolveCategoryKey(category);
    const mmWidth = k ? CATEGORY_CONFIG[k].mmWidth : dbMmWidth;
    const mmHeight = k ? CATEGORY_CONFIG[k].mmHeight : dbMmHeight;

    const slidesDefRaw: any[] = A(src?.slides);
    const fallbackSlides: any[] =
      typeof (raw as any)?.slides === "string"
        ? (() => {
          try {
            const parsed = JSON.parse((raw as any).slides);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
        : A((raw as any)?.slides);

    const slidesDef: any[] =
      slidesDefRaw.length > 0
        ? slidesDefRaw
        : fallbackSlides.length > 0
          ? fallbackSlides
          : labels.length
            ? labels.map((_, idx) => ({ id: idx + 1 }))
            : [{ id: 1 }];

    let imgEls = A<any>(src?.imageElements);
    let txtEls = A<any>(src?.textElements);
    let stkEls = A<any>(src?.stickerElements);

    const hasSeparatedEls = imgEls.length || txtEls.length || stkEls.length;
    if (!hasSeparatedEls && slidesDef.length) {
      const snapshotEls: any[] = [];
      slidesDef.forEach((sl, idx) => {
        const sid = resolveSlideId(sl?.id ?? sl?.slideId ?? sl?.slide_id, idx + 1);
        const elements = A<any>(sl?.elements);
        elements.forEach((el) => {
          snapshotEls.push({
            ...el,
            slideId: resolveSlideId(el?.slideId ?? el?.slide_id, sid),
          });
        });
      });

      if (snapshotEls.length) {
        const nextImgs: any[] = [];
        const nextTxts: any[] = [];
        const nextStickers: any[] = [];

        snapshotEls.forEach((el) => {
          const t = String(el?.type ?? "").toLowerCase();
          if (t === "image" || (!t && (el?.src || el?.image || el?.url))) {
            nextImgs.push({
              ...el,
              src: el?.src ?? el?.image ?? el?.url ?? el?.imageUrl ?? "",
            });
            return;
          }
          if (t === "sticker" || (!t && (el?.sticker || el?.src))) {
            nextStickers.push({
              ...el,
              src: el?.sticker ?? el?.src ?? "",
            });
            return;
          }
          if (t === "text" || (!t && el?.text != null)) {
            nextTxts.push({
              ...el,
              text: el?.text ?? el?.value ?? "",
            });
          }
        });

        if (nextImgs.length) imgEls = nextImgs;
        if (nextTxts.length) txtEls = nextTxts;
        if (nextStickers.length) stkEls = nextStickers;
      }
    }

    const coerceText = (e: any): TextEl => {
      const displayEl = scaleTemplateElementBy(e, displayFactor);
      const r = normalize01(displayEl, storedW, storedH);
      const fontWeight = resolveTextWeight(displayEl);
      const fontStyle = resolveTextStyle(displayEl);
      const textDecoration = resolveTextDecoration(displayEl);
      const color = resolveTextColor(displayEl);
      const fontSize = asNum(
        firstDefinedValue(
          displayEl?.fontSize,
          displayEl?.font_size,
          displayEl?.["font-size"],
          displayEl?.style?.fontSize,
          displayEl?.style?.font_size,
          displayEl?.style?.["font-size"],
        ),
        16,
      );
      const lineHeight = asNum(
        firstDefinedValue(
          displayEl?.lineHeight,
          displayEl?.line_height,
          displayEl?.["line-height"],
          displayEl?.style?.lineHeight,
          displayEl?.style?.line_height,
          displayEl?.style?.["line-height"],
          1.2,
        ),
        1.2,
      );
      const resolvedAlign = String(
        firstDefinedValue(
          displayEl?.align,
          displayEl?.textAlign,
          displayEl?.style?.textAlign,
          "center",
        ),
      ).toLowerCase();
      const align =
        resolvedAlign === "left"
          ? "left"
          : resolvedAlign === "right"
          ? "right"
          : "center";
      const rotation = asNum(
        firstDefinedValue(
          displayEl?.rotation,
          displayEl?.rotate,
          displayEl?.style?.rotation,
          displayEl?.style?.rotate,
        ),
        0,
      );
      const curve = asNum(
        firstDefinedValue(
          displayEl?.curve,
          displayEl?.arc,
          displayEl?.style?.curve,
          displayEl?.style?.arc,
        ),
        0,
      );
      const normalizedFontStyle = String(fontStyle).toLowerCase();
      const weightNum =
        typeof fontWeight === "string" ? Number(fontWeight) : Number(fontWeight ?? 400);
      const derivedBold =
        Number.isFinite(weightNum) ? weightNum >= 600 : displayEl?.bold === true;
      const derivedItalic =
        normalizedFontStyle.includes("italic") || normalizedFontStyle.includes("oblique");
      return {
        type: "text",
        id: asStr(displayEl?.id) || uuid(),
        slideId: resolveSlideId(displayEl?.slideId ?? displayEl?.slide_id, 0),
        ...r,
        text: asStr(displayEl?.text ?? displayEl?.value),
        bold: typeof displayEl?.bold === "boolean" ? displayEl.bold : derivedBold,
        italic: typeof displayEl?.italic === "boolean" ? displayEl.italic : derivedItalic,
        color,
        fontSize,
        fontFamily: resolveTextFontFamily(displayEl),
        fontWeight,
        fontStyle,
        textDecoration,
        lineHeight,
        align,
        rotation,
        curve,
        zIndex: asNum(displayEl?.zIndex ?? displayEl?.z_index, 1),
        editable: displayEl?.editable !== false,
      };
    };

    const isLeafletTemplate = /business\s*leaflets?/i.test(category);
    const coerceImage = (e: any): ImageEl => {
      const displayEl = scaleTemplateElementBy(e, displayFactor);
      const r = normalize01(displayEl, storedW, storedH);
      const id = asStr(displayEl?.id) || uuid();
      const tol = 8;
      const bgLike =
        id.startsWith("bg-") ||
        (isLeafletTemplate &&
          Math.abs(asNum(r.x, 0)) <= tol &&
          Math.abs(asNum(r.y, 0)) <= tol &&
          asNum(r.width, 0) >= storedW - tol &&
          asNum(r.height, 0) >= storedH - tol);

      return {
        type: "image",
        id,
        slideId: resolveSlideId(displayEl?.slideId ?? displayEl?.slide_id, 0),
        x: bgLike ? 0 : r.x,
        y: bgLike ? 0 : r.y,
        width: bgLike ? storedW : r.width,
        height: bgLike ? storedH : r.height,
        src: sanitizeSrc(
          asStr(displayEl?.src ?? displayEl?.url ?? displayEl?.imageUrl ?? displayEl?.image),
        ),
        zIndex: asNum(displayEl?.zIndex ?? displayEl?.z_index, 1),
        editable: bgLike ? displayEl?.editable === true : displayEl?.editable !== false,
      };
    };

    const coerceSticker = (e: any): StickerEl => {
      const displayEl = scaleTemplateElementBy(e, displayFactor);
      const r = normalize01(displayEl, storedW, storedH);
      return {
        type: "sticker",
        id: asStr(displayEl?.id) || uuid(),
        slideId: resolveSlideId(displayEl?.slideId ?? displayEl?.slide_id, 0),
        ...r,
        src: sanitizeSrc(asStr(displayEl?.src ?? displayEl?.url)),
        zIndex: asNum(displayEl?.zIndex ?? displayEl?.z_index, 1),
        editable: displayEl?.editable !== false,
      };
    };

    const slideBgMap = (src as any)?.slideBg ?? (raw as any)?.slideBg ?? null;
    const firstSlideId = resolveSlideId(
      slidesDef?.[0]?.id ?? slidesDef?.[0]?.slideId ?? slidesDef?.[0]?.slide_id,
      1,
    );

    const matchesSlide = (e: any, sid: number) => {
      const parsed = parseSlideId(e?.slideId ?? e?.slide_id);
      if (parsed != null) return parsed === sid;
      return sid === firstSlideId;
    };

    const slides: Slide[] = slidesDef.map((sl, i) => {
      const sid = resolveSlideId(sl?.id ?? sl?.slideId ?? sl?.slide_id, i + 1);
      const label = labels[i] ?? asStr(sl?.label, `Slide ${i + 1}`);

      const images = imgEls.filter((e) => matchesSlide(e, sid)).map(coerceImage);
      const texts = txtEls.filter((e) => matchesSlide(e, sid)).map(coerceText);
      const stickers = stkEls.filter((e) => matchesSlide(e, sid)).map(coerceSticker);

      const elements: AnyEl[] = [...images, ...texts, ...stickers].sort(
        (a, b) => asNum(a.zIndex, 1) - asNum(b.zIndex, 1)
      );

      const bg = readSlideBgEntry(slideBgMap, sid, i, label);
      if (bg?.image) {
        elements.unshift({
          type: "image",
          id: `bg-${sid}`,
          slideId: sid,
          x: 0,
          y: 0,
          width: storedW,
          height: storedH,
          src: sanitizeSrc(asStr(bg.image)),
          zIndex: 0,
          // Keep template background static by default in user editor.
          editable: bg?.editable === true,
        });
      }

      return { id: sid, label, elements, bgColor: bg?.color ?? undefined };
    });

    return {
      design: {
        category,
        config: { mmWidth, mmHeight, slideLabels: labels },
        canvasPx: { w: storedW, h: storedH, dpi: 96 },
        slides,
      },
      slides,
    };
  }

  const discardEditorState = () => {
    try {
      localStorage.removeItem(storageKey(productId));
      sessionStorage.removeItem(storageKey(productId));
    } catch { }
    navigate(-1);
  };

  const persistEditorState = () => {
    if (!adminDesign) return;
    const payload = {
      adminDesign,
      userSlides,
      activeSlide,
      selectedElId,
      savedAt: Date.now(),
    };
    const ok = safeSetLocalStorage(storageKey(productId), JSON.stringify(payload), {
      clearOnFail: ["slides_backup"],
      fallbackToSession: true,
    });
    if (!ok) {
      console.warn("Failed to persist editor state");
    }
  };

  const handleExit = () => {
    if (isDirty) {
      setShowExitModal(true);
      return;
    }
    discardEditorState();
  };

  const getOrCreateTemplateDraftId = () => {
    const key = templateDraftIdKey(productId);
    try {
      const existing = localStorage.getItem(key);
      if (existing && isUuid(existing)) return existing;
      const created = makeUuid();
      localStorage.setItem(key, created);
      return created;
    } catch {
      return makeUuid();
    }
  };

  const saveDraftToDb = async () => {
    if (!user?.id) throw new Error("Please login first");
    if (!adminDesign || !userSlides?.length) throw new Error("Nothing to save");

    const draftId = getOrCreateTemplateDraftId();
    const frontNode = slideRefs.current[0] ?? activeSlideRef.current ?? null;
    const coverScreenshot = frontNode
      ? await capturePngFromNode(frontNode, {
          width: artboardWidth,
          height: artboardHeight,
          background: "#ffffff",
          quality: previewCapture.quality,
          pixelRatio: previewCapture.pixelRatio,
        })
      : null;

    const selectedSize = localStorage.getItem("selectedSize") ?? "a4";
    const selectedVariant = safeJsonParse<{ price?: number }>(localStorage.getItem("selectedVariant"));
    const selectedPrices = safeJsonParse<any>(localStorage.getItem("selectedPrices"));
    const displayPrice = typeof selectedVariant?.price === "number" ? selectedVariant.price : null;

    const templateMeta = (state as any)?.templetDesign ?? {};
    const title =
      templateMeta?.cardname ?? templateMeta?.cardName ?? templateMeta?.title ?? adminDesign?.category ?? "Untitled";
    const category = adminDesign?.category ?? templateMeta?.category ?? "";
    const description = templateMeta?.description ?? "";

    const layoutPayload = {
      __editorType: "template",
      productId: productId ?? null,
      category,
      templetDesign: templateMeta ?? null,
      adminDesign,
      userSlides,
      activeSlide,
      selectedElId,
      cover_screenshot: coverScreenshot ?? null,
    };

    const { error } = await supabase.from("draft").upsert(
      {
        user_id: user.id,
        card_id: draftId,
        cover_screenshot: coverScreenshot ?? null,
        title,
        category,
        description,
        layout: layoutPayload,
        slide1: userSlides[0] ?? null,
        slide2: userSlides[1] ?? null,
        slide3: userSlides[2] ?? null,
        slide4: userSlides[3] ?? null,
        selected_size: selectedSize,
        prices: selectedPrices ?? null,
        display_price: displayPrice,
        is_on_sale: false,
      },
      { onConflict: "user_id,card_id" }
    );

    if (error) throw error;
  };

  const handleSaveDraftAndExit = async () => {
    persistEditorState();
    try {
      await saveDraftToDb();
      toast.success("Draft saved ✅");
      setShowExitModal(false);
      navigate(-1);
    } catch (e: any) {
      console.error("Template draft save failed:", e);
      toast.error(e?.message ?? "Failed to save draft");
    }
  };


  // ✅ Restore
  useEffect(() => {
  const restored = safeJsonParse<{
      adminDesign: AdminPreview;
      userSlides: Slide[];
      activeSlide: number;
      selectedElId: string | null;
    }>(safeGetStorage(storageKey(productId)));

    if (restored?.adminDesign && restored?.userSlides?.length) {
      // If incoming template has new/extra elements, ignore stale local restore.
      if (state?.templetDesign) {
        const incoming = buildSlidesFromRawStores(state.templetDesign);
        const types: Array<AnyEl["type"]> = ["text", "image", "sticker"];
        const hasIncomingDelta = types.some((type) => {
          const restoredCount = countElementsByType(restored.userSlides, type);
          const incomingCount = countElementsByType(incoming.slides, type);
          if (incomingCount > restoredCount) return true;
          const restoredIds = collectElementIdsByType(restored.userSlides, type);
          const incomingIds = collectElementIdsByType(incoming.slides, type);
          return Array.from(incomingIds).some((id) => !restoredIds.has(id));
        });

        if (hasIncomingDelta) {
          return;
        }
      }

      didRestoreRef.current = true;
      setAdminDesign(restored.adminDesign);
      setUserSlides(restored.userSlides);
      setActiveSlide(restored.activeSlide ?? 0);
      setSelectedElId(restored.selectedElId ?? null);
      setLoading(false);
    }
  }, [productId, state?.templetDesign]);

  useEffect(() => {
    if (!adminDesign) return;
    persistEditorState();
  }, [adminDesign, userSlides, activeSlide, selectedElId, productId]);


  // ✅ Load if not restored
  useEffect(() => {
    if (didRestoreRef.current) return;

    const load = async () => {
      setLoading(true);
      try {
        if (state?.templetDesign) {
          const { design, slides } = buildSlidesFromRawStores(state.templetDesign);
          const hasAny = slides.some((s) => (s.elements?.length ?? 0) > 0);
          if (hasAny || !productId) {
            setAdminDesign(design);
            setUserSlides(slides);
            setActiveSlide(0);
            setSelectedElId(null);
            return;
          }
          // fallback: fetch full row if elements are missing
        }

        if (productId) {
          const row: any = await fetchTempletDesignById(productId);
          const { design, slides } = buildSlidesFromRawStores(row);
          setAdminDesign(design);
          setUserSlides(slides);
          setActiveSlide(0);
          setSelectedElId(null);
          return;
        }

        setAdminDesign(null);
        setUserSlides([]);
      } catch (e) {
        console.error("Failed to load template:", e);
        setAdminDesign(null);
        setUserSlides([]);
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, state?.templetDesign]);

  useEffect(() => {
    if (!userSlides?.length) return;
    const fonts = collectFontsFromSlides(userSlides);
    if (!fonts.length) return;
    loadGoogleFontsOnce(buildGoogleFontsUrls(fonts));
  }, [userSlides]);


  // ====== Render sizing ======
  const canvasSize = useMemo(() => {
    // ⭐ Prefer fitCanvas (matches element coordinates), then px, then mm
    const fitW = asNum(state?.templetDesign?.config?.fitCanvas?.width, 0);
    const fitH = asNum(state?.templetDesign?.config?.fitCanvas?.height, 0);
    const adminFitW = asNum(adminDesign?.config?.fitCanvas?.width, 0);
    const adminFitH = asNum(adminDesign?.config?.fitCanvas?.height, 0);
    const exactPxW = asNum(state?.templetDesign?.canvas?.px?.w, 0);
    const exactPxH = asNum(state?.templetDesign?.canvas?.px?.h, 0);
    const exactMmW = asNum(state?.templetDesign?.canvas?.mm?.w, 0);
    const exactMmH = asNum(state?.templetDesign?.canvas?.mm?.h, 0);
    const cfgW = asNum(state?.templetDesign?.config?.mmWidth, 0);
    const cfgH = asNum(state?.templetDesign?.config?.mmHeight, 0);
    const adminPxW = asNum(adminDesign?.canvasPx?.w, 0);
    const adminPxH = asNum(adminDesign?.canvasPx?.h, 0);
    const adminMmW = asNum(adminDesign?.config?.mmWidth, 0);
    const adminMmH = asNum(adminDesign?.config?.mmHeight, 0);

    return {
      width: fitW || adminFitW || exactPxW || adminPxW || exactMmW || cfgW || adminMmW || 210,
      height: fitH || adminFitH || exactPxH || adminPxH || exactMmH || cfgH || adminMmH || 297,
    };
  }, [
    state?.templetDesign,
    adminDesign?.config?.mmWidth,
    adminDesign?.config?.mmHeight,
    adminDesign?.config?.fitCanvas?.width,
    adminDesign?.config?.fitCanvas?.height,
    adminDesign?.canvasPx?.w,
    adminDesign?.canvasPx?.h,
  ]);

  const artboardWidth = canvasSize.width;
  const artboardHeight = canvasSize.height;
  const [fitScale, setFitScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const vw = typeof window !== "undefined" ? window.innerWidth : 0;
      const vh = typeof window !== "undefined" ? window.innerHeight : 0;
      if (!vw || !vh || !artboardWidth || !artboardHeight) return;
      const maxW = Math.max(240, vw - 32);
      const maxH = Math.max(240, vh - 260); // leave room for header + nav
      const scaleW = maxW / artboardWidth;
      const scaleH = maxH / artboardHeight;
      const next = Math.min(1, scaleW, scaleH);
      const safe = Number.isFinite(next) && next > 0 ? next : 1;
      setFitScale(Math.max(0.2, safe));
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, [artboardWidth, artboardHeight]);

  const alignItems = useMemo(() => {
    const slide = userSlides[activeSlide];
    if (!slide) return [];
    const items: { id: string; x: number; y: number; w: number; h: number }[] = [];
    slide.elements?.forEach((el: AnyEl) => {
      const x = asNum(el.x, 0);
      const y = asNum(el.y, 0);
      const w = asNum(el.width, 0);
      const h = asNum(el.height, 0);
      if (!Number.isNaN(x + y + w + h)) items.push({ id: el.id, x, y, w, h });
    });
    return items;
  }, [userSlides, activeSlide]);

  // compute side padding to allow center snap on first/last slide
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const update = () => {
      const first = slideItemRefs.current[0];
      const itemW = first?.getBoundingClientRect().width ?? artboardWidth;
      if (!itemW) return;
      const pad = Math.max(0, (container.clientWidth - itemW) / 2);
      setSidePadPx(Math.floor(pad));
    };

    update();
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(update);
      ro.observe(container);
      window.addEventListener("resize", update);
      return () => {
        ro.disconnect();
        window.removeEventListener("resize", update);
      };
    }

    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, [artboardWidth, userSlides.length]);

  const centerSlideInView = useCallback((index: number) => {
    const container = scrollRef.current;
    const node = slideItemRefs.current[index];
    if (!container || !node) return;
    const cRect = container.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    const target =
      container.scrollLeft +
      (nRect.left - cRect.left) -
      (cRect.width / 2 - nRect.width / 2);
    const next = Math.max(0, target);
    container.scrollTo({ left: next, behavior: "smooth" });
    if (Math.abs(container.scrollLeft - next) > 2) {
      container.scrollLeft = next;
    }
  }, []);

  // Auto-center active slide in scroller
  useEffect(() => {
    if (userSlides.length <= 1) return;
    requestAnimationFrame(() => requestAnimationFrame(() => centerSlideInView(activeSlide)));
  }, [activeSlide, userSlides.length, sidePadPx, centerSlideInView]);

  const scrollToSlide = (index: number) => {
    setActiveSlide(index);
    setSelectedElId(null);
    requestAnimationFrame(() => requestAnimationFrame(() => centerSlideInView(index)));
  };

  // Update active slide on manual swipe/scroll (mobile/tablet)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || userSlides.length <= 1) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const containerRect = container.getBoundingClientRect();
        const center = containerRect.left + containerRect.width / 2;
        let nearest = activeSlide;
        let minDist = Number.POSITIVE_INFINITY;

        (Object.entries(slideItemRefs.current) as Array<[string, HTMLDivElement | null]>).forEach(
          ([key, node]) => {
            if (!node) return;
            const idx = Number(key);
            if (Number.isNaN(idx)) return;
            const rect = node.getBoundingClientRect();
            const nodeCenter = rect.left + rect.width / 2;
            const dist = Math.abs(nodeCenter - center);
            if (dist < minDist) {
              minDist = dist;
              nearest = idx;
            }
          }
        );

        if (nearest !== activeSlide) {
          setActiveSlide(nearest);
          setSelectedElId(null);
        }
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      container.removeEventListener("scroll", onScroll);
    };
  }, [activeSlide, userSlides.length]);

  const onTextChange = (slideIndex: number, elId: string, text: string) => {
    setIsDirty(true);
    setUserSlides((prev) => {
      const copy = cloneSlides(prev);
      const el = copy[slideIndex]?.elements.find((e) => e.id === elId);
      if (el && el.type === "text" && (el as TextEl).editable !== false) (el as TextEl).text = text;
      return copy;
    });
  };

  const updateElement = (slideIndex: number, elId: string, patch: Partial<AnyEl>) => {
    setIsDirty(true);
    setUserSlides((prev) => {
      const copy = cloneSlides(prev);
      const el = copy[slideIndex]?.elements.find((e) => e.id === elId);
      if (!el || el.editable === false) return copy;
      Object.assign(el, patch);
      return copy;
    });
  };

  const fileInputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const imagePickerClickTimerRef = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (imagePickerClickTimerRef.current !== null) {
        window.clearTimeout(imagePickerClickTimerRef.current);
      }
    };
  }, []);
  const setImageInputRef = (id: string) => (el: HTMLInputElement | null) => {
    fileInputsRef.current[id] = el;
  };

  const focusEditableTextById = useCallback((elId: string) => {
    focusContentEditableNode(editableTextRefs.current[elId] ?? null);
  }, []);

  const enterTextEditMode = useCallback(
    (elId: string) => {
      setSelectedElId(elId);
      setEditingTextId(elId);
      focusEditableTextById(elId);
    },
    [focusEditableTextById]
  );

  const handleTextTouchCommit = useCallback(
    (elId: string, editable: boolean, wasSelected: boolean) => {
      const now = Date.now();
      const lastHandled = textTapHandledRef.current[elId] ?? 0;
      if (now - lastHandled < 40) return;
      textTapHandledRef.current[elId] = now;

      const touchStart = textTouchStartRef.current[elId] ?? now;
      const lastTap = textLastTapRef.current[elId] ?? 0;
      const touchDuration = now - touchStart;
      const sinceLastTap = now - lastTap;

      setSelectedElId(elId);

      if (editable && touchDuration < 260) {
        const shouldEdit = isIos ? wasSelected || sinceLastTap < 420 : sinceLastTap < 320;
        if (shouldEdit) {
          enterTextEditMode(elId);
        }
      }

      textLastTapRef.current[elId] = now;
    },
    [enterTextEditMode, isIos]
  );

  const onImagePicked = async (slideIndex: number, elId: string, file: File | null) => {
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setIsDirty(true);

    setUserSlides((prev) => {
      const copy = cloneSlides(prev);
      const el = copy[slideIndex]?.elements.find((e) => e.id === elId);
      if (el && el.type === "image" && (el as ImageEl).editable !== false) {
        (el as ImageEl).src = dataUrl;
      }
      return copy;
    });
  };

  const openCropForImage = useCallback((slideIndex: number, image: ImageEl) => {
    if (!image?.id || !image?.src || image.editable === false) return;
    setCropTarget({
      slideIndex,
      imageId: image.id,
      src: image.src,
      aspect: Math.max(0.1, Number(image.width || 1) / Math.max(1, Number(image.height || 1))),
    });
  }, []);

  useEffect(() => {
    if (!isIos || !editingTextId) return;
    focusEditableTextById(editingTextId);
  }, [editingTextId, focusEditableTextById, isIos]);

  const isMugCategory = (cat?: string) => /mug/i.test(String(cat ?? ""));
  const isBagCategory = (cat?: string) => /bag|tote/i.test(String(cat ?? ""));
  const isLeafletCategory = (cat?: string) => /business\s*leaflets?/i.test(String(cat ?? ""));
  const isCandleCategory = (cat?: string) => /candle/i.test(String(cat ?? ""));
  const hideTextOutline = useMemo(
    () =>
      isMugCategory(adminDesign?.category) ||
      isBagCategory(adminDesign?.category) ||
      isLeafletCategory(adminDesign?.category),
    [adminDesign?.category]
  );
  const textLineHeight = useMemo(
    () => 1.2,
    [adminDesign?.category]
  );
  const canvasScale = useMemo(() => {
    const base = isCandleCategory(adminDesign?.category) ? (isTablet ? 1.2 : 1.5) : 1;
    return Math.min(base, fitScale);
  }, [adminDesign?.category, isTablet, fitScale]);
  const isFullBleedImage = useCallback(
    (el: AnyEl) => {
      if (el.type !== "image") return false;
      const tol = 8;
      return (
        Math.abs(asNum(el.x, 0)) <= tol &&
        Math.abs(asNum(el.y, 0)) <= tol &&
        asNum(el.width, 0) >= artboardWidth - tol &&
        asNum(el.height, 0) >= artboardHeight - tol
      );
    },
    [artboardWidth, artboardHeight]
  );
  const align = useAlignGuides(activeSlideRef, { scale: canvasScale });
  const previewCapture = useMemo(
    () => ({
      quality: isTablet ? 0.6 : 0.72,
      pixelRatio: isTablet
        ? 1
        : Math.min(1.5, (typeof window !== "undefined" ? window.devicePixelRatio : 1.25) || 1.25),
    }),
    [isTablet]
  );
  // const isBusinessCardCategory = (cat?: string) => /business\s*card/i.test(String(cat ?? ""));
  // const is3DCategory = (cat?: string) =>
    // /mug/i.test(String(cat ?? ""));

  // 1. Capture function ko PNG banao + fonts include karo + blob handle karo
  const capturePngFromNode = async (
    node: HTMLElement,
    opts?: { width?: number; height?: number; background?: string; quality?: number; pixelRatio?: number }
  ): Promise<string | null> => {
    try {
      await waitForAssets(node)

      const rect = node.getBoundingClientRect();
      const w = Math.max(1, Math.round(opts?.width ?? rect.width));
      const h = Math.max(1, Math.round(opts?.height ?? rect.height));

      // PNG capture — quality full, fonts skip nahi karo
      const commonOpts = {
        pixelRatio: opts?.pixelRatio ?? previewCapture.pixelRatio,
        backgroundColor: "#ffffff",
        filter: (n: Node) => {
          return !(n instanceof Element && n.classList?.contains("capture-exclude"));
        },
        cacheBust: true,
        skipFonts: false,
        width: w,
        height: h,
        style: { transform: "none" },
      };

      if (isSafari || isIos) {
        try {
          return await htmlToImage.toPng(node, commonOpts);
        } catch {
          return await htmlToImage.toJpeg(node, {
            ...commonOpts,
            quality: opts?.quality ?? previewCapture.quality,
          });
        }
      }

      return await htmlToImage.toJpeg(node, {
        ...commonOpts,
        quality: opts?.quality ?? previewCapture.quality,
      });


    } catch (e) {
      console.error("capturePngFromNode failed:", e);
      return null;
    }

  };

  const handleNavigatePrview = async () => {
    if (!adminDesign?.category) return;

    // ensure latest edits are persisted before navigating
    persistEditorState();
    setPreviewLoading(true);

    const category = encodeURIComponent(adminDesign.category);

    const navStateBase: any = {
      slides: userSlides,
      config: { mmWidth: artboardWidth, mmHeight: artboardHeight, slideLabels: adminDesign.config.slideLabels },
      canvasPx: adminDesign.canvasPx,
      slideIndex: activeSlide,
      category: adminDesign.category,
    };

    try {
      try {
        sessionStorage.setItem("templ_preview_slides", JSON.stringify(userSlides));
      } catch {}

      // ✅ For mugs: use raw slide data in preview to avoid Safari dropping image layers
      if (isMugCategory(adminDesign.category)) {
        const node = slideRefs.current[0] ?? slideRefs.current[activeSlide];
        const mugImage =
          (isSafari || isIos) && node
            ? await capturePngFromNode(node, {
                width: artboardWidth,
                height: artboardHeight,
                background: "#ffffff",
                quality: previewCapture.quality,
                pixelRatio: previewCapture.pixelRatio,
              })
            : null;
        try {
          if (mugImage) {
            sessionStorage.setItem("templ_preview_mug_image", mugImage);
          } else {
            sessionStorage.removeItem("templ_preview_mug_image");
          }
        } catch {}

        navigate(`${USER_ROUTES.TEMPLET_EDITORS_PREVIEW}/${category}/${productId ?? "state"}`, {
          state: { ...navStateBase, mugImage: mugImage || null },
        });
        return;
      }

      navigate(`${USER_ROUTES.CATEGORIES_EDITORS_PREVIEW}/${productId ?? "state"}`, {
        state: navStateBase,
      });
    } catch (err) {
      console.error("Capture failed:", err);
      toast.error("Preview capture failed. Try again.");
    } finally {
      setPreviewLoading(false);
    }
  };


  // --------- Render ---------
  if (loading) {
    return (
      <Box sx={{ height: "90vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!adminDesign) return <Typography>No template found.</Typography>;

  const sidePad = sidePadPx;

  return (
    <>
      {/* HEADER */}
      <Box px={isTablet ? 2 : 8} pt={1}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <IconButton onClick={handleExit} sx={{ fontSize: 16, color: 'blue' }}>
            <ArrowBackIos fontSize="small" /> exit
          </IconButton>{" "}
          <Chip label={`Slides: ${userSlides.length}`} size="small" />
          {/* <Chip label={`${mmW} × ${mmH} mm`} size="small" /> */}
          <Box flexGrow={1} />
          {/* ✅ loading pass */}
          <LandingButton title="Preview" onClick={handleNavigatePrview} loading={previewLoading} />
        </Stack>
      </Box>

      {/* MAIN */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Scroller */}
        <Box
          ref={scrollRef}
          sx={{
            display: "flex",
            height: "83vh",
            flexDirection: "row",
            alignItems: "center",
            overflowX: "auto",
            overflowY: "hidden",
            width: "100%",
            p: 0,
            gap: isTablet ? 4 : 7,
            justifyContent: "flex-start",
            minWidth: "100%",
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: `${sidePad}px`,
            scrollPaddingRight: `${sidePad}px`,
            "&::-webkit-scrollbar": { height: 6, width: 6 },
            "&::-webkit-scrollbar-thumb": { backgroundColor: COLORS.primary, borderRadius: "20px" },
          }}
        >
          <Box sx={{ flex: "0 0 auto", width: sidePad }} />

          {userSlides.map((slide, i) => {
            const ordered = [...slide.elements].sort((a, b) => {
              const zA = asNum(a.zIndex, 1) + (a.type === "text" ? 100000 : 0);
              const zB = asNum(b.zIndex, 1) + (b.type === "text" ? 100000 : 0);
              return zA - zB;
            });
            const isActive = i === activeSlide;
            const scaledW = artboardWidth * canvasScale;
            const scaledH = artboardHeight * canvasScale;

            return (
              <Box
                key={slide.id}
                ref={setSlideItemRef(i)}
                sx={{
                  position: "relative",
                  display: "flex",
                  gap: 2,
                  flex: "0 0 auto",
                  scrollSnapAlign: "center",
                  opacity: isActive ? 1 : 0.5,
                  filter: isActive ? "none" : "grayscale(0.35)",
                  transition: "opacity .2s ease, filter .2s ease",
                  ml: i === 0 ? (isTablet ? 1 : 3) : 0,
                  width: scaledW,
                  height: scaledH,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* ARTBOARD (scaled for candles) */}
                <Box
                  sx={{
                    width: scaledW,
                    height: scaledH,
                    position: "relative",
                    overflow: "visible",
                  }}
                >
                    <Box
                      ref={(el: any) => {
                      setSlideRef(i)(el);
                      if (isActive) activeSlideRef.current = el;
                      }}
                      sx={{
                      width: artboardWidth,
                      height: artboardHeight,
                      borderRadius: 0,
                      position: "relative",
                      overflow: "hidden",
                      bgcolor: slide.bgColor ?? "transparent",
                      boxShadow: isActive ? 10 : 4,
                      outline: "none",
                      transform: `scale(${canvasScale})`,
                      transformOrigin: "top left",
                    }}
                    onClick={() => {
                      if (!isActive) return;
                      setSelectedElId(null);
                      setEditingTextId(null);
                    }}
                  >
                    <AlignmentGuides {...align.guides} hide={!isActive || !align.isActive} />
                    {ordered.map((el) => {
                    const isLocked = el.editable === false;
                    const isSelected = selectedElId === el.id && isActive;
                    const isBgImage =
                      el.type === "image" &&
                      (String(el.id).startsWith("bg-") || isFullBleedImage(el));
                    const cursor = isSelected ? "text" : isLocked ? "not-allowed" : "text";

                    const canMove =
                      isActive && !isLocked && !isBgImage && (!isTablet || isSelected);
                    const commonRnd = {
                      bounds: "parent" as const,
                      scale: canvasScale,
                      size: { width: el.width, height: el.height },
                      position: { x: el.x, y: el.y },
                      dragCancel: ".no-drag, input, textarea, button, .MuiInputBase-root, .MuiInputBase-input",
                      disableDragging: !canMove,
                      enableResizing: canMove ? { bottomRight: true } : false,
                      style: {
                        zIndex: asNum(el.zIndex, 1),
                        cursor,
                        borderRadius: 1,
                        border: hideTextOutline
                          ? "1px solid transparent"
                          : isSelected
                          ? "1px solid #1976d2"
                          : "1px solid transparent",
                      },
                      onDragStart: () => {
                        if (canMove) align.onDragStart();
                      },
                      onDrag: (_: any, d: any) => {
                        if (!canMove) return;
                        const snap = align.onDrag(d.x, d.y, el.width, el.height, alignItems, el.id);
                        if (snap.snappedX || snap.snappedY) {
                          updateElement(i, el.id, { x: snap.x, y: snap.y });
                        }
                      },
                      onDragStop: (_: any, d: any) => {
                        if (!canMove) return;
                        const snap = align.onDrag(d.x, d.y, el.width, el.height, alignItems, el.id);
                        updateElement(i, el.id, { x: snap.x, y: snap.y });
                        align.onDragStop();
                      },
                      onResizeStop: (_: any, __: any, ref: any, ___: any, position: any) => {
                        if (!canMove) return;
                        const newW = parseInt(ref.style.width, 10);
                        const newH = parseInt(ref.style.height, 10);
                        updateElement(i, el.id, {
                          width: newW,
                          height: newH,
                          x: position.x,
                          y: position.y,
                        });
                        align.onDragStop();
                      },
                    };

                    if (el.type === "image") {
                      const img = el as ImageEl;
                      const isLeaflet = isLeafletCategory(adminDesign?.category);
                      const isBg = String(el.id).startsWith("bg-") || isFullBleedImage(el);
                      const objectFit = isLeaflet && !isBg ? "contain" : "cover";
                      const showTouchOverlay = isIos && isSelected;
                      return (
                        <Rnd key={el.id} {...commonRnd}>
                          <Box
                            sx={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              lastTouchTsRef.current = Date.now();
                              if (!isActive) return;
                              setSelectedElId(el.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isActive) return;
                              setSelectedElId(el.id);
                            }}
                          >
                            <img
                              crossOrigin="anonymous"
                              src={img.src}
                              alt=""
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit,
                                objectPosition: "center",
                                display: "block",
                                backgroundColor: "transparent",
                              }}
                            />

                            {el.editable !== false && isActive && (
                              <Box
                                className="capture-exclude no-drag"
                                sx={{
                                  position: "absolute",
                                  inset: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  opacity: showTouchOverlay ? 1 : 0,
                                  transition: "opacity .15s ease",
                                  "&:hover": { opacity: 1, background: "rgba(0,0,0,0.18)" },
                                  cursor: "pointer",
                                  touchAction: "manipulation",
                                  background: showTouchOverlay ? "rgba(0,0,0,0.18)" : "transparent",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isIos) return;
                                  if (!isActive) return;
                                  setSelectedElId(el.id);
                                  if (imagePickerClickTimerRef.current !== null) {
                                    window.clearTimeout(imagePickerClickTimerRef.current);
                                  }
                                  imagePickerClickTimerRef.current = window.setTimeout(() => {
                                    fileInputsRef.current[el.id]?.click();
                                    imagePickerClickTimerRef.current = null;
                                  }, 220);
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                  if (!isIos) return;
                                  if (!isActive) return;
                                  setSelectedElId(el.id);
                                  fileInputsRef.current[el.id]?.click();
                                }}
                                onDoubleClick={(e) => {
                                  e.stopPropagation();
                                  if (!isActive || el.editable === false) return;
                                  if (imagePickerClickTimerRef.current !== null) {
                                    window.clearTimeout(imagePickerClickTimerRef.current);
                                    imagePickerClickTimerRef.current = null;
                                  }
                                  setSelectedElId(el.id);
                                  openCropForImage(i, img);
                                }}
                              >
                                <Collections sx={{ color: "#fff" }} />
                              </Box>
                            )}

                            <input
                              type="file"
                              accept="image/*"
                              ref={setImageInputRef(el.id)}
                              onChange={(e) => onImagePicked(i, el.id, e.target.files?.[0] || null)}
                              style={{ display: "none" }}
                              disabled={el.editable === false}
                            />
                          </Box>
                        </Rnd>
                      );
                    }

                    if (el.type === "text") {
                      const t = el as TextEl;
                      const align = t.align ?? "center";
                      const justify =
                        align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
                      const rotation = asNum((t as any).rotation, 0);
                      const curve = asNum((t as any).curve, 0);
                      const curveVal = Math.max(-200, Math.min(200, curve));
                      const hasCurve = Math.abs(curveVal) > 0.5;
                      const safeW = Math.max(1, asNum(t.width, 1));
                      const safeH = Math.max(1, asNum(t.height, 1));
                      const curvePx = (curveVal / 100) * (safeH / 2);
                      const midY = safeH / 2;
                      const curvePath = `M 0 ${midY} Q ${safeW / 2} ${midY - curvePx} ${safeW} ${midY}`;
                      const curveId = `curve-${t.id}`;
                      const textAnchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
                      const startOffset = align === "left" ? "0%" : align === "right" ? "100%" : "50%";
                      const textTransform = rotation ? `rotate(${rotation}deg)` : "none";
                      const fontWeight =
                        t.fontWeight != null ? t.fontWeight : t.bold ? 700 : 400;
                      const fontStyle =
                        t.fontStyle != null ? t.fontStyle : t.italic ? "italic" : "normal";
                      const textDecoration = t.textDecoration ?? "none";
                      const fontFamily = t.fontFamily || "inherit";
                      const lineHeight = asNum((t as any).lineHeight, textLineHeight);
                      const textColor = t.color ?? "#000";
                      const isEditing = isActive && editingTextId === el.id;
                      const textRndProps = {
                        ...commonRnd,
                        disableDragging: !canMove || isEditing,
                        enableResizing: !isEditing && canMove ? { bottomRight: true } : false,
                        style: {
                          ...commonRnd.style,
                          touchAction: isEditing ? "manipulation" : "none",
                        },
                      };

                      return (
                        <Rnd
                          key={el.id}
                          {...textRndProps}
                          onMouseDown={(e: any) => {
                            e.stopPropagation();
                            if (!isActive) return;
                            setSelectedElId(el.id);
                          }}
                          onTouchStart={(e: any) => {
                            e.stopPropagation();
                            lastTouchTsRef.current = Date.now();
                            textTouchStartRef.current[el.id] = Date.now();
                            if (!isActive) return;
                            setSelectedElId(el.id);
                          }}
                          onTouchEnd={(e: any) => {
                            e.stopPropagation();
                            if (!isActive) return;
                            handleTextTouchCommit(el.id, t.editable !== false, isSelected || isEditing);
                          }}
                          onPointerDown={(e: any) => {
                            if (e?.pointerType !== "touch") return;
                            lastTouchTsRef.current = Date.now();
                            textTouchStartRef.current[el.id] = Date.now();
                            if (!isActive) return;
                            setSelectedElId(el.id);
                          }}
                          onPointerUp={(e: any) => {
                            if (e?.pointerType !== "touch") return;
                            if (!isActive) return;
                            handleTextTouchCommit(el.id, t.editable !== false, isSelected || isEditing);
                          }}
                        >
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              p: 0,
                              position: "relative",
                              overflow: "visible",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: justify,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isActive) return;
                              setSelectedElId(el.id);
                              const fromRecentTouch = Date.now() - lastTouchTsRef.current < 700;
                              if (t.editable !== false && isTablet && !fromRecentTouch) setEditingTextId(el.id);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (!isActive) return;
                              if (t.editable !== false) enterTextEditMode(el.id);
                              setSelectedElId(el.id);
                            }}
                          >
                            <Box
                              sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: isEditing ? "stretch" : "center",
                                alignContent: "center",
                                justifyContent: justify,
                                transform: textTransform,
                                transformOrigin: "center",
                                overflow: isEditing ? "hidden" : "visible",
                              }}
                            >
                              {t.editable !== false && isActive && (selectedElId === el.id || editingTextId === el.id) ? (
                                <Box
                                  className="no-drag"
                                  contentEditable={isIos ? true : ("plaintext-only" as any)}
                                  dir="ltr"
                                  ref={(node: HTMLDivElement | null) => {
                                    editableTextRefs.current[el.id] = node;
                                    const isFocused =
                                      typeof document !== "undefined" && document.activeElement === node;
                                    if (!isFocused) syncEditableNodeText(node, t.text);
                                  }}
                                  suppressContentEditableWarning
                                  onInput={(e) => {
                                    const next = normalizeEditableText(
                                      (e.currentTarget as HTMLDivElement).innerText ?? ""
                                    );
                                    if (next !== t.text) onTextChange(i, el.id, next);
                                  }}
                                  onKeyDown={(e) => {
                                    if (!isIos || e.key !== "Enter") return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const host = e.currentTarget as HTMLDivElement;
                                    const inserted = insertPlainTextAtCursor("\n");
                                    if (!inserted) {
                                      const current = host.innerText ?? "";
                                      host.innerText = `${current}\n`;
                                      focusContentEditableNode(host);
                                    }
                                    const next = normalizeEditableText(host.innerText ?? "");
                                    if (next !== t.text) onTextChange(i, el.id, next);
                                  }}
                                  onFocus={(e) => {
                                    e.stopPropagation();
                                    syncEditableNodeText(e.currentTarget as HTMLDivElement, t.text);
                                    setEditingTextId(el.id);
                                  }}
                                  onBlur={(e) => {
                                    e.stopPropagation();
                                    const next = normalizeEditableText(
                                      (e.currentTarget as HTMLDivElement).innerText ?? ""
                                    );
                                    if (next !== t.text) onTextChange(i, el.id, next);
                                    setEditingTextId((curr) => (curr === el.id ? null : curr));
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => e.stopPropagation()}
                                  onTouchEnd={(e) => {
                                    e.stopPropagation();
                                    if (!isIos) return;
                                    enterTextEditMode(el.id);
                                  }}
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    maxHeight: "100%",
                                    minHeight: "100%",
                                    display: "flex",
                                    alignContent: "center",
                                    justifyContent: justify,
                                    flexWrap: "wrap",
                                    overflow: "hidden",
                                    textAlign: align as any,
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                    direction: "ltr",
                                    unicodeBidi: "plaintext",
                                    fontWeight,
                                    fontStyle,
                                    fontSize: t.fontSize,
                                    fontFamily,
                                    color: textColor,
                                    textDecoration,
                                    lineHeight,
                                    backgroundColor: "transparent",
                                    outline: "none",
                                    border: "none",
                                    p: 0,
                                    m: 0,
                                    cursor: "text",
                                    userSelect: "text",
                                    WebkitUserSelect: "text",
                                    WebkitUserModify: isIos ? ("read-write-plaintext-only" as any) : undefined,
                                    WebkitTouchCallout: "default",
                                    touchAction: "manipulation",
                                  }}
                                />
                              ) : hasCurve ? (
                                <Box
                                  component="svg"
                                  viewBox={`0 0 ${safeW} ${safeH}`}
                                  sx={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
                                >
                                  <defs>
                                    <path id={curveId} d={curvePath} />
                                  </defs>
                                  <text
                                    fill={textColor}
                                    fontFamily={fontFamily}
                                    fontSize={t.fontSize}
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
                                        fontSize: t.fontSize,
                                        fontWeight,
                                        fontStyle,
                                        textDecoration,
                                      }}
                                    >
                                      {t.text}
                                    </textPath>
                                  </text>
                                </Box>
                              ) : (
                                <Typography
                                  sx={{
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    alignContent: "center",
                                    justifyContent: justify,
                                    fontWeight,
                                    fontStyle,
                                    fontSize: t.fontSize,
                                    fontFamily,
                                    color: textColor,
                                    textAlign: align as any,
                                    textDecoration,
                                    lineHeight,
                                    whiteSpace: "pre-wrap",
                                    overflow: "visible",
                                    direction: "ltr",
                                    unicodeBidi: "plaintext",
                                    userSelect: "none",
                                  }}
                                >
                                  {t.text}
                                </Typography>
                              )}
                            </Box>

                          </Box>
                        </Rnd>
                      );
                    }

                    if (el.type === "sticker") {
                      const st = el as StickerEl;
                      return (
                        <Rnd key={el.id} {...commonRnd}>
                          <Box
                            component="img"
                            src={st.src}
                            alt=""
                            sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              lastTouchTsRef.current = Date.now();
                              if (!isActive) return;
                              setSelectedElId(el.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isActive) return;
                              setSelectedElId(el.id);
                            }}
                          />
                        </Rnd>
                      );
                    }

                    return null;
                    })}
                  </Box>
                </Box>
              </Box>
            );
          })}
          <Box sx={{ flex: "0 0 auto", width: sidePad }} />
        </Box>
      </Box>
      {/* Thumbnails */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mt: 2,
          alignItems: "center",
          justifyContent: "center",
          overflowX: "auto",
          maxWidth: "100%",
          px: 1,
          flexWrap: "nowrap",
          scrollBehavior: "smooth",
          position: "relative",
          zIndex: 2,
          "&::-webkit-scrollbar": { height: 6 },
          "&::-webkit-scrollbar-thumb": { backgroundColor: COLORS.primary, borderRadius: "20px" },
        }}
      >
        <IconButton onClick={() => scrollToSlide(Math.max(0, activeSlide - 1))}>
          <ArrowBackIos />
        </IconButton>

        {userSlides.map((slide, i) => (
          <Box
            key={slide.id}
            onClick={() => scrollToSlide(i)}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: 2,
              cursor: "pointer",
              bgcolor: activeSlide === i ? "#1976d2" : "#eceff1",
              color: activeSlide === i ? "white" : "#000",
            }}
          >
            {slide.label}
          </Box>
        ))}

        <IconButton onClick={() => scrollToSlide(Math.min(activeSlide + 1, userSlides.length - 1))}>
          <ArrowForwardIos />
        </IconButton>
      </Box>

      <ImageCropModal
        open={!!cropTarget}
        imageSrc={cropTarget?.src ?? ""}
        aspect={cropTarget?.aspect ?? 1}
        onClose={() => setCropTarget(null)}
        onApply={(croppedImageSrc) => {
          if (!cropTarget) {
            setCropTarget(null);
            return;
          }
          updateElement(cropTarget.slideIndex, cropTarget.imageId, { src: croppedImageSrc });
          setCropTarget(null);
        }}
      />

      {/* Exit Draft Modal */}
      <Modal open={showExitModal} onClose={() => setShowExitModal(false)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { md: 480, sm: 420, xs: "92%" },
            bgcolor: "background.paper",
            borderRadius: 2,
            p: 3,
            boxShadow: 24,
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Save your changes as draft?</Typography>
          <Typography sx={{ fontSize: 14, opacity: 0.8, mb: 3 }}>
            If you leave now, you can resume this template later.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <LandingButton
              title="Discard & Exit"
              personal
              variant="outlined"
              width="160px"
              onClick={() => {
                setShowExitModal(false);
                discardEditorState();
              }}
            />
            <LandingButton
              title="Save Draft"
              personal
              width="160px"
              onClick={handleSaveDraftAndExit}
            />
          </Stack>
        </Box>
      </Modal>
    </>
  );
}

