// path: src/pages/admin/.../TempletForm.tsx
import { useMemo, useState, useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";
import { Controller, useForm, type FieldErrors } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllCategoriesFromDB,
  fetchTempletDesignFullById,
} from "../../../../../source/source";
import CustomInput from "../../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../../components/LandingButton/LandingButton";
import {
  useCategoriesEditorState,
  type PublishMeta,
} from "../../../../../context/CategoriesEditorContext";
import TempletKonvaPreview from "../../../../../components/KonvaPreview/TempletKonvaPreview";
import { ADMINS_DASHBOARD } from "../../../../../constant/route";
import { buildGoogleFontsUrls, loadGoogleFontsOnce } from "../../../../../constant/googleFonts";
import {
  getTemplateDisplayFactor,
  scaleTemplateElementBy,
} from "../../../../../lib/templateEditorScale";

type SizeKey =
  | "A5"
  | "A4"
  | "A3"
  | "US_LETTER"
  | "HALF_US_LETTER"
  | "US_TABLOID"
  | "MUG_WRAP_11OZ"
  | "COASTER_95";

type PricingMap = Partial<Record<SizeKey, string>>;

type FormValue = {
  cardname: string;
  cardcategory: string;
  subCategory?: string;
  subSubCategory?: string;
  sku: string;

  // legacy (kept for compatibility)
  actualprice?: string;
  a4price?: string;
  a5price?: string;
  usletter?: string;
  saleprice?: string;
  salea4price?: string;
  salea5price?: string;
  saleusletter?: string;

  // UI-only maps
  pricing: PricingMap;
  salePricing: PricingMap;

  description: string;
  cardImage?: FileList;
  polygon_shape: string;
};

type PricingFieldPath = `pricing.${SizeKey}`;
type SalePricingFieldPath = `salePricing.${SizeKey}`;

type CategoryRow = {
  id: string;
  name: string;
  subcategories: string[];
  sub_subcategories: Record<string, string[]>;
};

type SizeDef = { key: SizeKey; label: string; helper?: string };
type CategoryPricingConfig = {
  title?: string;
  note?: string;
  sizes: SizeDef[];
};

type EditProductLike = Partial<FormValue> & {
  a3price?: string;
  halfusletter?: string;
  ustabloid?: string;
  salea3price?: string;
  salehalfusletter?: string;
  saleustabloid?: string;
};

type Option = { label: string; value: string };

const normalizeNumberInput = (v: unknown) =>
  typeof v === "string" ? v.replace(/,/g, "").trim() : String(v ?? "").trim();

const isBlank = (v: unknown) => v == null || String(v).trim() === "";

const toTextNumberOrEmpty = (v?: string) => {
  const raw = normalizeNumberInput(v);
  if (!raw) return "";
  const n = Number(raw);
  return Number.isFinite(n) ? String(n) : "";
};

const normalizePricingKey = (key: string): SizeKey | null => {
  const raw = String(key ?? "").trim();
  if (!raw) return null;
  const u = raw.toUpperCase().replace(/[\s-]+/g, "_");
  switch (u) {
    case "A5":
    case "A4":
    case "A3":
      return u as SizeKey;
    case "US_LETTER":
    case "USLETTER":
      return "US_LETTER";
    case "HALF_US_LETTER":
    case "HALFUSLETTER":
      return "HALF_US_LETTER";
    case "US_TABLOID":
    case "USTABLOID":
    case "US_TABLOID_11_X_17_IN":
      return "US_TABLOID";
    case "MUG_WRAP_11OZ":
    case "MUG_WRAP_11_OZ":
      return "MUG_WRAP_11OZ";
    case "COASTER_95":
      return "COASTER_95";
    default:
      return null;
  }
};

const readPricingMap = (source: unknown): PricingMap => {
  if (!source || typeof source !== "object") return {};
  const out: PricingMap = {};
  for (const [k, v] of Object.entries(source as Record<string, unknown>)) {
    const nk = normalizePricingKey(k);
    if (!nk) continue;
    out[nk] = v != null ? String(v) : "";
  }
  return out;
};

const normalizeFontFamily = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const quoted = raw.match(/['"]([^'"]+)['"]/);
  if (quoted?.[1]) return quoted[1].trim();
  const first = raw.split(",")[0]?.trim() ?? "";
  if (!first) return "";
  return first.replace(/^['"]|['"]$/g, "").trim();
};

const GENERIC_FONTS = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
]);

const addFontFamilyToSet = (bucket: Set<string>, value: unknown) => {
  if (typeof value !== "string") return;
  const fam = normalizeFontFamily(value);
  if (!fam) return;
  if (GENERIC_FONTS.has(fam.toLowerCase())) return;
  bucket.add(fam);
};

const resolveTextFontFamily = (entry: any): string =>
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

const resolveTextFontWeight = (entry: any): string | number => {
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
    const asNum = Number(trimmed);
    if (Number.isFinite(asNum) && asNum > 0) return asNum;
    return trimmed;
  }
  return entry?.bold ? 700 : 400;
};

const resolveTextFontStyle = (entry: any): string => {
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
      "#111111",
    ),
  );

const resolveTextAlign = (entry: any): "left" | "center" | "right" => {
  const raw = String(
    firstDefinedValue(entry?.align, entry?.textAlign, entry?.style?.textAlign, "center"),
  ).toLowerCase();
  if (raw === "left") return "left";
  if (raw === "right") return "right";
  return "center";
};

const resolveTextRotation = (entry: any): number => {
  const raw = firstDefinedValue(
    entry?.rotation,
    entry?.rotate,
    entry?.style?.rotation,
    entry?.style?.rotate,
  );
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

const resolveTextCurve = (entry: any): number => {
  const raw = firstDefinedValue(
    entry?.curve,
    entry?.arc,
    entry?.style?.curve,
    entry?.style?.arc,
  );
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
};

const collectFontsFromRawStores = (rawStores: any): string[] => {
  const fonts = new Set<string>();
  const add = (value: unknown) => addFontFamilyToSet(fonts, value);
  const pick = (entry: any) => add(resolveTextFontFamily(entry));

  const separatedText = Array.isArray(rawStores?.textElements) ? rawStores.textElements : [];
  separatedText.forEach(pick);

  const snapshotSlides =
    Array.isArray(rawStores?.snapshotSlides)
      ? rawStores.snapshotSlides
      : typeof rawStores?.snapshotSlides === "string"
        ? (() => {
          try {
            const parsed = JSON.parse(rawStores.snapshotSlides);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
        : [];

  const slidesSource =
    snapshotSlides.length > 0
      ? snapshotSlides
      : Array.isArray(rawStores?.slides)
        ? rawStores.slides
        : [];

  slidesSource.forEach((slide: any) => {
    const elements = Array.isArray(slide?.elements) ? slide.elements : [];
    elements.forEach((el: any) => {
      const t = String(el?.type ?? "").toLowerCase();
      if (t === "text" || (!t && el?.text != null)) pick(el);
    });
  });

  // Fallback: walk unknown/nested template shapes and pick any font* key.
  const seen = new Set<any>();
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    pick(node);
    Object.entries(node).forEach(([key, val]) => {
      if (/fontfamily/i.test(key) || key === "font_family") add(val);
      walk(val);
    });
  };
  walk(rawStores);

  return Array.from(fonts);
};

const capturePreviewThumbnail = async (
  konvaRef: any,
): Promise<string | null> => {
  if (!konvaRef?.current?.toDataURL) {
    console.warn("Konva ref not available");
    return null;
  }
  try {
    const dataUrl = await konvaRef.current.toDataURL();
    return dataUrl;
  } catch (error) {
    console.error("Failed to capture preview:", error);
    return null;
  }
};

const SIZES: Record<SizeKey, SizeDef> = {
  A5: { key: "A5", label: "A5" },
  A4: { key: "A4", label: "A4" },
  A3: { key: "A3", label: "A3" },
  US_LETTER: { key: "US_LETTER", label: "US Letter" },
  HALF_US_LETTER: { key: "HALF_US_LETTER", label: "Half US Letter" },
  US_TABLOID: { key: "US_TABLOID", label: "US Tabloid" },
  MUG_WRAP_11OZ: { key: "MUG_WRAP_11OZ", label: " (11oz mug)" },
  COASTER_95: { key: "COASTER_95", label: "(×2 coasters)" },
};

const getPricingConfig = (categoryName?: string): CategoryPricingConfig => {
  const name = (categoryName ?? "").trim().toLowerCase();

  if (name.includes("invite")) {
    return {
      title: "Prices by Size",
      note: "Invite sizing options are unique.",
      sizes: [
        { ...SIZES.A5, helper: "2 per A4 sheet" },
        { ...SIZES.A4, helper: "1 per A4 sheet" },
        { ...SIZES.HALF_US_LETTER, helper: "2 per US Letter sheet" },
        { ...SIZES.US_LETTER, helper: "1 per US Letter sheet" },
      ],
    };
  }

  if (name.includes("business leaflet"))
    return {
      title: "Prices by Size",
      sizes: [
        { ...SIZES.A5, helper: "2 per A4 sheet" },
        { ...SIZES.A4, helper: "1 per A4 sheet" },
        { ...SIZES.HALF_US_LETTER, helper: "2 per US Letter sheet" },
        { ...SIZES.US_LETTER, helper: "1 per US Letter sheet" },
      ],
    };

  if (name.includes("business card"))
    return {
      title: "Prices by Size",
      sizes: [
        { ...SIZES.A4, helper: "1 per A4 sheet" },
        { ...SIZES.US_LETTER, helper: "1 per US Letter sheet" },
      ],
    };

  if (name.includes("candle"))
    return {
      title: "Prices by Size",
      sizes: [
        { ...SIZES.A4, helper: "6 labels per A4 sheet (70mm × 70mm)" },
        { ...SIZES.US_LETTER, helper: "6 labels per sheet (70mm × 70mm)" },
      ],
    };

  if (name.includes("clothing"))
    return {
      title: "Prices by Size",
      sizes: [SIZES.A4, SIZES.A3, SIZES.US_LETTER, SIZES.US_TABLOID],
    };
  if (name.includes("mug"))
    return { title: "Prices by Size", sizes: [SIZES.MUG_WRAP_11OZ] };
  if (name.includes("coaster"))
    return { title: "Prices by Size", sizes: [SIZES.COASTER_95] };
  if (name.includes("sticker"))
    return {
      title: "Prices by Size",
      sizes: [SIZES.A4, SIZES.A3, SIZES.US_LETTER, SIZES.US_TABLOID],
    };
  if (name.includes("notebook"))
    return {
      title: "Prices by Size",
      sizes: [SIZES.A5, SIZES.A4, SIZES.HALF_US_LETTER, SIZES.US_LETTER],
    };
  if (name.includes("wall art"))
    return {
      title: "Prices by Size",
      sizes: [SIZES.A4, SIZES.A3, SIZES.US_LETTER, SIZES.US_TABLOID],
    };
  if (name.includes("photo art"))
    return {
      title: "Prices by Size",
      sizes: [SIZES.A4, SIZES.A3, SIZES.US_LETTER, SIZES.US_TABLOID],
    };
  if (name.includes("bag"))
    return {
      title: "Prices by Size",
      sizes: [SIZES.A4, SIZES.A3, SIZES.US_LETTER, SIZES.US_TABLOID],
    };

  // Default: Cards
  return {
    title: "Prices by Size",
    sizes: [
      SIZES.A5,
      SIZES.A4,
      SIZES.HALF_US_LETTER,
      SIZES.US_LETTER,
      { ...SIZES.US_TABLOID, helper: "Folded half: 11 × 8.5 in" },
    ],
  };
};

const getNestedError = (
  errors: FieldErrors<FormValue>,
  path: string,
): string | undefined => {
  const parts = path.split(".");
  let cur: any = errors;
  for (const p of parts) {
    if (!cur) return undefined;
    cur = cur[p];
  }
  return cur?.message as string | undefined;
};

const TempletForm = () => {
  const { saveDesign, loading, setLoading, resetState } =
    useCategoriesEditorState();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state as any;


  const mode: string | undefined = navState?.mode;
  const templateId: string | undefined = navState?.id ?? undefined;
  const prevImg: string | undefined = navState?.imgUrl ?? undefined;
  const isEditMode = mode === "edit" || !!templateId;
  const hasIncomingRawStores = !!navState?.rawStores;

  const [rawStoresState, setRawStoresState] = useState<any>(null);
  const [editProduct, setEditProduct] = useState<EditProductLike | undefined>(
    (location.state as any)?.product,
  );
  const [previewImage, setPreviewImage] = useState<string | undefined>(prevImg);

  useEffect(() => {
    const rs = navState?.rawStores;
    if (!rs) return;

    const normalized =
      typeof rs === "string"
        ? (() => {
          try {
            return JSON.parse(rs);
          } catch {
            return null;
          }
        })()
        : rs;

    setRawStoresState(normalized);
    didPrefillRef.current = false;
  }, [navState?.rawStores]);


  useEffect(() => {
    // If we returned from editor with fresh state, do not override with stale DB row.
    if (!isEditMode || !templateId || hasIncomingRawStores) return;
    let mounted = true;

    const load = async () => {
      try {
        const row: any = await fetchTempletDesignFullById(templateId);
        if (!mounted || !row) return;

        const normalizedProduct: EditProductLike = {
          cardname: row.title ?? row.name ?? row.cardname ?? "",
          cardcategory: row.category ?? row.cardcategory ?? "",
          subCategory: row.subCategory ?? row.subcategory ?? "",
          subSubCategory: row.subSubCategory ?? row.sub_subcategory ?? "",
          sku: row.sku ?? "",
          description: row.description ?? "",

          actualprice: row.actualprice ?? row.actual_price ?? "",
          a4price: row.a4price ?? "",
          a5price: row.a5price ?? "",
          usletter: row.usletter ?? "",
          saleprice: row.saleprice ?? row.sale_price ?? "",
          salea4price: row.salea4price ?? "",
          salea5price: row.salea5price ?? "",
          saleusletter: row.saleusletter ?? "",

          a3price: row.a3price ?? "",
          halfusletter: row.halfusletter ?? "",
          ustabloid: row.ustabloid ?? "",
          salea3price: row.salea3price ?? "",
          salehalfusletter: row.salehalfusletter ?? "",
          saleustabloid: row.saleustabloid ?? "",

          pricing: row.pricing ?? undefined,
          salePricing: row.salePricing ?? undefined,
        };

        setEditProduct(normalizedProduct);

        const rs = row.raw_stores ?? row.rawStores ?? row.rawstores ?? null;
        if (rs) {
          const normalized =
            typeof rs === "string"
              ? (() => {
                try {
                  return JSON.parse(rs);
                } catch {
                  return null;
                }
              })()
              : rs;

          const snapshotSlides =
            typeof row?.slides === "string"
              ? (() => {
                try {
                  return JSON.parse(row.slides);
                } catch {
                  return null;
                }
              })()
              : row?.slides ?? null;

          setRawStoresState(
            normalized && snapshotSlides
              ? { ...normalized, snapshotSlides }
              : normalized
          );
        }

        const img =
          row.img_url ??
          row.image_url ??
          row.imageurl ??
          row.lastpageImageUrl ??
          row.lastpageimageurl ??
          undefined;
        if (img) setPreviewImage(img);

        didPrefillRef.current = false;
      } catch (e) {
        console.error("Failed to fetch template full details:", e);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [isEditMode, templateId, hasIncomingRawStores]);

  useEffect(() => {
    if (!rawStoresState) return;
    const fonts = collectFontsFromRawStores(rawStoresState);
    if (!fonts.length) return;
    loadGoogleFontsOnce(buildGoogleFontsUrls(fonts));
  }, [rawStoresState]);

  const rawStores = rawStoresState;

  const konvaPreviewRef = useRef<any>(null);
  const [previewUrl] = useState<string | undefined>(undefined);

  const didPrefillRef = useRef(false);

  useEffect(() => {
    const incomingProduct = (location.state as any)?.product;

    if (incomingProduct) {
      // Only update if it's truly different
      setEditProduct((prev) => {
        if (prev === incomingProduct) return prev;
        didPrefillRef.current = false; // allow prefill to run
        return incomingProduct;
      });
    }
  }, [location.state?.product]);



  const {
    data: categories = [],
    isLoading: isLoadingCats,
    isError: isErrorCats,
  } = useQuery<CategoryRow[]>({
    queryKey: ["categories"],
    queryFn: fetchAllCategoriesFromDB,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    control,
    setValue,
    getValues,
  } = useForm<FormValue>({
    defaultValues: {
      cardname: "",
      cardcategory: "",
      subCategory: "",
      subSubCategory: "",
      sku: "",

      actualprice: "",
      a4price: "",
      a5price: "",
      usletter: "",
      saleprice: "",
      salea4price: "",
      salea5price: "",
      saleusletter: "",

      pricing: {},
      salePricing: {},

      description: "",
      polygon_shape: "",
    },
  });

  const product = editProduct;

  const selectedCategoryName = watch("cardcategory");
  const selectedSubCategory = watch("subCategory");

  const categoryOptions: Option[] = useMemo(() => {
    const normalized = categories
      .map((c) => (c?.name ?? "").trim())
      .filter(Boolean)
      .filter((name) => name.trim().toLowerCase() !== "cards");
    const unique = Array.from(new Set(normalized));
    unique.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    return unique.map((name) => ({ label: name, value: name }));
  }, [categories]);

  const categoryOptionsWithEmpty: Option[] = useMemo(
    () => [{ label: "Select category", value: "" }, ...categoryOptions],
    [categoryOptions],
  );

  const pricingConfig = useMemo(
    () => getPricingConfig(selectedCategoryName),
    [selectedCategoryName],
  );
  const sizes = pricingConfig.sizes;

  // ✅ Prefill ONLY ONCE (prevents category snapping back)
  useEffect(() => {
    const baseProduct = product ?? ({} as EditProductLike);
    const resolvedCategory = String(
      baseProduct.cardcategory ?? (rawStoresState as any)?.category ?? "",
    ).trim();
    const hasAnyPrefillSource = !!product || !!rawStoresState;
    if (!hasAnyPrefillSource) return;
    if (didPrefillRef.current) return;
    didPrefillRef.current = true;

    const productConfig = getPricingConfig(resolvedCategory);
    const productSizes = productConfig.sizes;
    const hasA5 = productSizes.some((s) => s.key === "A5");
    const hasA3 = productSizes.some((s) => s.key === "A3");
    const firstKey = productSizes[0]?.key;

    const incomingPricing: PricingMap = {};
    const incomingSalePricing: PricingMap = {};

    Object.assign(incomingPricing, readPricingMap((baseProduct as any).pricing));
    Object.assign(incomingSalePricing, readPricingMap((baseProduct as any).salePricing));

    // raw_stores fallback (if present)
    const rawPricing = readPricingMap((rawStoresState as any)?.pricing);
    for (const [k, v] of Object.entries(rawPricing) as [SizeKey, string][]) {
      if (isBlank(incomingPricing[k]) && !isBlank(v)) incomingPricing[k] = v;
    }

    const rawSalePricing = readPricingMap((rawStoresState as any)?.salePricing);
    for (const [k, v] of Object.entries(rawSalePricing) as [SizeKey, string][]) {
      if (isBlank(incomingSalePricing[k]) && !isBlank(v)) incomingSalePricing[k] = v;
    }

    if (firstKey && !incomingPricing[firstKey] && baseProduct.actualprice != null) {
      incomingPricing[firstKey] = String(baseProduct.actualprice);
    }
    if (
      firstKey &&
      !incomingSalePricing[firstKey] &&
      baseProduct.saleprice != null
    ) {
      incomingSalePricing[firstKey] = String(baseProduct.saleprice);
    }

    // DB fallback
    if (isBlank(incomingPricing.A4) && baseProduct.a4price != null)
      incomingPricing.A4 = String(baseProduct.a4price);
    if (isBlank(incomingPricing.US_LETTER) && baseProduct.usletter != null)
      incomingPricing.US_LETTER = String(baseProduct.usletter);
    if (isBlank(incomingPricing.A3) && baseProduct.a3price != null)
      incomingPricing.A3 = String(baseProduct.a3price);
    if (isBlank(incomingPricing.HALF_US_LETTER) && baseProduct.halfusletter != null)
      incomingPricing.HALF_US_LETTER = String(baseProduct.halfusletter);
    if (isBlank(incomingPricing.US_TABLOID) && baseProduct.ustabloid != null)
      incomingPricing.US_TABLOID = String(baseProduct.ustabloid);

    // legacy a5price ambiguity
    if (isBlank(incomingPricing.A5) && hasA5 && baseProduct.a5price != null)
      incomingPricing.A5 = String(baseProduct.a5price);
    if (
      isBlank(incomingPricing.A3) &&
      hasA3 &&
      baseProduct.a3price == null &&
      baseProduct.a5price != null
    )
      incomingPricing.A3 = String(baseProduct.a5price);

    if (isBlank(incomingSalePricing.A4) && baseProduct.salea4price != null)
      incomingSalePricing.A4 = String(baseProduct.salea4price);
    if (isBlank(incomingSalePricing.US_LETTER) && baseProduct.saleusletter != null)
      incomingSalePricing.US_LETTER = String(baseProduct.saleusletter);
    if (isBlank(incomingSalePricing.A3) && baseProduct.salea3price != null)
      incomingSalePricing.A3 = String(baseProduct.salea3price);
    if (isBlank(incomingSalePricing.HALF_US_LETTER) && baseProduct.salehalfusletter != null)
      incomingSalePricing.HALF_US_LETTER = String(baseProduct.salehalfusletter);
    if (isBlank(incomingSalePricing.US_TABLOID) && baseProduct.saleustabloid != null)
      incomingSalePricing.US_TABLOID = String(baseProduct.saleustabloid);

    if (isBlank(incomingSalePricing.A5) && hasA5 && baseProduct.salea5price != null)
      incomingSalePricing.A5 = String(baseProduct.salea5price);
    if (
      isBlank(incomingSalePricing.A3) &&
      hasA3 &&
      baseProduct.salea3price == null &&
      baseProduct.salea5price != null
    )
      incomingSalePricing.A3 = String(baseProduct.salea5price);

    reset({
      cardname: baseProduct.cardname ?? "",
      cardcategory: resolvedCategory,
      subCategory: baseProduct.subCategory ?? "",
      subSubCategory: baseProduct.subSubCategory ?? "",
      sku: baseProduct.sku ?? "",
      description: baseProduct.description ?? "",
      polygon_shape: "",

      actualprice: baseProduct.actualprice ?? "",
      a4price: baseProduct.a4price ?? "",
      a5price: baseProduct.a5price ?? "",
      usletter: baseProduct.usletter ?? "",
      saleprice: baseProduct.saleprice ?? "",
      salea4price: baseProduct.salea4price ?? "",
      salea5price: baseProduct.salea5price ?? "",
      saleusletter: baseProduct.saleusletter ?? "",

      pricing: incomingPricing,
      salePricing: incomingSalePricing,
    });
  }, [product, rawStoresState, reset]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.name === selectedCategoryName),
    [categories, selectedCategoryName],
  );

  const subCategoryOptions: Option[] = useMemo(() => {
    const base = selectedCategory?.subcategories ?? [];
    const set = new Set(base);
    if (selectedSubCategory && !set.has(selectedSubCategory))
      set.add(selectedSubCategory);
    const list = Array.from(set);
    if (list.length === 0) return [{ label: "Select sub category", value: "" }];
    return [
      { label: "Select sub category", value: "" },
      ...list.map((sub) => ({ label: sub, value: sub })),
    ];
  }, [selectedCategory, selectedSubCategory]);

  const subSubCategoryOptions: Option[] = useMemo(() => {
    if (!selectedCategory || !selectedSubCategory)
      return [{ label: "Select sub-sub category", value: "" }];
    const map = selectedCategory.sub_subcategories || {};
    const list = map[selectedSubCategory] || [];
    const set = new Set(list);
    const current = watch("subSubCategory") || "";
    if (current && !set.has(current)) set.add(current);
    const final = Array.from(set);
    return [
      { label: "Select sub-sub category", value: "" },
      ...final.map((name) => ({ label: name, value: name })),
    ];
  }, [selectedCategory, selectedSubCategory, watch]);

  // Clear sub/subSub when invalid after category changes
  useEffect(() => {
    const sub = watch("subCategory") || "";
    const subsub = watch("subSubCategory") || "";
    const availableSubs = selectedCategory?.subcategories ?? [];
    const validSub =
      availableSubs.length === 0 ? true : availableSubs.includes(sub);

    if (!validSub) {
      setValue("subCategory", "");
      setValue("subSubCategory", "");
      return;
    }

    const availableSubSubs = selectedCategory?.sub_subcategories?.[sub] ?? [];
    const validSubSub =
      availableSubSubs.length === 0 ? true : availableSubSubs.includes(subsub);
    if (!validSubSub) setValue("subSubCategory", "");
  }, [selectedCategoryName, selectedCategory, setValue, watch]);

  // Ensure keys exist
  useEffect(() => {
    for (const s of sizes) {
      const p = `pricing.${s.key}` as PricingFieldPath;
      const sp = `salePricing.${s.key}` as SalePricingFieldPath;
      if (getValues(p) === undefined) setValue(p, "");
      if (getValues(sp) === undefined) setValue(sp, "");
    }
  }, [sizes, getValues, setValue]);

  // legacy sync for old columns
  const pricing = watch("pricing");
  const salePricing = watch("salePricing");

  useEffect(() => {
    const hasA5 = sizes.some((s) => s.key === "A5");
    const hasA3 = sizes.some((s) => s.key === "A3");
    const firstKey = sizes[0]?.key;

    const nextActual = (firstKey ? pricing?.[firstKey] : "") ?? "";
    if ((getValues("actualprice") ?? "") !== nextActual)
      setValue("actualprice", nextActual);

    const nextSale = (firstKey ? salePricing?.[firstKey] : "") ?? "";
    if ((getValues("saleprice") ?? "") !== nextSale)
      setValue("saleprice", nextSale);

    if ((getValues("a4price") ?? "") !== (pricing?.A4 ?? ""))
      setValue("a4price", (pricing?.A4 ?? "") as any);
    if ((getValues("usletter") ?? "") !== (pricing?.US_LETTER ?? ""))
      setValue("usletter", (pricing?.US_LETTER ?? "") as any);

    const legacyA5Slot = hasA5
      ? (pricing?.A5 ?? "")
      : hasA3
        ? (pricing?.A3 ?? "")
        : "";
    if ((getValues("a5price") ?? "") !== legacyA5Slot)
      setValue("a5price", legacyA5Slot as any);

    if ((getValues("salea4price") ?? "") !== (salePricing?.A4 ?? ""))
      setValue("salea4price", (salePricing?.A4 ?? "") as any);
    if ((getValues("saleusletter") ?? "") !== (salePricing?.US_LETTER ?? ""))
      setValue("saleusletter", (salePricing?.US_LETTER ?? "") as any);

    const legacySaleA5Slot = hasA5
      ? (salePricing?.A5 ?? "")
      : hasA3
        ? (salePricing?.A3 ?? "")
        : "";
    if ((getValues("salea5price") ?? "") !== legacySaleA5Slot)
      setValue("salea5price", legacySaleA5Slot as any);
  }, [sizes, getValues, pricing, salePricing, setValue]);

  const onSubmit = async (data: FormValue) => {
    setLoading(true);

    let captured: string | null = null;
    if (konvaPreviewRef.current) {
      captured = await capturePreviewThumbnail(konvaPreviewRef);
    }
    if (!captured) {
      captured =
        (typeof navState?.imgUrl === "string" && navState.imgUrl.trim()) ||
        (typeof previewImage === "string" && previewImage.trim()) ||
        null;
    }

    const pricingValues = getValues("pricing") ?? {};
    const salePricingValues = getValues("salePricing") ?? {};

    const hasA5 = sizes.some((s) => s.key === "A5");
    const hasA3 = sizes.some((s) => s.key === "A3");
    const firstKey = sizes[0]?.key;

    const existingPricing: PricingMap = isEditMode
      ? {
        ...readPricingMap((product as any)?.pricing),
        ...readPricingMap((rawStoresState as any)?.pricing),
      }
      : {};
    const existingSalePricing: PricingMap = isEditMode
      ? {
        ...readPricingMap((product as any)?.salePricing),
        ...readPricingMap((rawStoresState as any)?.salePricing),
      }
      : {};

    if (isEditMode) {
      if (isBlank(existingPricing.A4) && product?.a4price != null)
        existingPricing.A4 = String(product.a4price);
      if (isBlank(existingPricing.US_LETTER) && product?.usletter != null)
        existingPricing.US_LETTER = String(product.usletter);
      if (isBlank(existingPricing.A3) && product?.a3price != null)
        existingPricing.A3 = String(product.a3price);
      if (isBlank(existingPricing.HALF_US_LETTER) && product?.halfusletter != null)
        existingPricing.HALF_US_LETTER = String(product.halfusletter);
      if (isBlank(existingPricing.US_TABLOID) && product?.ustabloid != null)
        existingPricing.US_TABLOID = String(product.ustabloid);
      if (isBlank(existingPricing.A5) && hasA5 && product?.a5price != null)
        existingPricing.A5 = String(product.a5price);
      if (
        isBlank(existingPricing.A3) &&
        hasA3 &&
        product?.a3price == null &&
        product?.a5price != null
      )
        existingPricing.A3 = String(product.a5price);

      if (isBlank(existingSalePricing.A4) && product?.salea4price != null)
        existingSalePricing.A4 = String(product.salea4price);
      if (isBlank(existingSalePricing.US_LETTER) && product?.saleusletter != null)
        existingSalePricing.US_LETTER = String(product.saleusletter);
      if (isBlank(existingSalePricing.A3) && product?.salea3price != null)
        existingSalePricing.A3 = String(product.salea3price);
      if (isBlank(existingSalePricing.HALF_US_LETTER) && product?.salehalfusletter != null)
        existingSalePricing.HALF_US_LETTER = String(product.salehalfusletter);
      if (isBlank(existingSalePricing.US_TABLOID) && product?.saleustabloid != null)
        existingSalePricing.US_TABLOID = String(product.saleustabloid);
      if (isBlank(existingSalePricing.A5) && hasA5 && product?.salea5price != null)
        existingSalePricing.A5 = String(product.salea5price);
      if (
        isBlank(existingSalePricing.A3) &&
        hasA3 &&
        product?.salea3price == null &&
        product?.salea5price != null
      )
        existingSalePricing.A3 = String(product.salea5price);
    }

    const resolvedPricing: PricingMap = { ...(pricingValues as PricingMap) };
    const resolvedSalePricing: PricingMap = { ...(salePricingValues as PricingMap) };
    for (const [k, v] of Object.entries(existingPricing) as [SizeKey, string][]) {
      if (isBlank(resolvedPricing[k]) && !isBlank(v)) resolvedPricing[k] = v;
    }
    for (const [k, v] of Object.entries(existingSalePricing) as [SizeKey, string][]) {
      if (isBlank(resolvedSalePricing[k]) && !isBlank(v)) resolvedSalePricing[k] = v;
    }

    const legacyA5Slot = hasA5
      ? (resolvedPricing as any)?.A5
      : hasA3
        ? (resolvedPricing as any)?.A3
        : "";
    const legacySaleA5Slot = hasA5
      ? (resolvedSalePricing as any)?.A5
      : hasA3
        ? (resolvedSalePricing as any)?.A3
        : "";

    const meta: PublishMeta = {
      id: templateId,
      mode,

      cardname: data.cardname,
      cardcategory: data.cardcategory,
      subCategory: data.subCategory,
      subSubCategory: data.subSubCategory,

      // legacy DB columns
      actualprice: toTextNumberOrEmpty(
        firstKey ? (resolvedPricing as any)?.[firstKey] : "",
      ),
      a4price: toTextNumberOrEmpty((resolvedPricing as any)?.A4),
      a5price: toTextNumberOrEmpty(legacyA5Slot),
      usletter: toTextNumberOrEmpty((resolvedPricing as any)?.US_LETTER),

      saleprice: toTextNumberOrEmpty(
        firstKey ? (resolvedSalePricing as any)?.[firstKey] : "",
      ),
      salea4price: toTextNumberOrEmpty((resolvedSalePricing as any)?.A4),
      salea5price: toTextNumberOrEmpty(legacySaleA5Slot),
      saleusletter: toTextNumberOrEmpty((resolvedSalePricing as any)?.US_LETTER),

      // NEW DB columns
      a3price: toTextNumberOrEmpty((resolvedPricing as any)?.A3),
      halfusletter: toTextNumberOrEmpty((resolvedPricing as any)?.HALF_US_LETTER),
      ustabloid: toTextNumberOrEmpty((resolvedPricing as any)?.US_TABLOID),

      salea3price: toTextNumberOrEmpty((resolvedSalePricing as any)?.A3),
      salehalfusletter: toTextNumberOrEmpty((resolvedSalePricing as any)?.HALF_US_LETTER),
      saleustabloid: toTextNumberOrEmpty((resolvedSalePricing as any)?.US_TABLOID),

      pricing: resolvedPricing as any,
      salePricing: resolvedSalePricing as any,

      description: data.description,
      sku: data.sku,
      imgUrl: captured ?? previewUrl,
    };

    const saved = await saveDesign(meta);
    if (!saved) {
      setLoading(false);
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["templates-list"] }),
      queryClient.invalidateQueries({ queryKey: ["templetCards:light"] }),
      queryClient.invalidateQueries({ queryKey: ["allTemplates"] }),
      queryClient.invalidateQueries({ queryKey: ["templates"] }),
      queryClient.invalidateQueries({ queryKey: ["templates:light"] }),
    ]);

    setLoading(false);
    resetState();
    reset();
  };

  const mmToPx = (mm: number) => (mm / 25.4) * 96;

  const toNum = (v: any, d = 0) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : d;
  };

  const canvasDims = useMemo(() => {
    const fitW = toNum(rawStores?.config?.fitCanvas?.width, 0);
    const fitH = toNum(rawStores?.config?.fitCanvas?.height, 0);

    const canvasMmW = toNum(rawStores?.canvas?.mm?.w, 0);
    const canvasMmH = toNum(rawStores?.canvas?.mm?.h, 0);

    const canvasPxW = toNum(rawStores?.canvas?.px?.w, 0);
    const canvasPxH = toNum(rawStores?.canvas?.px?.h, 0);

    const mmW = toNum(rawStores?.config?.mmWidth, 0);
    const mmH = toNum(rawStores?.config?.mmHeight, 0);

    const width = fitW || canvasMmW || canvasPxW || (mmW ? mmToPx(mmW) : 0);
    const height = fitH || canvasMmH || canvasPxH || (mmH ? mmToPx(mmH) : 0);

    if (!width || !height) return { width: 400, height: 565 };
    return { width, height };
  }, [
    rawStores?.config?.fitCanvas?.width,
    rawStores?.config?.fitCanvas?.height,
    rawStores?.canvas?.mm?.w,
    rawStores?.canvas?.mm?.h,
    rawStores?.canvas?.px?.w,
    rawStores?.canvas?.px?.h,
    rawStores?.config?.mmWidth,
    rawStores?.config?.mmHeight,
  ]);

  const previewSize = useMemo(() => {
    return { width: canvasDims.width, height: canvasDims.height };
  }, [canvasDims.width, canvasDims.height]);

  const cols = 4;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          m: "auto",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Left Preview - Konva Canvas */}
        <Box
          sx={{
            width: previewSize.width,
            height: previewSize.height,
            maxWidth: "100%",
            borderRadius: "12px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            mx: "auto",
          }}
        >
          {rawStores ? (
            (() => {
              // Extract slide data
              const snapshotSlides = Array.isArray(rawStores.snapshotSlides)
                ? rawStores.snapshotSlides
                : typeof rawStores.snapshotSlides === "string"
                ? (() => {
                    try {
                      const parsed = JSON.parse(rawStores.snapshotSlides);
                      return Array.isArray(parsed) ? parsed : [];
                    } catch {
                      return [];
                    }
                  })()
                : [];

              const slidesSource = snapshotSlides.length > 0 ? snapshotSlides : rawStores.slides ?? [];
              const firstSlide = slidesSource?.[0];
              
              if (!firstSlide) {
                return (
                  <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                    <Typography>No slide data available</Typography>
                  </Box>
                );
              }

              // Helper functions
              const toNumHelper = (v: any, d = 0) => {
                const n = Number(v);
                return Number.isFinite(n) && n > 0 ? n : d;
              };

              const slideToken = (value: any): string => {
                if (typeof value === "number" && Number.isFinite(value)) return String(value);
                const raw = String(value ?? "").trim();
                if (!raw) return "";
                const n = Number(raw);
                if (Number.isFinite(n)) return String(n);
                const lower = raw.toLowerCase();
                if (lower === "front") return "1";
                if (lower === "back") return "2";
                return lower;
              };

              const slideAliases = (value: any): string[] => {
                const token = slideToken(value);
                if (!token) return [];
                const out = new Set<string>([token]);
                if (token === "1") {
                  out.add("front");
                  out.add("slide1");
                }
                if (token === "2") {
                  out.add("back");
                  out.add("slide2");
                }
                const m = token.match(/^slide(\d+)$/);
                if (m?.[1]) out.add(String(Number(m[1])));
                return Array.from(out);
              };

              const firstSlideRaw = firstSlide?.id ?? firstSlide?.slideId ?? firstSlide?.slide_id ?? 1;
              const firstSlideAliasSet = new Set(slideAliases(firstSlideRaw));
              const firstSlideToken = slideToken(firstSlideRaw) || "1";

              const belongsToFirstSlide = (el: any) => {
                const sid = el?.slideId ?? el?.slide_id;
                if (sid == null || String(sid).trim() === "") return true;
                const aliases = slideAliases(sid);
                if (!aliases.length) return true;
                return aliases.some((a) => firstSlideAliasSet.has(a));
              };

              const resolveLayer = (el: any) => {
                const explicit = Number(el?.zIndex ?? el?.z_index);
                if (Number.isFinite(explicit)) return explicit;
                const t = String(el?.type ?? "").toLowerCase();
                return t === "text" ? 2 : 1;
              };

              const resolveTextAlignHelper = (el: any): 'left' | 'center' | 'right' => {
                const raw = String(el?.align ?? el?.textAlign ?? el?.style?.textAlign ?? "center").toLowerCase();
                if (raw === "left") return "left";
                if (raw === "right") return "right";
                return "center";
              };

              const resolveTextRotationHelper = (el: any): number => {
                const raw = el?.rotation ?? el?.rotate ?? el?.style?.rotation ?? 0;
                const n = Number(raw);
                return Number.isFinite(n) ? n : 0;
              };

              const resolveTextCurveHelper = (el: any): number => {
                const raw = el?.curve ?? el?.arc ?? el?.style?.curve ?? 0;
                const n = Number(raw);
                return Number.isFinite(n) ? n : 0;
              };

              const resolveTextFontFamilyHelper = (el: any): string => {
                return el?.fontFamily ?? el?.font_family ?? el?.style?.fontFamily ?? "Arial";
              };

              const resolveTextFontWeightHelper = (el: any): number | string => {
                return el?.fontWeight ?? el?.font_weight ?? el?.style?.fontWeight ?? 400;
              };

              const resolveTextFontStyleHelper = (el: any): string => {
                return el?.fontStyle ?? el?.font_style ?? el?.style?.fontStyle ?? "normal";
              };

              const resolveTextDecorationHelper = (el: any): string => {
                return el?.textDecoration ?? el?.text_decoration ?? el?.style?.textDecoration ?? "none";
              };

              const resolveTextColorHelper = (el: any): string => {
                return el?.color ?? el?.fill ?? el?.style?.color ?? "#111111";
              };

              // Extract elements
              const snapshotElementsRaw = Array.isArray(firstSlide?.elements) ? firstSlide.elements : [];
              const snapshotElements = snapshotElementsRaw
                .filter((el: any) => {
                  const t = String(el?.type ?? "").toLowerCase();
                  return t === "text" || t === "image" || t === "sticker" || (!t && (el?.text != null || el?.src || el?.image));
                })
                .map((el: any) => {
                  const t = String(el?.type ?? "").toLowerCase();
                  if (t) return el;
                  if (el?.text != null) return { ...el, type: "text" };
                  if (el?.sticker) return { ...el, type: "sticker" };
                  return { ...el, type: "image" };
                });

              const separatedElements = [
                ...(Array.isArray(rawStores.textElements) ? rawStores.textElements.map((el: any) => ({ ...el, type: "text" })) : []),
                ...(Array.isArray(rawStores.imageElements) ? rawStores.imageElements.map((el: any) => ({ ...el, type: "image" })) : []),
                ...(Array.isArray(rawStores.stickerElements) ? rawStores.stickerElements.map((el: any) => ({ ...el, type: "sticker" })) : []),
              ].filter((el: any) => belongsToFirstSlide(el));

              const renderElements = separatedElements.length > 0 ? separatedElements : snapshotElements;
              
              const canvasW = canvasDims.width;
              const canvasH = canvasDims.height;
              const containerW = previewSize.width;
              const containerH = previewSize.height;
              const scale = Math.min(containerW / canvasW, containerH / canvasH);

              const normalizePos = (el: any) => {
                let x = toNumHelper(el?.x ?? el?.left, 0);
                let y = toNumHelper(el?.y ?? el?.top, 0);
                let w = toNumHelper(el?.width ?? el?.w, 0);
                let h = toNumHelper(el?.height ?? el?.h, 0);

                const isUnit = (n: number) => n >= 0 && n <= 1.000001;
                const looksRelative = isUnit(x) && isUnit(y) && w > 0 && w <= 1.000001 && h > 0 && h <= 1.000001;
                
                if (looksRelative) {
                  x = x * canvasW;
                  y = y * canvasH;
                  w = w * canvasW;
                  h = h * canvasH;
                }
                
                return { x: x * scale, y: y * scale, w: w * scale, h: h * scale };
              };

              const slideBgMap = rawStores?.slideBg ?? {};
              const firstSlideLabel = String(firstSlide?.label ?? "").trim();
              const firstSlideLabelKey = firstSlideLabel.toLowerCase().replace(/\s+/g, "");
              const slideBgKeys = [
                firstSlideRaw,
                String(firstSlideRaw ?? ""),
                firstSlideToken,
                `slide${firstSlideToken}`,
                `Slide${firstSlideToken}`,
                firstSlideLabel,
                firstSlideLabelKey,
                firstSlideLabelKey === "front" ? "front" : "",
                firstSlideLabelKey === "front" ? "slide1" : "",
                firstSlideLabelKey === "back" ? "back" : "",
                firstSlideLabelKey === "back" ? "slide2" : "",
              ].filter(Boolean);
              
              let slideBg: any = null;
              for (const k of slideBgKeys) {
                if (slideBgMap?.[k] != null) {
                  slideBg = slideBgMap[k];
                  break;
                }
              }

              const konvaElements = renderElements.map((el: any, idx: number) => {
                const type = String(el?.type ?? "").toLowerCase();
                const { x, y, w, h } = normalizePos(el);
                
                if (type === "text") {
                  return {
                    type: "text" as const,
                    x, y, width: w, height: h,
                    text: el.text ?? el.value,
                    fontSize: el.fontSize || 20,
                    fontFamily: resolveTextFontFamilyHelper(el),
                    fontWeight: resolveTextFontWeightHelper(el),
                    fontStyle: resolveTextFontStyleHelper(el),
                    color: resolveTextColorHelper(el),
                    textAlign: resolveTextAlignHelper(el),
                    rotation: resolveTextRotationHelper(el),
                    curve: resolveTextCurveHelper(el),
                    textDecoration: resolveTextDecorationHelper(el),
                    lineHeight: el.lineHeight || 1.2,
                    zIndex: resolveLayer(el),
                  };
                } else {
                  return {
                    type: type === "sticker" ? "sticker" as const : "image" as const,
                    x, y, width: w, height: h,
                    src: el?.src ?? el?.sticker ?? el?.image ?? el?.url,
                    zIndex: resolveLayer(el),
                  };
                }
              });

              return (
                <TempletKonvaPreview
                  ref={konvaPreviewRef}
                  width={containerW}
                  height={containerH}
                  bgImage={slideBg?.image || null}
                  bgColor={slideBg?.color || "#ffffff"}
                  elements={konvaElements}
                  borderRadius={12}
                />
              );
            })()
          ) : previewImage ? (
            <Box
              component="img"
              src={previewImage}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
                display: "block",
              }}
            />
          ) : (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
              <Typography>No preview available</Typography>
            </Box>
          )}
        </Box>

        {/* Right Form */}
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
            },
            gap: 2,
          }}
        >
          {/* Title */}
          <CustomInput
            label="Title"
            placeholder="Enter template title"
            register={register("cardname", { required: "Title is required" })}
            error={errors.cardname?.message}
          />

          {/* Category */}
          <Controller
            name="cardcategory"
            control={control}
            rules={{ required: "Category is required" }}
            render={({ field }) => (
              <CustomInput
                label="Category"
                type="select"
                placeholder={
                  isLoadingCats
                    ? "Loading categories..."
                    : isErrorCats
                      ? "Failed to load categories"
                      : "Select category"
                }
                value={field.value ?? ""}
                onChange={(e) => field.onChange((e.target as any).value)}
                error={errors.cardcategory?.message}
                options={categoryOptionsWithEmpty}
              />
            )}
          />

          {/* Sub Category */}
          <Controller
            name="subCategory"
            control={control}
            rules={{
              required:
                subCategoryOptions.length > 1
                  ? "Sub category is required"
                  : false,
            }}
            render={({ field }) => (
              <CustomInput
                label="Sub Category"
                type="select"
                placeholder={
                  !watch("cardcategory")
                    ? "Select main category first"
                    : subCategoryOptions.length <= 1
                      ? "No sub categories"
                      : "Select sub category"
                }
                value={field.value ?? ""}
                onChange={(e) => field.onChange((e.target as any).value)}
                error={errors.subCategory?.message}
                options={subCategoryOptions}
              />
            )}
          />

          {/* Sub Sub Category */}
          <Controller
            name="subSubCategory"
            control={control}
            rules={{
              required:
                subSubCategoryOptions.length > 1
                  ? "Sub-sub category is required"
                  : false,
            }}
            render={({ field }) => (
              <CustomInput
                label="Sub Sub Category"
                type="select"
                placeholder={
                  !watch("subCategory")
                    ? "Select sub category first"
                    : subSubCategoryOptions.length <= 1
                      ? "No sub-sub categories"
                      : "Select sub-sub category"
                }
                value={field.value ?? ""}
                onChange={(e) => field.onChange((e.target as any).value)}
                error={errors.subSubCategory?.message}
                options={subSubCategoryOptions}
              />
            )}
          />

          {/* SKU */}
          <CustomInput
            label="SKU"
            placeholder="Enter your SKU"
            register={register("sku", { required: "SKU is required" })}
            error={errors.sku?.message}
          />

          {/* Pricing Note */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            {pricingConfig.note && (
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {pricingConfig.note}
              </Typography>
            )}
          </Box>

          {/* Actual Prices */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography sx={{ fontWeight: 700, mb: 0.8 }}>
              Actual Prices
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 1,
              }}
            >
              {sizes.map((s) => (
                <CustomInput
                  key={`pricing-${s.key}`}
                  label={s.label}
                  placeholder="0"
                  register={register(`pricing.${s.key}` as PricingFieldPath, {
                    required: !isEditMode ? "Required" : false,
                  })}
                  error={getNestedError(errors, `pricing.${s.key}`)}
                />
              ))}
            </Box>
          </Box>

          {/* Sale Prices */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography sx={{ fontWeight: 700, mb: 0.8, mt: 2 }}>
              Sale Prices
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 1,
              }}
            >
              {sizes.map((s) => (
                <CustomInput
                  key={`salePricing-${s.key}`}
                  label={s.label}
                  placeholder="0"
                  register={register(
                    `salePricing.${s.key}` as SalePricingFieldPath,
                  )}
                  error={getNestedError(errors, `salePricing.${s.key}`)}
                />
              ))}
            </Box>
          </Box>

          {/* Description */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <CustomInput
              label="Description"
              placeholder="Enter description"
              register={register("description", {
                required: "Description is required",
              })}
              error={errors.description?.message}
              multiline
            />
          </Box>

          {/* Buttons */}
          <Box
            sx={{
              gridColumn: "1 / -1",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <LandingButton
              title={isEditMode ? "Update templet" : "Edit templet"}
              personal
              width="200px"
              type="button"
              onClick={() =>
                navigate(ADMINS_DASHBOARD.ADMIN_CATEGORIES_EDITOR, {
                  state: {
                    mode: isEditMode ? "edit" : "create",
                    id: templateId ?? null,
                    product: watch(),
                    rawStores: rawStoresState,
                  },
                })
              }
            />

            <LandingButton
              title={isEditMode ? "Update & Publish" : "Save & Publish"}
              personal
              variant="outlined"
              width="200px"
              type="submit"
              loading={loading}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TempletForm;