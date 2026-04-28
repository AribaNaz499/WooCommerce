import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import toast from "react-hot-toast";
import { supabase } from "../../../supabase/supabase";
import { API_BASE } from "../../../lib/apiBase";
import { removeWhiteBg } from "../../../lib/lib";
import { renderTemplateSlideToCanvas } from "../../../lib/templateSlideCanvas";
import {
  clearSlidesFromScopes,
  loadSlidesFromScopes,
  resolveSlidesScopeCandidates,
} from "../../../lib/slidesScope";
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
import useModal from "../../../hooks/useModal";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { Check, ErrorOutline, HourglassEmptyOutlined } from "@mui/icons-material";

type Status = "loading" | "success" | "error";
type RawSlide = { id: number; label?: string; elements: any[]; bgColor?: string | null };
type LegacyRuntimeSnapshot = {
  capturedAt?: number;
  slide1?: Record<string, any>;
  slide2?: Record<string, any>;
  slide3?: Record<string, any>;
  slide4?: Record<string, any>;
};
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

async function getTokenSafely() {
  const { data } = await supabase.auth.getSession();
  if (data?.session?.access_token) return data.session.access_token;

  try {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.data?.session?.access_token) {
      return refreshed.data.session.access_token;
    }
  } catch {}

  const retry = await supabase.auth.getSession();
  return retry.data?.session?.access_token || null;
}

async function getSlidesPayload(scopes: string[]) {
  try {
    const scopedSlides = await loadSlidesFromScopes(scopes);
    if (scopedSlides && Object.keys(scopedSlides).length) return scopedSlides;
  } catch {}

  try {
    const raw = !scopes.length
      ? sessionStorage.getItem("slides") ||
        localStorage.getItem("slides_backup") ||
        "{}"
      : "{}";
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const getValidSlides = (slides?: Record<string, any> | null) =>
  Object.fromEntries(
    Object.entries(slides ?? {}).filter(
      ([, value]) => typeof value === "string" && value.startsWith("data:image/"),
    ),
  ) as Record<string, string>;

const singularizeCategory = (name?: string) => {
  const trimmed = String(name ?? "").trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  if (lower.endsWith("ss")) return trimmed;
  if (lower.endsWith("s")) return trimmed.slice(0, -1);
  return trimmed;
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

const buildPdfFileName = (category?: string, ext: "pdf" | "png" = "pdf") => {
  const label = singularizeCategory(category);
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

const toNum = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const clipText = (value: unknown, max = 20) => {
  const text = String(value ?? "").trim();
  return text.length > max ? `${text.slice(0, max)}.....` : text;
};

const mapAlign = (value: unknown): "left" | "center" | "right" => {
  const raw = String(value ?? "").toLowerCase().trim();
  if (raw === "start") return "left";
  if (raw === "end") return "right";
  if (raw === "left" || raw === "right") return raw;
  return "center";
};

const pushImageElement = (elements: any[], input: any, type: "image" | "sticker" = "image") => {
  const src = String(input?.src ?? input?.sticker ?? input?.image ?? input?.url ?? input?.originalSrc ?? "").trim();
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
      lineHeight: 1.1,
    },
    { align: "left" },
  );
};

const readLegacyRuntimeSnapshot = (): LegacyRuntimeSnapshot | null => {
  try {
    const raw = sessionStorage.getItem("card_runtime_snapshot");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as LegacyRuntimeSnapshot) : null;
  } catch {
    return null;
  }
};

const buildLegacySlidesFromSnapshot = async (snapshot: LegacyRuntimeSnapshot): Promise<RawSlide[]> => {
  const slideStates = [snapshot.slide1, snapshot.slide2, snapshot.slide3, snapshot.slide4].map((state, index) => ({
    ...(state ?? {}),
    id: index + 1,
  }));
  return await Promise.all(
    slideStates.map(async (slideState: any) => {
      const elements: any[] = [];
      const selectedSet = new Set((slideState.selectedImg ?? []).map((id: any) => String(id)));
      for (const entry of slideState.layout?.elements ?? []) pushImageElement(elements, entry, "image");
      for (const entry of slideState.layout?.textElements ?? []) pushTextElement(elements, entry);
      for (const entry of slideState.layout?.stickers ?? []) pushImageElement(elements, entry, "sticker");
      for (const image of slideState.draggableImages ?? []) {
        if (selectedSet.size && !selectedSet.has(String(image?.id))) continue;
        pushImageElement(elements, image, "image");
      }
      if (slideState.multipleTextValue) {
        (slideState.texts ?? []).forEach((text: any, index: number) => {
          pushTextElement(elements, {
            ...text,
            width: 470,
            height: 210,
            x: 8,
            y: 8 + index * 220,
            lineHeight: text?.lineHeight ?? slideState.lineHeight,
            letterSpacing: text?.letterSpacing ?? slideState.letterSpacing,
          });
        });
      } else if (slideState.selectedLayout === "oneText" && String(slideState.oneTextValue ?? "").trim()) {
        pushTextElement(elements, {
          id: `single-text-${slideState.id}`,
          text: slideState.oneTextValue,
          x: 10,
          y: 10,
          width: 465,
          height: 680,
          fontSize: slideState.fontSize,
          fontFamily: slideState.fontFamily,
          fontColor: slideState.fontColor,
          fontWeight: slideState.fontWeight,
          textAlign: slideState.textAlign,
          lineHeight: slideState.lineHeight,
          letterSpacing: slideState.letterSpacing,
        });
      } else {
        for (const text of slideState.textElements ?? []) pushTextElement(elements, text);
      }
      if (slideState.isAIimage && slideState.selectedAIimageUrl) {
        pushImageElement(elements, {
          id: `ai-${slideState.id}`,
          src: slideState.selectedAIimageUrl,
          x: slideState.aimage?.x,
          y: slideState.aimage?.y,
          width: slideState.aimage?.width,
          height: slideState.aimage?.height,
          zIndex: 10,
        });
      }
      for (const sticker of slideState.selectedStickers ?? []) pushImageElement(elements, sticker, "sticker");
      await addLegacyMediaElements(elements, slideState.id, "video", slideState.selectedVideoUrl, slideState.qrPosition);
      await addLegacyMediaElements(elements, slideState.id, "audio", slideState.selectedAudioUrl, slideState.qrAudioPosition);
      return {
        id: slideState.id,
        label: `slide${slideState.id}`,
        bgColor: slideState.bgColor ?? "#ffffff",
        elements,
      };
    }),
  );
};

const renderSlidesToImages = async (slides: RawSlide[], format: "jpeg" | "png") => {
  const out: string[] = [];
  for (let i = 0; i < slides.length; i++) {
    const canvas = await renderTemplateSlideToCanvas(slides[i] as any, {
      width: LEGACY_SLIDE_CAPTURE.w,
      height: LEGACY_SLIDE_CAPTURE.h,
      pixelRatio: format === "png" ? 3 : 2.5,
      backgroundColor: format === "png" ? "transparent" : "#ffffff",
    });
    out.push(format === "png" ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.88));
  }
  return out;
};

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

function getSelectedPlan() {
  return (
    localStorage.getItem("selectedSize") ||
    JSON.parse(localStorage.getItem("selectedVariant") || "{}")?.key ||
    null
  );
}

function getSelectedCategory() {
  try {
    if (typeof window !== "undefined") {
      const fromUrl = new URLSearchParams(window.location.search).get("category");
      if (fromUrl) return fromUrl;
    }
  } catch {}

  const direct = localStorage.getItem("selectedCategory");
  if (direct) return direct;

  try {
    const variant = JSON.parse(localStorage.getItem("selectedVariant") || "{}");
    if (variant?.category) return variant.category;
  } catch {}

  try {
    const raw = JSON.parse(localStorage.getItem("selectedProduct") || "{}");
    return raw?.category || "";
  } catch {
    return "";
  }
}

function getSelectedProductKey() {
  try {
    const raw = JSON.parse(localStorage.getItem("selectedProduct") || "{}");
    if (raw?.id && raw?.type) return `${raw.type}:${raw.id}`;
  } catch {}
  return "";
}

export default function PremiumSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = useMemo(() => searchParams.get("session_id"), [searchParams]);

  const { open, openModal, closeModal } = useModal();
  const [status, setStatus] = useState<Status>("loading");
  const [msg, setMsg] = useState("");
  const slidesScopeKeys = useMemo(
    () => {
      let storedType = "";
      try {
        const storedProduct = JSON.parse(localStorage.getItem("selectedProduct") || "{}");
        storedType = String(storedProduct?.type ?? storedProduct?.__type ?? "");
      } catch {}

      return resolveSlidesScopeCandidates({
        includeStoredDraft: !/template|templet/i.test(storedType),
        productKey: getSelectedProductKey(),
        category: getSelectedCategory(),
        cardSize: getSelectedPlan(),
      });
    },
    [],
  );

  const clearPreviewStorage = () => {
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
    } catch {}

    try {
      localStorage.removeItem("slides_backup");
    } catch {}

    try {
      void clearSlidesFromScopes(slidesScopeKeys);
    } catch {}

    try {
      delete (globalThis as any).__slidesCache;
      delete (globalThis as any).__rawSlidesCache;
      delete (globalThis as any).__previewConfigCache;
    } catch {}
  };

  async function handlePaymentSuccess() {
    if (!sessionId) return;

    openModal();
    setStatus("loading");

    try {
      const token = await getTokenSafely();
      if (!token) throw new Error("Login required");

      const sentKey = `payment_email_sent_${sessionId}`;
      const sentState = sessionStorage.getItem(sentKey);
      if (sentState === "1" || sentState === "sending") {
        setStatus("success");
        setMsg("Payment successful. File sent to your email 📧");
        return;
      }
      sessionStorage.setItem(sentKey, "sending");

      const runtimeSnapshot = readLegacyRuntimeSnapshot();
      const isLegacyPreviewRuntime =
        sessionStorage.getItem("card_preview_downloaded") === "1" && Boolean(runtimeSnapshot);
      if (isLegacyPreviewRuntime && runtimeSnapshot) {
        const categoryName = getSelectedCategory();
        const outputFormat: "pdf" | "png" =
          /sticker|bag|tote|clothing|clothes|apparel|notebook|coaster|mug/i.test(String(categoryName ?? ""))
            ? "png"
            : "pdf";
        const exportRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const rawSlides = await buildLegacySlidesFromSnapshot(runtimeSnapshot);
        const images = await renderSlidesToImages(rawSlides, outputFormat === "png" ? "png" : "jpeg");
        if (!images.length) throw new Error("No fresh slides available");

        if (outputFormat === "png") {
          images.forEach((src, index) => {
            triggerBrowserDownload(
              src,
              buildUniqueExportFileName(categoryName, "png", `${exportRequestId}-${index + 1}`),
            );
          });
        } else {
          let pdf: jsPDF | null = null;
          for (const src of images) {
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

        sessionStorage.setItem(`payment_email_sent_${sessionId}`, "1");
        clearPreviewStorage();
        setStatus("success");
        setMsg("Payment successful. Fresh file downloaded.");
        toast.success("Fresh file downloaded successfully!");
        return;
      }

      const rawSlides = await getSlidesPayload(slidesScopeKeys);
      const cardSize = getSelectedPlan();
      const categoryName = getSelectedCategory();
      const slidesAlreadyMirrored = (() => {
        try {
          return sessionStorage.getItem("slides_mirrored") === "1";
        } catch {
          return false;
        }
      })();
      const mirrorPrint = isMirrorPrintCategory(categoryName) && !slidesAlreadyMirrored;
      const baseSlides = mirrorPrint ? await mirrorSlides(rawSlides) : rawSlides;
      if (slidesAlreadyMirrored) {
        try {
          sessionStorage.removeItem("slides_mirrored");
          sessionStorage.removeItem("slides_mirrored_category");
        } catch {}
      }
      const isTwoUpLandscape = isCardsCategory(categoryName) && isParallelCardSize(cardSize);
      const isInviteTwoUp =
        /invite/i.test(String(categoryName ?? "")) && isInviteTwoUpSize(cardSize);
      const isLeafletTwoUp =
        isBusinessLeafletsCategory(categoryName) && isLeafletTwoUpSize(cardSize);
      const isTenUpBusinessCards =
        isBusinessCardsCategory(categoryName) && isBusinessCardPrintSize(cardSize);
      const isCandlesGrid = isCandlesCategory(categoryName);
      const isCoastersGrid = isCoastersCategory(categoryName);
      const isNotebookTwoUp =
        isNotebooksCategory(categoryName) && isNotebookTwoUpSize(cardSize);
      const isMugWrap = /mug/i.test(String(categoryName ?? "")) && isMugWrapSize(cardSize);

      const isStickerForPdf = /sticker/i.test(String(categoryName ?? ""));
      const isBagCategory = /bag|tote/i.test(String(categoryName ?? ""));
      const isClothingCategory = /clothing|clothes|apparel/i.test(
        String(categoryName ?? "")
      );
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

      const processedCandleSlides = isCandlesGrid
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
              })
            );
            return Object.fromEntries(entries);
          })()
        : baseSlides;

      const processedCoasterSlides = isCoastersGrid
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
              })
            );
            return Object.fromEntries(entries);
          })()
        : baseSlides;

      const coasterSlides = isCoastersGrid
        ? (() => {
            const keys = Object.keys(processedCoasterSlides)
              .filter((k) => processedCoasterSlides[k])
              .sort();
            const limited = keys.slice(0, 2);
            return Object.fromEntries(limited.map((k) => [k, processedCoasterSlides[k]]));
          })()
        : processedCoasterSlides;

      const processedMugSlides = isMugWrap
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
              })
            );
            return Object.fromEntries(entries);
          })()
        : baseSlides;

      const processedBgSlides = bgRemoveOpts
        ? await (async () => {
            const entries = await Promise.all(
              Object.entries(baseSlides as Record<string, string>).map(async ([k, v]) => {
                const src = typeof v === "string" ? v : "";
                if (!src) return [k, v] as const;
                const cleaned = await removeWhiteBg(src, bgRemoveOpts);
                return [k, cleaned] as const;
              })
            );
            return Object.fromEntries(entries);
          })()
        : baseSlides;

      const notebookSlides = (() => {
        if (!isNotebookTwoUp) return baseSlides;
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
        if (!isLeafletTwoUp) return baseSlides;
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

      const slides = isTenUpBusinessCards
        ? await buildTenUpSlides(baseSlides, {
            columns: 2,
            rows: 5,
            gapPx: 10,
            marginPx: 0,
            orientation: "portrait",
            fit: "cover",
            pageMm: getPageMmForSize(cardSize),
          })
        : isCandlesGrid
        ? await buildFixedGridSlides(processedCandleSlides, {
            columns: 2,
            rows: 3,
            labelMm: { w: 70, h: 70 },
            gapMm: 0,
            distribute: true,
            fit: "contain",
            pageMm: getPageMmForSize(cardSize),
            fillMode: "sequence",
          })
        : isCoastersGrid
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
        : isMugWrap
        ? await buildFixedGridSlides(processedMugSlides, {
            columns: 1,
            rows: 1,
            labelMm: getMugWrapPageMm(cardSize),
            gapMm: 0,
            distribute: false,
            fit: "cover",
            pageMm: getMugWrapPageMm(cardSize),
            background: "transparent",
            outputFormat: "png",
          })
        : isInviteTwoUp
        ? await buildFixedGridSlides(baseSlides, {
            columns: 2,
            rows: 1,
            labelMm: getPageMmForSize(cardSize),
            gapMm: 0,
            distribute: false,
            fit: "contain",
            pageMm: getInviteTwoUpPageMm(cardSize),
          })
        : isNotebookTwoUp
        ? await buildTwoUpSlides(notebookSlides, {
            gapPx: 0,
            orientation: "landscape",
            fit: "contain",
            pairStrategy: "sequential",
            swapPairs: false,
            pageMm: getNotebookTwoUpPageMm(cardSize),
            background: "transparent",
            outputFormat: "png",
          })
        : isLeafletTwoUp
        ? await buildTwoUpSlides(leafletSlides, {
            gapPx: 0,
            orientation: "landscape",
            fit: "cover",
            pairStrategy: "sequential",
            swapPairs: false,
            pageMm: getLeafletTwoUpPageMm(cardSize),
          })
        : isTwoUpLandscape
        ? await buildTwoUpSlides(baseSlides, {
            gapPx: 0,
            orientation: "landscape",
            fit: "cover",
            pairStrategy: "outer-inner",
            swapPairs: true,
            pageMm: getPageMmForSize(cardSize),
            pageTitle: ({ pageIndex }) => {
              if (pageIndex === 1) return "Page 1: (front) and (back)";
              if (pageIndex === 2) return "Page 2: (inside 1) and (inside 2)";
              return null;
            },
          })
        : processedBgSlides;

      if (!Object.keys(slides).length) {
        throw new Error("Slides data missing");
      }

      const outputFormat = isTransparentPdf ? "png" : "pdf";
      const validSlides = getValidSlides(slides as Record<string, string>);
      if (!Object.keys(validSlides).length) {
        throw new Error("No valid slides found");
      }

      const res = await fetch(`${API_BASE}/pdf/send-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId,
          session_id: sessionId,
          payment_session_id: sessionId,
          paid: true,
          slides: validSlides,
          cardSize,
          category: categoryName,
          emailSubject: buildEmailSubject(categoryName),
          email_subject: buildEmailSubject(categoryName),
          fileName: buildPdfFileName(categoryName, outputFormat),
          ...(isTransparentPdf ? { outputFormat } : {}),
          ...(isTwoUpLandscape || isLeafletTwoUp || isNotebookTwoUp || isInviteTwoUp || isMugWrap
            ? { pageOrientation: "landscape" }
            : {}),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Failed (${res.status})`);
      }

      sessionStorage.setItem(`payment_email_sent_${sessionId}`, "1");
      clearPreviewStorage();

      setStatus("success");
      setMsg("Payment successful. File sent to your email 📧");
      toast.success("File generated & sent to your email!");
    } catch (e: any) {
      if (sessionId) {
        sessionStorage.removeItem(`payment_email_sent_${sessionId}`);
      }
      setStatus("error");
      setMsg(e?.message || "Failed");
      toast.error(e?.message || "Failed");
    }
  }

  useEffect(() => {
    handlePaymentSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const title =
    status === "loading"
      ? "Processing your payment..."
      : status === "success"
      ? "✅ Payment Successful"
      : "❌ Payment Failed";

  const icon =
    status === "loading" ? (
      <HourglassEmptyOutlined fontSize="large" />
    ) : status === "success" ? (
      <Check color="success" fontSize="large" />
    ) : (
      <ErrorOutline color="error" fontSize="large" />
    );

  const btnText =
    status === "loading"
      ? "Please wait..."
      : status === "success"
      ? "Open Gmail"
      : "Try Again";

  const onPrimary = () => {
    if (status === "success") {
      window.open("https://mail.google.com", "_blank");
      return;
    }
    handlePaymentSuccess();
  };

  const onClose = () => {
    if (status === "loading") return;
    closeModal();
    navigate("/subscription");
  };

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "white",
      }}
    >
      {open && (
        <ConfirmModal
          open={open}
          onCloseModal={onClose}
          title={title}
          icon={icon}
          btnText={btnText}
          onClick={onPrimary}
        />
      )}

      {open && status === "error" && (
        <Box
          sx={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            bgcolor: "#fff",
            border: "1px solid #eee",
            px: 2,
            py: 1,
            borderRadius: 2,
          }}
        >
          {msg}
        </Box>
      )}
    </Box>
  );
}
