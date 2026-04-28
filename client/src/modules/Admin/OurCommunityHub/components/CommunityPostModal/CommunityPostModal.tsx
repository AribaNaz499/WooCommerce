import { useState } from "react";
import { Close, UploadFileOutlined } from "@mui/icons-material";
import { Box, IconButton, Modal, Typography } from "@mui/material";
import { COLORS } from "../../../../../constant/color";
import CustomInput from "../../../../../components/CustomInput/CustomInput";
import LandingButton from "../../../../../components/LandingButton/LandingButton";
import { useForm } from "react-hook-form";
import { supabase } from "../../../../../supabase/supabase";
import toast from "react-hot-toast";

type ModalType = { open: boolean; onCloseModal: () => void; title?: string };

type FormValues = {
    image_base64: string;
    postTitle: string;
    adminThought: string;
};

const CommunityPostModal = ({ open, onCloseModal, title }: ModalType) => {
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        formState: { errors, isSubmitting },
        clearErrors,
        setError,
    } = useForm<FormValues>({ mode: "onSubmit" });

    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("image_base64", { type: "validate", message: "Only image files are allowed" });
            toast.error("Please select a valid image file.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = String(reader.result || "");
            setImagePreview(base64);
            setValue("image_base64", base64, { shouldValidate: true });
            clearErrors("image_base64"); // why: ensure UI clears any previous error after a valid select
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data: FormValues) => {
        const payload = {
            image_base64: data.image_base64,
            post_title: data.postTitle,
            admin_thought: data.adminThought,
            created_by: "Admin",
        };

        const { error } = await supabase.from("topics").insert([payload]);
        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Post added successfully!");
        reset();
        setImagePreview(null);
        onCloseModal();
    };

    return (
        <Modal open={open} onClose={onCloseModal}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ ...style, overflowY: "scroll" }}>
                {/* Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography sx={{ fontSize: 20, fontWeight: 700 }}>{title}</Typography>
                    <IconButton sx={{ color: COLORS.black }} onClick={onCloseModal}>
                        <Close />
                    </IconButton>
                </Box>

                <br />

                {/* -------- Image Upload Box -------- */}
                <Box
                    sx={{
                        borderRadius: 2,
                        overflow: "hidden",
                        position: "relative",
                        cursor: "pointer",
                        "&:hover .overlay": { opacity: 1 },
                        "&:hover .upload-btn": { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
                        border: errors.image_base64 ? `2px solid red` : "none",
                    }}
                >
                    <Box
                        component="img"
                        src={imagePreview || "/assets/images/animated-banner.jpg"}
                        alt="post-img"
                        sx={{ width: "100%", height: 300, objectFit: "cover" }}
                    />

                    {/* Hidden file input */}
                    <input type="file" accept="image/*" hidden id="post-image-upload" onChange={handleImageUpload} />

                    {/* Register hidden field for validation */}
                    <input
                        type="hidden"
                        {...register("image_base64", { required: "Image is required" })}
                    />

                    {/* Overlay */}
                    <Box
                        className="overlay"
                        sx={{
                            position: "absolute",
                            inset: 0,
                            bgcolor: "rgba(0,0,0,0.4)",
                            opacity: 0,
                            transition: "0.3s ease",
                        }}
                    />

                    {/* Upload Button */}
                    <IconButton
                        className="upload-btn"
                        component="label"
                        htmlFor="post-image-upload"
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%) scale(0.6)",
                            transition: "0.3s ease",
                            opacity: 0,
                            zIndex: 99,
                            bgcolor: COLORS.primary,
                            color: "#fff",
                            "&:hover": { bgcolor: COLORS.primary },
                        }}
                    >
                        <UploadFileOutlined sx={{ fontSize: 35 }} />
                    </IconButton>
                </Box>

                {/* Image error text */}
                {errors.image_base64 && (
                    <Typography sx={{ color: "red", textAlign: "left", mt: 0.5, fontSize: 12 }}>
                        {errors.image_base64.message}
                    </Typography>
                )}

                <br />

                <CustomInput
                    label="Post Title"
                    placeholder="Enter your post title"
                    register={register("postTitle", { required: "Post title is required" })}
                    error={errors.postTitle?.message}
                />

                <CustomInput
                    label="Admin Thought"
                    placeholder="Enter your thoughts"
                    multiline
                    register={register("adminThought", { required: false })}
                    error={errors.adminThought?.message}
                />

                <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <LandingButton
                        title="Cancel"
                        variant="outlined"
                        width="200px"
                        personal
                        onClick={onCloseModal}
                    />
                    <LandingButton
                        title="Add Post"
                        width="200px"
                        personal
                        type="submit"
                        loading={isSubmitting}
                    />
                </Box>
            </Box>
        </Modal>
    );
};

export default CommunityPostModal;

const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { md: 500, sm: 500, xs: "95%" },
    height: { md: 600, sm: 600, xs: "500" },
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: "8px",
    p: 2,
    textAlign: "center",
    overflowY: "auto",
    "&::-webkit-scrollbar": { height: "6px", width: "6px" },
    "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1", borderRadius: "20px" },
    "&::-webkit-scrollbar-thumb": { backgroundColor: COLORS.primary, borderRadius: "20px" },
};
