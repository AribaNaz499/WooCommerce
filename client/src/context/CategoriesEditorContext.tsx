// /src/context/CategoriesEditorContext.tsx
import React, { createContext, useContext, useMemo, useRef, useState, useCallback } from "react";
import * as htmlToImage from "html-to-image";
import { CATEGORY_CONFIG, type CategoryKey } from "../constant/data";
import { supabaseAdmin } from "../supabase/supabase";
import toast from "react-hot-toast";
import { getCanvasMultiplier } from "../lib/lib";
import { prepareTemplateRawStoresForStorage } from "../lib/templateEditorScale";

/* ---------- Types ---------- */
export type Slide = { id: number };

export type TextElement = {
  id: string;
  slideId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  zIndex?: number;
  editable?: boolean;
  // align exists in editor code via ts-expect-error; keep flexible
  align?: "left" | "center" | "right";
  rotation?: number;
  curve?: number;
};

export type ImageElement = {
  id: string;
  slideId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
  zIndex?: number;
  editable?: boolean;
  shapeId?: string;
};

export type StickerElement = {
  id: string;
  slideId: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sticker: string;
  zIndex?: number;
};

export type SnapshotTextEl = TextElement & { type: "text" };
export type SnapshotImageEl = ImageElement & { type: "image" };
export type SnapshotStickerEl = StickerElement & { type: "sticker" };
export type SnapshotAnyEl = SnapshotTextEl | SnapshotImageEl | SnapshotStickerEl;

export type SnapshotSlide = {
  id: number;
  label: string;
  elements: SnapshotAnyEl[];
};


// path: src/context/CategoriesEditorContext.ts
export type PriceText = string | number | null | undefined;

export type PublishMeta = {
  id?: string;
  mode?: "edit" | "create" | string;

  // UI fields
  cardname?: string;
  cardcategory?: string;
  subCategory?: string;
  subSubCategory?: string;

  // Legacy DB columns (already in schema)
  actualprice?: PriceText;
  a4price?: PriceText;
  a5price?: PriceText;
  usletter?: PriceText;

  saleprice?: PriceText;
  salea4price?: PriceText;
  salea5price?: PriceText;
  saleusletter?: PriceText;

  // âœ… New DB columns (you added)
  a3price?: PriceText;
  halfusletter?: PriceText;
  ustabloid?: PriceText;

  salea3price?: PriceText;
  salehalfusletter?: PriceText;
  saleustabloid?: PriceText;

  // Optional map storage (kept inside raw_stores)
  pricing?: Record<string, PriceText>;
  salePricing?: Record<string, PriceText>;

  description?: string;
  sku?: string;
  imgUrl?: string;
};


type CategoriesEditorContextType = {
  // editor "template type"
  category: string;
  setCategory: (c: string) => void;
  config: (typeof CATEGORY_CONFIG)[CategoryKey];

  selectedSlide: number;
  setSelectedSlide: React.Dispatch<React.SetStateAction<number>>;
  selectedTextId: string | null;
  setSelectedTextId: React.Dispatch<React.SetStateAction<string | null>>;
  selectedImageId: string | null;
  setSelectedImageId: React.Dispatch<React.SetStateAction<string | null>>;
  textToolOn: boolean;
  setTextToolOn: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;

  slides: Slide[];
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;

  textElements: TextElement[];
  setTextElements: React.Dispatch<React.SetStateAction<TextElement[]>>;
  imageElements: ImageElement[];
  setImageElements: React.Dispatch<React.SetStateAction<ImageElement[]>>;
  stickerElements: StickerElement[];
  setStickerElements: React.Dispatch<React.SetStateAction<StickerElement[]>>;

  slideBg?: any;
  setSlideBg?: any;

  getTexts: (slideId: number) => TextElement[];
  getImages: (slideId: number) => ImageElement[];
  getStickers: (slideId: number) => StickerElement[];

  getSlidesWithElements: () => SnapshotSlide[];

  serialize: () => {
    category: string;
    config: (typeof CATEGORY_CONFIG)[CategoryKey];
    slides: Slide[];
    textElements: TextElement[];
    imageElements: ImageElement[];
    stickerElements: StickerElement[];
    slideBg: any;
  };

  serializeWithElements: () => {
    editorCategory: string;
    size_mm: { w: number; h: number };
    slides: SnapshotSlide[];
  };

  saveDesign: (meta?: PublishMeta) => Promise<boolean>;
  captureFirstSlidePng: () => Promise<string | null>;

  mainScrollerRef: React.MutableRefObject<HTMLDivElement | null>;
  registerFirstSlideNode: (node: HTMLDivElement | null) => void;

  resetState: () => void;
};

const CategoriesEditorContext = createContext<CategoriesEditorContextType | undefined>(undefined);

/* ---------- Helpers ---------- */
const DEFAULT_CATEGORY: CategoryKey = "Invites";
const mmToPx = (mm: number, dpi = 96) => (mm / 25.4) * dpi;

const resolveEditorCategory = (value: unknown, fallback: CategoryKey = DEFAULT_CATEGORY): string => {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;

  const keys = Object.keys(CATEGORY_CONFIG) as CategoryKey[];
  const exact = keys.find((k) => k.trim().toLowerCase() === raw);
  if (exact) return exact;

  if (raw.includes("candle")) return "Candles";
  if (raw.includes("clothing") || raw.includes("clothes") || raw.includes("cloth")) return "Apparel";

  return String(value ?? "").trim() || fallback;
};

export const CategoriesEditorProvider = ({ children }: { children: React.ReactNode }) => {
  const initialConfig = CATEGORY_CONFIG[DEFAULT_CATEGORY];
  const initialSlides: Slide[] = initialConfig.slideLabels?.length
    ? initialConfig.slideLabels.map((_, i) => ({ id: i + 1 }))
    : [{ id: 1 }];

  const [category, setCategory] = useState<string>(DEFAULT_CATEGORY);
  const [config, setConfig] = useState<(typeof CATEGORY_CONFIG)[CategoryKey]>(initialConfig);
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [textToolOn, setTextToolOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [imageElements, setImageElements] = useState<ImageElement[]>([]);
  const [stickerElements, setStickerElements] = useState<StickerElement[]>([]);
  const [slideBg, setSlideBg] = useState<Record<number, { color?: string; image?: string; editable?: boolean }>>({});

  const mainScrollerRef = useRef<HTMLDivElement | null>(null);
  const firstSlideRef = useRef<HTMLDivElement | null>(null);

  const registerFirstSlideNode = useCallback((node: HTMLDivElement | null) => {
    firstSlideRef.current = node;
  }, []);

  const getConfigForCategory = useCallback((name: string) => {
    const key = resolveEditorCategory(name, DEFAULT_CATEGORY);
    const known = CATEGORY_CONFIG[key as CategoryKey];
    if (known) return known;
    return {
      ...CATEGORY_CONFIG[DEFAULT_CATEGORY],
      key,
      label: key,
    } as (typeof CATEGORY_CONFIG)[CategoryKey];
  }, []);

  const applyCategory = useCallback((c: string) => {
    const resolved = resolveEditorCategory(c, DEFAULT_CATEGORY);
    setCategory(resolved);
    const cfg = getConfigForCategory(resolved);
    setConfig(cfg);

    const newSlides = cfg.slideLabels?.length ? cfg.slideLabels.map((_, i) => ({ id: i + 1 })) : [{ id: 1 }];
    setSlides(newSlides);

    setSelectedSlide(0);
    setSelectedTextId(null);
    setSelectedImageId(null);
    setTextElements([]);
    setImageElements([]);
    setStickerElements([]);
    setSlideBg({});
  }, [getConfigForCategory]);

  const getTexts = (slideId: number) => textElements.filter((t) => t.slideId === slideId);
  const getImages = (slideId: number) => imageElements.filter((i) => i.slideId === slideId);
  const getStickers = (slideId: number) => stickerElements.filter((s) => s.slideId === slideId);

  const buildSlidesWithElements = useCallback((): SnapshotSlide[] => {
    return slides.map((s, idx) => {
      const label = config.slideLabels?.[idx] ?? `Slide ${idx + 1}`;
      const texts: SnapshotTextEl[] = getTexts(s.id).map((e) => ({
        ...e,
        type: "text",
        bold: !!e.bold,
        italic: !!e.italic,
        fontSize: e.fontSize ?? 20,
        fontFamily: e.fontFamily ?? "Arial",
        color: e.color ?? "#111111",
      }));
      const images: SnapshotImageEl[] = getImages(s.id).map((e) => ({ ...e, type: "image" }));
      const stickers: SnapshotStickerEl[] = getStickers(s.id).map((e) => ({ ...e, type: "sticker" }));
      return { id: s.id, label, elements: [...texts, ...images, ...stickers] };
    });
  }, [slides, config.slideLabels, textElements, imageElements, stickerElements]);

  const getSlidesWithElements = useCallback(() => buildSlidesWithElements(), [buildSlidesWithElements]);

  const resetState = () => {
    const cfg = getConfigForCategory(category);
    const newSlides = cfg.slideLabels?.length ? cfg.slideLabels.map((_, i) => ({ id: i + 1 })) : [{ id: 1 }];
    setSlides(newSlides);
    setSelectedSlide(0);
    setSelectedTextId(null);
    setSelectedImageId(null);
    setTextElements([]);
    setImageElements([]);
    setStickerElements([]);
    setSlideBg({});
  };

  const serialize = () => ({
    category,
    config,
    slides,
    textElements,
    imageElements,
    stickerElements,
    slideBg,
  });

  // IMPORTANT: do not call it "category" here to avoid confusion with DB category
  const serializeWithElements = () => ({
    editorCategory: category,
    size_mm: { w: config.mmWidth, h: config.mmHeight },
    slides: buildSlidesWithElements(),
  });

  const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result || ""));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });

  const urlToDataUrl = async (src: string): Promise<string> => {
    if (!src || src.startsWith("data:")) return src;
    try {
      const absolute = src.startsWith("/") ? `${window.location.origin}${src}` : src;
      const resp = await fetch(absolute, { mode: "cors" });
      const blob = await resp.blob();
      return await readBlobAsDataUrl(blob);
    } catch {
      // Keep original remote/static URLs if conversion fails.
      // Returning a transparent pixel here can silently drop design assets.
      if (src.startsWith("http") || src.startsWith("/")) return src;
      // blob URLs are usually session-bound; do not persist them as-is.
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";
    }
  };

  const captureFirstSlidePng = useCallback(async (): Promise<string | null> => {
    const node = firstSlideRef.current;
    if (!node) return null;

    const transparentPx =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

    const clone = node.cloneNode(true) as HTMLElement;

    const w = node.offsetWidth || node.getBoundingClientRect().width || 1;
    const h = node.offsetHeight || node.getBoundingClientRect().height || 1;
    clone.style.width = `${w}px`;
    clone.style.height = `${h}px`;

    const sandbox = document.createElement("div");
    sandbox.style.position = "fixed";
    sandbox.style.left = "-10000px";
    sandbox.style.top = "-10000px";
    sandbox.style.zIndex = "-1";
    sandbox.style.pointerEvents = "none";
    sandbox.appendChild(clone);
    document.body.appendChild(sandbox);

    const convertImgsToDataUrl = async (root: HTMLElement) => {
      const imgs = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
      await Promise.all(
        imgs.map(async (img) => {
          const src = img.getAttribute("src") || "";
          if (!src.startsWith("data:")) {
            try {
              const resp = await fetch(src);
              const blob = await resp.blob();
              const dataUrl = await readBlobAsDataUrl(blob);
              img.setAttribute("src", dataUrl);
            } catch {
              img.setAttribute("src", transparentPx);
            }
          }
          img.setAttribute("crossorigin", "anonymous");
        })
      );
    };

    try {
      await convertImgsToDataUrl(clone);
      await (document as any).fonts?.ready?.catch(() => { });

      const dataUrl = await htmlToImage.toPng(clone, {
        cacheBust: false,
        pixelRatio: 2,
        backgroundColor: "transparent",
        skipFonts: false,
        imagePlaceholder: transparentPx,
        width: Math.round(w),
        height: Math.round(h),
        style: { transform: "none" },
      });

      return dataUrl;
    } catch (e) {
      console.error("captureFirstSlidePng failed:", e);
      return null;
    } finally {
      sandbox.remove();
    }
  }, []);

  const saveDesign = async (meta?: PublishMeta): Promise<boolean> => {
    setLoading(true);
    let saved = false;
    try {
      const combined = serializeWithElements(); // { editorCategory, size_mm, slides }
      const rawStores = serialize(); // editor raw stores
      const multiplier = getCanvasMultiplier(rawStores.category);
      const storedRawStores = prepareTemplateRawStoresForStorage(rawStores, multiplier);
      const storedSlidesPayload = prepareTemplateRawStoresForStorage(
        { slides: combined.slides },
        multiplier,
      ) as { slides?: SnapshotSlide[] } | null;
      const storedSlides = Array.isArray(storedSlidesPayload?.slides)
        ? storedSlidesPayload.slides
        : combined.slides;

      const normImageElements = await Promise.all(
        (storedRawStores?.imageElements ?? rawStores.imageElements).map(async (el: any) => ({
          ...el,
          src: await urlToDataUrl(el.src),
        }))
      );
      const normStickerElements = await Promise.all(
        (storedRawStores?.stickerElements ?? rawStores.stickerElements).map(async (el: any) => ({
          ...el,
          sticker: await urlToDataUrl(el.sticker),
        }))
      );

      const idToImgBase64 = new Map(normImageElements.map((e) => [e.id, e.src]));
      const idToStickerBase64 = new Map(normStickerElements.map((e) => [e.id, e.sticker]));

      const normSlides = await Promise.all(
        storedSlides.map(async (s) => {
          const elements = await Promise.all(
            s.elements.map(async (el: any) => {
              if (el.type === "image") {
                const src = idToImgBase64.get(el.id) || (await urlToDataUrl(el.src));
                return { ...el, src };
              }
              if (el.type === "sticker") {
                const sticker = idToStickerBase64.get(el.id) || (await urlToDataUrl(el.sticker));
                return { ...el, sticker };
              }
              return el;
            })
          );
          return { ...s, elements };
        })
      );

      const imgUrl = meta?.imgUrl ?? null;

      // Store product cardCategory into DB column "category"
      const dbCategory = meta?.cardcategory?.trim() || null;

      // REAL product size (never change)
      const productMm = {
        w: rawStores.config.mmWidth,
        h: rawStores.config.mmHeight,
      };

      // EDITOR / RENDER size (multiplied)
      const canvasMm = {
        w: productMm.w * multiplier,
        h: productMm.h * multiplier,
      };

      const canvasPx = {
        w: Math.round(mmToPx(canvasMm.w, 96)),
        h: Math.round(mmToPx(canvasMm.h, 96)),
        dpi: 96,
      };

      const fitCanvas = {
        width: Math.round(rawStores.config.mmWidth * multiplier),
        height: Math.round(rawStores.config.mmHeight * multiplier),
      };

      const configWithMultiplier = {
        ...rawStores.config,
        multiplier, // ðŸ‘ˆ future reference ke liye
        fitCanvas, // keeps editor-space sizing for previews/thumbnails
      };



      const payload: any = {
        // DB COLUMN: category (must be the form cardcategory)
        category: dbCategory,

        // keep config & slides
        config: configWithMultiplier,
        slides: normSlides,

        img_url: imgUrl ?? null,

        // json storage (safe place for everything)
        raw_stores: {
          ...storedRawStores,
          config: configWithMultiplier,
          // keep image/sticker sources persisted safely while coords stay in product space
          imageElements: normImageElements,
          stickerElements: normStickerElements,
          slideBg: storedRawStores.slideBg ?? rawStores.slideBg,
          // preserve pricing maps in JSON (safe even without DB columns)
          pricing: meta?.pricing ?? (storedRawStores as any)?.pricing ?? null,
          salePricing: meta?.salePricing ?? (storedRawStores as any)?.salePricing ?? null,

          // do not lose editor template type
          editorCategory: rawStores.category, // editor category label

          // display canvas can stay scaled while saved coords remain print-accurate
          canvas: {
            productMm, // real size (printing)
            mm: canvasMm, // display/editor size
            px: canvasPx, // display size
            multiplier,
          },
        },

        title: meta?.cardname ?? rawStores?.config?.label ?? null,

        // extra columns
        subCategory: meta?.subCategory ?? null,
        subSubCategory: meta?.subSubCategory ?? null,

        actualprice: meta?.actualprice != null ? String(meta.actualprice) : null,
        a4price: meta?.a4price != null ? String(meta.a4price) : null,
        a5price: meta?.a5price != null ? String(meta.a5price) : null,
        usletter: meta?.usletter != null ? String(meta.usletter) : null,

        saleprice: meta?.saleprice != null ? String(meta.saleprice) : null,
        salea4price: meta?.salea4price != null ? String(meta.salea4price) : null,
        salea5price: meta?.salea5price != null ? String(meta.salea5price) : null,
        saleusletter: meta?.saleusletter != null ? String(meta.saleusletter) : null,
        a3price: meta?.a3price != null ? String(meta.a3price) : null,
        halfusletter: meta?.halfusletter != null ? String(meta.halfusletter) : null,
        ustabloid: meta?.ustabloid != null ? String(meta.ustabloid) : null,

        salea3price: meta?.salea3price != null ? String(meta.salea3price) : null,
        salehalfusletter: meta?.salehalfusletter != null ? String(meta.salehalfusletter) : null,
        saleustabloid: meta?.saleustabloid != null ? String(meta.saleustabloid) : null,

        description: meta?.description ?? null,
        sku: meta?.sku ?? null,
      };

      if (!payload.category) {
        toast.error("Card Category is required (DB column: category).");
        return false;
      }

      const isEdit = !!meta?.id;

      const db = supabaseAdmin;
      const { error } = isEdit
        ? await db.from("templetDesign").update(payload).eq("id", meta!.id)
        : await db.from("templetDesign").insert([payload]);

      if (error) {
        console.error("DB save failed:", {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
        });
        if ((error as any).code === "42501") {
          toast.error("Save blocked by RLS. Please sign in with an admin account.");
        } else {
          toast.error(error.message || "Save failed");
        }
      } else {
        toast.success(isEdit ? "âœ… Updated template Design" : "âœ… Saved template Design");
        resetState();
        saved = true;
      }
    } catch (e) {
      console.error("Save error:", e);
      toast.error("Save error");
    } finally {
      setLoading(false);
      // resetState();
    }
    return saved;
  };

  const value = useMemo<CategoriesEditorContextType>(
    () => ({
      category,
      setCategory: applyCategory,
      config,

      selectedSlide,
      setSelectedSlide,
      selectedTextId,
      setSelectedTextId,
      selectedImageId,
      setSelectedImageId,
      textToolOn,
      setTextToolOn,
      loading,
      setLoading,

      slides,
      setSlides,

      textElements,
      setTextElements,
      imageElements,
      setImageElements,
      stickerElements,
      setStickerElements,

      slideBg,
      setSlideBg,

      getTexts,
      getImages,
      getStickers,

      getSlidesWithElements,

      serialize,
      serializeWithElements,
      saveDesign,
      captureFirstSlidePng,

      mainScrollerRef,
      registerFirstSlideNode,

      resetState,
    }),
    [
      category,
      config,
      selectedSlide,
      selectedTextId,
      selectedImageId,
      textToolOn,
      loading,
      slides,
      textElements,
      imageElements,
      stickerElements,
      slideBg,
      applyCategory,
      getSlidesWithElements,
      registerFirstSlideNode,
    ]
  );

  return <CategoriesEditorContext.Provider value={value}>{children}</CategoriesEditorContext.Provider>;
};

export const useCategoriesEditorState = () => {
  const ctx = useContext(CategoriesEditorContext);
  if (!ctx) throw new Error("useCategoriesEditorState must be used within CategoriesEditorProvider");
  return ctx;
};

