import { createContext, useContext, useEffect, useRef, useState, useMemo, type MouseEvent as ReactMouseEvent, type ComponentProps } from "react";
import {
  Box,
  IconButton,
  TextField,
  Tooltip,
  Typography,
  Switch,
  Paper,
  Chip,
} from "@mui/material";
import {
  Close,
  // Edit,
  Forward10,
  Forward30,
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
  TitleOutlined,
  UploadFileRounded,
  LockOutlined,
  LockOpenOutlined,
  ContentCopyOutlined,
} from "@mui/icons-material";
import { useSlide1 } from "../../context/Slide1Context";
import { useLocation, useParams } from "react-router-dom";
import { Rnd } from "react-rnd";
import { motion } from "framer-motion";
import QrGenerator from "../QR-code/Qrcode";
import { COLORS } from "../../constant/color";
import mergePreservePdf from "../../utils/mergePreservePdf";
import { safeGetStorage } from "../../lib/storage";
import { getDraftCardId, isUuid } from "../../lib/draftCardId";
import { readDraftFull } from "../../lib/draftLocal";
import { pickPolygonLayout } from "../../lib/polygon";
import { isIosTouchDevice } from "../../lib/platform";
import { fetchCardById, fetchDraftByCardId } from "../../source/source";
import AlignmentGuides from "../AlignmentGuides/AlignmentGuides";
import { useAlignGuides } from "../../hooks/useAlignGuides";
import UserKonvaPreview from "../KonvaPreview/UserKonvaPreview";
import ImageCropModal from "../ImageCropModal/ImageCropModal";

/* ===================== helpers + types ===================== */
const num = (v: any, d = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : d);
const str = (v: any, d = "") => (typeof v === "string" ? v : d);
const bool = (v: any, d = false) => (typeof v === "boolean" ? v : d);
const idOrIdx = (obj: any, idx: number, prefix: string) => str(obj?.id, `${prefix}-${idx}`);

type ElementEl = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string | null;
  zIndex?: number;
  rotation?: number;
  isEditable?: boolean;
  locked?: boolean;
  clipPath?: any
};
type StickerEl = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation?: number;
  sticker?: string | null;
  isEditable?: boolean;
  locked?: boolean;
};
type TextEl = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  textAlign: "left" | "center" | "right";
  verticalAlign: "top" | "center" | "bottom";
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: number;
  italic?: boolean;
  zIndex?: number;
  isEditable?: boolean;
  locked?: boolean;
};
type LayoutNorm = {
  elements: ElementEl[];
  stickers: StickerEl[];
  textElements: TextEl[];
};

type RndProps = ComponentProps<typeof Rnd>;
const CanvasScaleContext = createContext(1);
const ScaledRnd = (props: RndProps) => {
  const scale = useContext(CanvasScaleContext);
  return <Rnd {...props} scale={props.scale ?? scale} />;
};

export const toElement = (obj: any, i: number, editable: boolean, prefix = "bg"): ElementEl => ({
  id: idOrIdx(obj, i, prefix),
  x: num(obj?.x, 0),
  y: num(obj?.y, 0),
  width: num(obj?.width, num(obj?.w, 200)),
  height: num(obj?.height, num(obj?.h, 200)),
  src: obj?.src ?? obj?.image ?? obj?.url ?? null,
  zIndex: num(obj?.zIndex, 1),
  rotation: num(obj?.rotation, 0),
  isEditable: editable,
  locked: bool(obj?.locked, !editable),
  clipPath: obj?.clipPath ?? obj?.shapePath ?? null,
});
export const toSticker = (obj: any, i: number, editable: boolean, prefix = "st"): StickerEl => ({
  id: idOrIdx(obj, i, prefix),
  x: num(obj?.x, 0),
  y: num(obj?.y, 0),
  width: num(obj?.width, 80),
  height: num(obj?.height, 80),
  zIndex: num(obj?.zIndex, 1),
  rotation: num(obj?.rotation, 0),
  sticker: obj?.sticker ?? obj?.src ?? obj?.image ?? obj?.url ?? null,
  isEditable: editable,
  locked: bool(obj?.locked, !editable),
});
export const toText = (obj: any, i: number, editable: boolean, prefix = "te"): TextEl => {
  const tAlign = str(obj?.textAlign, "center");
  const vAlign = str(obj?.verticalAlign, "center");
  return {
    id: idOrIdx(obj, i, prefix),
    x: num(obj?.x, num(obj?.position?.x, 0)),
    y: num(obj?.y, num(obj?.position?.y, 0)),
    width: num(obj?.width, num(obj?.w, num(obj?.size?.width, 240))),
    height: num(obj?.height, num(obj?.h, num(obj?.size?.height, 60))),
    text: str(obj?.text ?? obj?.value, ""),
    textAlign: (tAlign === "start" ? "left" : tAlign === "end" ? "right" : tAlign) as TextEl["textAlign"],
    verticalAlign: (["top", "bottom"].includes(vAlign) ? (vAlign as any) : "center") as TextEl["verticalAlign"],
    fontSize: num(obj?.fontSize, 18),
    fontFamily: str(obj?.fontFamily, "Roboto"),
    color: str(obj?.fontColor ?? obj?.color, "#000"),
    fontWeight: num(obj?.fontWeight ?? obj?.bold, 400),
    italic: bool(obj?.italic, false),
    zIndex: num(obj?.zIndex, 1),
    isEditable: editable,
    locked: bool(obj?.locked, !editable),
  };
};

const normalizeMultiTexts = (arr: any[]) =>
  (Array.isArray(arr) ? arr : []).map((t) => ({
    ...t,
    fontSize1: t?.fontSize1 ?? t?.fontSize ?? 16,
    fontWeight1: t?.fontWeight1 ?? t?.fontWeight ?? 400,
    fontColor1: t?.fontColor1 ?? t?.fontColor ?? "#000000",
    fontFamily1: t?.fontFamily1 ?? t?.fontFamily ?? "Roboto",
    textAlign: t?.textAlign ?? "center",
    verticalAlign: t?.verticalAlign ?? "top",
    lineHeight: t?.lineHeight ?? 1.5,
    letterSpacing: t?.letterSpacing ?? 0,
  }));

const stripLayoutTextElements = (
  layout: any,
  opts: { stripMulti?: boolean; stripOne?: boolean }
) => {
  if (!layout || !Array.isArray(layout.textElements)) return layout;
  const { stripMulti, stripOne } = opts;
  if (!stripMulti && !stripOne) return layout;
  const textElements = layout.textElements.filter((t: any) => {
    const id = String(t?.id ?? "");
    if (stripMulti && id.startsWith("mte-")) return false;
    if (stripOne && (id === "single-text" || id.startsWith("ote-"))) return false;
    return true;
  });
  return { ...layout, textElements };
};

export function normalizeSlide(slide: any): {
  bgColor: string | null;
  bgImage: string | null;
  layout: LayoutNorm;
} {
  if (!slide || typeof slide !== "object") {
    return { bgColor: null, bgImage: null, layout: { elements: [], stickers: [], textElements: [] } };
  }
  const layout = slide.layout ?? {};
  const user = slide.user ?? {};
  const bg = slide.bg ?? {};
  const flags = slide.flags ?? {};
  const rect = bg?.rect ?? { x: 0, y: 0, width: 0, height: 0 };
  const bgEditable = bool(bg?.editable, false);       // default locked
  const bgLocked = bool(bg?.locked, !bgEditable);

  const out: LayoutNorm = { elements: [], stickers: [], textElements: [] };

  // bg frames (locked/editable)
  out.elements.push(...(layout?.bgFrames?.locked ?? []).map((o: any, i: number) => toElement(o, i, false, "bg-locked")));
  out.elements.push(...(layout?.bgFrames?.editable ?? []).map((o: any, i: number) => toElement(o, i, true, "bg-edit")));
  out.textElements.push(...(user?.freeTexts ?? []).map((o: any, i: number) => toText(o, i, !o?.locked, "ut")));

  // single bg image
  if (bg?.image) {
    out.elements.push(
      toElement(
        {
          id: "bg-image",
          x: num(rect.x, 0),
          y: num(rect.y, 0),
          width: num(rect.width, 0),
          height: num(rect.height, 0),
          src: bg.image,
          zIndex: 0,
          rotation: 0,
          locked: bgLocked,          // hard lock flag
        },
        9990,
        bgEditable && !bgLocked,      // isEditable flag for UI
        "bg",
      ),
    );
  }

  // user images as elements
  out.elements.push(...(user?.images?.locked ?? []).map((o: any, i: number) => toElement(o, i, false, "uimg-locked")));
  out.elements.push(...(user?.images?.editable ?? []).map((o: any, i: number) => toElement(o, i, true, "uimg-edit")));

  // stickers (layout + user + qrVideo)
  // out.stickers.push(...(layout?.stickers?.locked ?? []).map((o: any, i: number) => toSticker(o, i, false, "st-locked")));
  // out.stickers.push(...(layout?.stickers?.editable ?? []).map((o: any, i: number) => toSticker(o, i, true, "st-edit")));
  out.stickers.push(...(user?.stickers?.locked ?? []).map((o: any, i: number) => toSticker(o, i, false, "ust-locked")));
  out.stickers.push(...(user?.stickers?.editable ?? []).map((o: any, i: number) => toSticker(o, i, true, "ust-edit")));

  if (slide.qrVideo?.url) {
    out.stickers.push(
      toSticker(
        {
          id: "qr-video",
          x: num(slide.qrVideo.x, 56),
          y: num(slide.qrVideo.y, 404),
          width: num(slide.qrVideo.width, 70),
          height: num(slide.qrVideo.height, 105),
          zIndex: num(slide.qrVideo.zIndex, 1000),
          url: slide.qrVideo.url,
        },
        9991,
        false,
        "qr",
      ),
    );
  }

  // texts
  // out.textElements.push(...(layout?.staticText ?? []).map((o: any, i: number) => toText(o, i, !!o?.editable, "te")));
  const multiRaw = Array.isArray(slide?.multipleTexts) ? slide.multipleTexts : [];
  const hasMultiContent = multiRaw.some(
    (o: any) => str(o?.text ?? o?.value, "").trim().length > 0
  );
  const includeMulti = flags?.multipleText === true || hasMultiContent;
  const multiToRender = includeMulti ? multiRaw : [];
  out.textElements.push(
    ...multiToRender.map((o: any, i: number) => {
      const explicit =
        typeof o?.isEditable === "boolean"
          ? o.isEditable
          : typeof o?.editable === "boolean"
            ? o.editable
            : undefined;
      const editable = explicit ?? !o?.locked;
      return toText(o, i, editable, "mte");
    })
  );
  if (slide.oneText && str(slide.oneText.value, "").trim().length > 0) {
    out.textElements.push(
      toText(
        {
          id: "single-text",
          x: num(slide.oneText.x, 24),
          y: num(slide.oneText.y, 24),
          width: num(slide.oneText.width, 360),
          height: num(slide.oneText.height, 120),
          text: slide.oneText.value,
          fontSize: slide.oneText.fontSize,
          fontFamily: slide.oneText.fontFamily,
          fontColor: slide.oneText.fontColor,
          fontWeight: slide.oneText.fontWeight,
          textAlign: slide.oneText.textAlign,
          verticalAlign: slide.oneText.verticalAlign,
          italic: false,
          zIndex: 1,
        },
        9992,
        true,
        "ote",
      ),
    );
  }

  // freeze edits if AI image flag
  if (flags?.isAIImage === true) {
    out.elements = out.elements.map((e) => ({ ...e, isEditable: false }));
    out.stickers = out.stickers.map((s) => ({ ...s, isEditable: false }));
    out.textElements = out.textElements.map((t) => ({ ...t, isEditable: false }));
  }

  return { bgColor: bg?.color ?? null, bgImage: bg?.image ?? null, layout: out };
}

/* ===================== component ===================== */
interface SlideCoverProps {
  textAlign?: "start" | "center" | "end";
  rotation?: number;
  togglePopup?: (name: string | null) => void;
  activePopup?: string | null;
  activeIndex?: number;
  addTextRight?: number;
  rightBox?: boolean;
  isCaptureMode?: boolean;
  isAdminEditor?: boolean;
  canvasScale?: number;
}

const createNewTextElement1 = (defaults: any) => ({
  id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  value: "",
  fontSize: defaults.fontSize || 16,
  fontWeight: defaults.fontWeight || 400,
  fontColor: defaults.fontColor || "#000000",
  fontFamily: defaults.fontFamily || "Roboto",
  textAlign: defaults.textAlign || "center",
  rotation: defaults.rotation || 0,
  zIndex: defaults.zIndex || 1,
  position: { x: 50 + Math.random() * 50, y: 50 + Math.random() * 50 },
  size: { width: 200, height: 40 },
  isEditing: false,
  locked: false,
});

const focusEditableTextFromTarget = (target: EventTarget | null) => {
  const root = target instanceof HTMLElement ? target : null;
  if (!root) return;

  requestAnimationFrame(() => {
    window.setTimeout(() => {
      const input = root.querySelector("textarea, input") as
        | HTMLTextAreaElement
        | HTMLInputElement
        | null;
      if (!input) return;
      input.focus();
      if (typeof input.select === "function") {
        input.select();
      }
    }, 0);
  });
};

const focusTextInputNode = (
  input: HTMLTextAreaElement | HTMLInputElement | null,
) => {
  if (!input) return;

  const focusNow = () => {
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    const end = input.value?.length ?? 0;
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(end, end);
    } else if (typeof input.select === "function") {
      input.select();
    }
  };

  focusNow();
  requestAnimationFrame(focusNow);
  window.setTimeout(focusNow, 0);
  window.setTimeout(focusNow, 80);
};

const SlideCover = ({
  activeIndex,
  // togglePopup,
  rightBox,
  isCaptureMode,
  isAdminEditor,
  addTextRight,
  canvasScale,
}: SlideCoverProps) => {
  const coverRef = useRef<HTMLDivElement>(null);
  const staticTextInputRefs = useRef<
    Record<number, HTMLTextAreaElement | HTMLInputElement | null>
  >({});
  const rndScale = canvasScale && canvasScale > 0 ? canvasScale : 1;
  const isMugsCategory = useMemo(() => {
    const direct = safeGetStorage("selectedCategory");
    if (direct && /mug/i.test(String(direct))) return true;
    try {
      const variant = JSON.parse(safeGetStorage("selectedVariant") || "{}");
      if (/mug/i.test(String(variant?.category ?? ""))) return true;
    } catch {}
    try {
      const product = JSON.parse(safeGetStorage("selectedProduct") || "{}");
      if (/mug/i.test(String(product?.category ?? ""))) return true;
    } catch {}
    return false;
  }, []);
  const hideTextOutline = !isAdminEditor && isMugsCategory;
  const isIos = useMemo(() => isIosTouchDevice(), []);
  const handleBlankClick = (e: ReactMouseEvent) => {
    if (!hideTextOutline) return;
    if (e.target !== e.currentTarget) return;
    setSelectedTextId1(null);
    setEditingIndex1(null);
    setSelectedImage1([]);
    setSelectedShapeImageId1(null);
    setSelectedStickerIndex(null);
    setSelectedBgIndex(null);
  };

  const {
    images1,
    selectedImg1,
    setSelectedImage1,
    showOneTextRightSideBox1,
    oneTextValue1,
    setOneTextValue1,
    multipleTextValue1,
    texts1,
    editingIndex1,
    setEditingIndex1,
    fontSize1,
    fontWeight1,
    fontColor1,
    textAlign1,
    verticalAlign1,
    setVerticalAlign1,
    setTextAlign1,
    rotation1,
    setRotation1,
    setTexts1,
    setShowOneTextRightSideBox1,
    fontFamily1,

    // free text layer
    textElements1,
    setTextElements1,
    selectedTextId1,
    setSelectedTextId1,
    setMultipleTextValue1,
    isSlideActive1,
    setFontSize1,
    setFontColor1,
    setFontWeight1,
    setFontFamily1,
    setLineHeight1,
    setLetterSpacing1,

    // media
    selectedVideoUrl1,
    setSelectedVideoUrl1,
    draggableImages1,
    setDraggableImages1,
    qrPosition1,
    setQrPosition1,
    setSelectedAudioUrl1,
    selectedAudioUrl1,
    qrAudioPosition1,
    setQrAudioPosition1,
    isAIimage1,
    setIsAIimage1,
    selectedAIimageUrl1,

    // stickers
    selectedStickers1,
    updateSticker1,
    removeSticker1,

    // ai image pos
    aimage1,
    setSelectedLayout1,
    setAIImage1,

    // filters
    setImageFilter1,
    setActiveFilterImageId1,

    // layout
    lineHeight1,
    letterSpacing1,
    layout1,
    setLayout1,

    bgColor1,
    bgImage1,
    setBgColor1,
    setBgImage1,
    bgEdit1,
    setBgEdit1,
    bgLocked1,
    setBgLocked1,
    bgRect1,
    setBgRect1,
    // selection helpers
    selectedShapeImageId1,
    setSelectedShapeImageId1,
  } = useSlide1();

  /* ------------------ pull slide1 from route ------------------ */

  const location = useLocation();
  const { id: routeId } = useParams<{ id?: string }>();
  const draftId = useMemo(() => (routeId && isUuid(routeId) ? routeId : getDraftCardId() ?? ""), [routeId]);
  const localDraftFull = useMemo(
    () => (!isAdminEditor && draftId ? readDraftFull(draftId) : null),
    [draftId, isAdminEditor]
  );
  const draftFull = location.state?.draftFull ?? localDraftFull ?? null;
  const slide1 = location.state?.layout?.slides?.slide1 ?? null;

  // console.log(layout1, '---')

  const applyTemplateLayout1 = (baseSlide: any, norm: ReturnType<typeof normalizeSlide>) => {
    const flags = baseSlide?.flags ?? {};
    const templateMulti =
      flags?.multipleText === true ||
      (Array.isArray(baseSlide?.multipleTexts) && baseSlide.multipleTexts.length > 0);
    const templateOne =
      flags?.showOneText === true ||
      String(baseSlide?.oneText?.value ?? "").trim().length > 0;

    if (templateMulti) {
      setSelectedLayout1?.("multipleText");
      setMultipleTextValue1?.(true);
      setShowOneTextRightSideBox1?.(false);
      setTexts1?.(normalizeMultiTexts(baseSlide?.multipleTexts ?? []));
    } else if (templateOne) {
      setSelectedLayout1?.("oneText");
      setShowOneTextRightSideBox1?.(true);
      setMultipleTextValue1?.(false);
      const ot = baseSlide?.oneText ?? {};
      setOneTextValue1?.(ot.value ?? "");
      if (ot.fontSize != null) setFontSize1?.(ot.fontSize);
      if (ot.fontWeight != null) setFontWeight1?.(ot.fontWeight);
      if (ot.fontColor != null) setFontColor1?.(ot.fontColor);
      if (ot.fontFamily != null) setFontFamily1?.(ot.fontFamily);
      if (ot.textAlign != null) setTextAlign1?.(ot.textAlign);
      if (ot.verticalAlign != null) setVerticalAlign1?.(ot.verticalAlign);
      if (ot.rotation != null) setRotation1?.(ot.rotation);
      if (ot.lineHeight != null) setLineHeight1?.(ot.lineHeight);
      if (ot.letterSpacing != null) setLetterSpacing1?.(ot.letterSpacing);
    } else {
      setSelectedLayout1?.("blank");
      setShowOneTextRightSideBox1?.(false);
      setMultipleTextValue1?.(false);
    }

    return stripLayoutTextElements(norm.layout, {
      stripMulti: templateMulti,
      stripOne: templateOne,
    });
  };

  /* ------------------ normalize slide1 -> user view state ------------------ */
  useEffect(() => {
    if (draftFull?.slide1) {
      // ✅ prefer draft values, fallback to base layout bg if present
      setLayout1?.(draftFull.slide1);

      const hasBgColor =
        draftFull.slide1?.bgColor1 !== undefined || draftFull.slide1?.bgColor !== undefined;
      const hasBgImage =
        draftFull.slide1?.bgImage1 !== undefined || draftFull.slide1?.bgImage !== undefined;

      if (hasBgColor) {
        setBgColor1?.(draftFull.slide1?.bgColor1 ?? draftFull.slide1?.bgColor ?? null);
      }
      if (hasBgImage) {
        setBgImage1?.(draftFull.slide1?.bgImage1 ?? draftFull.slide1?.bgImage ?? null);
      }
      const hasBgRect = draftFull.slide1?.bgRect1 !== undefined;
      if (hasBgRect) {
        setBgRect1?.(draftFull.slide1?.bgRect1);
      }

      const baseSlide1 = draftFull.layout?.slides?.slide1 ?? draftFull.layout?.slide1 ?? null;
      if (baseSlide1) {
        const normBase = normalizeSlide(baseSlide1);
        if (!hasBgColor) setBgColor1?.(normBase.bgColor);
        if (!hasBgImage) setBgImage1?.(normBase.bgImage);
        if (!hasBgRect && baseSlide1?.bg?.rect) setBgRect1?.(baseSlide1.bg.rect);
      }
      return;
    }
    if (!slide1) return;
    const norm = normalizeSlide(slide1);
    setBgColor1?.(norm.bgColor);
    setBgImage1?.(norm.bgImage);
    setLayout1?.(applyTemplateLayout1(slide1, norm));
    if (slide1?.bg?.rect) setBgRect1?.(slide1.bg.rect);
    return;
  }, [draftFull, slide1, setBgColor1, setBgImage1, setLayout1, setBgRect1]);

  useEffect(() => {
    if (draftFull?.slide1 || slide1) return;

    const hasLayoutContent = (l: any) => {
      if (!l || typeof l !== "object") return false;
      const els = Array.isArray(l.elements) ? l.elements.length : 0;
      const sts = Array.isArray(l.stickers) ? l.stickers.length : 0;
      const txt = Array.isArray(l.textElements) ? l.textElements.length : 0;
      return els + sts + txt > 0;
    };

    let restored = false;
    let usedBase = false;
    const saved = safeGetStorage("slide1_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const currentDraftId = getDraftCardId();
        const savedDraftId = parsed?.draftId;
        const applySaved = (p: any) => {
          if (p.bgColor1 !== undefined) setBgColor1?.(p.bgColor1);
          if (p.bgImage1 !== undefined) setBgImage1?.(p.bgImage1);
          if (p.bgRect1 !== undefined) setBgRect1?.(p.bgRect1);
          setLayout1?.(p.layout1);
          restored = true;
        };

        const savedLayout = parsed?.layout1;
        const savedHasContent =
          hasLayoutContent(savedLayout) ||
          parsed?.bgColor1 !== undefined ||
          parsed?.bgImage1 !== undefined;

        if (currentDraftId) {
          if (savedDraftId && savedDraftId === currentDraftId && savedHasContent) {
            applySaved(parsed);
          }
        } else if (savedHasContent) {
          applySaved(parsed);
        }
      } catch {}
    }

    if (restored) return;

    // Fallback: restore from base admin layout stored in localStorage
    const draftIdValue = draftId || getDraftCardId();
    try {
      if (draftIdValue) {
        const raw = safeGetStorage(`draft:layout:${draftIdValue}`);
        if (raw) {
          const parsedBase = JSON.parse(raw);
          const baseLayout = pickPolygonLayout(
            parsedBase,
            parsedBase?.layout,
            parsedBase?.polygonlayout,
            parsedBase?.polygonLayout,
            parsedBase?.polyganLayout
          );
          const baseSlide1 = baseLayout?.slides?.slide1 ?? baseLayout?.slide1;
          if (baseSlide1) {
            const norm = normalizeSlide(baseSlide1);
            setBgColor1?.(norm.bgColor);
            setBgImage1?.(norm.bgImage);
            setLayout1?.(applyTemplateLayout1(baseSlide1, norm));
            if (baseSlide1?.bg?.rect) setBgRect1?.(baseSlide1.bg.rect);
            usedBase = true;
          }
        }
      }
    } catch {}

    if (usedBase) return;

    // Last resort: fetch from Supabase (draft by card_id OR card by id)
    let cancelled = false;
    (async () => {
      try {
        const routeKey = String(routeId ?? "").trim();

        // 1) If URL is a draft uuid, try draft table first
        if (routeKey && isUuid(routeKey)) {
          try {
            const draft = await fetchDraftByCardId(routeKey);
            if (cancelled) return;
            if (draft?.slide1) {
              setLayout1?.(draft.slide1);
              // also restore base BG from layout if present
              const baseSlide1 = draft?.layout?.slides?.slide1 ?? null;
              if (baseSlide1) {
                const normBase = normalizeSlide(baseSlide1);
                setBgColor1?.(normBase.bgColor);
                setBgImage1?.(normBase.bgImage);
                if (baseSlide1?.bg?.rect) setBgRect1?.(baseSlide1.bg.rect);
              }
              return;
            }
            if (draft?.layout) {
              const baseSlide1 = draft.layout?.slides?.slide1 ?? draft.layout?.slide1;
              if (baseSlide1) {
                const norm = normalizeSlide(baseSlide1);
                setBgColor1?.(norm.bgColor);
                setBgImage1?.(norm.bgImage);
                setLayout1?.(norm.layout);
                if (baseSlide1?.bg?.rect) setBgRect1?.(baseSlide1.bg.rect);
                return;
              }
            }
          } catch {}
        }

        // 2) Try card by id (route or selectedProduct)
        const rawSelected = localStorage.getItem("selectedProduct");
        const selected = rawSelected ? JSON.parse(rawSelected) : null;
        const selectedId = selected?.id ? String(selected.id) : "";
        const selectedType = String(selected?.type ?? "").toLowerCase();

        const cardId = routeKey || selectedId;
        if (!cardId) return;
        if (selectedType && selectedType !== "card" && cardId === selectedId) return;

        const full = await fetchCardById(String(cardId));
        if (cancelled || !full) return;

        const rawStores =
          (full as any)?.raw_stores ??
          (full as any)?.rawStores ??
          (full as any)?.raw_store ??
          null;

        const fetchedLayout = pickPolygonLayout(
          (full as any)?.polygonlayout,
          (full as any)?.polyganLayout,
          rawStores?.polygonlayout,
          rawStores?.polyganLayout
        );
        const s1 = fetchedLayout?.slides?.slide1 ?? fetchedLayout?.slide1;
        if (!s1) return;

        const norm = normalizeSlide(s1);
        if (cancelled) return;
        setBgColor1?.(norm.bgColor);
        setBgImage1?.(norm.bgImage);
        setLayout1?.(applyTemplateLayout1(s1, norm));
        if (s1?.bg?.rect) setBgRect1?.(s1.bg.rect);
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [draftFull, slide1, routeId, draftId, setBgColor1, setBgImage1, setLayout1, setBgRect1]);

  /* ------------------ local UI state ------------------ */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rightBoxRef = useRef<HTMLDivElement>(null);
  const align = useAlignGuides(rightBoxRef, { scale: rndScale });
  const alignItems = useMemo(() => {
    const items: { id: string; x: number; y: number; w: number; h: number }[] = [];
    const push = (id: string, x?: number, y?: number, w?: number, h?: number) => {
      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        typeof w !== "number" ||
        typeof h !== "number" ||
        Number.isNaN(x + y + w + h)
      ) {
        return;
      }
      items.push({ id, x, y, w, h });
    };

    const selectedIds = Array.isArray(selectedImg1) ? selectedImg1 : [];
    (draggableImages1 ?? [])
      .filter((img: any) => selectedIds.includes(img.id))
      .forEach((img: any) => push(`img:${img.id}`, img.x, img.y, img.width, img.height));

    (textElements1 ?? []).forEach((t: any) =>
      push(`txt:${t.id}`, t.position?.x ?? t.x, t.position?.y ?? t.y, t.size?.width ?? t.width, t.size?.height ?? t.height)
    );

    (selectedStickers1 ?? []).forEach((s: any, idx: number) =>
      push(`st:${s.id ?? idx}`, s.x, s.y, s.width, s.height)
    );

    if (isAIimage1 && aimage1) {
      push("ai:1", aimage1.x, aimage1.y, aimage1.width, aimage1.height);
    }

    return items;
  }, [draggableImages1, selectedImg1, textElements1, selectedStickers1, isAIimage1, aimage1]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedBgIndex, setSelectedBgIndex] = useState<number | null>(null);
  const [selectedStickerIndex, setSelectedStickerIndex] = useState<number | null>(null);

  const [uploadTarget, setUploadTarget] = useState<{ type: "bg" | "sticker"; index: number } | null>(null);
  const [cropTarget, setCropTarget] = useState<{
    type: "bg" | "sticker" | "image";
    index: number;
    src: string;
    aspect: number;
  } | null>(null);

  /* ------------------ user upload handlers (editable only) ------------------ */
  const handleImageUploadClick = (type: "bg" | "sticker", index: number) => {
    if (type === "bg") setSelectedBgIndex(index);
    setUploadTarget({ type, index });
    fileInputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const dataUrl = event.target?.result as string;
      setLayout1((prev: any) => {
        if (!prev) return prev;
        if (uploadTarget.type === "bg") {
          const elements = [...(prev.elements ?? [])];
          const el = elements[uploadTarget.index];
          if (!el?.isEditable) return prev;
          elements[uploadTarget.index] = { ...el, src: dataUrl };
          return { ...prev, elements };
        }
        const stickers = [...(prev.stickers ?? [])];
        const st = stickers[uploadTarget.index];
        if (!st?.isEditable) return prev;
        stickers[uploadTarget.index] = { ...st, sticker: dataUrl };
        return { ...prev, stickers };
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
    setUploadTarget(null);
  };

  const openCropEditor = (type: "bg" | "sticker" | "image", index: number) => {
    if (type === "image") {
      const targetItem = draggableImages1[index];
      if (!targetItem?.src) return;
      const aspect =
        targetItem?.width && targetItem?.height
          ? Math.max(0.1, Number(targetItem.width) / Number(targetItem.height))
          : 1;
      setCropTarget({ type, index, src: targetItem.src, aspect });
      return;
    }
    const targetCollection = type === "bg" ? (layout1?.elements ?? []) : (layout1?.stickers ?? []);
    const targetItem = targetCollection[index];
    const src = type === "bg" ? targetItem?.src : targetItem?.sticker;
    if (!targetItem?.isEditable || !src) return;
    const aspect =
      targetItem?.width && targetItem?.height
        ? Math.max(0.1, Number(targetItem.width) / Number(targetItem.height))
        : 1;
    setCropTarget({ type, index, src, aspect });
  };

  /* ------------------ static text edit bindings (editable only) ------------------ */
  const handleTextChange = (newText: string, index: number) => {
    setLayout1((prev: any) => {
      const updated = [...prev.textElements];
      if (!updated[index]?.isEditable) return prev;
      updated[index] = { ...updated[index], text: newText };
      return { ...prev, textElements: updated };
    });
  };

  const handleTextFocus = (index: number, te: any) => {
    if (!te?.isEditable) return;
    setEditingIndex(index);
    setFontSize1(te.fontSize);
    setFontFamily1(te.fontFamily);
    setFontColor1(te.color);
    setFontWeight1(te.fontWeight);
  };

  const openSlide1StaticTextEditor = (
    index: number,
    te: any,
    target?: EventTarget | null,
  ) => {
    handleTextFocus(index, te);
    focusTextInputNode(staticTextInputRefs.current[index] ?? null);
    if (target instanceof HTMLElement) {
      focusEditableTextFromTarget(target);
    }
  };

  useEffect(() => {
    if (editingIndex === null) return;

    setLayout1((prev: any) => {
      if (!prev) return prev;
      const updated = [...prev.textElements];
      const te = updated[editingIndex];
      if (!te?.isEditable) return prev;

      updated[editingIndex] = {
        ...te,
        // only overwrite when a value exists; otherwise keep element’s own value
        fontSize: fontSize1 ?? te.fontSize,
        fontFamily: fontFamily1 ?? te.fontFamily,
        color: fontColor1 ?? te.color,
        fontWeight: fontWeight1 ?? te.fontWeight,
        italic: typeof te.italic === "boolean" ? te.italic : te.italic, // unchanged, explicit keep
      };

      return { ...prev, textElements: updated };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize1, fontFamily1, fontColor1, fontWeight1]); // ← removed editingIndex

  useEffect(() => {
    if (editingIndex === null) return;
    focusTextInputNode(staticTextInputRefs.current[editingIndex] ?? null);
  }, [editingIndex, layout1?.textElements]);

  /* ------------------ init draggable state for user images (unchanged) ------------------ */
  useEffect(() => {
    if (images1.length > 0) {
      setDraggableImages1((prev: any[]) => {
        const existingIds = prev.map((img: any) => img.id);
        const newOnes = images1
          .filter((img) => !existingIds.includes(img.id)
          )
          .map((img) => ({
            id: img.id,
            src: img.src,
            x: 50,
            y: 50,
            width: 150,
            height: 150,
            rotation: 0,
            zIndex: 1,
            locked: false,
          }));
        const stillValid = prev.filter((img: any) => images1.some((incoming: any) => incoming.id === img.id));
        const next = [...stillValid, ...newOnes];
        return mergePreservePdf(prev, next);
      });
    } else {
      setDraggableImages1((prev: any[]) => mergePreservePdf(prev, []));
    }
  }, [images1, setDraggableImages1]);

  /* ------------------ multiple text reset (unchanged) ------------------ */
  useEffect(() => {
    if (multipleTextValue1 && texts1.length === 0) {
      const defaultTexts = Array(1).fill(null).map(() => ({
        value: "",
        fontSize: 16,
        fontWeight: 400,
        fontColor: "#000000",
        fontFamily: "Roboto",
        textAlign: "center",
        verticalAlign: "top",
        rotation: 0,
        lineHeight: 1.5,
        letterSpacing: 0,
      }));
      setTexts1(defaultTexts);
    }
  }, [multipleTextValue1, texts1.length, setTexts1]);

  /* ------------------ reflect right-panel into multi-box (unchanged) ------------------ */
  useEffect(() => {
    if (editingIndex1 !== null && editingIndex1 !== undefined) {
      setTexts1((prev) =>
        prev.map((t, i) =>
          i === editingIndex1
            ? { ...t, fontSize1, fontWeight1, fontColor1, fontFamily1, textAlign1, verticalAlign1 }
            : t,
        ),
      );
    }
  }, [fontSize1, fontFamily1, fontWeight1, fontColor1, textAlign1, verticalAlign1, editingIndex1, setTexts1]);

  /* ------------------ QR sync (unchanged) ------------------ */
  useEffect(() => {
    if (selectedVideoUrl1) setQrPosition1((p) => ({ ...p, url: selectedVideoUrl1 }));
  }, [selectedVideoUrl1, setQrPosition1]);
  useEffect(() => {
    if (selectedAudioUrl1) setQrAudioPosition1((p) => ({ ...p, url: selectedAudioUrl1 }));
  }, [selectedAudioUrl1, setQrAudioPosition1]);

  /* ------------------ z-index helpers for images (unchanged) ------------------ */
  const buildLayers = (): any[] => {
    const texts: any[] = (textElements1 ?? []).map((t: any) => ({
      type: 'text',
      id: t.id,
      zIndex: Number(t.zIndex ?? 1),
      locked: !!t.locked,
    }));

    const images: any[] = (draggableImages1 ?? []).map((i: any) => ({
      type: 'image',
      id: i.id,
      zIndex: Number(i.zIndex ?? 1),
      locked: !!i.locked,
    }));

    // If you want stickers too, push them here as { type:'sticker', ... } and extend write-back.
    return [...texts, ...images];
  };

  const normalizeGlobal = (nodes: any[]) =>
    [...nodes]
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
      .map((n, i) => ({ ...n, zIndex: i + 1 }));

  const swapGlobal = (arr: any[], i: number, j: number) => {
    const next = arr.map((n) => ({ ...n }));
    const tmp = next[i].zIndex;
    next[i].zIndex = next[j].zIndex;
    next[j].zIndex = tmp;
    return next;
  };

  const writeBack = (nodes: any[]) => {
    // Create quick lookup map
    const zMap = new Map(nodes.map((n) => [`${n.type}:${n.id}`, n.zIndex]));

    setTextElements1((prev: any[]) =>
      (prev ?? []).map((t) => {
        const key = `text:${t.id}`;
        const z = zMap.get(key);
        return typeof z === 'number' ? { ...t, zIndex: z } : t;
      }),
    );

    setDraggableImages1((prev: any[]) =>
      (prev ?? []).map((i) => {
        const key = `image:${i.id}`;
        const z = zMap.get(key);
        return typeof z === 'number' ? { ...i, zIndex: z } : i;
      }),
    );
  };

  const layerUpAny = ({ type, id }: { type: 'text' | 'image'; id: string }) => {
    const list = normalizeGlobal(buildLayers());
    const idx = list.findIndex((n) => n.type === type && n.id === id);
    if (idx === -1) return;

    if (list[idx].locked) return;
    // find the next unlocked ABOVE
    const aboveIdx = list.findIndex((n, i) => i > idx && !n.locked);
    if (aboveIdx === -1) return;

    const swapped = swapGlobal(list, idx, aboveIdx);
    writeBack(normalizeGlobal(swapped));
  };

  const layerDownAny = ({ type, id }: { type: 'text' | 'image'; id: string }) => {
    const list = normalizeGlobal(buildLayers());
    const idx = list.findIndex((n) => n.type === type && n.id === id);
    if (idx === -1) return;

    if (list[idx].locked) return;
    // find the next unlocked BELOW (nearest lower)
    for (let j = idx - 1; j >= 0; j--) {
      if (!list[j].locked) {
        const swapped = swapGlobal(list, idx, j);
        writeBack(normalizeGlobal(swapped));
        return;
      }
    }
  };
  /* ------------------ selection + locking (admin) ------------------ */
  const currentSelection: any = useMemo(() => {
    if (selectedTextId1) return { type: "text", id: selectedTextId1 };
    if (selectedShapeImageId1) return { type: "image", id: selectedShapeImageId1 };
    if (selectedStickerIndex !== null) return { type: "sticker", index: selectedStickerIndex };
    if (selectedBgIndex !== null) return { type: "bg", index: selectedBgIndex };
    return null;
  }, [selectedTextId1, selectedShapeImageId1, selectedStickerIndex, selectedBgIndex]);

  const getSelectedLocked = (): boolean => {
    if (!currentSelection) return false;
    if (currentSelection.type === "text") {
      const t: any = textElements1.find((x) => x.id === currentSelection.id);
      return !!t?.locked;
    }
    if (currentSelection.type === "image") {
      const i: any = draggableImages1.find((x) => x.id === currentSelection.id);
      return !!i?.locked;
    }
    if (currentSelection.type === "sticker") {
      const s: any = selectedStickers1?.[currentSelection.index];
      return !!s?.locked;
    }
    if (currentSelection.type === "bg") {
      const el = layout1?.elements?.[currentSelection.index];
      return !!el?.locked;
    }
    return false;
  };

  const setSelectedLocked = (locked: any) => {
    if (!currentSelection) return;
    if (currentSelection.type === "text") {
      setTextElements1((prev) => prev.map((t) => (t.id === currentSelection.id ? { ...t, locked } : t)));
      if (locked) setSelectedTextId1(null);
      return;
    }
    if (currentSelection.type === "image") {
      setDraggableImages1((prev) => prev.map((img) => (img.id === currentSelection.id ? { ...img, locked } : img)));
      if (locked) setSelectedShapeImageId1(null);
      return;
    }
    if (currentSelection.type === "sticker") {
      const i = currentSelection.index;
      if (i != null) {
        updateSticker1(i, { locked } as any);
        if (locked) setSelectedStickerIndex(null);
      }
      return;
    }
    if (currentSelection.type === "bg") {
      const index = currentSelection.index;
      setLayout1((prev: any) => {
        if (!prev?.elements) return prev;
        const elements = [...prev.elements];
        elements[index] = { ...elements[index], locked };
        return { ...prev, elements };
      });
      if (locked) setSelectedBgIndex(null);
      return;
    }
  };

  const selectionLabel = useMemo(() => {
    if (!currentSelection) return "";
    switch (currentSelection.type) {
      case "text":
        return "Text";
      case "image":
        return "Image";
      case "sticker":
        return "Sticker";
      case "bg":
        return "BG Frame";
      default:
        return "";
    }
  }, [currentSelection]);

  const selectedLocked = getSelectedLocked();
  const shouldShowLockSwitch = Boolean(isAdminEditor && currentSelection);

  const addNewTextElement = () => {
    const z = Array.isArray(textElements1) ? textElements1.length + 1 : 1;
    const newTextElement = createNewTextElement1({ zIndex: z });
    setTextElements1(prev => Array.isArray(prev) ? [...prev, newTextElement] : [newTextElement]);
    setSelectedTextId1(newTextElement.id);
  };

  const lastAddTick = useRef<number>(0);
  useEffect(() => {
    if (typeof addTextRight === "number" && addTextRight > lastAddTick.current) {
      addNewTextElement();
      lastAddTick.current = addTextRight;
    }
  }, [addTextRight]);

  const updateTextElement1 = (id: string, updates: Partial<any>) => {
    setTextElements1((prev) => prev.map((text) => (text.id === id ? { ...text, ...updates } : text)));
  };

  const deleteTextElement1 = (id: string) => {
    setTextElements1((prev) => prev.filter((text) => text.id !== id));
    if (selectedTextId1 === id) {
      setSelectedTextId1(null);
    }
  };


  const placerRef = useRef<HTMLDivElement | null>(null);

  // Esc closes edit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBgEdit1(false);
      if (e.key.toLowerCase() === "l") setBgLocked1((v: any) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Outside click closes edit
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!bgEdit1) return;
      if (!placerRef.current) return;
      if (!placerRef.current.contains(e.target as Node)) setBgEdit1(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [bgEdit1]);



  // duplicate   
  const duplicateLayer = (type: 'text' | 'image' | 'sticker', idOrIndex: string | number) => {
    if (!isAdminEditor) return;

    if (type === 'text') {
      const item: any = textElements1.find(t => t.id === idOrIndex);
      if (!item || item.locked) return;

      const newItem = {
        ...item,
        id: `text-duplicate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        position: {
          x: item.position.x + 30,
          y: item.position.y + 30,
        },
        zIndex: (item.zIndex || 1) + 1,   // put on top
      };

      setTextElements1(prev => [...prev, newItem]);
      setSelectedTextId1(newItem.id);     // optional: auto-select the duplicate
    }

    else if (type === 'image') {
      const item: any = draggableImages1.find(img => img.id === idOrIndex);
      if (!item || item.locked) return;

      const newItem = {
        ...item,
        id: `img-duplicate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        x: item.x + 30,
        y: item.y + 30,
        zIndex: (item.zIndex || 1) + 1,
      };

      setDraggableImages1(prev => [...prev, newItem]);
      setSelectedShapeImageId1(newItem.id);   // optional
    }

    else if (type === 'sticker') {
      const index = typeof idOrIndex === 'number' ? idOrIndex : -1;
      if (index < 0) return;

      const item: any = selectedStickers1?.[index];
      if (!item || item.locked) return;

      const newSticker = {
        ...item,
        id: item.id ? `${item.id}-dup-${Date.now()}` : `sticker-dup-${Date.now()}`,
        x: item.x + 35,
        y: item.y + 35,
        zIndex: (item.zIndex || 1) + 1,
      };

      // Assuming you have addSticker or similar function
      // If you only have update/remove → you'll need to add a addSticker function in context
      // For now assuming you can do:
      updateSticker1(selectedStickers1.length, newSticker); // ← hacky – better to have proper add
      // Better solution: add addSticker function in useSlide1 context
    }
  };



  /* ------------------ UI ------------------ */
  // Draft capture 
  // Keep capture-only clean mode, but do not disable inactive overlay in admin editor.
  const captureClean = !!isCaptureMode && !isAdminEditor;
  return (
    <CanvasScaleContext.Provider value={rndScale}>
      <Box
        ref={coverRef}
        id="slide-cover-capture"
        onClick={handleBlankClick}
        sx={{
          display: "flex",
          width: "var(--card-slide-w, 500px)",
          minWidth: "var(--card-slide-w, 500px)",
          gap: "5px",
          position: "relative",
        }}
      >
        {activeIndex === 0 && rightBox && (
          <Box
            ref={rightBoxRef}
            onClick={handleBlankClick}
            sx={{
              zIndex: 10,
              p: 0,
              position: "relative",
              height: "var(--card-slide-h, 700px)",
              width: "var(--card-slide-w, 500px)",
              minWidth: "var(--card-slide-w, 500px)",
              opacity: captureClean ? 1 : (isSlideActive1 ? 1 : 0.6),
              pointerEvents: captureClean ? "auto" : (isSlideActive1 ? "auto" : "none"),
              backgroundColor: bgColor1 ?? "transparent",
              "&::after": !isSlideActive1
                ? {
                  content: '""',
                  position: "absolute",
                  inset: 0,
                  backgroundColor: captureClean ? 'transparent' : "rgba(105,105,105,0.51)",
                  zIndex: 30000,
                  pointerEvents: "none",
                }
                : {},
            }}
          >
          <AlignmentGuides
            {...align.guides}
            hide={!isSlideActive1 || !align.isActive}
          />
          {isAdminEditor && bgImage1 && (
            <ScaledRnd
              size={{ width: bgRect1.width, height: bgRect1.height }}
              position={{ x: bgRect1.x, y: bgRect1.y }}
              bounds="parent"
              enableUserSelectHack={false}
              // ✅ only draggable when unlocked AND in edit mode
              disableDragging={!bgEdit1 || bgLocked1}
              // ✅ only resizable when unlocked AND in edit mode
              enableResizing={
                bgEdit1 && !bgLocked1
                  ? {
                    top: false,
                    right: false,
                    bottom: false,
                    left: false,
                    topRight: false,
                    bottomRight: true,
                    bottomLeft: false,
                    topLeft: false,
                  }
                  : false
              }
              onDragStop={(_, d) => setBgRect1((r: any) => ({ ...r, x: d.x, y: d.y }))}
              onResizeStop={(_, __, ref, ___, position) =>
                setBgRect1({
                  x: position.x,
                  y: position.y,
                  width: parseInt(ref.style.width, 10),
                  height: parseInt(ref.style.height, 10),
                })
              }
              style={{
                zIndex: 1,
                outline: bgEdit1 && !bgLocked1 ? "2px solid #1976d2" : "none",
                cursor: bgEdit1 && !bgLocked1 ? "move" : "default",
              }}
              resizeHandleStyles={{
                bottomRight: {
                  width: "14px",
                  height: "14px",
                  background: "white",
                  border: "2px solid #1976d2",
                  borderRadius: "3px",
                  right: "-7px",
                  bottom: "-7px",
                  cursor: "se-resize",
                  boxShadow: "0 0 2px rgba(0,0,0,.25)",
                  pointerEvents: bgEdit1 && !bgLocked1 ? "auto" : "none",
                },
              }}
            >
              <Box
                ref={placerRef}
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  backgroundColor: bgImage1 ? "transparent" : bgColor1 ?? "transparent",
                  backgroundImage: bgImage1 ? `url(${bgImage1})` : "none",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  userSelect: "none",
                }}
                // ✅ double-click only works when unlocked
                onDoubleClick={() => {
                  if (!bgLocked1) setBgEdit1(true);
                }}
              >
                {/* Lock/Unlock toggle (top-left) */}
                <IconButton
                  onClick={(e) => { e.stopPropagation(); setBgLocked1((v: any) => !v); if (!bgLocked1) setBgEdit1(false); }}
                  sx={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    bgcolor: "black",
                    color: "white",
                    width: 28,
                    height: 28,
                    "&:hover": { bgcolor: bgLocked1 ? "#2e7d32" : "#d32f2f" },
                  }}
                >
                  {bgLocked1 ? <LockOutlined fontSize="small" /> : <LockOpenOutlined fontSize="small" />}
                </IconButton>
                {/* Small hint when locked */}
                {bgLocked1 && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 6,
                      left: 6,
                      px: 1,
                      py: 0.5,
                      fontSize: 12,
                      bgcolor: "rgba(0,0,0,.55)",
                      color: "white",
                      borderRadius: 1,
                      pointerEvents: "none",
                    }}
                  >
                    BG locked
                  </Box>
                )}
              </Box>
            </ScaledRnd>
          )}


          {/* Admin-only lock switch */}
          {shouldShowLockSwitch && (
            <Paper
              elevation={2}
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                p: 1,
                px: 1.5,
                borderRadius: 2,
                display: "flex",
                gap: 1,
                alignItems: "center",
                zIndex: 20000,
              }}
            >
              <Chip
                size="small"
                label={selectionLabel}
                icon={selectedLocked ? <LockOutlined /> : <LockOpenOutlined />}
                variant="outlined"
              />
              <Switch size="small" checked={!selectedLocked} onChange={(_, checked) => setSelectedLocked(!checked ? true : false)} />
            </Paper>
          )}

          {/* Hidden file input (user uploads for editable items) */}
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />

          <ImageCropModal
            open={!!cropTarget}
            imageSrc={cropTarget?.src ?? ""}
            aspect={cropTarget?.aspect ?? 1}
            onClose={() => setCropTarget(null)}
            onApply={(croppedImageSrc) => {
              if (!cropTarget) return;
              if (cropTarget.type === "image") {
                setDraggableImages1((prev) =>
                  prev.map((img, idx) => (idx === cropTarget.index ? { ...img, src: croppedImageSrc } : img)),
                );
                setCropTarget(null);
                return;
              }
              setLayout1((prev: any) => {
                if (!prev) return prev;
                if (cropTarget.type === "bg") {
                  const elements = [...(prev.elements ?? [])];
                  const el = elements[cropTarget.index];
                  if (!el?.isEditable) return prev;
                  elements[cropTarget.index] = { ...el, src: croppedImageSrc };
                  return { ...prev, elements };
                }
                const stickers = [...(prev.stickers ?? [])];
                const st = stickers[cropTarget.index];
                if (!st?.isEditable) return prev;
                stickers[cropTarget.index] = { ...st, sticker: croppedImageSrc };
                return { ...prev, stickers };
              });
              setCropTarget(null);
            }}
          />

          {/* ---------- USER VIEW: normalized layout; edits only if item.isEditable ---------- */}
          {!isAdminEditor &&
            layout1 && (
              <Box sx={{ width: "100%", height: "100%" }}>
                <UserKonvaPreview
                  width={500}
                  height={700}
                  bgColor={bgColor1 ?? "transparent"}
                  bgImage={(layout1.elements ?? []).some((el: any) => el?.id === "bg-image") ? null : bgImage1}
                  elements={(layout1.elements ?? []).filter((el: any) => !el?.isEditable)}
                  stickers={(layout1.stickers ?? []).filter((st: any) => !st?.isEditable)}
                  textElements={(layout1.textElements ?? []).filter((te: any) => !te?.isEditable)}
                  borderRadius={0}
                  boxShadow="none"
                />
                {/* BG frames */}
                {layout1.elements
                  ?.slice()
                  .sort((a: any, b: any) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                  .map((el: any, index: number) => {
                    const isEditable = !!el.isEditable;
                    const isLocked = !!el.locked;

                    return (
                      <Box
                        key={el.id ?? index}
                        sx={{
                          position: "absolute",
                          left: el.x,
                          top: el.y,
                          width: el.width,
                          height: el.height,
                          borderRadius: 1,
                          overflow: "visible",
                          opacity: isEditable ? 1 : 0,
                          pointerEvents: isEditable ? "auto" : "none",
                          cursor: isEditable ? "pointer" : "default",
                        }}
                        onClick={() => setSelectedBgIndex(index)}
                        onDoubleClick={() => openCropEditor("bg", index)}
                      >
                        <Box
                          component="img"
                          src={el.src || undefined}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: el.id === "bg-image" ? "cover" : "fill",
                            borderRadius: 1,
                            display: "block",
                            pointerEvents: "none",
                            clipPath: el.clipPath || "none",
                            WebkitClipPath: el.clipPath || "none",
                          }}
                        />
                        {/* ✅ Only show upload icon when this frame is editable (NOT when locked) */}
                        {isEditable && !isLocked && (
                          <Box
                            sx={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              backgroundColor: "rgba(0,0,0,0.45)",
                              borderRadius: "50%",
                              width: 40,
                              height: 40,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "1px solid white",
                              cursor: "pointer",
                              "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
                            }}
                            onClick={() => handleImageUploadClick("bg", index)}
                            title="Change background image"
                          >
                            <UploadFileRounded sx={{ color: "white" }} />
                          </Box>
                        )}
                      </Box>
                    );
                  })}

                {/* Stickers */}
                {layout1.stickers?.map((st: any, index: number) => {
                  const isEditable = !!st.isEditable;
                  return (
                    <Box
                      key={st.id ?? index}
                      sx={{
                        position: "absolute",
                        left: st.x,
                        top: st.y,
                        zIndex: st.zIndex,
                        borderRadius: 1,
                        overflow: "hidden",
                        opacity: isEditable ? 1 : 0,
                        pointerEvents: isEditable ? "auto" : "none",
                      }}
                      onDoubleClick={() => openCropEditor("sticker", index)}
                    >
                      <Box
                        component="img"
                        src={st.sticker || undefined}
                        sx={{
                          width: st.width,
                          height: st.height,
                          objectFit: "contain",
                          borderRadius: 1,
                          display: "block",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Hover upload (editable only) */}
                      {isEditable && (
                        <Box
                          sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            backgroundColor: "rgba(0,0,0,0.4)",
                            borderRadius: "50%",
                            width: 36,
                            height: 36,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            border: "1px solid white",
                            cursor: "pointer",
                            "&:hover": { backgroundColor: "rgba(0,0,0,0.6)" },
                          }}
                          onClick={() => handleImageUploadClick("sticker", index)}
                        >
                          <UploadFileRounded sx={{ color: "white", fontSize: 18 }} />
                        </Box>
                      )}
                    </Box>
                  );
                })}

                {/* Static text */}
                {layout1.textElements?.map((te: any, index: number) => {
                  const isEditable = !!te.isEditable;
                  const isActive = editingIndex === index;
                  return (
                    <Box
                      key={te.id ?? index}
                      sx={{
                        position: "absolute",
                        left: te.x,
                        top: te.y,
                        width: te.width,
                        height: 'auto',
                        zIndex: (te.zIndex ?? 1) + 1000,

                        // ✅ easiest way to center the block itself
                        display: isEditable ? "grid" : "none",
                        placeItems: "center",

                        // ✅ cursor
                        cursor: !isEditable ? "not-allowed" : (isActive ? "text" : "pointer"),

                        // ✅ border
                        border: hideTextOutline
                          ? "none"
                          : isEditable
                          ? (isActive ? "1px dashed #1976d2" : "1px dashed rgba(25,118,210,.35)")
                          : "none",
                        borderRadius: "6px",
                        transition: "border .15s ease",
                      }}
                      onMouseDown={isEditable ? (e) => {
                        e.preventDefault();
                        openSlide1StaticTextEditor(index, te, e.currentTarget);
                      } : undefined}
                      onClick={isEditable ? (e) => {
                        openSlide1StaticTextEditor(index, te, e.currentTarget);
                      } : undefined}
                      onDoubleClick={isEditable ? (e) => {
                        openSlide1StaticTextEditor(index, te, e.currentTarget);
                      } : undefined}
                      onTouchStart={isEditable ? (e) => {
                        e.preventDefault();
                        openSlide1StaticTextEditor(index, te, e.currentTarget);
                      } : undefined}
                      onTouchEnd={isEditable ? (e) => {
                        e.preventDefault();
                        openSlide1StaticTextEditor(index, te, e.currentTarget);
                      } : undefined}
                    >
                      <TextField
                        variant="standard"
                        fullWidth
                        multiline
                        value={te.text || ""}
                        inputRef={(node) => {
                          staticTextInputRefs.current[index] = node;
                        }}
                        onFocus={isEditable ? () => handleTextFocus(index, te) : undefined}
                        onChange={isEditable && isActive ? (e) => handleTextChange(e.target.value, index) : undefined}
                        onBlur={() => setEditingIndex(null)}

                        InputProps={{
                          readOnly: !(isEditable && isActive),
                          disableUnderline: true,
                          style: {
                            textAlign: "center",

                            fontSize: te.fontSize,
                            fontFamily: te.fontFamily,
                            color: te.color,
                            fontWeight: te.fontWeight,
                            fontStyle: te.italic ? "italic" : "normal",
                            padding: 0,
                            background: "transparent",
                            lineHeight: "1.2em",

                            // Let wrapper handle pointer until active
                            pointerEvents: isEditable && isActive ? "auto" : "none",
                          },
                        }}
                        sx={{
                          width: "100%",
                          height: "100%",

                          // ✅ make sure both single & multiline inputs are centered
                          "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
                            textAlign: "center",
                            textAlignLast: "center",
                          },

                          "& .MuiInputBase-input": {
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "pre-wrap",
                          },
                        }}
                      />
                    </Box>
                  );
                })}

              </Box>
            )}

          {/* ---------------- Admin editable layer (unchanged) ---------------- */}
          {isAdminEditor && (
            <>
              {!(multipleTextValue1 || showOneTextRightSideBox1) &&
                textElements1?.map((textElement) => {
                  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

                  const hAlign =
                    textElement.textAlign === "top"
                      ? "flex-start"
                      : textElement.textAlign === "end"
                        ? "flex-end"
                        : "center";
                  const vAlign =
                    textElement.verticalAlign === "top"
                      ? "flex-start"
                      : textElement.verticalAlign === "bottom"
                        ? "flex-end"
                        : "center";

                  let touchStartTime = 0;
                  let lastTap = 0;

                  return (
                    <ScaledRnd
                      key={textElement.id}
                      cancel={textElement.isEditing ? ".no-drag, .text-edit" : ".no-drag"}
                      enableUserSelectHack={false}
                      enableResizing={{ bottomRight: true }}
                      size={{ width: textElement.size.width, height: textElement.size.height }}
                      position={{ x: textElement.position.x, y: textElement.position.y }}
                      bounds="parent"
                      style={{
                        transform: `rotate(${textElement.rotation || 0}deg)`,
                        zIndex: textElement.zIndex,
                        display: "flex",
                        alignItems: vAlign,
                        justifyContent: hAlign,
                        touchAction: textElement.isEditing ? "manipulation" : "none",
                        transition: "border 0.2s ease",
                        cursor: textElement.isEditing ? "text" : "move",
                      }}
                      onTouchStart={() => { touchStartTime = Date.now(); }}
                      onPointerDown={(e: any) => {
                        if (e?.pointerType !== "touch") return;
                        touchStartTime = Date.now();
                      }}
                      onTouchEnd={(e: any) => {
                        const now = Date.now();
                        const timeSince = now - lastTap;
                        const touchDuration = now - touchStartTime;
                        if (touchDuration < 200) {
                          const shouldEdit = isIos || timeSince < 300;
                          setSelectedTextId1(textElement.id);
                          if (shouldEdit) {
                            updateTextElement1(textElement.id, { isEditing: true });
                            focusEditableTextFromTarget(e.currentTarget);
                          }
                        }
                        lastTap = now;
                      }}
                      onPointerUp={(e: any) => {
                        if (e?.pointerType !== "touch") return;
                        const now = Date.now();
                        const timeSince = now - lastTap;
                        const touchDuration = now - touchStartTime;
                        if (touchDuration < 200) {
                          const shouldEdit = isIos || timeSince < 300;
                          setSelectedTextId1(textElement.id);
                          if (shouldEdit) {
                            updateTextElement1(textElement.id, { isEditing: true });
                            focusEditableTextFromTarget(e.currentTarget);
                          }
                        }
                        lastTap = now;
                      }}
                      onMouseDown={() => setSelectedTextId1(textElement.id)}
                      onDoubleClick={(e: any) => {
                        setSelectedTextId1(textElement.id);
                        updateTextElement1(textElement.id, { isEditing: true });
                        focusEditableTextFromTarget(e.currentTarget);
                      }}
                      onDragStart={() => align.onDragStart()}
                      onDrag={(_, d) => {
                        const snap = align.onDrag(
                          d.x,
                          d.y,
                          textElement.size.width,
                          textElement.size.height,
                          alignItems,
                          `txt:${textElement.id}`
                        );
                        updateTextElement1(textElement.id, {
                          position: {
                            x: snap.snappedX ? snap.x : d.x,
                            y: snap.snappedY ? snap.y : d.y,
                          },
                        });
                      }}
                      onDragStop={(_, d) => {
                        const snap = align.onDrag(
                          d.x,
                          d.y,
                          textElement.size.width,
                          textElement.size.height,
                          alignItems,
                          `txt:${textElement.id}`
                        );
                        updateTextElement1(textElement.id, { position: { x: snap.x, y: snap.y } });
                        align.onDragStop();
                      }}
                      onResizeStop={(_, __, ref, ___, position) => {
                        updateTextElement1(textElement.id, {
                          size: { width: parseInt(ref.style.width, 10), height: parseInt(ref.style.height, 10) },
                          position: { x: position.x, y: position.y },
                        });
                      }}
                      resizeHandleStyles={{
                        bottomRight: {
                          width: isMobile ? "20px" : "12px",
                          height: isMobile ? "20px" : "12px",
                          background: "white",
                          border: "2px solid #1976d2",
                          borderRadius: "3px",
                          right: isMobile ? "-10px" : "-6px",
                          bottom: isMobile ? "-10px" : "-6px",
                          cursor: "se-resize",
                          zIndex: 999,
                          touchAction: "none",
                        },
                      }}
                    >
                      <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                        {/* Delete */}
                        <IconButton
                          size="small"
                          className="no-drag"
                          onClick={(e) => { e.stopPropagation(); deleteTextElement1(textElement.id); }}
                          sx={{
                            position: "absolute", top: -10, right: -10, bgcolor: "#1976d2", color: "white",
                            width: isMobile ? 26 : 20, height: isMobile ? 26 : 20, "&:hover": { bgcolor: "#f44336" },
                            zIndex: 1, pointerEvents: "auto", touchAction: "auto",
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>

                        {/* Rotate */}
                        <IconButton
                          size="small"
                          className="no-drag"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTextElement1(textElement.id, { rotation: (textElement.rotation || 0) + 30 });
                          }}
                          sx={{
                            position: "absolute", top: -10, left: -10, bgcolor: "#1976d2", color: "white",
                            width: isMobile ? 26 : 20, height: isMobile ? 26 : 20, "&:hover": { bgcolor: "#f44336" },
                            zIndex: 3000, pointerEvents: "auto", touchAction: "auto",
                          }}
                        >
                          <Forward30 fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>

                        {/* Layer controls (use your global layerUpAny/layerDownAny) */}
                        <Tooltip title="To Back">
                          <Box
                            className="no-drag"
                            onClick={(e) => { e.stopPropagation(); layerDownAny({ type: 'text', id: textElement.id }); }}
                            sx={{
                              position: "absolute", top: -25, left: 20, bgcolor: "black", color: "white",
                              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                              p: isMobile ? "4px" : "2px", zIndex: 9999, cursor: "pointer", "&:hover": { bgcolor: "#333" },
                            }}
                          >
                            <KeyboardArrowDownOutlined fontSize={isMobile ? "medium" : "small"} />
                          </Box>
                        </Tooltip>

                        <Tooltip title="To Front">
                          <Box
                            className="no-drag"
                            onClick={(e) => { e.stopPropagation(); layerUpAny({ type: 'text', id: textElement.id }); }}
                            sx={{
                              position: "absolute", top: -25, left: 45, bgcolor: "black", color: "white",
                              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                              p: isMobile ? "4px" : "2px", zIndex: 9999, cursor: "pointer", "&:hover": { bgcolor: "#333" },
                            }}
                          >
                            <KeyboardArrowUpOutlined fontSize={isMobile ? "medium" : "small"} />
                          </Box>
                        </Tooltip>

                        {/* Duplicate */}
                        <Tooltip title="Duplicate text">
                          <IconButton
                            size="small"
                            className="no-drag"
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateLayer('text', textElement.id);
                            }}
                            sx={{
                              position: "absolute", top: -25, left: 70, bgcolor: "black", color: "white",
                              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                              p: isMobile ? "4px" : "2px", zIndex: 9999, cursor: "pointer", "&:hover": { bgcolor: "#333" },
                            }}
                          >
                            <ContentCopyOutlined fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        {/* Content: drag anywhere when NOT editing; click twice to edit */}
                        <Box
                          sx={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: vAlign,
                            justifyContent: hAlign,
                            userSelect: "none",
                            touchAction: textElement.isEditing ? "manipulation" : "none",
                            transform: `rotate(${textElement.rotation || 0}deg)`,
                            border: hideTextOutline
                              ? "none"
                              : textElement.id === selectedTextId1
                              ? "2px solid #1976d2"
                              : "1px dashed #4a7bd5",
                            zIndex: textElement.zIndex,
                            cursor: textElement.isEditing ? "text" : "move", // ✅ keep move cursor
                          }}
                          onDoubleClick={(e: any) => {
                            setSelectedTextId1(textElement.id);
                            updateTextElement1(textElement.id, { isEditing: true });
                            focusEditableTextFromTarget(e.currentTarget);
                          }}
                        >
                          <TextField
                            variant="standard"
                            value={textElement.value}
                            className="text-edit"         // ✅ used by cancel when editing
                            placeholder="Add Text"
                            multiline
                            fullWidth
                            tabIndex={0}
                            // autoFocus={textElement.id === selectedTextId1 && textElement.isEditing}
                            InputProps={{
                              readOnly: !textElement.isEditing,
                              disableUnderline: true,
                              style: {
                                fontSize: textElement.fontSize,
                                fontWeight: textElement.fontWeight,
                                color: textElement.fontColor || "#000",
                                fontFamily: textElement.fontFamily || "Arial",
                                lineHeight: textElement.lineHeight || 1.4,
                                letterSpacing: textElement.letterSpacing ? `${textElement.letterSpacing}px` : "0px",
                                padding: 0,
                                width: "100%",
                                display: "flex",
                                alignItems: vAlign,
                                justifyContent: hAlign,
                                // ✅ drag by default, only interact with text in edit mode
                                pointerEvents: textElement.isEditing ? "auto" : "none",
                              },
                            }}
                            onChange={(e) => updateTextElement1(textElement.id, { value: e.target.value })}
                            onFocus={(e) => {
                              e.stopPropagation();
                              setSelectedTextId1(textElement.id);
                              updateTextElement1(textElement.id, { isEditing: true });
                            }}
                            onBlur={(e) => { e.stopPropagation(); updateTextElement1(textElement.id, { isEditing: false }); }}
                            sx={{
                              "& .MuiInputBase-input": { overflowY: "auto", textAlign: textElement.textAlign || "center" },
                            }}
                          />
                        </Box>
                      </Box>
                    </ScaledRnd>
                  );
                })}

              {/* VIDEO QR */}
              {selectedVideoUrl1 && (
                <ScaledRnd
                  cancel=".no-drag"
                  size={{
                    width: (qrPosition1 as any).boxWidth || 350,
                    height: Math.round((((qrPosition1 as any).boxWidth || 350) * 200) / 350),
                  }}
                  position={{ x: qrPosition1.x, y: qrPosition1.y }}
                  onDragStop={(_, d) =>
                    setQrPosition1((prev) => ({ ...prev, x: d.x, y: d.y, zIndex: qrPosition1.zIndex }))
                  }
                  bounds="parent"
                  lockAspectRatio
                  onResizeStop={(_, __, ref, ___, position) => {
                    setQrPosition1((prev) => ({
                      ...prev,
                      boxWidth: parseInt(ref.style.width, 10),
                      boxHeight: Math.round((parseInt(ref.style.width, 10) * 200) / 350),
                      x: position.x,
                      y: position.y,
                      zIndex: qrPosition1.zIndex,
                    }));
                  }}
                  enableResizing={{ bottomRight: true }}
                  resizeHandleStyles={{
                    bottomRight: {
                      width: "12px",
                      height: "12px",
                      background: "white",
                      border: "2px solid #1976d2",
                      borderRadius: "3px",
                      right: "-6px",
                      bottom: "-6px",
                      cursor: "se-resize",
                      zIndex: 9999,
                    },
                  }}
                  style={{ zIndex: 999, overflow: "hidden", border: "2px solid #1976d2", borderRadius: "8px", background: "rgba(255,255,255,0.2)", boxShadow: "0 0 0 1px rgba(25,118,210,0.15)" }}
                >
                  <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <motion.div
                      key={selectedVideoUrl1}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      style={{
                        width: 350,
                        height: 200,
                        transform: `scale(${Math.min(
                        (((qrPosition1 as any).boxWidth || 350) / 350)
                      )})`,
                        transformOrigin: "center center",
                      }}
                    >
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-end",
                        m: "auto",
                        width: 350,
                        textAlign: "center",
                        height: 200,
                        bottom: 0,
                        flex: 1,
                      }}
                    >
                      <Box component={"img"} src="/assets/images/video-qr-tips.png" sx={{ width: "100%", height: 200, pointerEvents: "none" }} />
                      <Box sx={{ position: "absolute", top: 55, width: 68, height: 68, left: { md: 6, sm: 6, xs: 5 }, borderRadius: 2, overflow: "hidden" }}>
                        <QrGenerator url={selectedVideoUrl1} size={68} />
                      </Box>
                      <a href={`${selectedVideoUrl1}`} target="_blank" rel="noreferrer">
                        <Typography sx={{ position: "absolute", top: 80, right: 15, zIndex: 9999, color: "black", fontSize: "10px", width: "105px" }}>
                          {`${selectedVideoUrl1.slice(0, 20)}.....`}
                        </Typography>
                      </a>
                      <IconButton
                        className="no-drag"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVideoUrl1(null);
                        }}
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bgcolor: COLORS.black,
                          color: COLORS.white,
                          zIndex: 9999,
                          "&:hover": { bgcolor: "red" },
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                    </motion.div>
                  </Box>
                </ScaledRnd>
              )}

              {/* AUDIO QR */}
              {selectedAudioUrl1 && (
                <ScaledRnd
                  cancel=".no-drag"
                  size={{
                    width: (qrAudioPosition1 as any).boxWidth || 350,
                    height: Math.round((((qrAudioPosition1 as any).boxWidth || 350) * 200) / 350),
                  }}
                  position={{ x: qrAudioPosition1.x, y: qrAudioPosition1.y }}
                  onDragStop={(_, d) =>
                    setQrAudioPosition1((prev) => ({ ...prev, x: d.x, y: d.y, zIndex: qrAudioPosition1.zIndex }))
                  }
                  bounds="parent"
                  lockAspectRatio
                  onResizeStop={(_, __, ref, ___, position) => {
                    setQrAudioPosition1((prev) => ({
                      ...prev,
                      boxWidth: parseInt(ref.style.width, 10),
                      boxHeight: Math.round((parseInt(ref.style.width, 10) * 200) / 350),
                      x: position.x,
                      y: position.y,
                      zIndex: qrAudioPosition1.zIndex,
                    }));
                  }}
                  enableResizing={{ bottomRight: true }}
                  resizeHandleStyles={{
                    bottomRight: {
                      width: "12px",
                      height: "12px",
                      background: "white",
                      border: "2px solid #1976d2",
                      borderRadius: "3px",
                      right: "-6px",
                      bottom: "-6px",
                      cursor: "se-resize",
                      zIndex: 9999,
                    },
                  }}
                  style={{ zIndex: 999, overflow: "hidden", border: "2px solid #1976d2", borderRadius: "8px", background: "rgba(255,255,255,0.2)", boxShadow: "0 0 0 1px rgba(25,118,210,0.15)" }}
                >
                  <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <motion.div
                      key={selectedAudioUrl1}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      style={{
                        width: 350,
                        height: 200,
                        transform: `scale(${Math.min(
                        (((qrAudioPosition1 as any).boxWidth || 350) / 350)
                      )})`,
                        transformOrigin: "center center",
                      }}
                    >
                    <Box
                      sx={{
                        position: "relative",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-end",
                        m: "auto",
                        width: 350,
                        textAlign: "center",
                        height: 200,
                        bottom: 0,
                        flex: 1,
                      }}
                    >
                      <Box component={"img"} src="/assets/images/audio-qr-tips.png" sx={{ width: "100%", height: 200, pointerEvents: "none" }} />
                      <Box sx={{ position: "absolute", top: 55, width: 68, height: 68, left: { md: 6, sm: 6, xs: 5 }, borderRadius: 2, overflow: "hidden" }}>
                        <QrGenerator url={selectedAudioUrl1} size={68} />
                      </Box>
                      <a href={`${selectedAudioUrl1}`} target="_blank" rel="noreferrer">
                        <Typography sx={{ position: "absolute", top: 78, right: 15, zIndex: 9999, color: "black", fontSize: "10px", width: "105px" }}>
                          {`${selectedAudioUrl1.slice(0, 20)}.....`}
                        </Typography>
                      </a>
                      <IconButton
                        onClick={() => setSelectedAudioUrl1(null)}
                        className="no-drag"
                        sx={{ position: "absolute", top: 0, right: 0, bgcolor: COLORS.black, color: COLORS.white, "&:hover": { bgcolor: "red" } }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                    </motion.div>
                  </Box>
                </ScaledRnd>
              )}

              {/* USER IMAGES */}
              {draggableImages1
                .filter((img: any) => selectedImg1.includes(img.id))
                .map(({ id, src, x, y, width, height, zIndex, rotation = 0, filter, locked }: any, index: number) => {
                  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
                  const isSelected = selectedShapeImageId1 === id;
                  const isLocked = !!locked;

                  return (
                    <ScaledRnd
                      key={id}
                      size={{ width, height }}
                      position={{ x, y }}
                      bounds="parent"
                      enableUserSelectHack={false}
                      cancel=".non-draggable"
                      disableDragging={isLocked}
                      enableResizing={isLocked ? false : { bottomRight: true }}
                      onDragStart={() => align.onDragStart()}
                      onDrag={(_, d) => {
                        if (isLocked) return;
                        const snap = align.onDrag(d.x, d.y, width, height, alignItems, `img:${id}`);
                        const nextX = snap.snappedX ? snap.x : d.x;
                        const nextY = snap.snappedY ? snap.y : d.y;
                        setDraggableImages1((prev) =>
                          prev.map((img) => (img.id === id ? { ...img, x: nextX, y: nextY } : img))
                        );
                      }}
                      onDragStop={(_, d) => {
                        if (isLocked) return;
                        const snap = align.onDrag(d.x, d.y, width, height, alignItems, `img:${id}`);
                        setDraggableImages1((prev) =>
                          prev.map((img) => (img.id === id ? { ...img, x: snap.x, y: snap.y } : img))
                        );
                        align.onDragStop();
                      }}
                      onResizeStop={(_, __, ref, ___, position) => {
                        if (isLocked) return;
                        const newWidth = parseInt(ref.style.width);
                        const newHeight = parseInt(ref.style.height);
                        setDraggableImages1((prev) =>
                          prev.map((img) =>
                            img.id === id
                              ? { ...img, width: newWidth, height: newHeight, x: position.x, y: position.y }
                              : img
                          )
                        );
                      }}
                      style={{
                        zIndex: zIndex || 1,
                        boxSizing: "border-box",
                        borderRadius: 8,
                        touchAction: "none",
                        outline: isSelected ? "2px solid #1976d2" : "none",
                        opacity: isLocked ? 0.9 : 1,
                      }}
                      onClick={() => setSelectedShapeImageId1(id)}
                      onDoubleClick={() => openCropEditor("image", index)}
                      resizeHandleStyles={{
                        bottomRight: {
                          width: isMobile ? "20px" : "10px",
                          height: isMobile ? "20px" : "10px",
                          background: "white",
                          border: "1px solid #1976d2",
                          borderRadius: "10%",
                          right: isMobile ? "-10px" : "-5px",
                          bottom: isMobile ? "-10px" : "-5px",
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                          overflow: "visible",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
	                        <Box
	                          sx={{
	                            width: "100%",
                            height: "100%",
                            transform: `rotate(${rotation}deg)`,
                            transformOrigin: "center center",
                            border: "2px solid #1976d2",
                            outline: isSelected ? "1px solid #cf57ffff" : "none",
                            borderRadius: isSelected ? 1 : 0,
	                            pointerEvents: "auto",
	                            cursor: isLocked ? "default" : "move",
	                          }}
	                          onMouseDown={() => setSelectedShapeImageId1(id)}
	                          onDoubleClickCapture={(e) => {
	                            e.stopPropagation();
	                            if (!isLocked) openCropEditor("image", index);
	                          }}
	                          onDoubleClick={(e) => {
	                            e.stopPropagation();
	                            if (!isLocked) openCropEditor("image", index);
	                          }}
	                          onTouchStart={(e) => {
	                            e.stopPropagation();
	                            setSelectedShapeImageId1(id);
                          }}
                          onPointerDown={(e: any) => {
                            if (e?.pointerType !== "touch") return;
                            e.stopPropagation();
                            setSelectedShapeImageId1(id);
                          }}
                        >
                          <img
                            src={src}
                            alt="Uploaded"
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: 2,
                              pointerEvents: "none",
                              objectFit: "fill",
                              filter: filter || "none",
                              zIndex: zIndex,
                              clipPath: (() => {
                                const me = draggableImages1.find((img) => img.id === id);
                                return me?.shapePath || "none";
                              })(),
                            }}
                          />
                        </Box>

                        {/* rotate */}
                        {!isLocked && (
                          <Box
                            className="non-draggable"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDraggableImages1((prev) =>
                                prev.map((img) => (img.id === id ? { ...img, rotation: (img.rotation || 0) + 15 } : img))
                              );
                            }}
                            sx={{
                              position: "absolute",
                              top: -25,
                              left: -5,
                              bgcolor: "black",
                              color: "white",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              p: isMobile ? "4px" : "2px",
                              zIndex: 9999,
                              cursor: "pointer",
                              "&:hover": { bgcolor: "#333" },
                            }}
                          >
                            <Forward30 fontSize={isMobile ? "medium" : "small"} />
                          </Box>
                        )}

                        {/* layer controls */}
                        {!isLocked && (
                          <>
                            <Tooltip title="To Back">
                              <Box
                                className="non-draggable"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  layerDownAny({ type: 'image', id });
                                }}
                                sx={{
                                  position: "absolute",
                                  top: -25,
                                  left: 20,
                                  bgcolor: "black",
                                  color: "white",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  p: isMobile ? "4px" : "2px",
                                  zIndex: 9999,
                                  cursor: "pointer",
                                  "&:hover": { bgcolor: "#333" },
                                }}
                              >
                                <KeyboardArrowDownOutlined fontSize={isMobile ? "medium" : "small"} />
                              </Box>
                            </Tooltip>

                            <Tooltip title="To Front">
                              <Box
                                className="non-draggable"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  layerUpAny({ type: 'image', id });
                                }}
                                sx={{
                                  position: "absolute",
                                  top: -25,
                                  left: 45,
                                  bgcolor: "black",
                                  color: "white",
                                  borderRadius: "50%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  p: isMobile ? "4px" : "2px",
                                  zIndex: 9999,
                                  cursor: "pointer",
                                  "&:hover": { bgcolor: "#333" },
                                }}
                              >
                                <KeyboardArrowUpOutlined fontSize={isMobile ? "medium" : "small"} />
                              </Box>
                            </Tooltip>
                          </>
                        )}

                        {/* Duplicate Image Button */}
                        {isAdminEditor && !isLocked && (
                          <Tooltip title="Duplicate">
                            <Box
                              className="non-draggable"
                              onClick={(e) => {
                                e.stopPropagation();

                                const original = draggableImages1.find((img) => img.id === id);
                                if (!original) return;

                                const duplicate = {
                                  ...original,
                                  id: `img-dup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                                  x: original.x + 40,
                                  y: original.y + 30,
                                  zIndex: (original.zIndex || 1) + 5,
                                };

                                setDraggableImages1((prev) => [...prev, duplicate]);
                                setSelectedShapeImageId1(duplicate.id);
                                setSelectedImage1((prev: any) => [...prev, duplicate.id]); // ← yeh line important hai (filter ke liye)
                              }}
                              sx={{
                                position: "absolute",
                                top: -25,
                                left: 70,
                                bgcolor:COLORS.black,
                                color: "white",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 28,
                                height: 28,
                                zIndex: 10000,
                                cursor: "pointer",
                                "&:hover": { bgcolor:COLORS.gray },
                              }}
                            >
                              <ContentCopyOutlined fontSize="small" />
                            </Box>
                          </Tooltip>
                        )}

                        {/* close */}
                        {!isLocked && (
                          <Box
                            className="non-draggable"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedImage1((prev) => prev.filter((i) => i !== id));
                              setDraggableImages1((prev) => prev.filter((img) => img.id !== id));
                              setActiveFilterImageId1(null);
                              setImageFilter1(false);
                            }}
                            sx={{
                              position: "absolute",
                              top: -25,
                              right: -5,
                              bgcolor: "black",
                              color: "white",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              p: isMobile ? "4px" : "2px",
                              zIndex: 9999,
                              cursor: "pointer",
                              "&:hover": { bgcolor: "#333" },
                            }}
                          >
                            <Close fontSize={isMobile ? "medium" : "small"} />
                          </Box>
                        )}
                      </Box>
                    </ScaledRnd>
                  );
                })}

              {/* ONE TEXT BOX */}
              {showOneTextRightSideBox1 && (
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    alignItems: "stretch",
                    justifyContent: "flex-start",
                    height: "100%",
                    width: "100%",
                    border: hideTextOutline ? "none" : "3px dashed #3a7bd5",
                    position: "absolute",
                    bgcolor: "#6183cc36",
                    p: 1,
                    top: 0,
                    left: 0,
                    boxSizing: "border-box",
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      width: "35px",
                      height: "35px",
                      p: 1,
                      bgcolor: COLORS.primary,
                      color: "white",
                      border: "1px solid #ccc",
                      "&:hover": { bgcolor: "#f44336", color: "white" },
                      zIndex: 5,
                    }}
                    onClick={() => {
                      setOneTextValue1("");
                      if (typeof setShowOneTextRightSideBox1 === "function") {
                        setShowOneTextRightSideBox1(false);
                        setSelectedLayout1("blank");
                      }
                    }}
                  >
                    <Close />
                  </IconButton>
                  <Box
                    sx={{
                      height: "100%",
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent:
                        verticalAlign1 === "top"
                          ? "flex-start"
                          : verticalAlign1 === "center"
                            ? "center"
                            : "flex-end",
                      alignItems:
                        textAlign1 === "start"
                          ? "flex-start"
                          : textAlign1 === "center"
                            ? "center"
                            : "flex-end",
                    }}
                  >
                    <TextField
                      variant="standard"
                      value={oneTextValue1}
                      onChange={(e) => setOneTextValue1(e.target.value)}
                      InputProps={{
                        disableUnderline: true,
                        sx: {
                          height: "100%",
                          alignItems:
                            verticalAlign1 === "top"
                              ? "flex-start"
                              : verticalAlign1 === "center"
                                ? "center"
                                : "flex-end",
                          "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
                            fontSize: fontSize1,
                            fontWeight: fontWeight1,
                            color: fontColor1,
                            fontFamily: fontFamily1,
                            textAlign: textAlign1,
                            transform: `rotate(${rotation1}deg)`,
                            lineHeight: lineHeight1,
                            letterSpacing: letterSpacing1,
                            minHeight: "unset !important",
                            height: "auto !important",
                            maxHeight: "100%",
                            boxSizing: "border-box",
                            overflowY: "auto",
                          },
                        },
                      }}
                      sx={{ width: "100%", height: "100%" }}
                      autoFocus
                      multiline
                      fullWidth
                    />
                  </Box>
                </Box>
              )}

              {/* MULTI TEXT LAYOUT */}
              {multipleTextValue1 && (
                <Box
                  sx={{
                    height: "98%",
                    width: "var(--card-slide-w, 475px)",
                    borderRadius: "6px",
                    p: 1,
                    position: "absolute",
                    top: 10,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {texts1?.map((textObj, index) => (
                    <Box
                      key={index}
                      sx={{
                        position: "relative",
                        height: { md: "210px", sm: "180px", xs: "180px" },
                        width: "100%",
                        mb: 2,
                        border: hideTextOutline ? "none" : "3px dashed #3a7bd5",
                        borderRadius: "6px",
                        justifyContent: "center",
                        display: "flex",
                        alignItems:
                          verticalAlign1 === "top"
                            ? "flex-start"
                            : verticalAlign1 === "center"
                              ? "center"
                              : "flex-end",
                      }}
                    >
                      <IconButton
                        size="small"
                        sx={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          width: "28px",
                          height: "28px",
                          bgcolor: COLORS.primary,
                          color: "white",
                          border: "1px solid #ccc",
                          "&:hover": { bgcolor: "#f44336", color: "white" },
                          zIndex: 5,
                        }}
                        onClick={() => {
                          setTexts1((prev) => {
                            const updated = prev.filter((_, i) => i !== index);
                            if (updated.length === 0) {
                              setMultipleTextValue1(false);
                              setSelectedLayout1("blank");
                            }
                            return updated;
                          });
                        }}
                      >
                        <Close />
                      </IconButton>

                      {editingIndex1 === index ? (
                        <TextField
                          autoFocus
                          fullWidth
                          multiline
                          variant="standard"
                          value={textObj.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setTexts1((prev) =>
                              prev.map((t, i) =>
                                i === index
                                  ? {
                                    ...t,
                                    value: newValue,
                                    textAlign: textAlign1,
                                    verticalAlign: verticalAlign1,
                                  }
                                  : t,
                              ),
                            );
                          }}
                          InputProps={{
                            disableUnderline: true,
                            sx: {
                              "& textarea": {
                                width: "100%",
                                resize: "none",
                                height: "100px",
                                fontSize: textObj.fontSize1 ?? textObj.fontSize,
                                fontWeight: textObj.fontWeight1 ?? textObj.fontWeight,
                                color: textObj.fontColor1 ?? textObj.fontColor,
                                fontFamily: textObj.fontFamily1 ?? textObj.fontFamily,
                                textAlign: textObj.textAlign,
                                lineHeight: textObj.lineHeight,
                                letterSpacing: textObj.letterSpacing,
                              },
                            },
                          }}
                        />
                      ) : (
                        <Box
                          onClick={() => {
                            if (editingIndex1 !== null) {
                              setTexts1((prev) =>
                                prev.map((t, i) =>
                                  i === editingIndex1
                                    ? { ...t, textAlign: textAlign1, verticalAlign: verticalAlign1 }
                                    : t,
                                ),
                              );
                            }
                            setEditingIndex1(index);
                            setFontSize1(textObj.fontSize1 ?? textObj.fontSize ?? 16);
                            setFontFamily1(textObj.fontFamily1 ?? textObj.fontFamily ?? "Roboto");
                            setFontWeight1(textObj.fontWeight1 ?? textObj.fontWeight ?? 400);
                            setFontColor1(textObj.fontColor1 ?? textObj.fontColor ?? "#000000");
                            setTextAlign1(textObj.textAlign);
                            setVerticalAlign1(textObj.verticalAlign);
                          }}
                          sx={{ width: "100%", height: "100%", cursor: "pointer" }}
                        >
                          <Typography
                            sx={{
                              fontSize: textObj.fontSize1 ?? textObj.fontSize,
                              fontWeight: textObj.fontWeight1 ?? textObj.fontWeight,
                              color: textObj.fontColor1 ?? textObj.fontColor,
                              fontFamily: textObj.fontFamily1 ?? textObj.fontFamily,
                              textAlign: textObj.textAlign,
                              lineHeight: textObj.lineHeight,
                              letterSpacing: textObj.letterSpacing,
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems:
                                textObj.verticalAlign === "top"
                                  ? "flex-start"
                                  : textObj.verticalAlign === "bottom"
                                    ? "flex-end"
                                    : "center",
                              justifyContent:
                                textObj.textAlign === "left"
                                  ? "flex-start"
                                  : textObj.textAlign === "right"
                                    ? "flex-end"
                                    : "center",
                            }}
                          >
                            {textObj.value.length === 0 ? (
                              <TitleOutlined sx={{ alignSelf: "center", color: "gray" }} />
                            ) : null}{" "}
                            {textObj.value}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {/* AI IMAGE */}
              {isAIimage1 && (
                <ScaledRnd
                  bounds="parent"
                  size={{ width: aimage1.width, height: aimage1.height }}
                  position={{ x: aimage1.x, y: aimage1.y }}
                  onDragStart={() => align.onDragStart()}
                  onDrag={(_, d) => {
                    const snap = align.onDrag(
                      d.x,
                      d.y,
                      aimage1.width,
                      aimage1.height,
                      alignItems,
                      "ai:1"
                    );
                    setAIImage1((prev: any) => ({
                      ...prev,
                      x: snap.snappedX ? snap.x : d.x,
                      y: snap.snappedY ? snap.y : d.y,
                    }));
                  }}
                  onDragStop={(_, d) => {
                    const snap = align.onDrag(
                      d.x,
                      d.y,
                      aimage1.width,
                      aimage1.height,
                      alignItems,
                      "ai:1"
                    );
                    setAIImage1((prev: any) => ({ ...prev, x: snap.x, y: snap.y }));
                    align.onDragStop();
                  }}
                  onResizeStop={(_, __, ref, ___, position) =>
                    setAIImage1({
                      width: parseInt(ref.style.width),
                      height: parseInt(ref.style.height),
                      x: position.x,
                      y: position.y,
                    })
                  }
                  enableResizing={{ bottomRight: true }}
                  resizeHandleStyles={{
                    bottomRight: {
                      width: "10px",
                      height: "10px",
                      background: "white",
                      border: "2px solid #1976d2",
                      borderRadius: "10%",
                      right: "-5px",
                      bottom: "-5px",
                      cursor: "se-resize",
                    },
                  }}
                  style={{
                    zIndex: 10,
                    border: "2px solid #1976d2",
                    display: "flex",
                    alignItems: "stretch",
                    justifyContent: "stretch",
                  }}
                >
                  <Box sx={{ position: "relative", width: "100%", height: "100%", display: "flex" }}>
                    <Box component="img" src={`${selectedAIimageUrl1}`} alt="AI Image" sx={{ width: "100%", height: "100%", objectFit: "fill", pointerEvents: "none" }} />
                    <IconButton
                      onClick={() => setIsAIimage1?.(false)}
                      sx={{ position: "absolute", top: -7, right: -7, bgcolor: "black", color: "white", width: 22, height: 22, "&:hover": { bgcolor: "red" } }}
                    >
                      <Close />
                    </IconButton>
                  </Box>
                </ScaledRnd>
              )}

              {/* STICKERS (admin drag/resize) */}
              {selectedStickers1?.map((sticker: any, index) => {
                const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
                const isSelected = selectedStickerIndex === index;
                const isLocked = !!sticker.locked;

                return (
                  <ScaledRnd
                    key={sticker.id || index}
                    size={{ width: sticker.width, height: sticker.height }}
                    position={{ x: sticker.x, y: sticker.y }}
                    bounds="parent"
                    enableUserSelectHack={false}
                    cancel=".non-draggable"
                    disableDragging={isLocked}
                    enableResizing={isLocked ? false : { bottomRight: true }}
                    onMouseDown={() => setSelectedStickerIndex(index)}
                    onDragStart={() => align.onDragStart()}
                    onDrag={(_, d) => {
                      if (isLocked) return;
                      const snap = align.onDrag(
                        d.x,
                        d.y,
                        sticker.width,
                        sticker.height,
                        alignItems,
                        `st:${sticker.id ?? index}`
                      );
                      updateSticker1(index, {
                        x: snap.snappedX ? snap.x : d.x,
                        y: snap.snappedY ? snap.y : d.y,
                        zIndex: sticker.zIndex,
                      });
                    }}
                    onDragStop={(_, d) => {
                      if (!isLocked) {
                        const snap = align.onDrag(
                          d.x,
                          d.y,
                          sticker.width,
                          sticker.height,
                          alignItems,
                          `st:${sticker.id ?? index}`
                        );
                        updateSticker1(index, {
                          x: snap.x,
                          y: snap.y,
                          zIndex: sticker.zIndex,
                        });
                      }
                      align.onDragStop();
                    }}
                    onResizeStop={(_, __, ref, ___, position) =>
                      !isLocked &&
                      updateSticker1(index, {
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                        x: position.x,
                        y: position.y,
                        zIndex: sticker.zIndex,
                      })
                    }
                    resizeHandleStyles={{
                      bottomRight: {
                        width: isMobile ? "20px" : "10px",
                        height: isMobile ? "20px" : "10px",
                        background: "white",
                        border: "2px solid #1976d2",
                        borderRadius: "10%",
                        right: isMobile ? "-10px" : "-5px",
                        bottom: isMobile ? "-10px" : "-5px",
                        cursor: "se-resize",
                      },
                    }}
                    style={{
                      zIndex: sticker.zIndex,
                      position: "absolute",
                      touchAction: "none",
                      outline: isSelected ? "2px solid #1976d2" : "none",
                      opacity: isLocked ? 0.9 : 1,
                    }}
                  >
                    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                      <Box
                        component="img"
                        src={sticker.sticker}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          transform: `rotate(${sticker.rotation || 0}deg)`,
                          transition: "transform 0.2s",
                          border: "1px solid #1976d2",
                          pointerEvents: "none",
                        }}
                      />

                      {!isLocked && (
                        <IconButton
                          className="non-draggable"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSticker1(index);
                            if (selectedStickerIndex === index) setSelectedStickerIndex(null);
                          }}
                          sx={{
                            position: "absolute",
                            top: -isMobile ? -20 : -8,
                            right: -isMobile ? -20 : -10,
                            bgcolor: "black",
                            color: "white",
                            p: isMobile ? 1.5 : 1,
                            width: isMobile ? 32 : 25,
                            height: isMobile ? 32 : 25,
                            zIndex: 9999,
                            "&:hover": { bgcolor: "red" },
                          }}
                        >
                          <Close fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>
                      )}

                      {!isLocked && (
                        <IconButton
                          className="non-draggable"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSticker1(index, { rotation: ((sticker.rotation || 0) + 15) % 360 });
                          }}
                          sx={{
                            position: "absolute",
                            top: -isMobile ? -20 : -8,
                            left: -isMobile ? -20 : -5,
                            bgcolor: "black",
                            color: "white",
                            p: isMobile ? 1.5 : 1,
                            width: isMobile ? 32 : 25,
                            height: isMobile ? 32 : 25,
                            zIndex: 9999,
                            "&:hover": { bgcolor: "blue" },
                          }}
                        >
                          <Forward10 fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>
                      )}
                    </Box>
                  </ScaledRnd>
                );
              })}
            </> 
          )}
          </Box>
        )}
      </Box>
    </CanvasScaleContext.Provider>
  );
};

export default SlideCover;
