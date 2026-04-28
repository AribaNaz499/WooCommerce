import { createContext, useContext, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type ComponentProps } from "react";
import { Box, Chip, IconButton, Paper, Switch, TextField, Tooltip, Typography } from "@mui/material";
import {
  Close,
  ContentCopyOutlined,
  Forward10,
  Forward30,
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
  LockOpenOutlined,
  LockOutlined,
  TitleOutlined,
  UploadFileRounded,
} from "@mui/icons-material";
import QrGenerator from "../QR-code/Qrcode";
import { Rnd } from "react-rnd";
import { COLORS } from "../../constant/color";
import { useSlide3 } from "../../context/Slide3Context";
import { motion } from "framer-motion";
import { useLocation, useParams } from "react-router-dom";
import mergePreservePdf from "../../utils/mergePreservePdf";
import { safeGetStorage } from "../../lib/storage";
import { getDraftCardId, isUuid } from "../../lib/draftCardId";
import { readDraftFull } from "../../lib/draftLocal";
import { isIosTouchDevice } from "../../lib/platform";
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

const toElement = (obj: any, i: number, editable: boolean, prefix = "bg"): ElementEl => ({
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
const toSticker = (obj: any, i: number, editable: boolean, prefix = "st"): StickerEl => ({
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
const toText = (obj: any, i: number, editable: boolean, prefix = "te"): TextEl => {
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
    fontSize3: t?.fontSize3 ?? t?.fontSize1 ?? t?.fontSize ?? 16,
    fontWeight3: t?.fontWeight3 ?? t?.fontWeight1 ?? t?.fontWeight ?? 400,
    fontColor3: t?.fontColor3 ?? t?.fontColor1 ?? t?.fontColor ?? "#000000",
    fontFamily3: t?.fontFamily3 ?? t?.fontFamily1 ?? t?.fontFamily ?? "Roboto",
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

function normalizeSlide(slide: any): {
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

  // stickers (layout + user)
  out.stickers.push(...(layout?.stickers?.locked ?? []).map((o: any, i: number) => toSticker(o, i, false, "st-locked")));
  out.stickers.push(...(layout?.stickers?.editable ?? []).map((o: any, i: number) => toSticker(o, i, true, "st-edit")));
  out.stickers.push(...(user?.stickers?.locked ?? []).map((o: any, i: number) => toSticker(o, i, false, "ust-locked")));
  out.stickers.push(...(user?.stickers?.editable ?? []).map((o: any, i: number) => toSticker(o, i, true, "ust-edit")));

  // texts
  out.textElements.push(...(layout?.staticText ?? []).map((o: any, i: number) => toText(o, i, !!o?.editable, "te")));
  const multiRaw = Array.isArray(slide?.multipleTexts) ? slide.multipleTexts : [];
  const hasMultiContent = multiRaw.some((o: any) => str(o?.text ?? o?.value, "").trim().length > 0);
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


// Helper function to create a new text element
const createNewTextElement3 = (defaults: any) => ({
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
});

interface SpreadRightSideProps {
  textAlign?: "start" | "center" | "end";
  rotation?: number;
  togglePopup?: (name: string | null) => void;
  activePopup?: string | null;
  activeIndex?: number;
  addTextRight?: number;
  rightBox?: boolean;
  isAdminEditor?: boolean;
  canvasScale?: number;
}

const SpreadRightSide = ({
  activeIndex,
  addTextRight,
  rightBox,
  isAdminEditor,
  canvasScale,
}: SpreadRightSideProps) => {
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
    setSelectedTextId3(null);
    setEditingIndex3(null);
    setSelectedImage3([]);
    setSelectedShapeImageId3(null);
    setSelectedStickerIndex2(null);
    setSelectedBgIndex3(null);
  };
  const {
    images3,
    selectedImg3,
    setSelectedImage3,
    showOneTextRightSideBox3,
    oneTextValue3,
    setOneTextValue3,
    multipleTextValue3,
    texts3,
    editingIndex3,
    setEditingIndex3,
    fontSize3,
    fontWeight3,
    fontColor3,
    textAlign3,
    verticalAlign3,
    setVerticalAlign3,
    setTextAlign3,
    rotation3,
    setRotation3,
    setTexts3,
    setShowOneTextRightSideBox3,
    fontFamily3,
    // New individual text management
    textElements3,
    setTextElements3,
    selectedTextId3,
    setSelectedTextId3,
    setMultipleTextValue3,
    isSlideActive3,
    setFontSize3,
    setFontColor3,
    setFontWeight3,
    setFontFamily3,
    setLineHeight3,
    setLetterSpacing3,
    selectedVideoUrl3,
    setSelectedVideoUrl3,
    draggableImages3,
    setDraggableImages3,
    qrPosition3,
    setQrPosition3,
    setSelectedAudioUrl3,
    selectedAudioUrl3,
    qrAudioPosition3,
    setQrAudioPosition3,
    isAIimage3,
    setIsAIimage3,
    selectedAIimageUrl3,
    selectedStickers3,
    setSelectedStickers3,
    updateSticker3,
    removeSticker3,
    aimage3,
    setSelectedLayout3,
    setAIImage3,

    setImageFilter3,
    setActiveFilterImageId3,

    lineHeight3,
    letterSpacing3,

    bgColor3,
    bgImage3,
    setBgColor3,
    setBgImage3,
    setSelectedAIimageUrl3,
    layout3,
    setLayout3,
    bgEdit3,
    setBgEdit3,
    bgLocked3,
    setBgLocked3,
    bgRect3,
    setBgRect3,

    selectedShapeImageId3,
    setSelectedShapeImageId3,
  } = useSlide3();


  const [selectedStickerIndex2, setSelectedStickerIndex2] = useState<number | null>(null);
  const [selectedBgIndex3, setSelectedBgIndex3] = useState<number | null>(null);


  const location = useLocation();
  const { id: routeId } = useParams<{ id?: string }>();
  const draftId = useMemo(() => (routeId && isUuid(routeId) ? routeId : getDraftCardId() ?? ""), [routeId]);
  const localDraftFull = useMemo(
    () => (!isAdminEditor && draftId ? readDraftFull(draftId) : null),
    [draftId, isAdminEditor]
  );
  const slide3Template = location.state?.layout?.slides?.slide3 ?? null;
  const draftSlide3 = location.state?.draftFull?.slide3 ?? localDraftFull?.slide3 ?? null;

  const restoredDraftRef = useRef(false);

  const applyTemplateLayout3 = (baseSlide: any, norm: ReturnType<typeof normalizeSlide>) => {
    const flags = baseSlide?.flags ?? {};
    const multiRaw = Array.isArray(baseSlide?.multipleTexts) ? baseSlide.multipleTexts : [];
    const hasMultiContent = multiRaw.some(
      (o: any) => str(o?.text ?? o?.value, "").trim().length > 0
    );
    const templateMulti = flags?.multipleText === true || hasMultiContent;
    const templateOne =
      flags?.showOneText === true ||
      String(baseSlide?.oneText?.value ?? "").trim().length > 0;

    if (templateMulti) {
      setSelectedLayout3?.("multipleText");
      setMultipleTextValue3?.(true);
      setShowOneTextRightSideBox3?.(false);
      setTexts3?.(normalizeMultiTexts(baseSlide?.multipleTexts ?? []));
    } else if (templateOne) {
      setSelectedLayout3?.("oneText");
      setShowOneTextRightSideBox3?.(true);
      setMultipleTextValue3?.(false);
      const ot = baseSlide?.oneText ?? {};
      setOneTextValue3?.(ot.value ?? "");
      if (ot.fontSize != null) setFontSize3?.(ot.fontSize);
      if (ot.fontWeight != null) setFontWeight3?.(ot.fontWeight);
      if (ot.fontColor != null) setFontColor3?.(ot.fontColor);
      if (ot.fontFamily != null) setFontFamily3?.(ot.fontFamily);
      if (ot.textAlign != null) setTextAlign3?.(ot.textAlign);
      if (ot.verticalAlign != null) setVerticalAlign3?.(ot.verticalAlign);
      if (ot.rotation != null) setRotation3?.(ot.rotation);
      if (ot.lineHeight != null) setLineHeight3?.(ot.lineHeight);
      if (ot.letterSpacing != null) setLetterSpacing3?.(ot.letterSpacing);
    } else {
      setSelectedLayout3?.("blank");
      setShowOneTextRightSideBox3?.(false);
      setMultipleTextValue3?.(false);
    }

    return stripLayoutTextElements(norm.layout, {
      stripMulti: templateMulti,
      stripOne: templateOne,
    });
  };

  useEffect(() => {
    const defaultQrVideo = { id: "qr1", url: "", x: 0, y: 0, width: 120, height: 120, rotation: 0, zIndex: 1 };
    const defaultQrAudio = { id: "qr2", url: "", x: 0, y: 0, width: 120, height: 120, rotation: 0, zIndex: 1 };

    // ✅ 1) Draft restore
    if (draftSlide3) {
      restoredDraftRef.current = true;

      setLayout3?.(draftSlide3.layout ?? null);
      setBgColor3?.(draftSlide3.bgColor ?? null);
      setBgImage3?.(draftSlide3.bgImage ?? null);

      setSelectedLayout3?.(draftSlide3.selectedLayout3 ?? "blank");

      // ✅ oneText restore
      setOneTextValue3?.(draftSlide3.oneTextValue3 ?? "");
      // (agar tum showOneTextRightSideBox3 ko layout se drive karte ho)
      setShowOneTextRightSideBox3?.(draftSlide3.selectedLayout3 === "oneText" || !!draftSlide3.showOneTextRightSideBox3);

      // ✅ multipleText restore (IMPORTANT)
      setMultipleTextValue3?.(!!draftSlide3.multipleTextValue3);

      // ✅ MULTIPLE TEXT BOXES CONTENT restore (VERY IMPORTANT)
      // kisi projects me keys different hoti hain, is liye fallbacks:
      const restoredTexts =
        draftSlide3.texts3 ??
        draftSlide3.multipleTextLayout ??
        draftSlide3.texts ??
        [];
      setTexts3?.(Array.isArray(restoredTexts) ? restoredTexts : []);

      // ✅ free user texts restore (draft saved textElements)
      setTextElements3?.(draftSlide3.textElements3 ?? draftSlide3.textElements ?? []);

      // ✅ user draggable images restore
      setDraggableImages3?.(draftSlide3.draggableImages3 ?? draftSlide3.draggableImages ?? []);

      // ✅ selected ids restore (warna filter ki wajah se images show nahi hoti)
      const idsFromDraftImages = (draftSlide3.draggableImages3 ?? draftSlide3.draggableImages ?? []).map((x: any) => x.id);
      setSelectedImage3?.(
        Array.isArray(draftSlide3.selectedImg3)
          ? draftSlide3.selectedImg3
          : idsFromDraftImages
      );

      // ✅ stickers restore
      setSelectedStickers3?.(
        draftSlide3.selectedStickers3 ??
        draftSlide3.selectedStickers2 ??
        draftSlide3.selectedStickers ??
        []
      );

      // ✅ video/audio restore + QR positions
      setSelectedVideoUrl3?.(draftSlide3.selectedVideoUrl3 ?? draftSlide3.selectedVideoUrl ?? null);
      setSelectedAudioUrl3?.(draftSlide3.selectedAudioUrl3 ?? draftSlide3.selectedAudioUrl ?? null);

      setQrPosition3?.(
        draftSlide3.qrPosition3 ??
        draftSlide3.qrPosition ??
        { x: 0, y: 0, width: 120, height: 120, zIndex: 1, url: "" }
      );

      setQrAudioPosition3?.(
        draftSlide3.qrAudioPosition3 ??
        draftSlide3.qrAudioPosition ??
        { x: 0, y: 0, width: 120, height: 120, zIndex: 1, url: "" }
      );

      // ✅ AI image restore
      setIsAIimage3?.(!!(draftSlide3.isAIimage3 ?? draftSlide3.isAIimage));
      setSelectedAIimageUrl3?.(draftSlide3.selectedAIimageUrl3 ?? draftSlide3.selectedAIimageUrl ?? "");
      setAIImage3?.(draftSlide3.aimage3 ?? draftSlide3.aiImage ?? { x: 0, y: 0, width: 200, height: 200 });

      return; // ✅ IMPORTANT: draft restore ke baad template normalize mat chalao
    }

    // ✅ 1.5) If saved slide3_state exists, prefer it (preview exit restore)
    const saved = safeGetStorage("slide3_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const currentDraftId = draftId || getDraftCardId();
        const savedDraftId = parsed?.draftId;
        const canUseSaved = !currentDraftId || (savedDraftId && savedDraftId === currentDraftId);
        if (canUseSaved && parsed?.layout3) {
          if (parsed.bgColor3 !== undefined) setBgColor3?.(parsed.bgColor3);
          if (parsed.bgImage3 !== undefined) setBgImage3?.(parsed.bgImage3);
          setSelectedVideoUrl3?.(parsed.selectedVideoUrl3 ?? parsed.selectedVideoUrl ?? null);
          setSelectedAudioUrl3?.(parsed.selectedAudioUrl3 ?? parsed.selectedAudioUrl ?? null);
          setQrPosition3?.(parsed.qrPosition3 ?? parsed.qrPosition ?? defaultQrVideo);
          setQrAudioPosition3?.(parsed.qrAudioPosition3 ?? parsed.qrAudioPosition ?? defaultQrAudio);
          setLayout3?.(parsed.layout3);
          return;
        }
      } catch { }
    }

    // ✅ 2) Not a draft => template mode (new card)
    restoredDraftRef.current = false;

    if (!slide3Template) return;
    const norm = normalizeSlide(slide3Template);
    setBgColor3?.(norm.bgColor);
    setBgImage3?.(norm.bgImage);
    setLayout3?.(applyTemplateLayout3(slide3Template, norm));

    const templateVideoUrl =
      slide3Template?.qrVideo?.url ??
      slide3Template?.selectedVideoUrl3 ??
      slide3Template?.selectedVideoUrl ??
      null;
    const templateAudioUrl =
      slide3Template?.qrAudio?.url ??
      slide3Template?.selectedAudioUrl3 ??
      slide3Template?.selectedAudioUrl ??
      null;
    const templateQrVideo = slide3Template?.qrVideo ?? slide3Template?.qrPosition3 ?? slide3Template?.qrPosition ?? {};
    const templateQrAudio = slide3Template?.qrAudio ?? slide3Template?.qrAudioPosition3 ?? slide3Template?.qrAudioPosition ?? {};

    setSelectedVideoUrl3?.(templateVideoUrl);
    setSelectedAudioUrl3?.(templateAudioUrl);
    setQrPosition3?.({
      ...defaultQrVideo,
      ...templateQrVideo,
      url: templateVideoUrl ?? templateQrVideo?.url ?? "",
    });
    setQrAudioPosition3?.({
      ...defaultQrAudio,
      ...templateQrAudio,
      url: templateAudioUrl ?? templateQrAudio?.url ?? "",
    });
  }, [draftSlide3, slide3Template]);



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

    const selectedIds = Array.isArray(selectedImg3) ? selectedImg3 : [];
    (draggableImages3 ?? [])
      .filter((img: any) => selectedIds.includes(img.id))
      .forEach((img: any) => push(`img:${img.id}`, img.x, img.y, img.width, img.height));

    (textElements3 ?? []).forEach((t: any) =>
      push(`txt:${t.id}`, t.position?.x ?? t.x, t.position?.y ?? t.y, t.size?.width ?? t.width, t.size?.height ?? t.height)
    );

    (selectedStickers3 ?? []).forEach((s: any, idx: number) =>
      push(`st:${s.id ?? idx}`, s.x, s.y, s.width, s.height)
    );

    if (isAIimage3 && aimage3) {
      push("ai:3", aimage3.x, aimage3.y, aimage3.width, aimage3.height);
    }

    return items;
  }, [draggableImages3, selectedImg3, textElements3, selectedStickers3, isAIimage3, aimage3]);



  const [uploadTarget, setUploadTarget] = useState<{ type: "bg" | "sticker"; index: number } | null>(null);
  const [cropTarget, setCropTarget] = useState<{
    type: "bg" | "sticker" | "image";
    index: number;
    src: string;
    aspect: number;
  } | null>(null);

  /* ------------------ user upload handlers (editable only) ------------------ */
  const handleImageUploadClick = (type: "bg" | "sticker", index: number) => {
    if (type === "bg") setSelectedBgIndex3(index);
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
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string;
      setLayout3((prev: any) => {
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
      const targetItem = draggableImages3[index];
      if (!targetItem?.src) return;
      const aspect =
        targetItem?.width && targetItem?.height
          ? Math.max(0.1, Number(targetItem.width) / Number(targetItem.height))
          : 1;
      setCropTarget({ type, index, src: targetItem.src, aspect });
      return;
    }
    const targetCollection = type === "bg" ? (layout3?.elements ?? []) : (layout3?.stickers ?? []);
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
    setLayout3((prev: any) => {
      if (!prev) return prev;
      const updated = [...prev.textElements];
      if (!updated[index]?.isEditable) return prev;
      updated[index] = { ...updated[index], text: newText };
      return { ...prev, textElements: updated };
    });
  };

  const handleTextFocus = (index: number, te: any) => {
    if (!te?.isEditable) return;
    setEditingIndex3(index);
    setFontSize3(te.fontSize);
    setFontFamily3(te.fontFamily);
    setFontColor3(te.color);
    setFontWeight3(te.fontWeight);
  };

  useEffect(() => {
    if (editingIndex3 == null) return;
    setLayout3((prev: any) => {
      if (!prev) return prev;
      const updated = [...prev.textElements];
      if (!updated[editingIndex3]?.isEditable) return prev;
      updated[editingIndex3] = {
        ...updated[editingIndex3],
        fontSize3, fontFamily3, color: fontColor3, fontWeight3
      };
      return { ...prev, textElements: updated };
    });
  }, [fontSize3, fontFamily3, fontColor3, fontWeight3, editingIndex3]);

  // Add this handler to initialize draggable state for images (omitted for brevity)
  useEffect(() => {
    // ✅ Draft restore hua hai aur images3 abhi empty hai => wipe mat karo
    if (restoredDraftRef.current && images3.length === 0) return;

    if (images3.length > 0) {
      setDraggableImages3((prev: any[]) => {
        const existingIds = prev.map((img: any) => img.id);

        const newOnes = images3
          .filter((img) => !existingIds.includes(img.id))
          .map((img) => ({
            id: img.id,
            src: img.src,
            x: 50,
            y: 50,
            width: 150,
            height: 150,
            rotation: 0,
          }));

        const stillValid = prev.filter((img: any) =>
          images3.some((incoming) => incoming.id === img.id)
        );

        const next = [...stillValid, ...newOnes];
        return mergePreservePdf(prev, next);
      });
    } else {
      // ✅ new card me jab user saari images delete kare => clear hona chahiye
      setDraggableImages3((prev: any[]) => mergePreservePdf(prev, []));
    }
  }, [images3, setDraggableImages3]);


  // Function to add new text element
  const addNewTextElement = () => {
    const newTextElement = createNewTextElement3({
      fontSize: 16,
      fontWeight: 400,
      fontColor: "#000000",
      fontFamily: "Roboto",
      textAlign: "center",
      rotation: 0,
      zIndex: textElements3.length + 1,
    });
    setTextElements3((prev: any) => [...prev, newTextElement]);
    setSelectedTextId3(newTextElement.id);
  };

  // Add Texts in screen
  useEffect(() => {
    if (addTextRight) {
      addNewTextElement();
    }
  }, [addTextRight, addTextRight]);

  // Function to update individual text element
  const updateTextElement = (id: string, updates: Partial<any>) => {
    setTextElements3((prev) =>
      prev.map((text) => (text.id === id ? { ...text, ...updates } : text))
    );
  };

  // Function to delete text element
  const deleteTextElement = (id: string) => {
    setTextElements3((prev) => prev.filter((text) => text.id !== id));
    if (selectedTextId3 === id) {
      setSelectedTextId3(null);
    }
  };

  // 👇 Auto-reset multipleTextValue when all multiple texts are deleted
  useEffect(() => {
    // When user re-selects the multipleTextValue layout
    if (multipleTextValue3) {
      // If no texts currently exist, recreate the 3 default boxes
      if (texts3.length === 0) {
        const defaultTexts = Array(3)
          .fill(null)
          .map(() => ({
            value: "",
            fontSize: 16,
            fontWeight: 400,
            fontColor: "#000000",
            fontFamily: "Roboto",
            textAlign: "center",
            verticalAlign: "top",
            rotation: 0,
            lineHeight: 1.5,
            letterSpacing: 0
          }));
        setTexts3(defaultTexts);
      }
    }
  }, [multipleTextValue3]);

  const handleDeleteBox = (index: number) => {
    setTexts3((prev) => {
      const updated = prev.filter((_, i) => i !== index);

      // ✅ If all boxes are deleted → reset layout
      if (updated.length === 0) {
        setMultipleTextValue3(false);
        setSelectedLayout3("blank");
      }

      return updated;
    });
  };

  // ✅ Place this useEffect HERE (below your state definitions)
  useEffect(() => {
    if (editingIndex3 !== null && editingIndex3 !== undefined) {
      setTexts3((prev) =>
        prev.map((t, i) =>
          i === editingIndex3
            ? {
              ...t,
              fontSize3,
              fontWeight3,
              fontColor3,
              fontFamily3,
              textAlign3,
              verticalAlign3,
            }
            : t
        )
      );
    }
  }, [
    fontSize3,
    fontFamily3,
    fontWeight3,
    fontColor3,
    textAlign3,
    verticalAlign3,
  ]);

  useEffect(() => {
    if (selectedVideoUrl3) {
      setQrPosition3((prev) => ({
        ...prev,
        url: selectedVideoUrl3,
      }));
    }
  }, [selectedVideoUrl3]);



  // ---------------- SINGLE SWITCH LOGIC ----------------
  // figure out what's selected right now (priority order: free text > user image > sticker > bg)
  const currentSelection: any = useMemo(() => {
    if (selectedTextId3) return { type: "text", id: selectedTextId3 };
    if (selectedShapeImageId3) return { type: "image", id: selectedShapeImageId3 };
    if (selectedStickerIndex2 !== null) return { type: "sticker", index: selectedStickerIndex2 };
    if (selectedBgIndex3 !== null) return { type: "bg", index: selectedBgIndex3 };
    return null;
  }, [selectedTextId3, selectedShapeImageId3, selectedStickerIndex2, selectedBgIndex3]);

  const getSelectedLocked = (): boolean => {
    if (!currentSelection) return false;
    if (currentSelection.type === "text") {
      const t: any = textElements3.find((x: any) => x.id === currentSelection.id);
      return !!t?.locked;
    }
    if (currentSelection.type === "image") {
      const i: any = draggableImages3.find((x) => x.id === currentSelection.id);
      return !!i?.locked;
    }
    if (currentSelection.type === "sticker") {
      const s: any = selectedStickers3?.[currentSelection.index];
      return !!s?.locked;
    }
    if (currentSelection.type === "bg") {
      const el = layout3?.elements?.[currentSelection.index];
      return !!el?.locked;
    }
    return false;
  };

  const setSelectedLocked = (locked: any) => {
    if (!currentSelection) return;
    if (currentSelection.type === "text") {
      setTextElements3((prev) =>
        prev.map((t) => (t.id === currentSelection.id ? { ...t, locked } : t))
      );
      // also drop edit state if locking
      if (locked) setSelectedTextId3(null);
      return;
    }
    if (currentSelection.type === "image") {
      setDraggableImages3((prev) =>
        prev.map((img) => (img.id === currentSelection.id ? { ...img, locked } : img))
      );
      if (locked) setSelectedShapeImageId3(null);
      return;
    }
    if (currentSelection.type === "sticker") {
      const i = currentSelection.index;
      if (i != null) {
        // updateSticker1 lets us patch the object
        updateSticker3(i, { locked } as any);
        if (locked) setSelectedStickerIndex2(null);
      }
      return;
    }
    if (currentSelection.type === "bg") {
      const index = currentSelection.index;
      setLayout3((prev: any) => {
        if (!prev?.elements) return prev;
        const elements = [...prev.elements];
        elements[index] = { ...elements[index], locked };
        return { ...prev, elements };
      });
      if (locked) setSelectedBgIndex3(null);
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


  // ---------------- Z-Index helpers for images ----------------
  const normalizeZ = (arr: any[]) =>
    [...arr]
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
      .map((item, i) => ({ ...item, zIndex: i + 1 }));

  const swapZ = (arr: any[], idA: any, idB: any) => {
    const next = arr.map((o) => ({ ...o }));
    const a = next.find((x) => x.id === idA);
    const b = next.find((x) => x.id === idB);
    if (!a || !b) return arr;
    const tmp = a.zIndex ?? 1;
    a.zIndex = b.zIndex ?? 1;
    b.zIndex = tmp;
    return next;
  };

  const layerUp = (target: any) => {
    const selection = typeof target === "object" && target ? target : { type: "image", id: target };
    if (selection.type === "text") {
      setTextElements3((prev) => {
        const withZ = normalizeZ(prev);
        const me = withZ.find((x) => x.id === selection.id);
        if (!me || me.locked) return prev;
        const higher = withZ
          .filter((x) => (x.zIndex ?? 0) > (me.zIndex ?? 0))
          .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))[0];
        if (!higher) return prev;
        return swapZ(withZ, me.id, higher.id);
      });
      return;
    }
    const id = selection.id;
    setDraggableImages3((prev) => {
      const withZ = normalizeZ(prev);
      const me = withZ.find((x) => x.id === id);
      if (!me) return prev;
      const higher = withZ
        .filter((x) => (x.zIndex ?? 0) > (me.zIndex ?? 0))
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))[0];
      if (!higher) return prev;
      return swapZ(withZ, me.id, higher.id);
    });
  };

  const layerDown = (target: any) => {
    const selection = typeof target === "object" && target ? target : { type: "image", id: target };
    if (selection.type === "text") {
      setTextElements3((prev) => {
        const withZ = normalizeZ(prev);
        const me = withZ.find((x) => x.id === selection.id);
        if (!me || me.locked) return prev;
        const lower = withZ
          .filter((x) => (x.zIndex ?? 0) < (me.zIndex ?? 0))
          .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))[0];
        if (!lower) return prev;
        return swapZ(withZ, me.id, lower.id);
      });
      return;
    }
    const id = selection.id;
    setDraggableImages3((prev) => {
      const withZ = normalizeZ(prev);
      const me = withZ.find((x) => x.id === id);
      if (!me) return prev;
      const lower = withZ
        .filter((x) => (x.zIndex ?? 0) < (me.zIndex ?? 0))
        .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))[0];
      if (!lower) return prev;
      return swapZ(withZ, me.id, lower.id);
    });
  };


  const placerRef = useRef<HTMLDivElement | null>(null);

  // Esc closes edit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBgEdit3(false);
      if (e.key.toLowerCase() === "l") setBgLocked3((v: any) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Outside click closes edit
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!bgEdit3) return;
      if (!placerRef.current) return;
      if (!placerRef.current.contains(e.target as Node)) setBgEdit3(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [bgEdit3]);


  // duplicate   
  const duplicateLayer = (type: 'text' | 'image' | 'sticker', idOrIndex: string | number) => {
    if (!isAdminEditor) return;

    if (type === 'text') {
      const item: any = textElements3.find(t => t.id === idOrIndex);
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

      setTextElements3(prev => [...prev, newItem]);
      setSelectedTextId3(newItem.id);     // optional: auto-select the duplicate
    }

    else if (type === 'image') {
      const item: any = draggableImages3.find(img => img.id === idOrIndex);
      if (!item || item.locked) return;

      const newItem = {
        ...item,
        id: `img-duplicate-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        x: item.x + 30,
        y: item.y + 30,
        zIndex: (item.zIndex || 1) + 1,
      };

      setDraggableImages3(prev => [...prev, newItem]);
      setSelectedShapeImageId3(newItem.id);   // optional
    }

    else if (type === 'sticker') {
      const index = typeof idOrIndex === 'number' ? idOrIndex : -1;
      if (index < 0) return;

      const item: any = selectedStickers3?.[index];
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
      updateSticker3(selectedStickers3.length, newSticker); // ← hacky – better to have proper add
      // Better solution: add addSticker function in useSlide1 context
    }
  };

  return (
    <CanvasScaleContext.Provider value={rndScale}>
      <Box
        sx={{
          display: "flex",
          width: "var(--card-slide-w, 500px)",
          minWidth: "var(--card-slide-w, 500px)",
          gap: "5px",
          position: "relative",
        }}
      >
        {activeIndex === 2 && rightBox && (
          <Box
            ref={rightBoxRef}
            onClick={handleBlankClick}
            sx={{
              flex: 1,
              zIndex: 10,
              p: 0,
              position: "relative",
              height: "var(--card-slide-h, 700px)",
              width: "var(--card-slide-w, 500px)",
              minWidth: "var(--card-slide-w, 500px)",
              opacity: isSlideActive3 ? 1 : 0.6,
              pointerEvents: isSlideActive3 ? "auto" : "none",
              backgroundColor: bgColor3 ?? "transparent",
              // backgroundImage: bgImage3 ? `url(${bgImage3})` : "none",
              backgroundSize: "cover",
              "&::after": !isSlideActive3
                ? {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(146, 145, 145, 0.51)",
                  zIndex: 30000,
                  pointerEvents: "none",
                }
                : {},
            }}
          >
          <AlignmentGuides
            {...align.guides}
            hide={!isSlideActive3 || !align.isActive}
          />

          {/* BG */}
          {isAdminEditor && bgImage3 && (
            <ScaledRnd
              size={{ width: bgRect3.width, height: bgRect3.height }}
              position={{ x: bgRect3.x, y: bgRect3.y }}
              bounds="parent"
              enableUserSelectHack={false}
              // ✅ only draggable when unlocked AND in edit mode
              disableDragging={!bgEdit3 || bgLocked3}
              // ✅ only resizable when unlocked AND in edit mode
              enableResizing={
                bgEdit3 && !bgLocked3
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
              onDragStop={(_, d) => setBgRect3((r: any) => ({ ...r, x: d.x, y: d.y }))}
              onResizeStop={(_, __, ref, ___, position) =>
                setBgRect3({
                  x: position.x,
                  y: position.y,
                  width: parseInt(ref.style.width, 10),
                  height: parseInt(ref.style.height, 10),
                })
              }
              style={{
                zIndex: 1,
                outline: bgEdit3 && !bgLocked3 ? "2px solid #1976d2" : "none",
                cursor: bgEdit3 && !bgLocked3 ? "move" : "default",
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
                  pointerEvents: bgEdit3 && !bgLocked3 ? "auto" : "none",
                },
              }}
            >
              <Box
                ref={placerRef}
                sx={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  backgroundColor: bgImage3 ? "transparent" : bgColor3 ?? "transparent",
                  backgroundImage: bgImage3 ? `url(${bgImage3})` : "none",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                  userSelect: "none",
                }}
                // ✅ double-click only works when unlocked
                onDoubleClick={() => {
                  if (!bgLocked3) setBgEdit3(true);
                }}
              >
                {/* Lock/Unlock toggle (top-left) */}
                <IconButton
                  onClick={(e) => { e.stopPropagation(); setBgLocked3((v: any) => !v); if (!bgLocked3) setBgEdit3(false); }}
                  sx={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    bgcolor: "black",
                    color: "white",
                    width: 28,
                    height: 28,
                    "&:hover": { bgcolor: bgLocked3 ? "#2e7d32" : "#d32f2f" },
                  }}
                >
                  {bgLocked3 ? <LockOutlined fontSize="small" /> : <LockOpenOutlined fontSize="small" />}
                </IconButton>
                {/* Small hint when locked */}
                {bgLocked3 && (
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


          {isAdminEditor && (
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
              <Switch
                size="small"
                checked={!selectedLocked}
                onChange={(_, checked) => setSelectedLocked(!checked ? true : false)}
              />
            </Paper>
          )}


          {
            isAdminEditor ?
              <>
                {
                  multipleTextValue3 || showOneTextRightSideBox3 ? null : (
                    <>
                      {textElements3?.map((textElement) => {
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
                              updateTextElement(textElement.id, {
                                position: {
                                  x: snap.snappedX ? snap.x : d.x,
                                  y: snap.snappedY ? snap.y : d.y,
                                },
                              });
                            }}
                            onTouchStart={() => { touchStartTime = Date.now(); }}
                            onTouchEnd={(e: any) => {
                              const now = Date.now();
                              const timeSince = now - lastTap;
                              const touchDuration = now - touchStartTime;
                              if (touchDuration < 200) {
                                const shouldEdit = isIos || timeSince < 300;
                                setSelectedTextId3(textElement.id);
                                if (shouldEdit) {
                                  updateTextElement(textElement.id, { isEditing: true });
                                  focusEditableTextFromTarget(e.currentTarget);
                                }
                              }
                              lastTap = now;
                            }}
                            onMouseDown={() => setSelectedTextId3(textElement.id)}
                            onDoubleClick={(e: any) => {
                              setSelectedTextId3(textElement.id);
                              updateTextElement(textElement.id, { isEditing: true });
                              focusEditableTextFromTarget(e.currentTarget);
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
                              updateTextElement(textElement.id, { position: { x: snap.x, y: snap.y } });
                              align.onDragStop();
                            }}
                            onResizeStop={(_, __, ref, ___, position) => {
                              updateTextElement(textElement.id, {
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
                                onClick={(e) => { e.stopPropagation(); deleteTextElement(textElement.id); }}
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
                                  updateTextElement(textElement.id, { rotation: (textElement.rotation || 0) + 30 });
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
                                  onClick={(e) => { e.stopPropagation(); layerDown({ type: 'text', id: textElement.id }); }}
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
                                  onClick={(e) => { e.stopPropagation(); layerUp({ type: 'text', id: textElement.id }); }}
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
                                    : textElement.id === selectedTextId3
                                    ? "2px solid #1976d2"
                                    : "1px dashed #4a7bd5",
                                  zIndex: textElement.zIndex,
                                  cursor: textElement.isEditing ? "text" : "move", // ✅ keep move cursor
                                }}
                                onDoubleClick={(e: any) => {
                                  setSelectedTextId3(textElement.id);
                                  updateTextElement(textElement.id, { isEditing: true });
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
                                  onChange={(e) => updateTextElement(textElement.id, { value: e.target.value })}
                                  onFocus={(e) => {
                                    e.stopPropagation();
                                    setSelectedTextId3(textElement.id);
                                    updateTextElement(textElement.id, { isEditing: true });
                                  }}
                                  onBlur={(e) => { e.stopPropagation(); updateTextElement(textElement.id, { isEditing: false }); }}
                                  sx={{
                                    "& .MuiInputBase-input": { overflowY: "auto", textAlign: textElement.textAlign || "center" },
                                  }}
                                />
                              </Box>
                            </Box>
                          </ScaledRnd>
                        );
                      })}
                    </>
                  )
                }

                {/* VIDEO QR */}
                {selectedVideoUrl3 && (
                  <ScaledRnd
                    cancel=".no-drag"
                    size={{
                      width: (qrPosition3 as any).boxWidth || 300,
                      height: Math.round((((qrPosition3 as any).boxWidth || 300) * 200) / 300),
                    }}
                    position={{ x: qrPosition3.x, y: qrPosition3.y }}
                    onDragStop={(_, d) =>
                      setQrPosition3((prev) => ({ ...prev, x: d.x, y: d.y, zIndex: qrPosition3.zIndex }))
                    }
                    bounds="parent"
                    lockAspectRatio
                    onResizeStop={(_, __, ref, ___, position) => {
                      setQrPosition3((prev) => ({
                        ...prev,
                        boxWidth: parseInt(ref.style.width, 10),
                        boxHeight: Math.round((parseInt(ref.style.width, 10) * 200) / 300),
                        x: position.x,
                        y: position.y,
                        zIndex: qrPosition3.zIndex,
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
                        key={selectedVideoUrl3}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        style={{
                          width: 300,
                          height: 200,
                          transform: `scale(${Math.min(
                          (((qrPosition3 as any).boxWidth || 300) / 300)
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
                          width: 300,
                          textAlign: "center",
                          height: 200,
                          bottom: 0,
                          flex: 1,
                        }}
                      >
                        <Box component={"img"} src="/assets/images/video-qr-tips.png" sx={{ width: "100%", height: 200, pointerEvents: "none" }} />
                        <Box sx={{ position: "absolute", top: 55, width: 68, height: 68, left: { md: 6, sm: 6, xs: 5 }, borderRadius: 2, overflow: "hidden" }}>
                          <QrGenerator url={selectedVideoUrl3} size={68} />
                        </Box>
                        <a href={`${selectedVideoUrl3}`} target="_blank">
                          <Typography sx={{ position: "absolute", top: 80, right: 15, zIndex: 9999, color: "black", fontSize: "10px", width: "105px" }}>
                            {`${selectedVideoUrl3.slice(0, 20)}.....`}
                          </Typography>
                        </a>
                        <IconButton
                          className="no-drag"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVideoUrl3(null);
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
                {selectedAudioUrl3 && (
                  <ScaledRnd
                    cancel=".no-drag"
                    size={{
                      width: (qrAudioPosition3 as any).boxWidth || 300,
                      height: Math.round((((qrAudioPosition3 as any).boxWidth || 300) * 200) / 300),
                    }}
                    position={{ x: qrAudioPosition3.x, y: qrAudioPosition3.y }}
                    onDragStop={(_, d) =>
                      setQrAudioPosition3((prev) => ({ ...prev, x: d.x, y: d.y, zIndex: qrAudioPosition3.zIndex }))
                    }
                    bounds="parent"
                    lockAspectRatio
                    onResizeStop={(_, __, ref, ___, position) => {
                      setQrAudioPosition3((prev) => ({
                        ...prev,
                        boxWidth: parseInt(ref.style.width, 10),
                        boxHeight: Math.round((parseInt(ref.style.width, 10) * 200) / 300),
                        x: position.x,
                        y: position.y,
                        zIndex: qrAudioPosition3.zIndex,
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
                        key={selectedAudioUrl3}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        style={{
                          width: 300,
                          height: 200,
                          transform: `scale(${Math.min(
                          (((qrAudioPosition3 as any).boxWidth || 300) / 300)
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
                          width: 300,
                          textAlign: "center",
                          height: 200,
                          bottom: 0,
                          flex: 1,
                        }}
                      >
                        <Box component={"img"} src="/assets/images/audio-qr-tips.png" sx={{ width: "100%", height: 200, pointerEvents: "none" }} />
                        <Box sx={{ position: "absolute", top: 55, width: 68, height: 68, left: { md: 6, sm: 6, xs: 5 }, borderRadius: 2, overflow: "hidden" }}>
                          <QrGenerator url={selectedAudioUrl3} size={68} />
                        </Box>
                        <a href={`${selectedAudioUrl3}`} target="_blank">
                          <Typography sx={{ position: "absolute", top: 78, right: 15, zIndex: 9999, color: "black", fontSize: "10px", width: "105px" }}>
                            {`${selectedAudioUrl3.slice(0, 20)}.....`}
                          </Typography>
                        </a>
                        <IconButton
                          onClick={() => setSelectedAudioUrl3(null)}
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

                {/* USER IMAGES (per-item lock) */}
                {draggableImages3
                  .filter((img: any) => selectedImg3.includes(img.id))
                  .map(({ id, src, x, y, width, height, zIndex, rotation = 0, filter, locked }: any, index: number) => {
                    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
                    const isSelected = selectedShapeImageId3 === id;
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
                          setDraggableImages3((prev) =>
                            prev.map((img) => (img.id === id ? { ...img, x: nextX, y: nextY } : img))
                          );
                        }}
                        onDragStop={(_, d) => {
                          if (isLocked) return;
                          const snap = align.onDrag(d.x, d.y, width, height, alignItems, `img:${id}`);
                          setDraggableImages3((prev) =>
                            prev.map((img) => (img.id === id ? { ...img, x: snap.x, y: snap.y } : img))
                          );
                          align.onDragStop();
                        }}
                        onResizeStop={(_, __, ref, ___, position) => {
                          if (isLocked) return;
                          const newWidth = parseInt(ref.style.width);
                          const newHeight = parseInt(ref.style.height);
                          setDraggableImages3((prev) =>
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
                        onClick={() => setSelectedShapeImageId3(id)}
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
                              outline: isSelected ? "2px solid #cf57ffff" : "none",
                              borderRadius: isSelected ? 1 : 0,
	                              pointerEvents: "auto",
	                              cursor: isLocked ? "default" : "move",
	                            }}
	                            onMouseDown={() => setSelectedShapeImageId3(id)}
	                            onDoubleClickCapture={(e) => {
	                              e.stopPropagation();
	                              if (!isLocked) openCropEditor("image", index);
	                            }}
	                            onDoubleClick={(e) => {
	                              e.stopPropagation();
	                              if (!isLocked) openCropEditor("image", index);
	                            }}
	                          >
                            <img
                              src={src}
                              alt="Uploaded"
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 8,
                                pointerEvents: "none",
                                objectFit: "fill",
                                filter: filter || "none",
                                zIndex: zIndex,
                                clipPath: ((): string => {
                                  const me = draggableImages3.find((img) => img.id === id);
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
                                setDraggableImages3((prev) =>
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
                                  layerDown(id);
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
                                  layerUp(id);
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

                                const original = draggableImages3.find((img) => img.id === id);
                                if (!original) return;

                                const duplicate = {
                                  ...original,
                                  id: `img-dup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                                  x: original.x + 40,
                                  y: original.y + 30,
                                  zIndex: (original.zIndex || 1) + 5,
                                };

                                setDraggableImages3((prev) => [...prev, duplicate]);
                                setSelectedShapeImageId3(duplicate.id);
                                setSelectedImage3((prev: any) => [...prev, duplicate.id]); // ← yeh line important hai (filter ke liye)
                              }}
                              sx={{
                                position: "absolute",
                                top: -25,
                                left: 70,
                                bgcolor: COLORS.black,
                                color: "white",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 28,
                                height: 28,
                                zIndex: 10000,
                                cursor: "pointer",
                                "&:hover": { bgcolor: COLORS.gray },
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
                                setSelectedImage3((prev) => prev.filter((i) => i !== id));
                                setDraggableImages3((prev) => prev.filter((img) => img.id !== id));
                                setActiveFilterImageId3(null);
                                setImageFilter3(false);
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

                {/* ONE TEXT BOX (unchanged) */}
                {showOneTextRightSideBox3 && (
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
                        setOneTextValue3("");
                        if (typeof setShowOneTextRightSideBox3 === "function") {
                          setShowOneTextRightSideBox3(false);
                          setSelectedLayout3("blank");
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
                          verticalAlign3 === "top"
                            ? "flex-start"
                            : verticalAlign3 === "center"
                              ? "center"
                              : "flex-end",
                        alignItems:
                          textAlign3 === "start"
                            ? "flex-start"
                            : textAlign3 === "center"
                              ? "center"
                              : "flex-end",
                      }}
                    >
                      <TextField
                        variant="standard"
                        value={oneTextValue3}
                        onChange={(e) => setOneTextValue3(e.target.value)}
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            height: "100%",
                            alignItems:
                              verticalAlign3 === "top"
                                ? "flex-start"
                                : verticalAlign3 === "center"
                                  ? "center"
                                  : "flex-end",
                            "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
                              fontSize: fontSize3,
                              fontWeight: fontWeight3,
                              color: fontColor3,
                              fontFamily: fontFamily3,
                              textAlign: textAlign3,
                              transform: `rotate(${rotation3}deg)`,
                              lineHeight: lineHeight3,
                              letterSpacing: letterSpacing3,
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

                {/* MULTI TEXT LAYOUT (unchanged behavior) */}
                {multipleTextValue3 && (
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
                    {texts3?.map((textObj, index) => (
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
                            verticalAlign3 === "top"
                              ? "flex-start"
                              : verticalAlign3 === "center"
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
                            setTexts3((prev) => {
                              const updated = prev.filter((_, i) => i !== index);
                              if (updated.length === 0) {
                                setMultipleTextValue3(false);
                                setSelectedLayout3("blank");
                              }
                              return updated;
                            });
                          }}
                        >
                          <Close />
                        </IconButton>

                        {editingIndex3 === index ? (
                          <TextField
                            autoFocus
                            fullWidth
                            multiline
                            variant="standard"
                            value={textObj.value}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setTexts3((prev) =>
                                prev.map((t, i) =>
                                  i === index
                                    ? {
                                      ...t,
                                      value: newValue,
                                      textAlign: textAlign3,
                                      verticalAlign: verticalAlign3,
                                    }
                                    : t
                                )
                              );
                            }}
                            InputProps={{
                              disableUnderline: true,
                              sx: {
                                "& textarea": {
                                  width: "100%",
                                  resize: "none",
                                  height: "100px",
                                  fontSize: textObj.fontSize3 ?? textObj.fontSize1 ?? textObj.fontSize,
                                  fontWeight: textObj.fontWeight3 ?? textObj.fontWeight1 ?? textObj.fontWeight,
                                  color: textObj.fontColor3 ?? textObj.fontColor1 ?? textObj.fontColor,
                                  fontFamily: textObj.fontFamily3 ?? textObj.fontFamily1 ?? textObj.fontFamily,
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
                              if (editingIndex3 !== null) {
                                setTexts3((prev) =>
                                  prev.map((t, i) =>
                                    i === editingIndex3
                                      ? {
                                        ...t,
                                        textAlign: textAlign3,
                                        verticalAlign: verticalAlign3,
                                      }
                                      : t
                                  )
                                );
                              }
                              setEditingIndex3(index);
                              setFontSize3(textObj.fontSize3 ?? textObj.fontSize1 ?? textObj.fontSize ?? 16);
                              setFontFamily3(textObj.fontFamily3 ?? textObj.fontFamily1 ?? textObj.fontFamily ?? "Roboto");
                              setFontWeight3(textObj.fontWeight3 ?? textObj.fontWeight1 ?? textObj.fontWeight ?? 400);
                              setFontColor3(textObj.fontColor3 ?? textObj.fontColor1 ?? textObj.fontColor ?? "#000000");
                              setTextAlign3(textObj.textAlign);
                              setVerticalAlign3(textObj.verticalAlign);
                            }}
                            sx={{ width: "100%", height: "100%", cursor: "pointer" }}
                          >
                            <Typography
                              sx={{
                                fontSize: textObj.fontSize3 ?? textObj.fontSize1 ?? textObj.fontSize,
                                fontWeight: textObj.fontWeight3 ?? textObj.fontWeight1 ?? textObj.fontWeight,
                                color: textObj.fontColor3 ?? textObj.fontColor1 ?? textObj.fontColor,
                                fontFamily: textObj.fontFamily3 ?? textObj.fontFamily1 ?? textObj.fontFamily,
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

                {/* AI IMAGE (kept as-is, not part of lock demo) */}
                {isAIimage3 && (
                  <ScaledRnd
                    bounds="parent"
                    size={{ width: aimage3.width, height: aimage3.height }}
                    position={{ x: aimage3.x, y: aimage3.y }}
                    onDragStart={() => align.onDragStart()}
                    onDrag={(_, d) => {
                      const snap = align.onDrag(
                        d.x,
                        d.y,
                        aimage3.width,
                        aimage3.height,
                        alignItems,
                        "ai:3"
                      );
                      setAIImage3((prev) => ({
                        ...prev,
                        x: snap.snappedX ? snap.x : d.x,
                        y: snap.snappedY ? snap.y : d.y,
                      }));
                    }}
                    onDragStop={(_, d) => {
                      const snap = align.onDrag(
                        d.x,
                        d.y,
                        aimage3.width,
                        aimage3.height,
                        alignItems,
                        "ai:3"
                      );
                      setAIImage3((prev) => ({ ...prev, x: snap.x, y: snap.y }));
                      align.onDragStop();
                    }}
                    onResizeStop={(_, __, ref, ___, position) =>
                      setAIImage3({
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
                      <Box component="img" src={`${selectedAIimageUrl3}`} alt="AI Image" sx={{ width: "100%", height: "100%", objectFit: "fill", pointerEvents: "none" }} />
                      <IconButton
                        onClick={() => setIsAIimage3?.(false)}
                        sx={{ position: "absolute", top: -7, right: -7, bgcolor: "black", color: "white", width: 22, height: 22, "&:hover": { bgcolor: "red" } }}
                      >
                        <Close />
                      </IconButton>
                    </Box>
                  </ScaledRnd>
                )}

                {/* STICKERS (per-item lock) */}
                {selectedStickers3?.map((sticker: any, index) => {
                  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
                  const isSelected = selectedStickerIndex2 === index;
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
                      onMouseDown={() => setSelectedStickerIndex2(index)}
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
                        updateSticker3(index, {
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
                          updateSticker3(index, {
                            x: snap.x,
                            y: snap.y,
                            zIndex: sticker.zIndex,
                          });
                        }
                        align.onDragStop();
                      }}
                      onResizeStop={(_, __, ref, ___, position) =>
                        !isLocked &&
                        updateSticker3(index, {
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

                        {/* delete */}
                        {!isLocked && (
                          <IconButton
                            className="non-draggable"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSticker3(index);
                              if (selectedStickerIndex2 === index) setSelectedStickerIndex2(null);
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

                        {/* rotate */}
                        {!isLocked && (
                          <IconButton
                            className="non-draggable"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSticker3(index, { rotation: ((sticker.rotation || 0) + 15) % 360 });
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
              </> :
              <>
                {
                  layout3 &&
                  <Box sx={{ width: "100%", height: "100%" }}>
                    <UserKonvaPreview
                      width={500}
                      height={700}
                      bgColor={bgColor3 ?? "transparent"}
                      bgImage={(layout3.elements ?? []).some((el: any) => el?.id === "bg-image") ? null : bgImage3}
                      elements={(layout3.elements ?? []).filter((el: any) => !el?.isEditable)}
                      stickers={(layout3.stickers ?? []).filter((st: any) => !st?.isEditable)}
                      textElements={(layout3.textElements ?? []).filter((te: any) => !te?.isEditable)}
                      borderRadius={0}
                      boxShadow="none"
                    />
                    {/* BG frames */}
                    {layout3.elements
                      ?.slice()
                      .sort((a: any, b: any) => (a.zIndex ?? 0) - (b.zIndex ?? 0)) // keep BG at the back (zIndex 0)
                      .map((el: any, index: number) => {
                        const isEditable = !!el.isEditable;  // <- comes from normalize
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
                  onClick={() => setSelectedBgIndex3(index)}
                  onDoubleClick={() => openCropEditor("bg", index)}
                >
                            <Box
                              component="img"
                              src={el.src || undefined}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "fill",
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
                    {layout3.stickers.map((st: any, i: any) => (
                      <Box key={st.id ?? i}
                        sx={{ position: "absolute", left: st.x, top: st.y, zIndex: st.zIndex ?? 1, borderRadius: 1, overflow: "hidden", opacity: st.isEditable ? 1 : 0, pointerEvents: st.isEditable ? "auto" : "none" }}
                        onDoubleClick={() => openCropEditor("sticker", i)}>
                        <Box component="img" src={st.sticker || undefined}
                          sx={{ width: st.width, height: st.height, objectFit: "contain", display: "block", pointerEvents: "none" }} />
                        {st.isEditable && (
                          <Box onClick={() => handleImageUploadClick("sticker", i)}
                            sx={{
                              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                              backgroundColor: "rgba(0,0,0,0.4)", borderRadius: "50%", width: 36, height: 36,
                              display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid white", cursor: "pointer"
                            }}>
                            <UploadFileRounded sx={{ color: "white", fontSize: 18 }} />
                          </Box>
                        )}
                      </Box>
                    ))}

                    {/* Texts (click → border + editable if isEditable) */}
                    {layout3.textElements.map((te: any, i: any) => {
                      const isActive = editingIndex3 === i;        // reuse your existing editingIndex
                      return (
                        <Box key={te.id ?? i}
                          onClick={te.isEditable ? (e) => {
                            handleTextFocus(i, te);
                            focusEditableTextFromTarget(e.currentTarget);
                          } : undefined}
                          onDoubleClick={te.isEditable ? (e) => {
                            handleTextFocus(i, te);
                            focusEditableTextFromTarget(e.currentTarget);
                          } : undefined}
                          onTouchEnd={te.isEditable ? (e) => {
                            handleTextFocus(i, te);
                            focusEditableTextFromTarget(e.currentTarget);
                          } : undefined}
                          sx={{
                            position: "absolute", left: te.x, top: te.y, width: te.width, height: te.height,
                            zIndex: (te.zIndex ?? 1) + 1000,         // lift text above images
                            display: te.isEditable ? "flex" : "none",
                            alignItems: te.verticalAlign === "top" ? "flex-start" : te.verticalAlign === "bottom" ? "flex-end" : "center",
                            justifyContent: te.textAlign === "left" ? "flex-start" : te.textAlign === "right" ? "flex-end" : "center",
                            outline: hideTextOutline
                              ? "none"
                              : te.isEditable && isActive
                              ? "2px solid #1976d2"
                              : "none",   // ✅ blue border on select
                            borderRadius: "6px",
                          }}>
                          <TextField
                            variant="standard" fullWidth multiline value={te.text || ""}
                            onFocus={te.isEditable ? () => handleTextFocus(i, te) : undefined}
                            onChange={te.isEditable ? (e) => handleTextChange(e.target.value, i) : undefined}
                            onBlur={() => setEditingIndex3(null)}
                            InputProps={{
                              readOnly: !te.isEditable || !isActive,      // ✅ only editable when selected
                              disableUnderline: true,
                              style: {
                                fontSize: te.fontSize,
                                fontFamily: te.fontFamily,
                                color: te.color,
                                fontWeight: te.fontWeight,
                                fontStyle: te.italic ? "italic" : "normal",
                                textAlign: te.textAlign,
                                padding: 0,
                                background: "transparent",
                                lineHeight: "1.2em",
                                cursor: te.isEditable ? (isActive ? "text" : "pointer") : "default",
                                pointerEvents: te.isEditable && isActive ? "auto" : "none",
                              },
                            }}
                            sx={{
                              width: "100%", height: "100%",
                              "& .MuiInputBase-input": {
                                textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "pre-wrap"
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <ImageCropModal
                      open={!!cropTarget}
                      imageSrc={cropTarget?.src ?? ""}
                      aspect={cropTarget?.aspect ?? 1}
                      onClose={() => setCropTarget(null)}
                      onApply={(croppedImageSrc) => {
                        if (!cropTarget) return;
                        if (cropTarget.type === "image") {
                          setDraggableImages3((prev) =>
                            prev.map((img, idx) => (idx === cropTarget.index ? { ...img, src: croppedImageSrc } : img)),
                          );
                          setCropTarget(null);
                          return;
                        }
                        setLayout3((prev: any) => {
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
                  </Box>
                }

                {!(multipleTextValue3 || showOneTextRightSideBox3) &&
                  textElements3?.map((textElement) => {
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
                          touchAction: "none",
                          transition: "border 0.2s ease",
                          cursor: textElement.isEditing ? "text" : "move",
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
                          if (snap.snappedX || snap.snappedY) {
                            updateTextElement(textElement.id, {
                              position: { x: snap.x, y: snap.y },
                            });
                          }
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
                            setSelectedTextId3(textElement.id);
                            if (shouldEdit) {
                              updateTextElement(textElement.id, { isEditing: true });
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
                            setSelectedTextId3(textElement.id);
                            if (shouldEdit) {
                              updateTextElement(textElement.id, { isEditing: true });
                              focusEditableTextFromTarget(e.currentTarget);
                            } else {
                              updateTextElement(textElement.id, { isEditing: false });
                            }
                          }
                          lastTap = now;
                        }}
                        onMouseDown={() => setSelectedTextId3(textElement.id)}
                        onDoubleClick={(e: any) => {
                          setSelectedTextId3(textElement.id);
                          updateTextElement(textElement.id, { isEditing: true });
                          focusEditableTextFromTarget(e.currentTarget);
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
                          updateTextElement(textElement.id, { position: { x: snap.x, y: snap.y } });
                          align.onDragStop();
                        }}
                        onResizeStop={(_, __, ref, ___, position) => {
                          updateTextElement(textElement.id, {
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
                            onClick={(e) => { e.stopPropagation(); deleteTextElement(textElement.id); }}
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
                              updateTextElement(textElement.id, { rotation: (textElement.rotation || 0) + 30 });
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
                          {/* <Tooltip title="To Back">
                            <Box
                              className="no-drag"
                              onClick={(e) => { e.stopPropagation(); layerDown({ type: 'text', id: textElement.id }); }}
                              sx={{
                                position: "absolute", top: -25, left: 40, bgcolor: "black", color: "white",
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
                              onClick={(e) => { e.stopPropagation(); layerUp({ type: 'text', id: textElement.id }); }}
                              sx={{
                                position: "absolute", top: -25, left: 80, bgcolor: "black", color: "white",
                                borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                p: isMobile ? "4px" : "2px", zIndex: 9999, cursor: "pointer", "&:hover": { bgcolor: "#333" },
                              }}
                            >
                              <KeyboardArrowUpOutlined fontSize={isMobile ? "medium" : "small"} />
                            </Box>
                          </Tooltip> */}

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
                                : textElement.id === selectedTextId3
                                ? "2px solid #1976d2"
                                : "1px dashed #4a7bd5",
                              zIndex: textElement.zIndex,
                              cursor: textElement.isEditing ? "text" : "move",
                            }}
                            onDoubleClick={(e: any) => {
                              setSelectedTextId3(textElement.id);
                              updateTextElement(textElement.id, { isEditing: true });
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
                              autoFocus={!!textElement.isEditing}
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
                              onChange={(e) => updateTextElement(textElement.id, { value: e.target.value })}
                              onFocus={(e) => {
                                e.stopPropagation();
                                setSelectedTextId3(textElement.id);
                                updateTextElement(textElement.id, { isEditing: true });
                              }}
                              onBlur={(e) => { e.stopPropagation(); updateTextElement(textElement.id, { isEditing: false }); }}
                              sx={{
                                "& .MuiInputBase-input": { overflowY: "auto", textAlign: textElement.textAlign || "center" },
                              }}
                            />
                          </Box>
                        </Box>
                      </ScaledRnd>
                    );
                  })}

                {selectedVideoUrl3 && (
                  <ScaledRnd
                    bounds="parent"
                    cancel=".no-drag"
                    size={{
                      width: (qrPosition3 as any).boxWidth || 300,
                      height: Math.round((((qrPosition3 as any).boxWidth || 300) * 200) / 300),
                    }}
                    position={{ x: qrPosition3.x, y: qrPosition3.y }}
                    onDragStop={(_, d) =>
                      setQrPosition3((prev) => ({
                        ...prev,
                        x: d.x,
                        y: d.y,
                        zIndex: qrPosition3.zIndex,
                      }))
                    }
                    onResizeStop={(_, __, ref, ___, position) => {
                      setQrPosition3((prev) => ({
                        ...prev,
                        boxWidth: parseInt(ref.style.width, 10),
                        boxHeight: Math.round((parseInt(ref.style.width, 10) * 200) / 300),
                        x: position.x,
                        y: position.y,
                        zIndex: qrPosition3.zIndex,
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
                    style={{
                      zIndex: 999,
                      overflow: "hidden",
                      border: "2px solid #1976d2",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.2)",
                      boxShadow: "0 0 0 1px rgba(25,118,210,0.15)"
                    }}
                  >
                    <motion.div
                      key={selectedVideoUrl3} // ✅ unique key triggers re-animation on change
                      initial={{ opacity: 0, x: 100 }} // start off-screen (right)
                      animate={{ opacity: 1, x: 0 }} // slide in
                      exit={{ opacity: 0, x: -100 }} // slide out left
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    // style={{ position: "absolute", width: "100%" }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "flex-end",
                          m: "auto",
                          width: "100%",
                          textAlign: "center",
                          height: "100%",
                          bottom: 0,
                          flex: 1,
                        }}
                      >
                        <Box
                          component={"img"}
                          src="/assets/images/video-qr-tips.png"
                          sx={{
                            width: "100%",
                            height: 200,
                            position: "relative",
                            pointerEvents: 'none'
                          }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 55,
                            width: 68,
                            height: 68,
                            left: { md: 6, sm: 6, xs: 5 },
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <QrGenerator url={selectedVideoUrl3} size={68} />
                        </Box>
                        <a href={`${selectedVideoUrl3}`} target="_blank">
                          <Typography
                            sx={{
                              position: "absolute",
                              top: 80,
                              right: 15,
                              zIndex: 9999,
                              color: "black",
                              fontSize: "10px",
                              width: "105px",
                              cursor: "pointer",
                              "&:hover": {
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {`${selectedVideoUrl3.slice(0, 20)}.....`}
                          </Typography>
                        </a>
                        <IconButton
                          className="no-drag"
                          onClick={(e) => {
                            e.stopPropagation(); // ✅ Prevent parent drag/touch interception
                            setSelectedVideoUrl3(null);
                          }}
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bgcolor: COLORS.black,
                            color: COLORS.white,
                            zIndex: 9999, // ✅ Make sure it's above other layers
                            pointerEvents: "auto", // ✅ Ensure it's clickable on touch devices
                            touchAction: "manipulation", // ✅ Allow touch tap
                            "&:hover": { bgcolor: "red" },
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </motion.div>
                  </ScaledRnd>
                )}

                {selectedAudioUrl3 && (
                  <ScaledRnd
                    bounds="parent"
                    cancel=".no-drag"
                    size={{
                      width: (qrAudioPosition3 as any).boxWidth || 300,
                      height: (qrAudioPosition3 as any).boxHeight || 200,
                    }}
                    position={{ x: qrAudioPosition3.x, y: qrAudioPosition3.y }}
                    onDragStop={(_, d) =>
                      setQrAudioPosition3((prev) => ({
                        ...prev,
                        x: d.x,
                        y: d.y,
                        zIndex: qrAudioPosition3.zIndex, // Bring to front on drag
                      }))
                    }
                    onResizeStop={(_, __, ref, ___, position) => {
                      setQrAudioPosition3((prev) => ({
                        ...prev,
                        boxWidth: parseInt(ref.style.width, 10),
                        boxHeight: parseInt(ref.style.height, 10),
                        x: position.x,
                        y: position.y,
                        zIndex: qrAudioPosition3.zIndex, // Bring to front on resize
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
                    style={{
                      zIndex: 999,
                      overflow: "hidden",
                      border: "2px solid #1976d2",
                      borderRadius: "8px",
                      background: "rgba(255,255,255,0.2)",
                      boxShadow: "0 0 0 1px rgba(25,118,210,0.15)"
                    }}
                  >
                    <motion.div
                      key={selectedAudioUrl3} // ✅ unique key triggers re-animation on change
                      initial={{ opacity: 0, x: 100 }} // start off-screen (right)
                      animate={{ opacity: 1, x: 0 }} // slide in
                      exit={{ opacity: 0, x: -100 }} // slide out left
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                    // style={{ position: "absolute", width: "100%" }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "flex-end",
                          m: "auto",
                          width: "100%",
                          textAlign: "center",
                          height: "100%",
                          bottom: 0,
                          flex: 1,
                        }}
                      >
                        <Box
                          component={"img"}
                          src="/assets/images/audio-qr-tips.png"
                          sx={{
                            width: "100%",
                            height: 200,
                            position: "relative",
                            pointerEvents: 'none'
                          }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 55,
                            width: 68,
                            height: 68,
                            left: { md: 6, sm: 6, xs: 5 },
                            borderRadius: 2,
                            overflow: "hidden",
                          }}
                        >
                          <QrGenerator url={selectedAudioUrl3} size={68} />
                        </Box>
                        <a href={`${selectedAudioUrl3}`} target="_blank">
                          <Typography
                            sx={{
                              position: "absolute",
                              top: 78,
                              right: 15,
                              zIndex: 9999,
                              color: "black",
                              fontSize: "10px",
                              width: "105px",
                              cursor: "pointer",
                              "&:hover": {
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {`${selectedAudioUrl3.slice(0, 20)}.....`}
                          </Typography>
                        </a>
                        <IconButton
                          onClick={() => setSelectedAudioUrl3(null)}
                          className="no-drag"
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            bgcolor: COLORS.black,
                            color: COLORS.white,
                            "&:hover": { bgcolor: "red" },
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </motion.div>
                  </ScaledRnd>
                )}

                {draggableImages3
                  .filter((img: any) => selectedImg3.includes(img.id))
                  // .sort((a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0))
                  .map(({ id, src, x, y, width, height, zIndex, rotation = 0, filter }: any) => {
                    const isMobile =
                      typeof window !== "undefined" && window.innerWidth < 768;

                    return (
                      <ScaledRnd
                        key={id}
                        size={{ width, height }}
                        position={{ x, y }}
                        bounds="parent"
                        enableUserSelectHack={false}
                        cancel=".non-draggable"
                        onDragStart={() => align.onDragStart()}
                        onDrag={(_, d) => {
                          const snap = align.onDrag(d.x, d.y, width, height, alignItems, `img:${id}`);
                          if (snap.snappedX || snap.snappedY) {
                            setDraggableImages3((prev) =>
                              prev.map((img) =>
                                img.id === id ? { ...img, x: snap.x, y: snap.y } : img
                              )
                            );
                          }
                        }}
                        onDragStop={(_, d) => {
                          const snap = align.onDrag(d.x, d.y, width, height, alignItems, `img:${id}`);
                          setDraggableImages3((prev) =>
                            prev.map((img) =>
                              img.id === id ? { ...img, x: snap.x, y: snap.y } : img
                            )
                          );
                          align.onDragStop();
                        }}
                        onResizeStop={(_, __, ref, ___, position) => {
                          const newWidth = parseInt(ref.style.width);
                          const newHeight = parseInt(ref.style.height);
                          setDraggableImages3((prev) =>
                            prev.map((img) =>
                              img.id === id
                                ? {
                                  ...img,
                                  width: newWidth,
                                  height: newHeight,
                                  x: position.x,
                                  y: position.y,
                                }
                                : img
                            )
                          );
                        }}
                        style={{
                          zIndex: zIndex || 1,
                          boxSizing: "border-box",
                          borderRadius: 8,
                          touchAction: "none",
                        }}
                        enableResizing={{ bottomRight: true }}
                        resizeHandleStyles={{
                          bottomRight: {
                            width: isMobile ? "20px" : "10px",
                            height: isMobile ? "20px" : "10px",
                            background: "white",
                            border: "2px solid #1976d2",
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
                          {/* rotated image */}
                          <Box
                            sx={{
                              width: "100%",
                              height: "100%",
                              transform: `rotate(${rotation}deg)`,
                              transformOrigin: "center center",
                            }}
                          >
                            <img
                              src={src}
                              alt="Uploaded"
                              style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 8,
                                pointerEvents: "none",
                                border: "2px solid #1976d2",
                                objectFit: "fill",
                                filter: filter || "none",
                                zIndex: zIndex
                              }}
                            />
                          </Box>

                          {/* Rotate button */}
                          <Box
                            className="non-draggable" // ✅ ensures RND doesn’t hijack
                            onClick={(e) => {
                              e.stopPropagation();
                              setDraggableImages3((prev) =>
                                prev.map((img) =>
                                  img.id === id
                                    ? { ...img, rotation: (img.rotation || 0) + 15 }
                                    : img
                                )
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
                              pointerEvents: "auto",
                              touchAction: "manipulation",
                              "&:hover": { bgcolor: "#333" },
                            }}
                          >
                            <Forward30 fontSize={isMobile ? "medium" : "small"} />
                          </Box>

                          {/* Close button */}
                          <Box
                            className="non-draggable"
                            onClick={(e) => {
                              e.stopPropagation();

                              // REMOVE image from selected
                              setSelectedImage3(prev => prev.filter(i => i !== id));
                              setDraggableImages3(prev => prev.filter(img => img.id !== id));

                              // RESET filter to original
                              setDraggableImages3(prev =>
                                prev.map(img =>
                                  img.id === id ? { ...img, filter: "none" } : img
                                )
                              );

                              setActiveFilterImageId3(null);
                              // CLOSE filter panel
                              setImageFilter3(false);
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
                              pointerEvents: "auto",
                              touchAction: "manipulation",
                              "&:hover": { bgcolor: "#333" },
                            }}
                          >
                            <Close fontSize={isMobile ? "medium" : "small"} />
                          </Box>
                        </Box>
                      </ScaledRnd>
                    );
                  })}

                {showOneTextRightSideBox3 && (
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
                        setOneTextValue3("");
                        if (typeof setShowOneTextRightSideBox3 === "function") {
                          setShowOneTextRightSideBox3(false);
                          setSelectedLayout3("blank");
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
                          verticalAlign3 === "top"
                            ? "flex-start"
                            : verticalAlign3 === "center"
                              ? "center"
                              : "flex-end",
                        alignItems:
                          textAlign3 === "start"
                            ? "flex-start"
                            : textAlign3 === "center"
                              ? "center"
                              : "flex-end",
                      }}
                    >
                      <TextField
                        variant="standard"
                        value={oneTextValue3}
                        onChange={(e) => setOneTextValue3(e.target.value)}
                        InputProps={{
                          disableUnderline: true,
                          sx: {
                            height: "100%",
                            alignItems:
                              verticalAlign3 === "top"
                                ? "flex-start"
                                : verticalAlign3 === "center"
                                  ? "center"
                                  : "flex-end",
                            "& .MuiInputBase-input, & .MuiInputBase-inputMultiline": {
                              fontSize: fontSize3,
                              fontWeight: fontWeight3,
                              color: fontColor3,
                              fontFamily: fontFamily3,
                              textAlign: textAlign3,
                              transform: `rotate(${rotation3}deg)`,
                              lineHeight: lineHeight3,
                              letterSpacing: letterSpacing3,
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

                {multipleTextValue3 && (
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
                    {texts3.map((textObj, index) => (
                      <Box
                        key={index}
                        sx={{
                          position: "relative",
                          height: { md: "210px", sm: "180px", xs: '180px' },
                          width: "100%",
                          mb: 2,
                          border: hideTextOutline ? "none" : "3px dashed #3a7bd5",
                          borderRadius: "6px",
                          justifyContent: "center",
                          display: "flex",
                          alignItems:
                            verticalAlign3 === "top"
                              ? "flex-start"
                              : verticalAlign3 === "center"
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
                          onClick={() =>
                            handleDeleteBox(index)
                          }
                        >
                          <Close />
                        </IconButton>

                        {editingIndex3 === index ? (
                          <TextField
                            autoFocus
                            fullWidth
                            multiline
                            variant="standard"
                            value={textObj.value}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setTexts3((prev) =>
                                prev.map((t, i) =>
                                  i === index
                                    ? {
                                      ...t,
                                      value: newValue,
                                      // Ye values bhi update kar do editing ke dauraan
                                      textAlign: textAlign3,
                                      verticalAlign: verticalAlign3,
                                    }
                                    : t
                                )
                              );
                            }}
                            InputProps={{
                              disableUnderline: true,
                              sx: {
                                "& textarea": {
                                  width: "100%",
                                  resize: "none",
                                  height: "100px",
                                  fontSize: textObj.fontSize3 ?? textObj.fontSize1 ?? textObj.fontSize,
                                  fontWeight: textObj.fontWeight3 ?? textObj.fontWeight1 ?? textObj.fontWeight,
                                  color: textObj.fontColor3 ?? textObj.fontColor1 ?? textObj.fontColor,
                                  fontFamily: textObj.fontFamily3 ?? textObj.fontFamily1 ?? textObj.fontFamily,
                                  textAlign: textAlign3,
                                  lineHeight: textObj.lineHeight,
                                  letterSpacing: textObj.letterSpacing
                                },
                              },
                            }}
                          />
                        ) : (
                          <Box
                            onClick={() => {
                              if (editingIndex3 !== null) {
                                setTexts3((prev) =>
                                  prev.map((t, i) =>
                                    i === editingIndex3
                                      ? {
                                        ...t,
                                        textAlign: textAlign3,
                                        verticalAlign: verticalAlign3,
                                      }
                                      : t
                                  )
                                );
                              }

                              // ✅ Then select new box
                              setEditingIndex3(index);
                              setFontSize3(textObj.fontSize3 ?? textObj.fontSize1 ?? textObj.fontSize ?? 16);
                              setFontFamily3(textObj.fontFamily3 ?? textObj.fontFamily1 ?? textObj.fontFamily ?? "Roboto");
                              setFontWeight3(textObj.fontWeight3 ?? textObj.fontWeight1 ?? textObj.fontWeight ?? 400);
                              setFontColor3(textObj.fontColor3 ?? textObj.fontColor1 ?? textObj.fontColor ?? "#000000");
                              setTextAlign3(textObj.textAlign);
                              setVerticalAlign3(textObj.verticalAlign);
                            }}
                            sx={{
                              width: "100%",
                              height: "100%",
                              cursor: "pointer",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: textObj.fontSize3 ?? textObj.fontSize1 ?? textObj.fontSize,
                                fontWeight: textObj.fontWeight3 ?? textObj.fontWeight1 ?? textObj.fontWeight,
                                color: textObj.fontColor3 ?? textObj.fontColor1 ?? textObj.fontColor,
                                fontFamily: textObj.fontFamily3 ?? textObj.fontFamily1 ?? textObj.fontFamily,
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
                                <TitleOutlined
                                  sx={{ alignSelf: "center", color: "gray" }}
                                />
                              ) : null}{" "}
                              {textObj.value}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}

                {isAIimage3 && (
                  <ScaledRnd
                    bounds="parent"
                    size={{ width: aimage3.width, height: aimage3.height }}
                    position={{ x: aimage3.x, y: aimage3.y }}
                    onDragStart={() => align.onDragStart()}
                    onDrag={(_, d) => {
                      const snap = align.onDrag(
                        d.x,
                        d.y,
                        aimage3.width,
                        aimage3.height,
                        alignItems,
                        "ai:3"
                      );
                      if (snap.snappedX || snap.snappedY) {
                        setAIImage3((prev) => ({ ...prev, x: snap.x, y: snap.y }));
                      }
                    }}
                    onDragStop={(_, d) => {
                      const snap = align.onDrag(
                        d.x,
                        d.y,
                        aimage3.width,
                        aimage3.height,
                        alignItems,
                        "ai:3"
                      );
                      setAIImage3((prev) => ({
                        ...prev,
                        x: snap.x,
                        y: snap.y,
                      }));
                      align.onDragStop();
                    }}
                    onResizeStop={(_, __, ref, ___, position) =>
                      setAIImage3({
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                        x: position.x,
                        y: position.y,
                      })
                    }
                    enableResizing={{
                      top: false,
                      right: false,
                      bottom: false,
                      left: false,
                      topRight: false,
                      bottomRight: true,
                      bottomLeft: false,
                      topLeft: false,
                    }}
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
                    {/* ✅ Ensure the container fills RND box */}
                    <Box
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                      }}
                    >
                      {/* ✅ Make image fill fully */}
                      <Box
                        component="img"
                        src={`${selectedAIimageUrl3}`}
                        alt="AI Image"
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "fill",
                          display: "block",
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Close button */}
                      <IconButton
                        onClick={() => setIsAIimage3?.(false)}
                        sx={{
                          position: "absolute",
                          top: -7,
                          right: -7,
                          bgcolor: "black",
                          color: "white",
                          width: 22,
                          height: 22,
                          "&:hover": {
                            bgcolor: "red",
                          },
                        }}
                      >
                        <Close />
                      </IconButton>
                    </Box>
                  </ScaledRnd>
                )}

                {selectedStickers3.map((sticker, index) => {
                  const isMobile =
                    typeof window !== "undefined" && window.innerWidth < 768;

                  return (
                    <ScaledRnd
                      key={sticker.id || index}
                      size={{ width: sticker.width, height: sticker.height }}
                      position={{ x: sticker.x, y: sticker.y }}
                      bounds="parent"
                      enableUserSelectHack={false} // ✅ allows touch events
                      cancel=".non-draggable" // ✅ prevents RND drag hijack on buttons
                    onDragStart={() => align.onDragStart()}
                    onDrag={(_, d) => {
                      const snap = align.onDrag(
                        d.x,
                        d.y,
                        sticker.width,
                        sticker.height,
                        alignItems,
                        `st:${sticker.id ?? index}`
                      );
                      if (snap.snappedX || snap.snappedY) {
                        updateSticker3(index, {
                          x: snap.x,
                          y: snap.y,
                          zIndex: sticker.zIndex,
                        });
                      }
                    }}
                    onDragStop={(_, d) => {
                      const snap = align.onDrag(
                        d.x,
                        d.y,
                        sticker.width,
                        sticker.height,
                        alignItems,
                        `st:${sticker.id ?? index}`
                      );
                      updateSticker3(index, {
                        x: snap.x,
                        y: snap.y,
                        zIndex: sticker.zIndex,
                      });
                      align.onDragStop();
                    }}
                      onResizeStop={(_, __, ref, ___, position) =>
                        updateSticker3(index, {
                          width: parseInt(ref.style.width),
                          height: parseInt(ref.style.height),
                          x: position.x,
                          y: position.y,
                          zIndex: sticker.zIndex,
                        })
                      }
                      enableResizing={{
                        bottomRight: true,
                      }}
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
                        touchAction: "none", // ✅ allow touch drag + taps
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        {/* Sticker image */}
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

                        {/* Close Button */}
                        <IconButton
                          className="non-draggable" // ✅ prevent drag capture
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSticker3(index);
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
                            cursor: "pointer",
                            pointerEvents: "auto",
                            touchAction: "manipulation",
                            "&:hover": { bgcolor: "red" },
                          }}
                        >
                          <Close fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>

                        {/* Rotate Button */}
                        <IconButton
                          className="non-draggable"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateSticker3(index, {
                              rotation: ((sticker.rotation || 0) + 15) % 360,
                            });
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
                            cursor: "pointer",
                            pointerEvents: "auto",
                            touchAction: "manipulation",
                            "&:hover": { bgcolor: "blue" },
                          }}
                        >
                          <Forward10 fontSize={isMobile ? "medium" : "small"} />
                        </IconButton>
                      </Box>
                    </ScaledRnd>
                  );
                })}
              </>
          }
          </Box>
        )}
      </Box>
    </CanvasScaleContext.Provider>
  );
};

export default SpreadRightSide;
