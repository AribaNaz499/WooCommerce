// File: src/pages/dashboard/categories/components/CategoryModal/CategoryModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { Close, UploadFileOutlined } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { supabase } from "../../../../../supabase/supabase";
import { COLORS } from "../../../../../constant/color";
import CustomInput from "../../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../../components/LandingButton/LandingButton";

type SubSubMap = Record<string, string[]>;

type Props = {
  open: boolean;
  onCloseModal: () => void;
  mode?: "add" | "edit";
  initial?:
    | {
        id: string;
        name: string;
        image_base64?: string | null;
        subcategories?: string[] | null;
        sub_subcategories?: SubSubMap | null;
      }
    | null;
  onSaved?: () => void;
  allSubcategoryOptions?: string[];
  subSubSuggestions?: SubSubMap;
};

type FormValues = {
  category: string;
  image?: string;
  subCategories?: string[];
};

const MAX_CHIPS = 50;
const MUG_DEFAULT_SUBS = ["Initials/Name", "Slogans"];

// --- helpers ---
const tokenize = (text: string): string[] =>
  text
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);

const normalizeAdd = (
  existing: string[],
  incoming: string[],
  limit: number
): string[] => {
  // why: ensure case-insensitive uniqueness and respect max size
  const lowerExisting = new Set(existing.map((v) => v.toLowerCase()));
  const dedupIncoming: string[] = [];
  for (const t of incoming) {
    const tl = t.toLowerCase();
    if (!lowerExisting.has(tl) && !dedupIncoming.map((x) => x.toLowerCase()).includes(tl)) {
      dedupIncoming.push(t);
    }
  }
  const room = Math.max(0, limit - existing.length);
  return room === 0 ? existing : [...existing, ...dedupIncoming.slice(0, room)];
};

const ensureMugSubs = (category: string, current: string[]) => {
  if (!/mug/i.test(category)) return current;
  const lower = new Set(current.map((v) => v.toLowerCase()));
  const next = [...current];
  for (const label of MUG_DEFAULT_SUBS) {
    const key = label.toLowerCase();
    if (!lower.has(key)) {
      next.push(label);
      lower.add(key);
    }
  }
  return next.slice(0, MAX_CHIPS);
};

const CategoryModal: React.FC<Props> = ({
  open,
  onCloseModal,
  mode = "add",
  initial,
  onSaved,
  allSubcategoryOptions = [],
  subSubSuggestions = {},
}) => {
  /* ---------------- RHF ---------------- */
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
    clearErrors,
    setError,
  } = useForm<FormValues>({
    defaultValues: {
      category: initial?.name ?? "",
      image: initial?.image_base64 ?? undefined,
      subCategories: initial?.subcategories ?? [],
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  /* ---------------- Local state ---------------- */
  const [imagePreview, setImagePreview] = useState<string | null>(
    initial?.image_base64 ?? null
  );
  const [subs, setSubs] = useState<string[]>(initial?.subcategories ?? []);
  const [subsInput, setSubsInput] = useState<string>(""); // NEW: subcategories input buffer

  const [subSubMap, setSubSubMap] = useState<SubSubMap>(
    initial?.sub_subcategories ?? {}
  );
  const [subSubInputMap, setSubSubInputMap] = useState<Record<string, string>>(
    {}
  ); // NEW: input buffers per sub

  const [expanded, setExpanded] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue("subCategories", subs, { shouldDirty: true, shouldValidate: false });
  }, [subs, setValue]);

  const watchedCategory = watch("category");
  useEffect(() => {
    const cat = String(watchedCategory ?? "").trim();
    if (!cat) return;
    setSubs((cur) => ensureMugSubs(cat, cur));
  }, [watchedCategory]);

  // rehydrate on open/initial change
  useEffect(() => {
    reset({
      category: initial?.name ?? "",
      image: initial?.image_base64 ?? undefined,
      subCategories: initial?.subcategories ?? [],
    });
    setImagePreview(initial?.image_base64 ?? null);
    setSubs(initial?.subcategories ?? []);
    setSubsInput("");
    setSubSubMap(initial?.sub_subcategories ?? {});
    setSubSubInputMap({});
    if (fileInputRef.current) fileInputRef.current.value = "";
    clearErrors();
  }, [initial, open, mode, reset, clearErrors]);

  // prune children when a sub is removed
  useEffect(() => {
    setSubSubMap((prev) => {
      const keep = new Set(subs);
      const next: SubSubMap = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (keep.has(k)) next[k] = v;
      });
      return next;
    });
    setSubSubInputMap((prev) => {
      const keep = new Set(subs);
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (keep.has(k)) next[k] = v;
      });
      return next;
    });
    if (expanded && !subs.includes(expanded)) setExpanded(null);
  }, [subs, expanded]);

  /* ---------------- Image handlers ---------------- */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = String(reader.result);
      setImagePreview(base64);
      setValue("image", base64, { shouldDirty: true, shouldValidate: true });
      clearErrors("image");
    };
    reader.readAsDataURL(file);
  };

  /* ---------------- Save (Supabase) ---------------- */
  const addMutation = useMutation({
    mutationKey: ["categories:add"],
    mutationFn: async (payload: {
      category: string;
      image: string;
      subCategories: string[];
      subSubCategories: SubSubMap;
    }) => {
      const { error } = await supabase.from("categories").insert([
        {
          name: payload.category,
          image_base64: payload.image,
          subcategories: payload.subCategories,
          sub_subcategories: payload.subSubCategories, // jsonb
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category stored successfully!");
      onSaved?.();
      onCloseModal();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to store category.");
    },
  });

  const updateMutation = useMutation({
    mutationKey: ["categories:update"],
    mutationFn: async (payload: {
      category: string;
      image?: string | null;
      subCategories: string[];
      subSubCategories: SubSubMap;
    }) => {
      if (!initial?.id) throw new Error("Missing category id");
      const { error } = await supabase
        .from("categories")
        .update({
          name: payload.category,
          image_base64: payload.image ?? null,
          subcategories: payload.subCategories,
          sub_subcategories: payload.subSubCategories,
        })
        .eq("id", initial.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category updated successfully!");
      onSaved?.();
      onCloseModal();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to update category.");
    },
  });

  const validateImageRequired = (currentImage?: string | null) => {
    const hasImage = Boolean(currentImage);
    if (mode === "add" && !hasImage) {
      setError("image", { type: "required", message: "Category image is required." });
      return false;
    }
    if (mode === "edit" && !hasImage && !initial?.image_base64) {
      setError("image", { type: "required", message: "Category image is required." });
      return false;
    }
    clearErrors("image");
    return true;
  };

  const onSubmit = async (data: FormValues) => {
    const category = (data.category ?? "").trim();
    if (!category) return;

    if (!validateImageRequired(imagePreview || data.image)) return;

    // commit any pending inputs before save
    if (subsInput.trim()) {
      setSubs((cur) => normalizeAdd(cur, tokenize(subsInput), MAX_CHIPS));
      setSubsInput("");
    }
    Object.entries(subSubInputMap).forEach(([k, v]) => {
      if (v?.trim()) {
        setSubSubMap((cur) => {
          const current = cur[k] ?? [];
          return { ...cur, [k]: normalizeAdd(current, tokenize(v), MAX_CHIPS) };
        });
      }
    });
    setSubSubInputMap({});

    const payload = {
      category,
      image: imagePreview || data.image!, // prefer latest picked
      subCategories: ensureMugSubs(category, subs),
      subSubCategories: subSubMap,
    };

    if (mode === "edit") {
      await updateMutation.mutateAsync(payload);
    } else {
      await addMutation.mutateAsync(payload as Required<typeof payload>);
    }
  };

  const isSaving = isSubmitting || addMutation.isPending || updateMutation.isPending;

  /* ---------------- Subcategories input handlers ---------------- */
  const commitSubsFromInput = () => {
    if (!subsInput.trim()) return;
    setSubs((cur) => normalizeAdd(cur, tokenize(subsInput), MAX_CHIPS));
    setSubsInput("");
  };

  const handleSubsKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); // why: stop Autocomplete from submitting form / adding raw comma
      commitSubsFromInput();
    }
  };

  const handleSubsPaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    const text = e.clipboardData?.getData("text") ?? "";
    if (/[,\n;]/.test(text)) {
      e.preventDefault(); // why: replace default paste with tokenized chips
      const tokens = tokenize(text);
      setSubs((cur) => normalizeAdd(cur, tokens, MAX_CHIPS));
    }
  };

  const handleSubsBlur: React.FocusEventHandler<HTMLInputElement> = () => {
    commitSubsFromInput();
  };

  /* ---------------- Sub-Sub input handlers (per sub) ---------------- */
  const getChildInput = (sub: string) => subSubInputMap[sub] ?? "";
  const setChildInput = (sub: string, v: string) =>
    setSubSubInputMap((m) => ({ ...m, [sub]: v }));

  const commitChildFromInput = (sub: string) => {
    const buf = getChildInput(sub);
    if (!buf.trim()) return;
    setSubSubMap((m) => {
      const current = m[sub] ?? [];
      return { ...m, [sub]: normalizeAdd(current, tokenize(buf), MAX_CHIPS) };
    });
    setChildInput(sub, "");
  };

  const makeChildKeyDown =
    (sub: string): React.KeyboardEventHandler<HTMLInputElement> =>
    (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        commitChildFromInput(sub);
      }
    };

  const makeChildPaste =
    (sub: string): React.ClipboardEventHandler<HTMLInputElement> =>
    (e) => {
      const text = e.clipboardData?.getData("text") ?? "";
      if (/[,\n;]/.test(text)) {
        e.preventDefault();
        const tokens = tokenize(text);
        setSubSubMap((m) => {
          const current = m[sub] ?? [];
          return { ...m, [sub]: normalizeAdd(current, tokens, MAX_CHIPS) };
        });
      }
    };

  const makeChildBlur =
    (sub: string): React.FocusEventHandler<HTMLInputElement> =>
    () => {
      commitChildFromInput(sub);
    };

  /* ---------------- Render ---------------- */
  return (
    <Modal open={open} onClose={onCloseModal}>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={style}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
            {mode === "edit" ? "Edit Category" : "Add Category"}
          </Typography>
          <IconButton sx={{ color: COLORS.black }} onClick={onCloseModal}>
            <Close />
          </IconButton>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Image (required) */}
        <Box
          sx={{
            borderRadius: 2,
            border: `1px solid ${errors.image ? "red" : "lightGray"}`,
            overflow: "hidden",
            position: "relative",
            cursor: "pointer",
            "&:hover .overlay": { opacity: 1 },
            "&:hover .upload-btn": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
          }}
          // onClick={() => fileInputRef.current?.click()}
        >
          <Box
            component="img"
            src={imagePreview || "/assets/images/animated-banner.jpg"}
            alt="category-img"
            sx={{ width: "100%", height: 220, objectFit: "cover" }}
          />

          {/* Hidden field so RHF can validate */}
          <input
            type="hidden"
            {...register("image", {
              validate: (v) => {
                const has = Boolean(imagePreview || v);
                if (mode === "add") return has || "Category image is required.";
                if (mode === "edit")
                  return has || Boolean(initial?.image_base64) || "Category image is required.";
                return true;
              },
            })}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            id="category-image-upload"
            onChange={handleImageUpload}
          />

          <Box
            className="overlay"
            sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.35)", opacity: 0, transition: "0.3s" }}
          />
          <IconButton
            className="upload-btn"
            component="label"
            htmlFor="category-image-upload"
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

        {errors.image?.message && (
          <Typography sx={{ mt: 0.5, color: "red", textAlign: "left", fontSize: 13 }}>
            {String(errors.image.message)}
          </Typography>
        )}

        <br />

        {/* Main category name (free text only) */}
        <CustomInput
          label="Main Category"
          placeholder="Type category name (e.g., Birthday)"
          register={register("category", {
            required: "Category name is required.",
            minLength: { value: 2, message: "Min 2 characters." },
            maxLength: { value: 120, message: "Max 120 characters." },
          })}
          error={errors.category?.message as string}
        />

        {/* Sub-categories (freeSolo chips) */}
        <Typography sx={{ textAlign: "start", fontSize: 14, fontWeight: 700, mt: 2 }}>
          Sub Categories
        </Typography>
        <Autocomplete
          multiple
          freeSolo
          options={allSubcategoryOptions}
          value={subs}
          onChange={(_, value) => {
            const next = Array.from(
              new Set((value || []).map(String).map((v) => v.trim()).filter(Boolean))
            ).slice(0, MAX_CHIPS);
            setSubs(next);
            setValue("subCategories", next, { shouldDirty: true });
          }}
          inputValue={subsInput} // NEW
          onInputChange={(_, v) => setSubsInput(v)} // NEW
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                variant="filled"
                sx={{ borderRadius: "8px" }}
                label={option}
                {...getTagProps({ index })}
                key={`${option}-${index}`}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              placeholder={
                subs.length === 0
                  ? "Type or pick (use comma or Enter)"
                  : "Add more… (comma or Enter)"
              }
              sx={{ mt: 0.5, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              onKeyDown={(e) => {
                params.inputProps.onKeyDown?.(e as any);
                handleSubsKeyDown(e as any);
              }}
              onPaste={(e) => {
                handleSubsPaste(e as any);
              }}
              onBlur={(e) => {
                handleSubsBlur(e as any);
              }}
            />
          )}
          disableCloseOnSelect
          filterSelectedOptions
        />

        {/* Sub-sub per sub (collapsible, freeSolo) */}
        <Typography sx={{ textAlign: "start", fontSize: 14, fontWeight: 700, mt: 2 }}>
          Sub-Sub Categories (per sub)
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {subs.length === 0 && (
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              Add some sub categories first.
            </Typography>
          )}

          {subs.map((sub) => {
            const suggestions = subSubSuggestions[sub] ?? []; // optional suggestions
            const selected = subSubMap[sub] ?? [];
            const isOpen = expanded === sub;
            const childInput = getChildInput(sub);

            return (
              <Box
                key={sub}
                sx={{ border: "1px solid #e0e0e0", borderRadius: 1.5, p: 1, bgcolor: "#fafafa" }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpanded(isOpen ? null : sub)}
                >
                  <Typography sx={{ fontWeight: 700 }}>{sub}</Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    {selected.length ? `${selected.length} selected` : "none"}
                  </Typography>
                </Box>

                <Collapse in={isOpen} unmountOnExit>
                  <Autocomplete
                    multiple
                    freeSolo
                    options={suggestions}
                    value={selected}
                    onChange={(_, value) => {
                      const next = Array.from(
                        new Set((value || []).map(String).map((v) => v.trim()).filter(Boolean))
                      ).slice(0, MAX_CHIPS);
                      setSubSubMap((m) => ({ ...m, [sub]: next }));
                    }}
                    inputValue={childInput} // NEW
                    onInputChange={(_, v) => setChildInput(sub, v)} // NEW
                    renderTags={(tagValue, getTagProps) =>
                      tagValue.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={`${sub}-${option}-${index}`}
                          label={option}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder={
                          selected.length
                            ? "Add more… (comma or Enter)"
                            : "Type child (comma or Enter)"
                        }
                        sx={{ mt: 1 }}
                        onKeyDown={(e) => {
                          params.inputProps.onKeyDown?.(e as any);
                          makeChildKeyDown(sub)(e as any);
                        }}
                        onPaste={(e) => {
                          makeChildPaste(sub)(e as any);
                        }}
                        onBlur={(e) => {
                          makeChildBlur(sub)(e as any);
                        }}
                      />
                    )}
                    disableCloseOnSelect
                    filterSelectedOptions
                  />
                </Collapse>
              </Box>
            );
          })}
        </Box>

        {/* Actions */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 2 }}>
          <LandingButton title="Cancel" variant="outlined" width="200px" personal onClick={onCloseModal} />
          <LandingButton
            title={
              mode === "edit"
                ? updateMutation.isPending
                  ? "Updating..."
                  : "Update Category"
                : addMutation.isPending
                ? "Saving..."
                : "Add Category"
            }
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

export default CategoryModal;

/* -------------------- styles -------------------- */
const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: 500, sm: 500, xs: "95%" },
  maxHeight: "86vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "8px",
  p: 2,
  textAlign: "center" as const,
  overflowY: "auto" as const,
};
