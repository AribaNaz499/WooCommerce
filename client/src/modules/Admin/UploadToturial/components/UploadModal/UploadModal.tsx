import React, { useEffect, useState } from "react";
import { Box, Modal, Stack, Typography, IconButton } from "@mui/material";
import { Close, CloudUpload } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import CustomInput from "../../../../../components/CustomInput/CustomInput";
import { fileToBase64Url, saveTutorial, updateTutorial } from "../../../../../source/source";
import LandingButton from "../../../../../components/LandingButton/LandingButton";

type Props = {
    open: boolean;
    onCloseModal: () => void;
    mode?: "add" | "edit";
    initial?: any | null;
    onSaved?: (row: any) => void;
};

type FormValues = {
    title: string;
    youtube_url: string;
    description: string;
    thumbnail_base64: string;
};

const UploadModal: React.FC<Props> = ({
    open,
    onCloseModal,
    mode = "add",
    initial = null,
    onSaved,
}) => {
    const {
        register,
        setValue,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        defaultValues: {
            title: "",
            youtube_url: "",
            description: "",
            thumbnail_base64: "",
        },
    });

    const [preview, setPreview] = useState<string>("");

    // hydrate for edit
    useEffect(() => {
        if (mode === "edit" && initial) {
            reset({
                title: initial.title,
                youtube_url: initial.youtube_url,
                description: initial.description,
                thumbnail_base64: initial.thumbnail_base64,
            });
            setPreview(initial.thumbnail_base64);
        } else {
            reset({
                title: "",
                youtube_url: "",
                description: "",
                thumbnail_base64: "",
            });
            setPreview("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, initial, open]);

    const onPickFile = async (file?: File | null) => {
        if (!file) return;
        const dataURL = await fileToBase64Url(file);
        setValue("thumbnail_base64", dataURL, { shouldValidate: true });
        setPreview(dataURL);
    };

    const onSubmit = async (values: FormValues) => {
        // simple YouTube URL check (no Zod)
        const ytOk = /(?:youtube\.com\/watch\?v=|youtu\.be\/)/i.test(values.youtube_url.trim());
        if (!ytOk) {
            alert("Please enter a valid YouTube URL");
            return;
        }

        const payload = {
            title: values.title.trim(),
            youtube_url: values.youtube_url.trim(),
            description: values.description.trim(),
            thumbnail_base64: values.thumbnail_base64,
        };

        const row =
            mode === "edit" && initial
                ? await updateTutorial(initial.id, payload)
                : await saveTutorial(payload);

        onSaved?.(row);
        onCloseModal();
    };

    return (
        <Modal open={open} onClose={onCloseModal}>
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={style}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 700 }}>
                        {mode === "edit" ? "Edit Tutorial" : "Add Tutorial"}
                    </Typography>
                    <IconButton onClick={onCloseModal}><Close /></IconButton>
                </Stack>

                <Stack spacing={2}>
                    {/* Title */}
                    <CustomInput
                        label="Tutorial Title"
                        placeholder="Enter tutorial title"
                        register={register("title", { required: "Title is required" })}
                        error={errors.title?.message}
                    />

                    {/* YouTube URL */}
                    <CustomInput
                        label="YouTube URL"
                        placeholder="https://www.youtube.com/watch?v=..."
                        register={register("youtube_url", { required: "YouTube URL is required" })}
                        error={errors.youtube_url?.message}
                    />

                    {/* Description */}
                    <CustomInput
                        label="Description"
                        placeholder="Brief description of the tutorial"
                        multiline
                        register={register("description", { required: "Description is required" })}
                        error={errors.description?.message}
                    />

                    {/* Hidden field to carry base64 into RHF submission */}
                    <input type="hidden" {...register("thumbnail_base64", { required: "Thumbnail is required" })} />

                    {/* Thumbnail uploader */}
                    <Stack spacing={1}>
                        <Typography sx={{ fontSize: 14, fontWeight: 600, textAlign: 'left' }}>
                            Thumbnail Image
                        </Typography>

                        {/* Preview container with hover overlay */}
                        <Box
                            sx={{
                                position: 'relative',
                                width: '100%',
                                height: 220,
                                borderRadius: 1,
                                overflow: 'hidden',
                                // show overlay on hover
                                '&:hover .hoverOverlay': { opacity: 1, visibility: 'visible' },
                            }}
                        >
                            {/* Image or placeholder */}
                            {preview ? (
                                <Box component="img" src={preview} alt="thumbnail"
                                    sx={{ width: '100%', height: '100%', objectFit: 'fill' }}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        width: '100%', height: '100%',
                                        border: '1px dashed #cbd5e1',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#64748b', fontSize: 14, bgcolor: '#fafafa',
                                    }}
                                >
                                    No image selected
                                </Box>
                            )}

                            {/* Hidden input */}
                            <input
                                id="thumb-input"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                            />

                            {/* Hover overlay: dark bg + centered upload icon */}
                            <label htmlFor="thumb-input">
                                <Box
                                    className="hoverOverlay"
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(0,0,0,0.45)',
                                        opacity: 0,
                                        visibility: 'hidden',
                                        transition: 'opacity .2s ease',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <IconButton
                                        component="span"
                                        sx={{
                                            width: 34,
                                            height: 34,
                                            borderRadius: '50%',
                                            bgcolor: 'rgba(255,255,255,0.95)',
                                            boxShadow: 3,
                                            transition: 'transform .15s ease, background .2s',
                                            '&:hover': { bgcolor: '#e6e6e6ff' },
                                        }}
                                        aria-label="Upload thumbnail"
                                    >
                                        <CloudUpload sx={{ fontSize: 25, color: '#111' }} />
                                    </IconButton>
                                </Box>
                            </label>
                        </Box>

                        {/* Validation error */}
                        {errors.thumbnail_base64 && (
                            <Typography color="error" sx={{ fontSize: 12, textAlign: 'left' }}>
                                {errors.thumbnail_base64.message}
                            </Typography>
                        )}
                    </Stack>



                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <LandingButton title={`Cancel`} onClick={onCloseModal} width={'230px'} variant="outlined" />
                        <LandingButton type={'submit'} title={`${mode === "edit" ? "Update Tutorial" : "Save Tutorial"}`} loading={isSubmitting} width={'230px'} />
                    </Box>
                </Stack>
            </Box>
        </Modal >
    );
};

export default UploadModal;

const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { md: 550, sm: 500, xs: "95%" },
    maxHeight: "85vh",
    bgcolor: "background.paper",
    boxShadow: 24,
    borderRadius: "8px",
    p: 2,
    textAlign: "left" as const,
    overflowY: "auto" as const,
};
