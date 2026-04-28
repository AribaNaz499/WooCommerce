// src/pages/admin/.../NewCardsForm.tsx
import { Box, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useMemo, useRef, useState, useEffect } from "react";
import CustomInput from "../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../components/LandingButton/LandingButton";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { supabase } from "../../../../supabase/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { ADMINS_DASHBOARD } from "../../../../constant/route";
import { useQuery } from "@tanstack/react-query";
import { fetchAllCategoriesFromDB } from "../../../../source/source";
import { useSlide1 } from "../../../../context/Slide1Context";
import { useSlide2 } from "../../../../context/Slide2Context";
import { useSlide3 } from "../../../../context/Slide3Context";
import { useSlide4 } from "../../../../context/Slide4Context";
import {
  applyPolygonLayoutToContexts,
  buildPolygonLayout,
  captureNodeToPng,
  pickPolygonLayout,
} from "../../../../lib/polygon";
import Slide1PreviewBox from "./FirstSlidePreview/FirstSlidePreview";

type AccessPlan = "free" | "bundle" | "pro";

type FormValue = {
  cardname: string;
  cardcategory: string;
  subCategory?: string;
  subSubCategory?: string;
  sku: string;

  // ✅ NEW
  accessPlan: AccessPlan;

  actualprice?: string;
  a4price?: string;
  a5price?: string;
  usletter?: string;
  ustabloid?: string;
  saleprice?: string;
  salea4price?: string;
  salea5price?: string;
  saleusletter?: string;
  saleustabloid?: string;
  description: string;
  cardImage: FileList;
  polygon_shape: string;
};

type CategoryRow = {
  id: string;
  name: string;
  subcategories: string[];
  sub_subcategories: Record<string, string[]>;
};

type EditFormValue = {
  cardName?: string;
  cardCategory?: string;
  sku?: string;
  actualPrice?: string;
  a4price?: string;
  a5price?: string;
  usletter?: string;
  ustabloid?: string;
  salePrice?: string;
  salea4price?: string;
  salea5price?: string;
  saleusletter?: string;
  saleustabloid?: string;
  description?: string;
  imageUrl?: string;
  polygon_shape?: string;
  polygonlayout?: any;
  subCategory?: string;
  subSubCategory?: string;
  lastpageImageUrl?: string;
  lastMessage?: string;

  cardname?: string;
  cardcategory?: string;
  actualprice?: string;
  saleprice?: string;
  imageurl?: string;
  lastpageimageurl?: string;
  lastmessage?: string;

  // ✅ NEW (for edit prefill)
  accessPlan?: AccessPlan;
  accessplan?: AccessPlan;

  polyganLayout?: any;
};

type Props = { editProduct?: EditFormValue };

const parseLayoutPricing = (layout: any) => {
  if (!layout) return { pricing: {}, salePricing: {} };
  const obj =
    typeof layout === "string"
      ? (() => {
        try {
          return JSON.parse(layout);
        } catch {
          return null;
        }
      })()
      : layout;
  const pricing = obj?.pricing && typeof obj.pricing === "object" ? obj.pricing : {};
  const salePricing =
    obj?.salePricing && typeof obj.salePricing === "object" ? obj.salePricing : {};
  return { pricing, salePricing };
};

const pickLayoutCandidate = (...candidates: any[]) =>
  candidates.find((c) => c !== undefined && c !== null && c !== "") ?? null;

const NewCardsForm = ({ editProduct }: Props) => {
  const slide1 = useSlide1();
  const slide2 = useSlide2();
  const slide3 = useSlide3();
  const slide4 = useSlide4();
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const isSmUp = useMediaQuery(theme.breakpoints.up("sm"));

  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as any) || {};
  const { id, product, formData, mode } = navState;

  const isEditMode = Boolean(id) || mode === "edit";
  const toFloat = (v: any) => (v === "" || v == null ? undefined : parseFloat(String(v)));

  const editLayout = useMemo(() => {
    return pickPolygonLayout(
      navState?.polygonlayout,
      navState?.polyganLayout,
      formData?.polygonlayout,
      formData?.polyganLayout,
      product?.polygonlayout,
      product?.polyganLayout
    );
  }, [
    navState?.polygonlayout,
    navState?.polyganLayout,
    formData?.polygonlayout,
    formData?.polyganLayout,
    product?.polygonlayout,
    product?.polyganLayout,
  ]);

  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  const {
    data: categories = [],
    isLoading: isLoadingCats,
    isError: isErrorCats,
  } = useQuery<CategoryRow[]>({
    queryKey: ["categories"],
    queryFn: fetchAllCategoriesFromDB,
    staleTime: 1000 * 60 * 30,
  });

  const cardsRow = useMemo(
    () => categories.find((c) => (c?.name ?? "").trim().toLowerCase() === "cards") || null,
    [categories]
  );

  const categoryOptions = useMemo(() => (cardsRow ? [{ label: "Cards", value: "Cards" }] : []), [cardsRow]);

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
      cardcategory: "Cards",
      subCategory: "",
      subSubCategory: "",
      sku: "",

      // ✅ NEW default
      accessPlan: "free",

      actualprice: "",
      a4price: "",
      a5price: "",
      usletter: "",
      ustabloid: "",
      saleprice: "",
      salea4price: "",
      salea5price: "",
      saleusletter: "",
      saleustabloid: "",
      description: "",
      polygon_shape: "",
    },
  });

  const normalizedEdit = useMemo(() => {
    const src = editProduct ?? {};
    const fd = formData ?? product ?? {};
    const pricingSource = pickLayoutCandidate(
      (src as any).polygonlayout,
      (src as any).polyganLayout,
      (fd as any).polygonlayout,
      (fd as any).polyganLayout,
      editLayout
    );
    const { pricing: layoutPricing, salePricing: layoutSalePricing } = parseLayoutPricing(
      pricingSource
    );

    const accessPlan =
      (src.accessPlan ??
        (src as any).accessplan ??
        (fd as any).accessPlan ??
        (fd as any).accessplan ??
        "free") as AccessPlan;

    return {
      cardname: (src.cardname ?? src.cardName ?? fd.cardname ?? fd.cardName ?? "") as string,
      cardcategory: "Cards",
      sku: (src.sku ?? fd.sku ?? "") as string,

      // ✅ NEW
      accessPlan,

      actualprice: (src.actualprice ?? src.actualPrice ?? fd.actualprice ?? fd.actualPrice ?? "") as any,
      a4price: (src.a4price ?? fd.a4price ?? src.actualprice ?? src.actualPrice ?? fd.actualprice ?? fd.actualPrice ?? "") as any,
      a5price: (src.a5price ?? fd.a5price ?? src.actualprice ?? src.actualPrice ?? fd.actualprice ?? fd.actualPrice ?? "") as any,
      usletter: (src.usletter ?? fd.usletter ?? src.actualprice ?? src.actualPrice ?? fd.actualprice ?? fd.actualPrice ?? "") as any,
      ustabloid: (src.ustabloid ??
        fd.ustabloid ??
        layoutPricing?.US_TABLOID ??
        layoutPricing?.us_tabloid ??
        layoutPricing?.ustabloid ??
        "") as any,
      saleprice: (src.saleprice ?? src.salePrice ?? fd.saleprice ?? fd.salePrice ?? "") as any,
      salea4price: (src.salea4price ?? fd.salea4price ?? "") as any,
      salea5price: (src.salea5price ?? fd.salea5price ?? "") as any,
      saleusletter: (src.saleusletter ?? fd.saleusletter ?? "") as any,
      saleustabloid: (src.saleustabloid ??
        fd.saleustabloid ??
        layoutSalePricing?.US_TABLOID ??
        layoutSalePricing?.us_tabloid ??
        layoutSalePricing?.ustabloid ??
        "") as any,
      description: (src.description ?? fd.description ?? "") as string,
      polygon_shape: (src.polygon_shape ?? (fd as any).polygon_shape ?? "") as string,
      subCategory: (src.subCategory ?? (src as any).subcategory ?? fd.subCategory ?? (fd as any).subcategory ?? "") as string,
      subSubCategory: (src.subSubCategory ?? (src as any).sub_subcategory ?? fd.subSubCategory ?? (fd as any).sub_subcategory ?? "") as string,
    } as any;
  }, [editProduct, formData, product, editLayout]);

  useEffect(() => {
    reset(normalizedEdit);
  }, [normalizedEdit, reset]);

  useEffect(() => {
    if (cardsRow) setValue("cardcategory", "Cards", { shouldValidate: true });
  }, [cardsRow, setValue]);

  const selectedSubCategory = watch("subCategory");

  const subCategoryOptions = useMemo(() => {
    if (!cardsRow) return [];
    return (cardsRow.subcategories ?? []).map((sub) => ({ label: sub, value: sub }));
  }, [cardsRow]);

  const subSubCategoryOptions = useMemo(() => {
    if (!cardsRow || !selectedSubCategory) return [];
    const list = cardsRow.sub_subcategories?.[selectedSubCategory] ?? [];
    return list.map((name) => ({ label: name, value: name }));
  }, [cardsRow, selectedSubCategory]);

  const previewRef = useRef<any>(null);
  const previewRatio = useMemo(() => {
    const rect = (slide1 as any)?.bgRect1;
    const w = Number(rect?.width ?? 0);
    const h = Number(rect?.height ?? 0);
    if (w > 0 && h > 0) return w / h;
    return 5 / 7;
  }, [(slide1 as any)?.bgRect1?.width, (slide1 as any)?.bgRect1?.height]);

  const previewBounds = useMemo(() => {
    if (isMdUp) return { maxW: 500, maxH: 700 };
    if (isSmUp) return { maxW: 500, maxH: 700 };
    return { maxW: 360, maxH: 480 };
  }, [isMdUp, isSmUp]);

  const previewSize = useMemo(() => {
    const ratio = previewRatio > 0 ? previewRatio : 5 / 7;
    const { maxW, maxH } = previewBounds;
    const byWidth = maxW / ratio <= maxH;
    const width = byWidth ? maxW : maxH * ratio;
    const height = byWidth ? maxW / ratio : maxH;
    return { width, height };
  }, [previewRatio, previewBounds]);

  useEffect(() => {
    if (isEditMode) {
      if (editLayout) {
        applyPolygonLayoutToContexts(editLayout, slide1, slide2, slide3, slide4);
      }
      return;
    }
  }, [isEditMode, editLayout]);

  useEffect(() => {
    // New product must always start clean (no carry-over from previous product/session).
    if (isEditMode) return;
    if (editLayout) return;
    slide1.resetSlide1State?.();
    slide2.resetSlide2State?.();
    slide3.resetSlide3State?.();
    slide4.resetSlide4State?.();
  }, [isEditMode, editLayout]);

  const handleEditLayout = async () => {
    if (editLoading) return;
    setEditLoading(true);

    const formSnapshot = getValues();
    const layoutNow = buildPolygonLayout(slide1, slide2, slide3, slide4);
    const designToSend = pickPolygonLayout(layoutNow, editLayout) ?? null;

    setEditLoading(false);

    navigate(ADMINS_DASHBOARD.ADMIN_EDITOR, {
      state: {
        mode: id ? "edit" : "create",
        id,
        design: designToSend,
        formData: formSnapshot,
      },
    });
  };

  const onSubmit = async (data: FormValue) => {
    try {
      setLoading(true);

      // ========== DEBUG LOGS START ==========
      console.log("🔍 ===== IMAGE CAPTURE DEBUG =====");
      console.log("1. previewRef.current:", previewRef.current);
      console.log("2. toDataURL exists?", !!previewRef.current?.toDataURL);
      console.log("3. typeof toDataURL:", typeof previewRef.current?.toDataURL);
      // ========== DEBUG LOGS END ==========

      const layoutNow = buildPolygonLayout(slide1, slide2, slide3, slide4, { onlySelectedImages: true });
      const baseLayout = pickPolygonLayout(layoutNow, editLayout) ?? {};
      const layoutObj = typeof baseLayout === "object" && baseLayout !== null ? baseLayout : {};
      const { pricing: existingPricing, salePricing: existingSalePricing } = parseLayoutPricing(
        layoutObj
      );
      const existingTabloid =
        (existingPricing as any)?.US_TABLOID ??
        (existingPricing as any)?.us_tabloid ??
        (existingPricing as any)?.ustabloid ??
        "";
      const existingSaleTabloid =
        (existingSalePricing as any)?.US_TABLOID ??
        (existingSalePricing as any)?.us_tabloid ??
        (existingSalePricing as any)?.ustabloid ??
        "";
      const resolvedTabloid =
        data.ustabloid === "" || data.ustabloid == null ? existingTabloid : data.ustabloid;
      const resolvedSaleTabloid =
        data.saleustabloid === "" || data.saleustabloid == null
          ? existingSaleTabloid
          : data.saleustabloid;
      const polygonlayout = {
        ...(layoutObj as any),
        pricing: {
          ...(existingPricing ?? {}),
          US_TABLOID: resolvedTabloid ?? "",
        },
        salePricing: {
          ...(existingSalePricing ?? {}),
          US_TABLOID: resolvedSaleTabloid ?? "",
        },
      };

      let imageurl: string | null = null;
      
      // ========== DEBUG: Check if toDataURL exists ==========
      console.log("4. Attempting to capture image...");
      
      if (previewRef.current?.toDataURL) {
        try {
          console.log("5. Calling toDataURL()...");
          imageurl = await previewRef.current.toDataURL();
          console.log("6. ✅ Capture SUCCESS!");
          console.log("7. Image URL length:", imageurl?.length);
          console.log("8. Starts with 'data:image':", imageurl?.startsWith('data:image'));
          console.log("9. First 100 chars:", imageurl?.substring(0, 100));
        } catch (error) {
          console.error("10. ❌ Capture FAILED:", error);
          imageurl = null;
        }
      } else {
        console.warn("11. ⚠️ toDataURL NOT AVAILABLE on previewRef");
        console.log("12. previewRef keys:", previewRef.current ? Object.keys(previewRef.current) : "null");
      }
      
      console.log("13. Final imageurl:", imageurl ? "✅ PRESENT (length: " + imageurl.length + ")" : "❌ NULL");
      console.log("====================================\n");

      const payload = {
        cardname: data.cardname,
        cardcategory: "Cards",
        sku: String(data.sku),
        description: data.description,
        subCategory: data.subCategory ?? null,
        subSubCategory: data.subSubCategory ?? null,
        polygon_shape: "",
        polygonlayout,
        lastmessage: "",
        imageurl,
        lastpageimageurl: null,

        // ✅ NEW (DB column: accessplan)
        accessplan: data.accessPlan,

        actualprice: data.actualprice,
        a4price: data.a4price,
        a5price: data.a5price,
        usletter: data.usletter,
        saleprice: data.saleprice,
        salea4price: data.salea4price,
        salea5price: data.salea5price,
        saleusletter: data.saleusletter,
      };

      if (payload.actualprice == null) throw new Error("Actual Price is required");

      const payloadWithTabloid = {
        ...payload,
        ustabloid: data.ustabloid ?? null,
        saleustabloid: data.saleustabloid ?? null,
      };

      const isMissingColumnError = (err: any) => {
        const msg = String(err?.message ?? "");
        return (
          msg.toLowerCase().includes("column") &&
          (msg.toLowerCase().includes("ustabloid") || msg.toLowerCase().includes("saleustabloid"))
        );
      };

      if (id) {
        let { error } = await supabase.from("cards").update(payloadWithTabloid).eq("id", id);
        if (error && isMissingColumnError(error)) {
          ({ error } = await supabase.from("cards").update(payload).eq("id", id));
        }
        if (error) throw error;
        toast.success("Card updated successfully!");
      } else {
        let { error } = await supabase.from("cards").insert([payloadWithTabloid]);
        if (error && isMissingColumnError(error)) {
          ({ error } = await supabase.from("cards").insert([payload]));
        }
        if (error) throw error;
        toast.success("Card saved successfully!");
      }

      if (!id) {
        reset();
        slide1.resetSlide1State?.();
        slide2.resetSlide2State?.();
        slide3.resetSlide3State?.();
        slide4.resetSlide4State?.();
      }
    } catch (err: any) {
      toast.error("Failed to save card: " + (err?.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: { md: "flex", sm: "block", xs: "block" },
          gap: "20px",
          justifyContent: "center",
          alignItems: { md: "center", sm: "stretch", xs: "stretch" },
          width: "100%",
          height: "auto",
          overflow: "hidden",
          mt: 2,
        }}
      >
        {/* Left — Preview (Slide-1 ONLY) */}
        <Box
          ref={previewRef}
          sx={{
            width: previewSize.width,
            height: previewSize.height,
            maxWidth: "100%",
            position: "relative",
            overflow: "hidden",
            borderRadius: "12px",
            boxShadow: "3px 5px 8px rgba(0,0,0,0.25)",
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <Slide1PreviewBox width={previewSize.width} height={previewSize.height} scale={1} />
        </Box>

        {/* Right — Form */}
        <Box
          component="form"
          sx={{
            width: { md: "500px", sm: "100%", xs: "100%" },
            maxWidth: "100%",
            mt: { md: 0, sm: 0, xs: 3 },
          }}
          onSubmit={handleSubmit(onSubmit)}
        >
          <CustomInput
            label="Card Name"
            placeholder="Enter your card name"
            defaultValue=""
            register={register("cardname", { required: "Card Name is required" })}
            error={errors.cardname?.message}
          />


          <Controller
            name="cardcategory"
            control={control}
            render={({ field }) => (
              <CustomInput
                label="Card Category"
                type="select"
                placeholder={isLoadingCats ? "Loading categories..." : isErrorCats ? "Failed to load categories" : "Cards"}
                value={field.value || "Cards"}
                onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                error={errors.cardcategory?.message}
                options={categoryOptions}
              />
            )}
          />

          <Controller
            name="subCategory"
            control={control}
            render={({ field }) => (
              <CustomInput
                label="Sub Category"
                type="select"
                placeholder={subCategoryOptions.length === 0 ? "No sub categories" : "Select sub category (optional)"}
                value={field.value ?? ""}
                onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                error={errors.subCategory?.message}
                options={subCategoryOptions}
              />
            )}
          />

          <Controller
            name="subSubCategory"
            control={control}
            render={({ field }) => (
              <CustomInput
                label="Sub Sub Category"
                type="select"
                placeholder={
                  !watch("subCategory")
                    ? "Select sub category first (optional)"
                    : subSubCategoryOptions.length === 0
                      ? "No sub-sub categories"
                      : "Select sub-sub category (optional)"
                }
                value={field.value ?? ""}
                onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                error={errors.subSubCategory?.message}
                options={subSubCategoryOptions}
              />
            )}
          />

          <CustomInput
            label="SKU"
            placeholder="Enter your SKU"
            defaultValue=""
            register={register("sku", { required: "SKU is required" })}
            error={errors.sku?.message}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(5, minmax(0, 1fr))",
              },
              gap: 1,
              alignItems: "start",
            }}
          >
            <CustomInput
              label="Actual Price"
              placeholder="Actual price"
              defaultValue=""
              type="number"
              register={register("actualprice", { required: "Actual Price is required", setValueAs: toFloat })}
              error={errors.actualprice?.message}
            />
            <CustomInput
              label="A4 Price"
              placeholder="A4 price"
              defaultValue=""
              type="number"
              register={register("a4price", { required: "A4 Price is required", setValueAs: toFloat })}
              error={errors.a4price?.message}
            />
            <CustomInput
              label="A3 Price"
              placeholder="A3 price"
              defaultValue=""
              type="number"
              register={register("a5price", { required: "A3 Price is required", setValueAs: toFloat })}
              error={errors.a5price?.message}
            />
            <CustomInput
              label="US Letter"
              placeholder="US Letter"
              defaultValue=""
              type="number"
              register={register("usletter", { required: "US Letter Price is required", setValueAs: toFloat })}
              error={errors.usletter?.message}
            />
            <CustomInput
              label="US Tabloid"
              placeholder="US Tabloid"
              defaultValue=""
              type="number"
              register={register("ustabloid", { setValueAs: toFloat })}
              error={errors.ustabloid?.message}
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(5, minmax(0, 1fr))",
              },
              gap: 1,
              alignItems: "start",
            }}
          >
            <CustomInput
              label="Sale Price"
              placeholder="Sale price"
              type="number"
              defaultValue=""
              register={register("saleprice", { setValueAs: toFloat })}
              error={errors.saleprice?.message}
            />
            <CustomInput
              label="Sale A4 Price"
              placeholder="A4 Price"
              type="number"
              defaultValue=""
              register={register("salea4price", { setValueAs: toFloat })}
              error={errors.salea4price?.message}
            />
            <CustomInput
              label="Sale A3 Price"
              placeholder="A3 Price"
              type="number"
              defaultValue=""
              register={register("salea5price", { setValueAs: toFloat })}
              error={errors.salea5price?.message}
            />
            <CustomInput
              label="Sale US Letter"
              placeholder="US Letter"
              type="number"
              defaultValue=""
              register={register("saleusletter", { setValueAs: toFloat })}
              error={errors.saleusletter?.message}
            />
            <CustomInput
              label="Sale US Tabloid"
              placeholder="US Tabloid"
              type="number"
              defaultValue=""
              register={register("saleustabloid", { setValueAs: toFloat })}
              error={errors.saleustabloid?.message}
            />
          </Box>

          <CustomInput
            label="Card description"
            placeholder="Enter your description"
            defaultValue=""
            register={register("description", { required: "Description is required" })}
            error={errors.description?.message}
            multiline
          />

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: { xs: "stretch", sm: "space-between" },
              alignItems: { xs: "stretch", sm: "center" },
              gap: 2,
              mt: 2,
            }}
          >
            <LandingButton
              title={isEditMode ? "Update Layout" : "Edit Layout"}
              personal
              width="200px"
              onClick={handleEditLayout}
              loading={editLoading}
            />
            <LandingButton
              title={isEditMode ? "Update & Publish" : "Save & Publish"}
              personal
              variant="outlined"
              width="250px"
              type="submit"
              loading={loading}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default NewCardsForm;
