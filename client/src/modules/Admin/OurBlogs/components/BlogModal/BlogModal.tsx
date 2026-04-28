
import { useEffect, useRef, useState } from "react";
import { Close, UploadFileOutlined } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import { COLORS } from "../../../../../constant/color";
import CustomInput from "../../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../../components/LandingButton/LandingButton";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { supabase } from "../../../../../supabase/supabase";
import { useQueryClient } from "@tanstack/react-query";



type BlogRow = {
  id: number;
  image_base64: string | null;
  title: string;
  category: string;
  short_description?: string | null;
  long_description?: string | null;
};

type Props = {
  open: boolean;
  onCloseModal: () => void;
  title?: string;
  mode?: "add" | "edit";
  initial?: BlogRow | null;
};

type FormVals = {
  title: string;
  blogCategory: string;
  shortDescription?: string;
  longDescription?: string;
  imageBase64: string;
};

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: 900, sm: 700, xs: "95%" },
  height: { md: 600, sm: 500, xs: "300" },
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "8px",
  p: 2,
  textAlign: "center" as const,
  overflowY: "auto" as const,
};

const BlogsModal = ({ open, onCloseModal, mode = "add", initial = null }: Props) => {
  const queryClient = useQueryClient();


  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormVals>({
    defaultValues: {
      title: initial?.title || "",
      blogCategory: initial?.category || "",
      shortDescription: initial?.short_description || "",
      longDescription: initial?.long_description || "",
      imageBase64: initial?.image_base64 || "",
    },
  });

  const [imagePreview, setImagePreview] = useState<string | null>(initial?.image_base64 || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Rehydrate when switching add <-> edit or opening
  useEffect(() => {
    reset({
      title: initial?.title || "",
      blogCategory: initial?.category || "",
      shortDescription: initial?.short_description || "",
      longDescription: initial?.long_description || "",
      imageBase64: initial?.image_base64 || "",
    });
    setImagePreview(initial?.image_base64 || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    // Clear image error if edit mode already has an image
    if (mode === "edit" && (initial?.image_base64 || "").length > 0) {
      clearErrors("imageBase64");
    }
  }, [initial, open, reset, mode, clearErrors]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = String(reader.result || "");
      setImagePreview(base64);
      setValue("imageBase64", base64, { shouldValidate: true });
      clearErrors("imageBase64");
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: FormVals) => {
    // Image required in add mode
    if (mode === "add" && !imagePreview) {
      setError("imageBase64", { type: "required", message: "Image is required." });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        image_base64: imagePreview ?? null,
        title: data.title?.trim() || "",
        category: data.blogCategory?.trim() || "",
        short_description: data.shortDescription?.trim() || "",
        long_description: data.longDescription?.trim() || "",
      };

      if (mode === "edit" && initial?.id) {
        const { error } = await supabase.from("blogs").update(payload).eq("id", initial.id);
        if (error) throw error;
        toast.success("Blog updated successfully!");
      } else {
        const { error } = await supabase.from("blogs").insert([payload]);
        if (error) throw error;
        toast.success("Blog added successfully!");
      }

      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      onCloseModal();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save blog.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onCloseModal}>
      <Box
        sx={{
          ...style,
          "&::-webkit-scrollbar": { height: "6px", width: "6px" },
          "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1", borderRadius: "20px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: COLORS.primary, borderRadius: "20px" },
        }}
        component="form"
        onSubmit={handleSubmit(onSubmit)}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
            {mode === "edit" ? "Edit Blog" : "Add Blog"}
          </Typography>
          <IconButton sx={{ color: COLORS.black }} onClick={onCloseModal}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ display: { md: "flex", sm: "flex", xs: "block" }, width: "100%", height: { md: "95%", sm: "95%", xs: 400 }, gap: 1 }}>
          {/* Image Upload with validation */}
          <Box
            sx={{
              borderRadius: 2,
              border: `1px solid ${errors.imageBase64 ? "red" : "lightGray"}`,
              overflow: "hidden",
              position: "relative",
              width: "100%",
              cursor: "pointer",
              "&:hover .overlay": { opacity: 1 },
              "&:hover .upload-btn": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Box
              component="img"
              src={imagePreview || "/assets/images/animated-banner.jpg"}
              alt="blog-img"
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              id="blog-image-upload"
              onChange={handleImageUpload}
            />

            <Box className="overlay" sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.4)", opacity: 0, transition: "0.3s ease" }} />

            <IconButton
              className="upload-btn"
              component="label"
              htmlFor="blog-image-upload"
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(0.6)",
                transition: "0.3s ease",
                opacity: 0,
                zIndex: 2,
                bgcolor: COLORS.primary,
                color: "#fff",
                "&:hover": { bgcolor: COLORS.primary },
              }}
            >
              <UploadFileOutlined sx={{ fontSize: 35 }} />
            </IconButton>

            {/* Image helper text */}
            {errors.imageBase64 && (
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  bottom: 6,
                  left: 8,
                  bgcolor: "rgba(255,255,255,0.9)",
                  px: 1,
                  borderRadius: 1,
                  color: "red",
                }}
              >
                {errors.imageBase64.message}
              </Typography>
            )}
          </Box>

          {/* Right Form */}
          <Box sx={{ width: "100%" }}>
            <CustomInput
              label="Title"
              placeholder="Enter your blog title"
              register={register("title", { required: "Title is required" })}
              error={errors.title?.message}
            />

            {/* Category via Controller to get proper select validation */}
            <Controller
              name="blogCategory"
              control={control}
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <CustomInput
                  label="Blog Category"
                  type="select"
                  placeholder="Select category"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange((e.target as HTMLInputElement).value)}
                  error={errors.blogCategory?.message}
                  options={[
                    { label: "Birthday Cards", value: "Birthday Cards" },
                    { label: "Birthday Gift", value: "Birthday Gift" },
                    { label: "Kids Birthday Cards", value: "Kids Birthday Cards" },
                    { label: "Kids Birthday Gift", value: "Kids Birthday Gift" },
                    { label: "Letter box", value: "Letter box" },
                    { label: "Under £30", value: "Under £30" },
                    { label: "Under £60", value: "Under £60" },
                  ]}
                />
              )}
            />

            <CustomInput
              label="Description 1"
              placeholder="Enter your short description"
              register={register("shortDescription",{required:'Short description is required'})}
              
            />
            <CustomInput
              label="Description 2"
              placeholder="Enter your long description"
              register={register("longDescription")}
              multiline
            />

            {/* Hidden field used purely for image validation */}
            <input
              type="hidden"
              {...register("imageBase64", {
                validate: (v) => {
                  if (mode === "add" && !v) return "Image is required";
                  return true;
                },
              })}
            />

            <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
              <LandingButton title="Cancel" variant="outlined" width="250px" personal onClick={onCloseModal} />
              <LandingButton
                title={loading ? (mode === "edit" ? "Updating..." : "Saving...") : (mode === "edit" ? "Update Blog" : "Add Blog")}
                width="250px"
                personal
                type="submit"
                loading={loading}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default BlogsModal;
