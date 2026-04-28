import {
  Box, IconButton, Typography, TextField, Select, MenuItem, Tooltip,
  FormControl, InputLabel, Divider, Chip, Stack, Switch,
  Paper, useMediaQuery, Slider
} from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import {
  CollectionsOutlined, EmojiEmotionsOutlined, TitleOutlined,
  ArrowBackIos, ArrowForwardIos, Close, FormatBoldOutlined,
  Edit, TextIncreaseOutlined,
  FormatAlignCenter, FormatAlignLeft, FormatAlignRight,
  KeyboardArrowUpOutlined, KeyboardArrowDownOutlined,
  FilterFramesOutlined,
  AddOutlined,
  ContentCopyOutlined, // ✅ NEW
} from "@mui/icons-material";
import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Rnd } from "react-rnd";
import { COLORS } from "../../../constant/color";
import { ADMINS_GOOGLE_FONTS, CATEGORY_CONFIG, SHAPES, STICKERS_DATA, type CategoryKey } from "../../../constant/data";
import PopupWrapper from "../../../components/PopupWrapper/PopupWrapper";
import LandingButton from "../../../components/LandingButton/LandingButton";
import AlignmentGuides from "../../../components/AlignmentGuides/AlignmentGuides";
import ImageCropModal from "../../../components/ImageCropModal/ImageCropModal";
import { useAlignGuides } from "../../../hooks/useAlignGuides";
import { useQuery } from "@tanstack/react-query";
import { fetchAllCategoryNamesFromDB } from "../../../source/source";
import {
  useCategoriesEditorState,
  type TextElement as CtxTextEl,
  type ImageElement as CtxImageEl,
} from "../../../context/CategoriesEditorContext";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMINS_DASHBOARD } from "../../../constant/route";
import { getCanvasMultiplier, uuid } from "../../../lib/lib";
import { prepareTemplateRawStoresForEditor } from "../../../lib/templateEditorScale";
import { buildGoogleFontsUrls, loadGoogleFontsOnce } from "../../../constant/googleFonts";

/* ----------------- Utils ----------------- */
const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });

const fetchToDataUrl = async (src: string): Promise<string> => {
  if (!src || src.startsWith("data:")) return src;
  try {
    const absolute = src.startsWith("/") ? `${window.location.origin}${src}` : src;
    const resp = await fetch(absolute, { mode: "cors" });
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    // Keep original URL when conversion is blocked; avoids dropping visible assets.
    if (src.startsWith("http") || src.startsWith("/")) return src;
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
  }
};

const parseSnapshotSlides = (value: any): any[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const buildElementsFromSnapshot = (slides: any[]) => {
  const texts: CtxTextEl[] = [];
  const images: CtxImageEl[] = [];
  const stickers: any[] = [];

  const toNum = (v: any, d = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : Number(v) || d);

  slides.forEach((sl, idx) => {
    const sid = toNum(sl?.id, idx + 1);
    const elements = Array.isArray(sl?.elements) ? sl.elements : [];
    elements.forEach((el: any) => {
      const type = String(el?.type ?? "").toLowerCase();
      if (type === "text" || (!type && el?.text != null)) {
        texts.push({
          id: String(el?.id ?? `text-${sid}-${idx}-${Math.random()}`),
          slideId: toNum(el?.slideId ?? el?.slide_id, sid),
          x: toNum(el?.x, 0),
          y: toNum(el?.y, 0),
          width: toNum(el?.width ?? el?.w, 0),
          height: toNum(el?.height ?? el?.h, 0),
          text: String(el?.text ?? el?.value ?? ""),
          bold: !!el?.bold,
          italic: !!el?.italic,
          fontSize: toNum(el?.fontSize ?? el?.font_size, 20),
          fontFamily: String(el?.fontFamily ?? el?.font_family ?? "Arial"),
          color: String(el?.color ?? "#111111"),
          rotation: toNum(el?.rotation ?? el?.rotate, 0),
          curve: toNum(el?.curve ?? el?.arc, 0),
          zIndex: toNum(el?.zIndex ?? el?.z_index, 1),
          editable: el?.editable !== false,
          align: el?.align,
        });
        return;
      }
      if (type === "image" || (!type && (el?.src || el?.image || el?.url))) {
        images.push({
          id: String(el?.id ?? `img-${sid}-${idx}-${Math.random()}`),
          slideId: toNum(el?.slideId ?? el?.slide_id, sid),
          x: toNum(el?.x, 0),
          y: toNum(el?.y, 0),
          width: toNum(el?.width ?? el?.w, 0),
          height: toNum(el?.height ?? el?.h, 0),
          src: String(el?.src ?? el?.image ?? el?.url ?? el?.imageUrl ?? ""),
          zIndex: toNum(el?.zIndex ?? el?.z_index, 1),
          editable: el?.editable !== false,
        });
        return;
      }
      if (type === "sticker" || (!type && (el?.sticker || el?.src))) {
        stickers.push({
          id: String(el?.id ?? `stk-${sid}-${idx}-${Math.random()}`),
          slideId: toNum(el?.slideId ?? el?.slide_id, sid),
          x: toNum(el?.x, 0),
          y: toNum(el?.y, 0),
          width: toNum(el?.width ?? el?.w, 0),
          height: toNum(el?.height ?? el?.h, 0),
          sticker: String(el?.sticker ?? el?.src ?? ""),
          zIndex: toNum(el?.zIndex ?? el?.z_index, 1),
        });
      }
    });
  });

  return { texts, images, stickers };
};

/* ------------ Mirror helpers (coordinate-based) ------------ */
const toViewX = (mirrorOn: boolean, canvasW: number, modelX: number, elW: number) =>
  mirrorOn ? (canvasW - elW - modelX) : modelX;

const toModelX = (mirrorOn: boolean, canvasW: number, viewX: number, elW: number) =>
  mirrorOn ? (canvasW - elW - viewX) : viewX;

/* --------------- Component --------------- */
const CategoriesEditor = () => {
  // const theme = useTheme();
  // const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const {
    category, setCategory, config,
    slides, setSlides,
    selectedSlide, setSelectedSlide,
    selectedTextId, setSelectedTextId,
    selectedImageId, setSelectedImageId,
    textToolOn, setTextToolOn,
    textElements, setTextElements,
    imageElements, setImageElements,
    stickerElements,
    setStickerElements,
    mainScrollerRef,
    registerFirstSlideNode,
    loading,
    slideBg,
    setSlideBg,
  } = useCategoriesEditorState();

  const location = useLocation();
  const hydratedRef = useRef(false);

  useEffect(() => {
    const st = location.state as any;
    const rs = st?.rawStores;
    if (hydratedRef.current) return;
    if (!rs) {
      const fallbackCategory = String(st?.product?.cardcategory ?? "").trim();
      if (fallbackCategory) {
        hydratedRef.current = true;
        setCategory(fallbackCategory);
      }
      return;
    }
    hydratedRef.current = true;

    const incomingCategory = String(
      rs?.category ?? st?.product?.cardcategory ?? category,
    ).trim();
    const editorReadyStores = prepareTemplateRawStoresForEditor(
      rs,
      getCanvasMultiplier(incomingCategory || category),
    );

    let snapshotSlides = parseSnapshotSlides(
      st?.snapshotSlides ?? (editorReadyStores as any)?.snapshotSlides,
    );
    if (
      snapshotSlides.length === 0 &&
      Array.isArray(editorReadyStores?.slides) &&
      editorReadyStores.slides.some((s: any) => Array.isArray(s?.elements) && s.elements.length)
    ) {
      snapshotSlides = editorReadyStores.slides;
    }

    if (editorReadyStores?.category) setCategory(editorReadyStores.category);
    if (Array.isArray(editorReadyStores?.slides) && editorReadyStores.slides.length) {
      setSlides(editorReadyStores.slides);
    }
    if (Array.isArray(editorReadyStores?.textElements)) {
      setTextElements(editorReadyStores.textElements);
    }
    if (Array.isArray(editorReadyStores?.imageElements)) {
      setImageElements(editorReadyStores.imageElements);
    }
    if (Array.isArray(editorReadyStores?.stickerElements)) {
      setStickerElements(editorReadyStores.stickerElements);
    }
    if (editorReadyStores?.slideBg) setSlideBg(editorReadyStores.slideBg);

    const hasText =
      Array.isArray(editorReadyStores?.textElements) && editorReadyStores.textElements.length > 0;
    const hasImg =
      Array.isArray(editorReadyStores?.imageElements) && editorReadyStores.imageElements.length > 0;
    const hasStk =
      Array.isArray(editorReadyStores?.stickerElements) &&
      editorReadyStores.stickerElements.length > 0;

    if (!hasText && !hasImg && !hasStk && snapshotSlides.length) {
      const { texts, images, stickers } = buildElementsFromSnapshot(snapshotSlides);
      if (texts.length) setTextElements(texts);
      if (images.length) setImageElements(images);
      if (stickers.length) setStickerElements(stickers);
    }

    setSelectedSlide(0);
    setSelectedTextId(null);
    setSelectedImageId(null);
  }, [
    location.state,
    category,
    setCategory,
    setSlides,
    setTextElements,
    setImageElements,
    setStickerElements,
    setSlideBg,
  ]);

  // ====== Local UI-only state ======
  const [fontSizeInput, setFontSizeInput] = useState<string>("20");
  const [showStickerPopup, setShowStickerPopup] = useState(false);
  const [inlineEditingTextId, setInlineEditingTextId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    loadGoogleFontsOnce(buildGoogleFontsUrls(ADMINS_GOOGLE_FONTS));
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined") return;
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Per-slide mirror toggle
  const [mirrorBySlide, setMirrorBySlide] = useState<Record<number, boolean>>({});
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cropTarget, setCropTarget] = useState<{
    imageId: string;
    src: string;
    aspect: number;
  } | null>(null);



  const {
    data: dbCategories = [],
  } = useQuery<{ id?: string; name?: string }[]>({
    queryKey: ["categories", "names"],
    queryFn: fetchAllCategoryNamesFromDB,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const categoryKeys = useMemo(() => {
    const configKeys = Object.keys(CATEGORY_CONFIG);
    const seen = new Map<string, string>();
    configKeys.forEach((k) => seen.set(k.toLowerCase(), k));

    (dbCategories ?? []).forEach((c) => {
      const name = (c?.name ?? "").trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!seen.has(key)) seen.set(key, name);
    });

    const list = Array.from(seen.values()).filter(
      (name) => name.trim().toLowerCase() !== "cards",
    );
    list.sort((a, b) => {
      const labelA = CATEGORY_CONFIG[a as CategoryKey]?.label ?? a;
      const labelB = CATEGORY_CONFIG[b as CategoryKey]?.label ?? b;
      return labelA.localeCompare(labelB, undefined, { sensitivity: "base" });
    });
    return list;
  }, [dbCategories]);

  const multiplier = getCanvasMultiplier(category);

  const canvasPx = {
    width: config.mmWidth * multiplier,
    height: config.mmHeight * multiplier,
  };

  const renderScale = useMemo(() => {
    if (!isMobile) return 1;
    const w = viewport.w || (typeof window !== "undefined" ? window.innerWidth : 360);
    const h = viewport.h || (typeof window !== "undefined" ? window.innerHeight : 640);
    const maxW = Math.max(240, w - 32);
    const maxH = Math.max(240, h - 320);
    const scale = Math.min(1, maxW / canvasPx.width, maxH / canvasPx.height);
    return Math.max(0.4, scale);
  }, [isMobile, viewport.w, viewport.h, canvasPx.width, canvasPx.height]);

  const renderCanvas = {
    width: Math.round(canvasPx.width * renderScale),
    height: Math.round(canvasPx.height * renderScale),
  };


  // ====== Viewport-aware canvas sizing ======
  // const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  // useEffect(() => {
  //   const onResize = () => {
  //     const headerFooterReserve = 240;
  //     setViewport({ w: window.innerWidth, h: Math.max(320, window.innerHeight - headerFooterReserve) });
  //   };
  //   onResize();
  //   window.addEventListener("resize", onResize);
  //   return () => window.removeEventListener("resize", onResize);
  // }, []);

  // const canvasSize = useMemo(
  //   () => fitCanvas(
  //     config.mmWidth,
  //     config.mmHeight,
  //     viewport.w * (isTablet ? 0.95 : 0.72),
  //     viewport.h
  //   ),
  //   [config.mmWidth, config.mmHeight, viewport, isTablet]
  // );

  // current slide id
  const artboardWidth = canvasPx.width;
  const artboardHeight = canvasPx.height;
  const scaleSafe = renderScale || 1;

  const currentSlideId = slides[selectedSlide]?.id ?? null;
  const activeSlideRef = useRef<HTMLDivElement | null>(null);
  const alignGuides = useAlignGuides(activeSlideRef);
  const alignItems = useMemo(() => {
    if (!currentSlideId) return [];
    const mirrorOn = !!mirrorBySlide[currentSlideId];
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

    textElements
      .filter((t) => t.slideId === currentSlideId)
      .forEach((t) => {
        const viewX = toViewX(mirrorOn, artboardWidth, t.x, t.width) * scaleSafe;
        const viewY = t.y * scaleSafe;
        push(`text:${t.id}`, viewX, viewY, t.width * scaleSafe, t.height * scaleSafe);
      });

    imageElements
      .filter((img) => img.slideId === currentSlideId)
      .forEach((img) => {
        const viewX = toViewX(mirrorOn, artboardWidth, img.x, img.width) * scaleSafe;
        const viewY = img.y * scaleSafe;
        push(`image:${img.id}`, viewX, viewY, img.width * scaleSafe, img.height * scaleSafe);
      });

    return items;
  }, [currentSlideId, textElements, imageElements, mirrorBySlide, artboardWidth, scaleSafe]);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  const openNativeColorPicker = () => {
    if (!selectedTextId) return;
    colorInputRef.current?.click();
  };

  const selectedText = useMemo(
    () => (selectedTextId ? (textElements.find(e => e.id === selectedTextId) ?? null) : null),
    [selectedTextId, textElements]
  );
  const selectedRotation = Number(selectedText?.rotation ?? 0) || 0;
  const selectedCurve = Number(selectedText?.curve ?? 0) || 0;

  useEffect(() => {
    if (!inlineEditingTextId) return;
    if (selectedTextId !== inlineEditingTextId) setInlineEditingTextId(null);
  }, [selectedTextId, inlineEditingTextId]);

  /* ---- Font size sync/control ---- */
  useEffect(() => {
    const sel = textElements.find(e => e.id === selectedTextId);
    if (sel?.fontSize != null) setFontSizeInput(String(sel.fontSize));
  }, [selectedTextId, textElements]);

  const commitFontSize = useCallback((raw: string) => {
    if (!selectedTextId) return;
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    const clamped = Math.max(6, Math.min(600, n));
    setTextElements(prev => prev.map(te => te.id === selectedTextId ? { ...te, fontSize: clamped } : te));
    setFontSizeInput(String(clamped));
  }, [selectedTextId, setTextElements]);

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => setFontSizeInput(e.target.value);

  /* ---------------- Slides ---------------- */
  const scrollToSlide = (index: number) => {
    const container = mainScrollerRef.current;
    if (!container) {
      setSelectedSlide(index);
      setSelectedTextId(null);
      setSelectedImageId(null);
      return;
    }
    const child = container.children[index] as HTMLElement | undefined;
    if (!child) return;
    const slideWidth = child.offsetWidth + 40;
    container.scrollTo({ left: slideWidth * index, behavior: "smooth" });
    setSelectedSlide(index);
    setSelectedTextId(null);
    setSelectedImageId(null);
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return;
    const target = slides[index];
    if (!target) return;
    const nextSlides = slides.filter((_, i) => i !== index);
    setSlides(nextSlides);
    setTextElements(prev => prev.filter(e => e.slideId !== target.id));
    setImageElements(prev => prev.filter(e => e.slideId !== target.id));
    setMirrorBySlide(prev => {
      const copy = { ...prev };
      delete (copy as any)[target.id];
      return copy;
    });
    setSelectedSlide(Math.max(0, Math.min(index, nextSlides.length - 1)));
    setSelectedTextId(null);
    setSelectedImageId(null);
  };

  /* -------------- Elements --------------- */
  const addText = () => {
    if (currentSlideId == null) return;
    const el: CtxTextEl = {
      id: uuid("txt"),
      slideId: currentSlideId,
      x: 24, y: 24, width: 220, height: 44,
      text: "",
      bold: false, italic: false, color: "#111111",
      fontSize: 20, fontFamily: "Arial",
      rotation: 0,
      curve: 0,
      align: "center",
      editable: true,
    };
    setTextElements(prev => [...prev, el]);
    setSelectedTextId(el.id);
    setSelectedImageId(null);
  };

  const updateText = (id: string, patch: Partial<CtxTextEl>) => {
    setTextElements(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  };

  const addImage = (src: string) => {
    if (currentSlideId == null) return;
    const el: CtxImageEl = {
      id: uuid("img"),
      slideId: currentSlideId,
      x: 48, y: 48, width: 160, height: 160,
      src,
      editable: true,
    };
    setImageElements(prev => [...prev, el]);
    setSelectedImageId(el.id);
    setSelectedTextId(null);
  };

  const updateImage = (id: string, patch: Partial<CtxImageEl>) => {
    setImageElements(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
  };

  const openCropForImage = useCallback((img: CtxImageEl) => {
    if (!img?.id || !img?.src || img.editable === false) return;
    setCropTarget({
      imageId: img.id,
      src: String(img.src),
      aspect: Math.max(0.1, Number(img.width || 1) / Math.max(1, Number(img.height || 1))),
    });
  }, []);

  const deleteElement = (id: string) => {
    let removed = false;
    setTextElements(prev => {
      if (prev.some(e => e.id === id)) removed = true;
      return prev.filter(e => e.id !== id);
    });
    if (!removed) setImageElements(prev => prev.filter(e => e.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
    if (selectedImageId === id) setSelectedImageId(null);
  };

  /* ✅ NEW: Duplicate / Copy element */
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const getMaxZOnSlide = useCallback((slideId: number, type: "text" | "image") => {
    if (type === "text") {
      return textElements
        .filter(t => t.slideId === slideId)
        .reduce((m, t: any) => Math.max(m, Number(t.zIndex ?? 1)), 1);
    }
    return imageElements
      .filter(i => i.slideId === slideId)
      .reduce((m, i: any) => Math.max(m, Number(i.zIndex ?? 1)), 1);
  }, [textElements, imageElements]);

  const duplicateElement = useCallback((target: { type: "text" | "image"; id: string }) => {
    const slideId = slides[selectedSlide]?.id;
    if (!slideId) return;

    const OFFSET = 24;

    if (target.type === "text") {
      const src = textElements.find(t => t.id === target.id);
      if (!src) return;

      const maxZ = getMaxZOnSlide(slideId, "text");
      const newW = src.width;
      const newH = src.height;

      const copy: CtxTextEl = {
        ...src,
        id: uuid("txt"),
        x: clamp((src.x ?? 0) + OFFSET, 0, Math.max(0, artboardWidth - newW)),
        y: clamp((src.y ?? 0) + OFFSET, 0, Math.max(0, artboardHeight - newH)),
        ...(typeof (src as any).zIndex !== "undefined" ? { zIndex: maxZ + 1 } as any : { zIndex: maxZ + 1 } as any),
      };

      setTextElements(prev => [...prev, copy]);
      setSelectedTextId(copy.id);
      setSelectedImageId(null);
      return;
    }

    // image
    const src = imageElements.find(i => i.id === target.id);
    if (!src) return;

    const maxZ = getMaxZOnSlide(slideId, "image");
    const newW = src.width;
    const newH = src.height;

    const copy: CtxImageEl = {
      ...src,
      id: uuid("img"),
      x: clamp((src.x ?? 0) + OFFSET, 0, Math.max(0, artboardWidth - newW)),
      y: clamp((src.y ?? 0) + OFFSET, 0, Math.max(0, artboardHeight - newH)),
      ...(typeof (src as any).zIndex !== "undefined" ? { zIndex: maxZ + 1 } as any : { zIndex: maxZ + 1 } as any),
    };

    setImageElements(prev => [...prev, copy]);
    setSelectedImageId(copy.id);
    setSelectedTextId(null);
  }, [slides, selectedSlide, textElements, imageElements, getMaxZOnSlide, artboardWidth, artboardHeight, setTextElements, setImageElements]);

  /* -------------- File input -------------- */
  const onClickPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      addImage(dataUrl);
    } finally {
      e.target.value = "";
    }
  };

  const getSlideElements = useCallback(
    (slideId: number) => {
      const texts = textElements
        .filter(e => e.slideId === slideId)
        .map(e => ({ ...e, type: "text" as const }));
      const images = imageElements
        .filter(e => e.slideId === slideId)
        .map(e => ({ ...e, type: "image" as const }));
      return [...texts, ...images].sort((a: any, b: any) => (a.zIndex ?? 1) - (b.zIndex ?? 1));
    },
    [textElements, imageElements]
  );

  /* ---------- Drag scrolling ---------- */
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const recalc = () => {
    const el = thumbRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;

    const left = scrollLeft > 0;
    const right = scrollLeft + clientWidth < scrollWidth - 1;
    setCanLeft(left);
    setCanRight(right);

    const firstChip = el.firstElementChild as HTMLElement | null;
    if (!firstChip) return;

    const chipRect = firstChip.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;

    const chipW = chipRect.width + gap;
    if (chipW <= 0) return;
  };

  useEffect(() => {
    recalc();
    const el = thumbRef.current;
    if (!el) return;

    const onScroll = () => recalc();
    el.addEventListener("scroll", onScroll, { passive: true });

    const onResize = () => recalc();
    window.addEventListener("resize", onResize);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [slides.length]);

  const scrollByOne = (dir: "left" | "right") => {
    const el = thumbRef.current;
    if (!el) return;

    const firstChip = el.firstElementChild as HTMLElement | null;
    if (!firstChip) return;

    const chipRect = firstChip.getBoundingClientRect();
    const styles = window.getComputedStyle(el);
    const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;

    const step = chipRect.width + gap || 120;
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  };

  const slideScrollLeft = () => scrollByOne("left");
  const slideScrollRight = () => scrollByOne("right");

  // ====== Align helpers ======
  type TextAlignVal = "left" | "center" | "right";
  const cycleAlign = (curr?: TextAlignVal): TextAlignVal =>
    curr === "left" ? "center" : curr === "center" ? "right" : "left";

  const currentAlign: TextAlignVal = (selectedText as any)?.align ?? "left";
  const AlignIcon = currentAlign === "left" ? FormatAlignLeft : currentAlign === "center" ? FormatAlignCenter : FormatAlignRight;

  /* ====== Layering (z-index) ====== */
  type LayerNode = { type: "text" | "image"; id: string; z: number };
  const buildLayers = useCallback((): LayerNode[] => {
    const slideId = slides[selectedSlide]?.id;
    if (!slideId) return [];
    const t: LayerNode[] = textElements
      .filter(e => e.slideId === slideId)
      .map(e => ({ type: "text", id: e.id, z: Number((e as any).zIndex ?? 1) }));
    const i: LayerNode[] = imageElements
      .filter(e => e.slideId === slideId)
      .map(e => ({ type: "image", id: e.id, z: Number((e as any).zIndex ?? 1) }));
    return [...t, ...i].sort((a, b) => a.z - b.z);
  }, [slides, selectedSlide, textElements, imageElements]);

  const normalizeZ = (nodes: LayerNode[]) =>
    nodes
      .slice()
      .sort((a, b) => a.z - b.z)
      .map((n, i) => ({ ...n, z: i + 1 }));

  const writeBackZ = (nodes: LayerNode[]) => {
    const map = new Map(nodes.map(n => [`${n.type}:${n.id}`, n.z]));
    const slideId = slides[selectedSlide]?.id;

    setTextElements(prev =>
      prev.map(e => {
        if (e.slideId !== slideId) return e;
        const z = map.get(`text:${e.id}`);
        return typeof z === "number" ? { ...e, zIndex: z } as any : e;
      })
    );
    setImageElements(prev =>
      prev.map(e => {
        if (e.slideId !== slideId) return e;
        const z = map.get(`image:${e.id}`);
        return typeof z === "number" ? { ...e, zIndex: z } as any : e;
      })
    );
  };

  const bringForward = (target: { type: "text" | "image"; id: string }) => {
    const nodes = buildLayers().filter(n => n.type === target.type);
    const idx = nodes.findIndex(n => n.id === target.id);
    if (idx === -1 || idx === nodes.length - 1) return;
    const swapped = nodes.slice();
    [swapped[idx].z, swapped[idx + 1].z] = [swapped[idx + 1].z, swapped[idx].z];
    writeBackZ(normalizeZ(swapped));
  };
  const sendBackward = (target: { type: "text" | "image"; id: string }) => {
    const nodes = buildLayers().filter(n => n.type === target.type);
    const idx = nodes.findIndex(n => n.id === target.id);
    if (idx <= 0) return;
    const swapped = nodes.slice();
    [swapped[idx].z, swapped[idx - 1].z] = [swapped[idx - 1].z, swapped[idx].z];
    writeBackZ(normalizeZ(swapped));
  };

  const [showShapePopup, setShowShapePopup] = useState(false);

  // ====== Toolbar (responsive)
    const Toolbar = (
      <Box
        sx={{
          position: { xs: "static", md: "absolute" },
          left: { xs: 0, md: 16 }, top: 0,
          display: "flex",
          flexDirection: { xs: "row", md: "column" },
          alignItems: { xs: "center", md: "stretch" },
          gap: 0.75,
          p: 1,
          bgcolor: "#fff",
          boxShadow: 3,
          borderRadius: 2,
          zIndex: 5,
          width: { xs: "100%", md: "auto" },
          height: { xs: "auto", md: renderCanvas.height },
          maxHeight: { xs: "none", md: renderCanvas.height },
          overflowX: { xs: "auto", md: "hidden" },
          overflowY: { xs: "hidden", md: "auto" },
          maxWidth: { xs: "100%", md: "none" },
          "&::-webkit-scrollbar": { height: 5, width: 5 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: COLORS.primary,
          borderRadius: "20px",
        },
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {config.features.text && (
        <Tooltip title="Toggle Text Tool">
          <IconButton sx={{ ...toolBtn, color: textToolOn ? "#1976d2" : "#212121" }} onClick={() => setTextToolOn((s) => !s)}>
            <TitleOutlined fontSize="large" />
            Text
          </IconButton>
        </Tooltip>
      )}
      {config.features.photo && (
        <Tooltip title="Add Photo">
          <IconButton sx={toolBtn} onClick={onClickPhoto}>
            <CollectionsOutlined fontSize="large" />
            Photo
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title="Frames">
        <IconButton
          disabled={!selectedImageId}
          onClick={() => setShowShapePopup(true)}
        >
          <FilterFramesOutlined />
        </IconButton>
      </Tooltip>

      {config.features.sticker && (
        <Tooltip title="Add Sticker">
          <IconButton
            sx={toolBtn}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); setShowStickerPopup(true); }}
          >
            <EmojiEmotionsOutlined fontSize="large" />
            Sticker
          </IconButton>
        </Tooltip>
      )}

      {textToolOn && (
        <>
          <Divider flexItem sx={{ my: 0.5 }} />
          <Tooltip title="Add text">
            <IconButton sx={toolBtn} onClick={addText}>
              <TextIncreaseOutlined fontSize="large" />
              Add
            </IconButton>
          </Tooltip>

          {/* Font size */}
          <Box sx={{ ...toolBtn, alignItems: "center", gap: 0.5 }}>
            <TextField
              type="text"
              variant="outlined"
              value={fontSizeInput}
              onChange={handleFontSizeChange}
              onBlur={() => commitFontSize(fontSizeInput)}
              onKeyDown={(e) => e.key === "Enter" && commitFontSize(fontSizeInput)}
              inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              sx={{
                width: 50,
                "& .MuiInputBase-root": { p: 0, textAlign: "center" },
                "& input": { textAlign: "center", fontSize: 14, fontWeight: 500, p: "8px" },
              }}
            />
          </Box>

          <Tooltip title="Bold">
            <IconButton
              sx={{ ...toolBtn, color: selectedText?.bold ? "#1976d2" : "#212121" }}
              onClick={() => selectedText && updateText(selectedText.id, { bold: !selectedText.bold })}
              disabled={!selectedTextId}
            >
              <FormatBoldOutlined fontSize="large" />
              Bold
            </IconButton>
          </Tooltip>

          {/* Font family */}
          <Box sx={{ ...toolBtn, alignItems: "center", gap: 0.5 }}>
            <Select
              value={selectedText?.fontFamily || "Arial"}
              onChange={(e) => selectedText && updateText(selectedText.id, { fontFamily: String(e.target.value) })}
              variant="standard"
              inputProps={{ disableUnderline: true }}
              renderValue={(val) => (
                <Box sx={{ fontFamily: String(val || "Arial"), fontSize: 12, textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {String(val || "Arial")}
                </Box>
              )}
              MenuProps={{ PaperProps: { sx: { maxHeight: 'auto' } } }}
              sx={{
                maxWidth: 50,
                textAlign: "center",
                "& .MuiSelect-select": { px: 0.5, py: 0.25, width: "60px", display: "flex", alignItems: "center", justifyContent: "center" },
                "& .MuiInputBase-root": { p: 0 },
                "& .MuiInput-underline:before": { borderBottom: "none" },
                "& .MuiInput-underline:after": { borderBottom: "none" },
              }}
            >
              <MenuItem value="Arial" sx={{ fontFamily: "Arial" }}>Arial</MenuItem>
              {ADMINS_GOOGLE_FONTS.map((font) => (
                <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
                  {font}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {/* Align */}
          <Tooltip title={`Align: ${currentAlign}`}>
            <span>
              <IconButton
                sx={{ ...toolBtn, color: "#212121" }}
                disabled={!selectedTextId}
                onClick={() => {
                  if (!selectedTextId) return;
                  const next = cycleAlign(currentAlign);
                  updateText(selectedTextId, { align: next });
                }}
              >
                <AlignIcon fontSize="large" />
                Align
              </IconButton>
            </span>
          </Tooltip>

          <Box
            sx={{
              minWidth: { xs: 140, md: 110 },
              px: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: 0.25,
              opacity: selectedTextId ? 1 : 0.5,
            }}
          >
            <Typography variant="caption" sx={{ textAlign: "center", fontWeight: 600 }}>
              Rotate
            </Typography>
            <Slider
              size="small"
              value={selectedRotation}
              min={-180}
              max={180}
              step={1}
              disabled={!selectedTextId}
              onChange={(_, v) => {
                if (!selectedTextId) return;
                const next = Array.isArray(v) ? v[0] : v;
                updateText(selectedTextId, { rotation: Number(next) });
              }}
            />
            <Typography variant="caption" sx={{ textAlign: "center" }}>
              {Math.round(selectedRotation)}°
            </Typography>
          </Box>

          <Box
            sx={{
              minWidth: { xs: 140, md: 110 },
              px: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              gap: 0.25,
              opacity: selectedTextId ? 1 : 0.5,
            }}
          >
            <Typography variant="caption" sx={{ textAlign: "center", fontWeight: 600 }}>
              Curve
            </Typography>
            <Slider
              size="small"
              value={selectedCurve}
              min={-200}
              max={200}
              step={1}
              disabled={!selectedTextId}
              onChange={(_, v) => {
                if (!selectedTextId) return;
                const next = Array.isArray(v) ? v[0] : v;
                updateText(selectedTextId, { curve: Number(next) });
              }}
            />
            <Typography variant="caption" sx={{ textAlign: "center" }}>
              {Math.round(selectedCurve)}
            </Typography>
          </Box>

          {/* Color */}
          <Stack direction="row" spacing={0.5} sx={{ px: 1, flexWrap: "wrap", maxWidth: 220 }}>
            <IconButton
              onClick={openNativeColorPicker}
              disabled={!selectedTextId}
              aria-label="Pick text color"
              sx={{
                width: 36, height: 36, borderRadius: "50%",
                border: "2px solid #e0e0e0", p: 0, overflow: "hidden",
                opacity: selectedTextId ? 1 : 0.5, cursor: selectedTextId ? "pointer" : "not-allowed",
              }}
            >
              <Box sx={{ width: "100%", height: "100%", bgcolor: selectedText?.color || "#000000", borderRadius: "50%" }} />
            </IconButton>
            <input
              ref={colorInputRef}
              type="color"
              value={selectedText?.color || "#000000"}
              onChange={(e) => { if (!selectedTextId) return; updateText(selectedTextId, { color: e.target.value }); }}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
              aria-hidden
            />
          </Stack>
        </>
      )}

      <Divider flexItem sx={{ my: 0.5 }} />
    </Box>
  );

  const navigate = useNavigate();

  const goNextWithRawStores = () => {
    const snapshotSlides = slides.map((s, idx) => {
      const label = config.slideLabels?.[idx] ?? `Slide ${idx + 1}`;
      const texts = textElements
        .filter((el) => el.slideId === s.id)
        .map((el) => ({ ...el, type: "text" as const }));
      const images = imageElements
        .filter((el) => el.slideId === s.id)
        .map((el) => ({ ...el, type: "image" as const }));
      const stickers = stickerElements
        .filter((el) => el.slideId === s.id)
        .map((el) => ({ ...el, type: "sticker" as const }));
      return { id: s.id, label, elements: [...texts, ...images, ...stickers] };
    });

    const configWithFit = {
      ...config,
      fitCanvas: {
        width: Math.round(canvasPx.width),
        height: Math.round(canvasPx.height),
      },
    };

    const rawStores = {
      category,
      config: configWithFit,
      slides,
      snapshotSlides,
      textElements,
      imageElements,
      stickerElements,
      slideBg,
    };

    const navState: any = { rawStores, snapshotSlides };

    const st = location.state as any;
    if (st?.mode) navState.mode = st.mode;
    if (st?.id) navState.id = st.id;
    navState.product = {
      ...(st?.product ?? {}),
      cardcategory: category,
    };

    navigate(ADMINS_DASHBOARD.ADD_NEW_TEMPLETS_CARDS, { state: navState });
  };

  const addSlide = () => {
    const newSlideId = Date.now();

    setSlides(prev => [...prev, { id: newSlideId }]);

    const currentId = slides[selectedSlide]?.id;
    if (currentId && slideBg[currentId]) {
      setSlideBg((prev: any) => ({
        ...prev,
        [newSlideId]: { ...prev[currentId] },
      }));
    }

    setSelectedTextId(null);
    setSelectedImageId(null);

    const nextIndex = slides.length;
    setSelectedSlide(nextIndex);

    requestAnimationFrame(() => {
      scrollToSlide(nextIndex);
    });
  };

  const duplicateSlide = useCallback(
    (index: number) => {
      const sourceId = slides[index]?.id;
      if (!sourceId) return;

      const newSlideId = Date.now();

      setSlides((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, { id: newSlideId });
        return next;
      });

      setTextElements((prev) => [
        ...prev,
        ...prev
          .filter((t) => t.slideId === sourceId)
          .map((t) => ({ ...t, id: uuid("text"), slideId: newSlideId })),
      ]);
      setImageElements((prev) => [
        ...prev,
        ...prev
          .filter((img) => img.slideId === sourceId)
          .map((img) => ({ ...img, id: uuid("img"), slideId: newSlideId })),
      ]);
      setStickerElements((prev) => [
        ...prev,
        ...prev
          .filter((st) => st.slideId === sourceId)
          .map((st) => ({ ...st, id: uuid("stk"), slideId: newSlideId })),
      ]);

      setSlideBg((prev: any) => {
        if (!prev?.[sourceId]) return prev;
        return { ...prev, [newSlideId]: { ...prev[sourceId] } };
      });

      setMirrorBySlide((prev) => ({
        ...prev,
        [newSlideId]: !!prev[sourceId],
      }));

      setSelectedTextId(null);
      setSelectedImageId(null);
      const nextIndex = index + 1;
      setSelectedSlide(nextIndex);

      requestAnimationFrame(() => {
        scrollToSlide(nextIndex);
      });
    },
    [
      slides,
      setSlides,
      setTextElements,
      setImageElements,
      setStickerElements,
      setSlideBg,
      setMirrorBySlide,
      setSelectedTextId,
      setSelectedImageId,
      setSelectedSlide,
      scrollToSlide,
    ],
  );

  return (
    <DashboardLayout title="Categories Wise Editor">
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFileSelected} />

      {/* Header */}
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            mb: 1,
            px: { xs: 1, md: 2 },
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            spacing={2}
            sx={{ width: "100%", flexWrap: "wrap" }}
          >
            <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 240, md: 260 } }}>
              <InputLabel id="cat-label">Category</InputLabel>
              <Select
                labelId="cat-label"
              value={category}
              label="Category"
              onChange={(e) => setCategory(String(e.target.value))}
            >
              {categoryKeys.map((k) => (
                <MenuItem key={k} value={k}>{CATEGORY_CONFIG[k as CategoryKey]?.label ?? k}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Chip label={`${config.mmWidth}×${config.mmHeight} mm`} size="small" />
          {currentSlideId != null && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption">Mirror</Typography>
              <Switch
                size="small"
                checked={!!mirrorBySlide[currentSlideId as number]}
                onChange={(e) =>
                  setMirrorBySlide(prev => ({
                    ...prev,
                    [currentSlideId as number]: e.target.checked,
                  }))
                }
              />
            </Stack>
          )}
        </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", md: "auto" } }}>
            <LandingButton personal title="Save Design" width="150px" onClick={goNextWithRawStores} loading={loading} />
          </Stack>
        </Box>

      {/* MAIN SLIDE SCROLLER */}
        <Box
          ref={mainScrollerRef}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: { xs: "flex-start", md: "center" },
            overflowX: "auto",
            overflowY: "hidden",
            width: "100%",
            p: { xs: 1, sm: 1.5, md: 2 },
            gap: { xs: 2, sm: 3, md: "75px" },
            scrollBehavior: "smooth",
            userSelect: "none",
            justifyContent: "flex-start",
          minWidth: "100%",
          scrollSnapType: "x mandatory",
          "&::-webkit-scrollbar": { height: 6, width: 6 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: COLORS.primary,
            borderRadius: "20px",
          },
        }}
      >
        {slides.map((slide, index) => {
          const isInactive = index !== selectedSlide;
          const mirrorOn = !!mirrorBySlide[slide.id as number];
          const elements = getSlideElements(slide.id);

          return (
              <Box
                key={slide.id}
                ref={index === 0 ? registerFirstSlideNode : undefined}
                sx={{
                  flex: "0 0 auto",
                  width: renderCanvas.width,
                  height: renderCanvas.height,
                  borderRadius: 2,
                  boxShadow: index === selectedSlide ? 8 : 4,
                  position: "relative",
                  outline: index === selectedSlide ? "2px solid #1976d2" : "1px solid rgba(0,0,0,0.08)",
                  transition: "box-shadow .2s ease, outline .2s ease, filter .2s ease, opacity .2s ease, background-color .2s ease",
                  opacity: isInactive ? 0.45 : 1,
                filter: isInactive ? "grayscale(0.4)" : "none",
                ml: index === 0 ? { xs: 0, md: 30 } : 0,
              }}
              onClick={() => { setSelectedTextId(null); setSelectedImageId(null); }}
            >
              {!isInactive && (
                <>
                  {(selectedTextId || selectedImageId) && (
                    <Paper elevation={2} sx={{ width: 100, p: 1, position: 'absolute', top: 3, left: 3, zIndex: 99999 }}>
                      <Typography variant="caption">Editable</Typography>
                      <Switch
                        size="small"
                        checked={
                          selectedTextId
                            ? textElements.find(t => t.id === selectedTextId)?.editable !== false
                            : imageElements.find(i => i.id === selectedImageId)?.editable !== false
                        }
                        onChange={(e) => {
                          const editable = e.target.checked;
                          if (selectedTextId) {
                            setTextElements(p =>
                              p.map(t => t.id === selectedTextId ? { ...t, editable } : t)
                            );
                          }
                          if (selectedImageId) {
                            setImageElements(p =>
                              p.map(i => i.id === selectedImageId ? { ...i, editable } : i)
                            );
                          }
                        }}
                      />
                    </Paper>
                  )}
                </>
              )}

                {/* Toolbar */}
                {index === selectedSlide && (
                  <Box
                    sx={{
                      position: { xs: "static", md: "absolute" },
                      left: { xs: 0, md: -100 },
                      top: 0,
                      mb: { xs: 1, md: 0 },
                      width: { xs: "100%", md: "auto" },
                    }}
                  >
                    {Toolbar}
                  </Box>
                )}

              {slideBg[slide.id]?.image && (
                <Rnd
                  bounds="parent"
                  disableDragging={!slideBg[slide.id]?.editable}
                  enableResizing={!!slideBg[slide.id]?.editable}
                  onDoubleClick={() =>
                    setSlideBg((p: any) => ({
                      ...p,
                      [slide.id]: {
                        ...p[slide.id],
                        editable: !p[slide.id]?.editable,
                      },
                    }))
                  }
                  style={{ zIndex: 0 }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      backgroundImage: `url(${slideBg[slide.id]?.image})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                </Rnd>
              )}

              {/* Elements */}
              <Box
                ref={index === selectedSlide ? activeSlideRef : undefined}
                sx={{
                  width: "100%", height: "100%",
                  pointerEvents: isInactive ? "none" : "auto",
                }}
              >
                <AlignmentGuides {...alignGuides.guides} hide={isInactive || !alignGuides.isActive} />
                {elements.map((el: any) => {
                  const isSelected = selectedTextId === el.id || selectedImageId === el.id;

                    const viewX = toViewX(mirrorOn, artboardWidth, el.x, el.width);
                    const viewXScaled = viewX * scaleSafe;
                    const viewYScaled = el.y * scaleSafe;
                    const widthScaled = el.width * scaleSafe;
                    const heightScaled = el.height * scaleSafe;
                    const alignKey = `${el.type}:${el.id}`;

                  // runtime z-index: text always above images
                  const runtimeZ = (el.type === "text" ? 100000 : 0) + Number(el.zIndex ?? 1);

                    const common = {
                      key: el.id,
                      position: { x: viewXScaled, y: viewYScaled },
                      size: { width: widthScaled, height: heightScaled },
                      bounds: "parent" as const,
                      cancel: ".no-drag",
                      disableDragging: isInactive,
                      enableResizing: isInactive ? false : { bottomRight: true },
                      onDragStart: () => {
                        if (!isInactive) alignGuides.onDragStart();
                      },
                      onDrag: (_: any, d: any) => {
                        if (isInactive) return;
                        const snap = alignGuides.onDrag(
                          d.x,
                          d.y,
                          widthScaled,
                          heightScaled,
                          alignItems,
                          alignKey
                        );
                        if (snap.snappedX || snap.snappedY) {
                          const modelX = toModelX(mirrorOn, artboardWidth, snap.x / scaleSafe, el.width);
                          const modelY = snap.y / scaleSafe;
                          if (el.type === "text") updateText(el.id, { x: modelX, y: modelY });
                          if (el.type === "image") updateImage(el.id, { x: modelX, y: modelY });
                        }
                      },
                      onDragStop: (_: any, d: any) => {
                        if (isInactive) return;
                        const snap = alignGuides.onDrag(
                          d.x,
                          d.y,
                          widthScaled,
                          heightScaled,
                          alignItems,
                          alignKey
                        );
                        const modelX = toModelX(mirrorOn, artboardWidth, snap.x / scaleSafe, el.width);
                        const modelY = snap.y / scaleSafe;
                        if (el.type === "text") updateText(el.id, { x: modelX, y: modelY });
                        if (el.type === "image") updateImage(el.id, { x: modelX, y: modelY });
                        alignGuides.onDragStop();
                      },
                      onResizeStop: (_: any, __: any, ref: any, ___: any, position: any) => {
                        const newW = parseInt(ref.style.width, 10) / scaleSafe;
                        const newH = parseInt(ref.style.height, 10) / scaleSafe;
                        const modelX = toModelX(mirrorOn, artboardWidth, position.x / scaleSafe, newW);
                        const modelY = position.y / scaleSafe;
                        const patch = { width: newW, height: newH, x: modelX, y: modelY };
                        if (el.type === "text") updateText(el.id, patch);
                        if (el.type === "image") updateImage(el.id, patch);
                        alignGuides.onDragStop();
                      },
                    style: {
                      borderRadius: 4,
                      position: "absolute" as const,
                      overflow: "visible",
                      zIndex: runtimeZ,
                      border: isSelected ? "1px solid #1976d2" : "1px solid rgba(0,0,0,0.06)",
                      background: "transparent",
                      cursor: isInactive ? "default" : "move",
                    },
                    resizeHandleStyles: {
                      bottomRight: {
                        width: "14px", height: "14px",
                        background: "white", border: "1px solid #1976d2",
                        borderRadius: "3px", right: "-7px", bottom: "-7px",
                        cursor: "nwse-resize", boxShadow: "0 1px 2px rgba(0,0,0,.15)",
                      },
                    },
                  };

                  // IMAGE
                  if (el.type === "image") {
                    return (
                      <Rnd
                        {...common}
                        onClick={(e: any) => {
                          if (isInactive) return;
                          e.stopPropagation();
                          setSelectedImageId(el.id);
                          setSelectedTextId(null);
                        }}
                      >
                        <Box
                          sx={{ width: "100%", height: "100%", position: "relative" }}
                          onDoubleClick={(e) => {
                            if (isInactive) return;
                            e.stopPropagation();
                            setSelectedImageId(el.id);
                            setSelectedTextId(null);
                            openCropForImage(el as CtxImageEl);
                          }}
                        >
                          <img
                            src={el.src} alt=""
                            style={{
                              width: "100%", height: "100%",
                              objectFit: "cover", display: "block", borderRadius: 4,
                              transform: mirrorOn ? "scaleX(-1)" : "none",
                              clipPath: SHAPES.find(s => s.id === el.shapeId)?.path,
                            }}
                            draggable={false}
                          />

                          {/* Layer + Copy controls (image-only) */}
                          {!isInactive && isSelected && (
                            <Box sx={{ position: "absolute", top: -15, left: -2, display: "flex", gap: 0.5, zIndex: 9999 }}>
                              <Tooltip title="Backward">
                                <IconButton
                                  sx={{ bgcolor: 'black', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: '#424242' } }}
                                  className="no-drag"
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); sendBackward({ type: "image", id: el.id }); }}
                                >
                                  <KeyboardArrowDownOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Forward">
                                <IconButton
                                  sx={{ bgcolor: 'black', color: 'white', width: 20, height: 20, '&:hover': { bgcolor: '#424242' } }}
                                  className="no-drag"
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); bringForward({ type: "image", id: el.id }); }}
                                >
                                  <KeyboardArrowUpOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {/* ✅ NEW: Copy/Duplicate */}
                              <Tooltip title="Duplicate">
                                <IconButton
                                  sx={{ bgcolor: 'black', color: 'white', width: 24, height: 26, '&:hover': { bgcolor: '#424242' } }}
                                  className="no-drag"
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); duplicateElement({ type: "image", id: el.id }); }}
                                >
                                  <ContentCopyOutlined fontSize="inherit" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}

                          {!isInactive && (
                            <IconButton
                              className="no-drag"
                              onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                              sx={{ position: "absolute", top: -8, right: -8, bgcolor: "black", color: "white", width: 22, height: 22, zIndex: 2, "&:hover": { bgcolor: "#c62828" } }}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          )}
                        </Box>
                      </Rnd>
                    );
                  }

                  const textAlignVal: TextAlignVal = (el.align ?? "left") as TextAlignVal;
                  const justify =
                    textAlignVal === "left"
                      ? "flex-start"
                      : textAlignVal === "center"
                      ? "center"
                      : "flex-end";
                  const rotation = Number((el as any).rotation ?? 0) || 0;
                  const curve = Number((el as any).curve ?? 0) || 0;
                  const curveVal = Math.max(-200, Math.min(200, curve));
                  const hasCurve = Math.abs(curveVal) > 0.5;
                  const safeW = Math.max(1, Number(el.width) || 1);
                  const safeH = Math.max(1, Number(el.height) || 1);
                  const curvePx = (curveVal / 100) * (safeH / 2);
                  const midY = safeH / 2;
                  const curvePath = `M 0 ${midY} Q ${safeW / 2} ${midY - curvePx} ${safeW} ${midY}`;
                  const curveId = `curve-${el.id}`;
                  const textAnchor =
                    textAlignVal === "left" ? "start" : textAlignVal === "right" ? "end" : "middle";
                  const startOffset =
                    textAlignVal === "left" ? "0%" : textAlignVal === "right" ? "100%" : "50%";
                  const isInlineEditing =
                    selectedTextId === el.id && inlineEditingTextId === el.id && !isInactive;
                  const transformParts: string[] = [];
                  if (mirrorOn) transformParts.push("scaleX(-1)");
                  if (rotation) transformParts.push(`rotate(${rotation}deg)`);
                  const textTransform = transformParts.length ? transformParts.join(" ") : "none";

                  return (
                    <Rnd
                      {...common}
                      onClick={(e: any) => {
                        if (isInactive) return;
                        e.stopPropagation();
                        setSelectedTextId(el.id);
                        setSelectedImageId(null);
                      }}
                      onDoubleClick={(e: any) => {
                        if (isInactive) return;
                        e.stopPropagation();
                        setSelectedTextId(el.id);
                        setSelectedImageId(null);
                        setInlineEditingTextId(el.id);
                      }}
                    >
                      <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: justify, p: 1, position: "relative", overflow: "visible" }}>

                        {/* Layer + Copy controls (text-only) */}
                        {!isInactive && isSelected && (
                          <Box sx={{ position: "absolute", top: -15, left: -2, display: "flex", gap: 0.5, zIndex: 9999 }}>
                            <Tooltip title="Backward">
                              <IconButton
                                sx={{ bgcolor: 'black', color: 'white', width: 18, height: 18, '&:hover': { bgcolor: '#424242' } }}
                                className="no-drag"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); sendBackward({ type: "text", id: el.id }); }}
                              >
                                <KeyboardArrowDownOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Forward">
                              <IconButton
                                sx={{ bgcolor: 'black', color: 'white', width: 18, height: 18, '&:hover': { bgcolor: '#424242' } }}
                                className="no-drag"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); bringForward({ type: "text", id: el.id }); }}
                              >
                                <KeyboardArrowUpOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {/* ✅ NEW: Copy/Duplicate */}
                            <Tooltip title="Duplicate">
                              <IconButton
                                sx={{ bgcolor: 'black', color: 'white', width: 24, height: 24, '&:hover': { bgcolor: '#424242' } }}
                                className="no-drag"
                                size="small"
                                onClick={(e) => { e.stopPropagation(); duplicateElement({ type: "text", id: el.id }); }}
                              >
                                <ContentCopyOutlined fontSize="inherit" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}

                        {isInlineEditing ? (
                          <>
                            <Box
                              sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: justify,
                                transform: textTransform,
                                transformOrigin: "center",
                                overflow: "visible",
                              }}
                            >
                              <TextField
                                className="no-drag"
                                multiline
                                value={el.text}
                                onChange={(e) => updateText(el.id, { text: e.target.value })}
                                variant="standard"
                                placeholder="Add Text"
                                autoFocus
                                sx={{ width: "100%", overflow: "visible" }}
                                InputProps={{ disableUnderline: true }}
                                inputProps={{
                                  style: {
                                    fontWeight: el.bold ? 700 : 400,
                                    fontStyle: el.italic ? "italic" : "normal",
                                    fontSize: el.fontSize ?? 20,
                                    fontFamily: el.fontFamily ?? "Arial",
                                    color: el.color ?? "#111111",
                                    lineHeight: 1.2,
                                    textAlign: textAlignVal,
                                  },
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </Box>
                            <IconButton
                              className="no-drag"
                              onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                              sx={{ position: "absolute", top: -8, right: -8, bgcolor: "black", color: "white", width: 22, height: 22, zIndex: 2, "&:hover": { bgcolor: "#c62828" } }}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </>
                        ) : (
                          <>
                            <Box
                              sx={{
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: justify,
                                transform: textTransform,
                                transformOrigin: "center",
                                overflow: "visible",
                                pointerEvents: "none",
                              }}
                            >
                              {hasCurve ? (
                                <Box
                                  component="svg"
                                  viewBox={`0 0 ${safeW} ${safeH}`}
                                  sx={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
                                >
                                  <defs>
                                    <path id={curveId} d={curvePath} />
                                  </defs>
                                  <text
                                    fill={el.color ?? "#111111"}
                                    fontFamily={el.fontFamily ?? "Arial"}
                                    fontSize={el.fontSize ?? 20}
                                    fontWeight={el.bold ? 700 : 400}
                                    fontStyle={el.italic ? "italic" : "normal"}
                                    textAnchor={textAnchor}
                                    dominantBaseline="middle"
                                  >
                                    <textPath
                                      href={`#${curveId}`}
                                      startOffset={startOffset}
                                      style={{
                                        fontFamily: el.fontFamily ?? "Arial",
                                        fontSize: Number(el.fontSize ?? 20),
                                        fontWeight: el.bold ? 700 : 400,
                                        fontStyle: el.italic ? "italic" : "normal",
                                      }}
                                    >
                                      {el.text}
                                    </textPath>
                                  </text>
                                </Box>
                              ) : (
                                <Typography
                                  sx={{
                                    fontWeight: el.bold ? 700 : 400,
                                    fontStyle: el.italic ? "italic" : "normal",
                                    fontSize: el.fontSize ?? 20,
                                    fontFamily: el.fontFamily ?? "Arial",
                                    color: el.color ?? "#111111",
                                    textAlign: textAlignVal,
                                    width: "100%",
                                    height: "100%",
                                    alignItems: "center",
                                    display: "flex",
                                    userSelect: "none",
                                    justifyContent: justify,
                                    whiteSpace: "pre-wrap",
                                    overflowWrap: "break-word",
                                    wordBreak: "break-word",
                                    overflow: "visible",
                                  }}
                                >
                                  {el.text}
                                </Typography>
                              )}
                            </Box>
                            {!isInactive && (
                              <Box sx={{ position: "absolute", top: -15, right: -8, pointerEvents: "auto" }}>
                                <IconButton
                                  className="no-drag"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTextId(el.id);
                                    setSelectedImageId(null);
                                    setInlineEditingTextId(el.id);
                                  }}
                                >
                                  <Edit color="info" />
                                </IconButton>
                              </Box>
                            )}
                          </>
                        )}
                      </Box>
                    </Rnd>
                  );
                })}

                {/* Sticker popup (active only) */}
                {!isInactive && (
                  <Box onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                    {showStickerPopup && (
                      <PopupWrapper title="Choose Sticker" open={showStickerPopup} onClose={() => setShowStickerPopup(false)} sx={{ height: "auto", width: 320, left: { xs: "0", md: "22%" }, top: 0 }}>
                        <Box
                          sx={{
                            mt: 2, display: "flex", flexWrap: "wrap", gap: 1, overflowY: "auto",
                            "&::-webkit-scrollbar": { height: "6px", width: "5px" },
                            "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1", borderRadius: "20px" },
                            "&::-webkit-scrollbar-thumb": { backgroundColor: COLORS.primary, borderRadius: "20px" },
                            height: 460,
                          }}
                        >
                          {STICKERS_DATA.map((stick) => (
                            <Box
                              key={stick.id}
                              onClick={async () => {
                                const b64 = await fetchToDataUrl(stick.sticker);
                                addImage(b64);
                                setShowStickerPopup(false);
                              }}
                              sx={{
                                width: { md: "86px", sm: "76px", xs: "74px" }, height: "80px",
                                borderRadius: 2, bgcolor: "rgba(233, 232, 232, 1)",
                                display: "flex", justifyContent: "center", alignItems: "center",
                                userSelect: "none", cursor: "pointer", transition: ".15s",
                                "&:hover": { boxShadow: 3 },
                              }}
                            >
                              <Box component={"img"} src={stick.sticker} sx={{ width: "100%", height: "auto", transform: mirrorOn ? "scaleX(-1)" : "none" }} />
                            </Box>
                          ))}
                        </Box>
                      </PopupWrapper>
                    )}
                  </Box>
                )}

                {/* Shapes */}
                {!isInactive && (
                  <PopupWrapper
                    title="Frames"
                    open={showShapePopup}
                    onClose={() => setShowShapePopup(false)}
                    sx={{ width: 250, height: 500, overflowY: 'auto' }}
                  >
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1 }}>
                      {SHAPES.map(shape => (
                        <Box
                          key={shape.id}
                          onClick={() => {
                            if (selectedImageId) {
                              setImageElements(p =>
                                p.map(img =>
                                  img.id === selectedImageId
                                    ? { ...img, shapeId: shape.id }
                                    : img
                                )
                              );
                            }
                            setShowShapePopup(false);
                          }}
                          sx={{
                            height: 80,
                            bgcolor: "#acacacff",
                            clipPath: shape.path,
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Box>
                  </PopupWrapper>
                )}
              </Box>
            </Box>
          );
        })}

        <Box
          onClick={addSlide}
          sx={{
            flex: "0 0 auto",
            width: renderCanvas.width,
            height: renderCanvas.height,
            display: 'flex', justifyContent: 'center', alignItems: 'center', m: 'auto',
            borderRadius: 2,
            boxShadow: 8,
            position: "relative",
            transition: "box-shadow .2s ease, outline .2s ease, filter .2s ease, opacity .2s ease, background-color .2s ease",
            cursor: 'pointer',
            background: '#eceaeaff',
            "&:hover": { bgcolor: '#c7c7c7ff' }
          }}>
          <Tooltip title='Click to Add Slide'>
            <IconButton
              sx={{
                width: 80,
                height: 80,
                color: "gray",
                border: '1px solid gray'
              }}
            >
              <AddOutlined sx={{ fontSize: 80 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Thumbnails */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 3,
          width: { xs: "100%", md: "60%" },
          justifyContent: "center",
          m: "16px auto 0",
          flexDirection: "column",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 }, width: "100%", justifyContent: "center" }}>
          <IconButton onClick={slideScrollLeft} disabled={!canLeft}>
            <ArrowBackIos />
          </IconButton>

          <Box
            ref={thumbRef}
            sx={{
              display: "flex",
              overflowX: "auto",
              gap: 1,
              width: { xs: "100%", sm: "80%", md: "64%" },
              "&::-webkit-scrollbar": { display: "none" },
              cursor: "grab",
              justifyContent: "flex-start",
              scrollBehavior: "smooth",
            }}
          >
            {slides.map((s, index) => {
              const mirrored = !!mirrorBySlide[s.id as number];
              return (
                <Box
                  key={s.id ?? index}
                  sx={{
                    px: 1.5,
                    height: 40,
                    minWidth: 60,
                    bgcolor: index === selectedSlide ? "#1976d2" : "#eceff1",
                    color: index === selectedSlide ? "white" : "#263238",
                    borderRadius: 2,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    fontWeight: 600,
                    flexShrink: 0,
                    cursor: "pointer",
                    transition: ".2s",
                    position: "relative",
                    boxShadow: index === selectedSlide ? 4 : 0,
                  }}
                  onClick={() => scrollToSlide(index)}
                >
                  <Typography variant="body2">
                    {config.slideLabels?.[index] ?? `Slide ${index + 1}`} {mirrored ? "⟲" : ""}
                  </Typography>

                  <Tooltip title="Duplicate slide">
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(index);
                      }}
                      sx={{
                        position: "absolute",
                        top: 0,
                        left: -8,
                        width: 18,
                        height: 18,
                        bgcolor: "#263238",
                        color: "white",
                        borderRadius: "50%",
                        "&:hover": { bgcolor: "#455a64" },
                        zIndex: 5,
                      }}
                    >
                      <ContentCopyOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>

                  {slides.length > 1 && (
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSlide(index);
                      }}
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: -8,
                        width: 18,
                        height: 18,
                        bgcolor: "#263238",
                        color: "white",
                        borderRadius: "50%",
                        "&:hover": { bgcolor: "#c62828" },
                        zIndex: 5,
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              );
            })}
          </Box>

          <IconButton onClick={slideScrollRight} disabled={!canRight}>
            <ArrowForwardIos />
          </IconButton>
        </Box>
      </Box>
      <ImageCropModal
        open={!!cropTarget}
        imageSrc={cropTarget?.src ?? ""}
        aspect={cropTarget?.aspect ?? 1}
        onClose={() => setCropTarget(null)}
        onApply={(croppedImageSrc) => {
          if (!cropTarget?.imageId) {
            setCropTarget(null);
            return;
          }
          updateImage(cropTarget.imageId, { src: croppedImageSrc });
          setCropTarget(null);
        }}
      />
    </DashboardLayout>
  );
};

export default CategoriesEditor;

const toolBtn = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  fontSize: { xs: "10px", sm: "12px" },
  minWidth: { xs: 54, md: "auto" },
  px: { xs: 0.5, md: 0 },
  color: "#212121",
  "&:hover": { color: "#3a7bd5" },
};
