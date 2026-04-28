import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  Divider,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { Close, UploadFileOutlined } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { COLORS } from "../../../../constant/color";
import CustomInput from "../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../components/LandingButton/LandingButton";
import { createBundleInDB, updateBundleInDB } from "../../../../lib/bundle";
import { supabase } from "../../../../supabase/supabase";

type Props = {
  open: boolean;
  onCloseModal: () => void;
  mode?: "add" | "edit";
  initial?: {
    id: string;
    name: string;
    image_base64?: string | null;
    main_categories?: string[] | null;
    sub_categories?: string[] | null;
    sub_sub_categories?: string[] | null;
  } | null;
  onSaved?: () => void;
};

type FormValues = {
  bundleName: string;
  bundleImage?: string;
};

type ProductItem = {
  key: string; // "card:123" | "template:456"
  item_type: "card" | "template";
  item_id: string;
  title: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
};

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: 560, sm: 560, xs: "95%" },
  maxHeight: "86vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "12px",
  p: 2,
  textAlign: "center" as const,
  overflowY: "auto" as const,
};

const norm = (s: any) => String(s ?? "").trim();
const lc = (s: any) => norm(s).toLowerCase();
const uniq = (arr: string[]) => Array.from(new Set(arr.map(norm).filter(Boolean)));

async function fetchBundleItemsKeys(bundleId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("bundle_items")
    .select("item_type,item_id")
    .eq("bundle_id", bundleId);

  if (error) throw error;
  return (data ?? []).map((r: any) => `${String(r.item_type)}:${String(r.item_id)}`);
}

async function fetchCategoriesLight(): Promise<any[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,subcategories,sub_subcategories,created_at");
  if (error) throw error;
  return data ?? [];
}

async function fetchCardsLight(): Promise<any[]> {
  const { data, error } = await supabase
    .from("cards")
    .select("id,cardname,cardcategory,subCategory,subSubCategory,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function fetchTemplatesLight(): Promise<any[]> {
  const { data, error } = await supabase
    .from("templetDesign")
    .select("id,title,category,subCategory,subSubCategory,created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

const BundleModal: React.FC<Props> = ({ open, onCloseModal, mode = "add", initial, onSaved }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const qc = useQueryClient();

  const didHydrateRef = useRef(false);
  const isHydratingRef = useRef(false);
  const didKeysHydrateRef = useRef(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      bundleName: initial?.name ?? "",
      bundleImage: initial?.image_base64 ?? undefined,
    },
    mode: "onSubmit",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_base64 ?? null);

  const [mainCategories, setMainCategories] = useState<string[]>(initial?.main_categories ?? []);
  const [subCategories, setSubCategories] = useState<string[]>(initial?.sub_categories ?? []);
  const [subSubCategories, setSubSubCategories] = useState<string[]>(initial?.sub_sub_categories ?? []);
  const [selectedProductKeys, setSelectedProductKeys] = useState<string[]>([]);

  const bundleId = initial?.id ? String(initial.id) : "";

  const { data: existingKeys = [] } = useQuery({
    queryKey: ["bundle_items_keys", bundleId],
    queryFn: () => fetchBundleItemsKeys(bundleId),
    enabled: open && mode === "edit" && !!bundleId,
    staleTime: 0,
  });

  const { data: categories = [], isLoading: isLoadingCats, isError: isErrorCats } = useQuery({
    queryKey: ["categories:light"],
    queryFn: fetchCategoriesLight,
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: true,
    enabled: open,
  });

  const { data: cards = [] } = useQuery<any[]>({
    queryKey: ["cards:light"],
    queryFn: fetchCardsLight,
    staleTime: 1000 * 60 * 10,
    enabled: open,
  });

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["templates:light"],
    queryFn: fetchTemplatesLight,
    staleTime: 1000 * 60 * 10,
    enabled: open,
  });

  const allProducts = useMemo<ProductItem[]>(() => {
    const cardItems: ProductItem[] = (cards ?? []).map((c: any) => ({
      key: `card:${String(c.id)}`,
      item_type: "card",
      item_id: String(c.id),
      title: norm(c.cardname) || `Card #${String(c.id)}`,
      category: norm(c.cardcategory),
      subCategory: norm(c.subCategory),
      subSubCategory: norm(c.subSubCategory),
    }));

    const tplItems: ProductItem[] = (templates ?? []).map((t: any) => ({
      key: `template:${String(t.id)}`,
      item_type: "template",
      item_id: String(t.id),
      title: norm(t.title) || `Template #${String(t.id)}`,
      category: norm(t.category),
      subCategory: norm(t.subCategory),
      subSubCategory: norm(t.subSubCategory),
    }));

    return [...cardItems, ...tplItems];
  }, [cards, templates]);

 const mainCategoryOptions = useMemo(() => {
  const base = categories.map((c: any) => norm(c?.name)).filter(Boolean);
  const selected = (mainCategories ?? []).map(norm).filter(Boolean);
  return Array.from(new Set([...base, ...selected]));
}, [categories, mainCategories]);

  const selectedCategoryRows = useMemo(() => {
    const set = new Set(mainCategories.map(lc));
    return categories.filter((c: any) => set.has(lc(c?.name)));
  }, [categories, mainCategories]);

  const subCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const cat of selectedCategoryRows) {
      const list = cat?.subcategories ?? [];
      for (const x of list) {
        const t = norm(x);
        if (t) set.add(t);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [selectedCategoryRows]);


  const subSubCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const cat of selectedCategoryRows) {
      const map = cat?.sub_subcategories ?? {};
      for (const sub of subCategories) {
        const arr = map?.[sub] ?? [];
        for (const item of arr) {
          const t = norm(item);
          if (t) set.add(t);
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [selectedCategoryRows, subCategories]);

  const filteredProducts = useMemo(() => {
    const mains = new Set(mainCategories.map(lc));
    if (!mains.size) return [];

    const subs = new Set(subCategories.map(lc));
    const subsubs = new Set(subSubCategories.map(lc));

    return allProducts
      .filter((p) => mains.has(lc(p.category)))
      .filter((p) => (subs.size ? subs.has(lc(p.subCategory)) : true))
      .filter((p) => (subsubs.size ? subsubs.has(lc(p.subSubCategory)) : true))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allProducts, mainCategories, subCategories, subSubCategories]);

  const selectedProducts = useMemo(() => {
    const set = new Set(selectedProductKeys);
    return allProducts.filter((p) => set.has(p.key));
  }, [allProducts, selectedProductKeys]);

  // ✅ reset refs on close (very important)
  useEffect(() => {
    if (!open) {
      didHydrateRef.current = false;
      didKeysHydrateRef.current = false;
      isHydratingRef.current = false;
    }
  }, [open]);

  // ✅ hydrate on open
  useEffect(() => {
    if (!open) return;
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;

    isHydratingRef.current = true;

    reset({
      bundleName: norm(initial?.name ?? ""),
      bundleImage: initial?.image_base64 ?? undefined,
    });

    setImagePreview(initial?.image_base64 ?? null);

    setMainCategories((initial?.main_categories ?? []).map(norm).filter(Boolean));
    setSubCategories((initial?.sub_categories ?? []).map(norm).filter(Boolean));
    setSubSubCategories((initial?.sub_sub_categories ?? []).map(norm).filter(Boolean));

    setSelectedProductKeys([]); // will hydrate when existingKeys arrive

    if (fileInputRef.current) fileInputRef.current.value = "";

    setTimeout(() => {
      isHydratingRef.current = false;
    }, 0);
  }, [open, initial?.id, reset]);

  // ✅ hydrate bundle_items keys when fetched
  useEffect(() => {
    if (!open || mode !== "edit") return;
    if (!existingKeys?.length) return;
    if (didKeysHydrateRef.current) return;

    didKeysHydrateRef.current = true;
    setSelectedProductKeys(existingKeys);
  }, [open, mode, existingKeys]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = String(reader.result);
      setImagePreview(base64);
      setValue("bundleImage", base64, { shouldDirty: true, shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const mutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      name: string;
      image_base64: string | null;
      main_categories: string[];
      sub_categories: string[];
      sub_sub_categories: string[];
      product_keys: string[];
    }) => {
      if (mode === "edit") return updateBundleInDB(payload as any);
      return createBundleInDB(payload as any);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["bundles"] });
      await qc.invalidateQueries({ queryKey: ["bundles:list"] });
      toast.success(mode === "edit" ? "Bundle updated ✅" : "Bundle added ✅");
      onSaved?.();
      onCloseModal();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to save bundle.");
    },
  });

  const onSubmit = async (data: FormValues) => {
    const name = norm(data.bundleName);
    const image = imagePreview ?? data.bundleImage ?? "";

    if (!name) return toast.error("Bundle name is required.");
    if (mode === "add" && !image) return toast.error("Bundle image is required.");

    if (!mainCategories.length) return toast.error("Please select main categories.");
    if (!subCategories.length) return toast.error("Please select at least 1 sub category.");
    if (!subSubCategories.length) return toast.error("Please select at least 1 sub-sub category.");

    await mutation.mutateAsync({
      id: initial?.id,
      name,
      image_base64: image || null,
      main_categories: uniq(mainCategories),
      sub_categories: uniq(subCategories),
      sub_sub_categories: uniq(subSubCategories),
      product_keys: uniq(selectedProductKeys),
    });
  };

  console.log("INIT mains", initial?.main_categories);

  const isSaving = isSubmitting || mutation.isPending;

  return (
    <Modal open={open} onClose={onCloseModal}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={style}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 800 }}>
            {mode === "edit" ? "Edit Bundle" : "Add Bundle"}
          </Typography>

          <IconButton sx={{ color: COLORS.black }} onClick={onCloseModal}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Box
          sx={{
            borderRadius: 2,
            border: `1px solid ${errors.bundleImage ? "red" : "lightGray"}`,
            overflow: "hidden",
            position: "relative",
            "&:hover .overlay": { opacity: 1 },
            "&:hover .upload-btn": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
          }}
        >
          <Box
            component="img"
            src={imagePreview || "/assets/images/winter.avif"}
            alt="bundle-img"
            sx={{ width: "100%", height: 220, objectFit: "fill" }}
          />

          <input
            type="hidden"
            {...register("bundleImage", {
              validate: (v) => {
                const has = Boolean(imagePreview || v);
                if (mode === "add") return has || "Bundle image is required.";
                return true;
              },
            })}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            id="bundle-image-upload"
            onChange={handleImageUpload}
          />

          <Box className="overlay" sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.35)", opacity: 0, transition: "0.3s" }} />

          <IconButton
            className="upload-btn"
            component="label"
            htmlFor="bundle-image-upload"
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) scale(0.6)",
              transition: "0.3s",
              opacity: 0,
              zIndex: 1,
              bgcolor: COLORS.primary,
              color: "#fff",
              "&:hover": { bgcolor: COLORS.primary },
            }}
          >
            <UploadFileOutlined sx={{ fontSize: 32 }} />
          </IconButton>
        </Box>

        <Box sx={{ mt: 2 }}>
          <CustomInput
            label="Bundle name"
            placeholder="Enter bundle name"
            register={register("bundleName", { required: "Bundle name is required." })}
            error={errors.bundleName?.message as string}
          />
        </Box>

        <Box sx={{ mt: 2, textAlign: "left" }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 0.5 }}>
            Main Categories (Multiple)
          </Typography>

          <Autocomplete
            multiple
            options={mainCategoryOptions}
            value={mainCategories}
            onChange={(_, v) => setMainCategories(v)}
            loading={isLoadingCats}
            isOptionEqualToValue={(o, v) => lc(o) === lc(v)} 
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip {...getTagProps({ index })} key={`${option}-${index}`} label={option} sx={{ borderRadius: 999 }} />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder={
                  isLoadingCats
                    ? "Loading categories..."
                    : isErrorCats
                      ? "Failed to load categories"
                      : "Select multiple main categories"
                }
                error={Boolean(isErrorCats)}
              />
            )}
            sx={{ bgcolor: "#fff", borderRadius: 2 }}
          />

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 0.5 }}>
              Sub Categories (Multiple)
            </Typography>

            <Autocomplete
              multiple
              options={subCategoryOptions}
              value={subCategories}
              onChange={(_, value) => setSubCategories(value)}
              disabled={!mainCategories.length || subCategoryOptions.length === 0}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip {...getTagProps({ index })} key={`${option}-${index}`} label={option} sx={{ borderRadius: 999 }} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={
                    !mainCategories.length
                      ? "Select main categories first"
                      : subCategoryOptions.length === 0
                        ? "No sub categories"
                        : "Select multiple sub categories"
                  }
                />
              )}
              sx={{ bgcolor: "#fff", borderRadius: 2 }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 0.5 }}>
              Sub-Sub Categories (Multiple)
            </Typography>

            <Autocomplete
              multiple
              options={subSubCategoryOptions}
              value={subSubCategories}
              onChange={(_, value) => setSubSubCategories(value)}
              disabled={!mainCategories.length || subCategories.length === 0 || subSubCategoryOptions.length === 0}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={`${option}-${index}`}
                    label={option}
                    color="primary"
                    variant="outlined"
                    sx={{ borderRadius: 999 }}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={
                    !mainCategories.length
                      ? "Select main categories first"
                      : subCategories.length === 0
                        ? "Select sub categories first"
                        : subSubCategoryOptions.length === 0
                          ? "No sub-sub categories"
                          : "Select multiple sub-sub categories"
                  }
                />
              )}
              sx={{ bgcolor: "#fff", borderRadius: 2 }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 0.5 }}>
              Products (Multiple)
            </Typography>

            <Autocomplete
              multiple
              options={filteredProducts}
              value={selectedProducts}
              onChange={(_, value) => setSelectedProductKeys(value.map((v) => v.key))}
              disabled={!mainCategories.length}
              getOptionLabel={(opt) => norm(opt?.title) || `${opt?.item_type ?? "item"} #${opt?.item_id ?? ""}`}
              isOptionEqualToValue={(o, v) => o.key === v.key}
              renderOption={(props, option) => (
                <li {...props} key={option.key}>
                  {option.title}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={
                    !mainCategories.length
                      ? "Select main categories first"
                      : filteredProducts.length === 0
                        ? "No matching products"
                        : "Select multiple products"
                  }
                />
              )}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
          <LandingButton title="Cancel" variant="outlined" width="200px" personal onClick={onCloseModal} />
          <LandingButton
            title={isSaving ? "Saving..." : mode === "edit" ? "Update Bundle" : "Add Bundle"}
            width="200px"
            personal
            type="submit"
            loading={isSaving}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default BundleModal;
