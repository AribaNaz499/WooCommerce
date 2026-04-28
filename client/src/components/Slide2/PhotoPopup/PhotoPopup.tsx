import { Box, Typography, IconButton } from "@mui/material";
import { ControlPoint, Delete, Check } from "@mui/icons-material";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { COLORS } from "../../../constant/color";
import { handleAutoDeletedImage } from "../../../lib/lib";
import { supabase } from "../../../supabase/supabase";
import toast from "react-hot-toast";
import { useSlide2 } from "../../../context/Slide2Context";

interface PhotoPopupProps {
  onClose: () => void;
  activeIndex?: number;
  isAdminEditor?: boolean;
}

const BUCKETS = {
  USER: "user-images",
  ADMIN: "admin-images",
} as const;

const PhotoPopup = ({ onClose, activeIndex, isAdminEditor = false }: PhotoPopupProps) => {
  const {
    images,
    setSelectedImage,
    selectedImg,
    setImages,
    setDraggableImages,
    imageFilter,
    setImageFilter,
    draggableImages,
    activeFilterImageId,
    setActiveFilterImageId,
  } = useSlide2();

  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const bucket = isAdminEditor ? BUCKETS.ADMIN : BUCKETS.USER;

  const filters = useMemo(
    () => [
      { name: "None", css: "none" },
      { name: "Brightness", css: "brightness(150%)" },
      { name: "Contrast", css: "contrast(180%)" },
      { name: "Grayscale", css: "grayscale(100%)" },
      { name: "Sepia", css: "sepia(100%)" },
      { name: "Invert", css: "invert(100%)" },
      { name: "Blur", css: "blur(3px)" },
    ],
    []
  );

  const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const pathForUpload = useCallback(
    (fileName: string) => {
      // why: namespacing prevents collisions and simplifies delete/list by user
      if (isAdminEditor) return fileName; // flat at root for admins
      if (!user?.id) return fileName;
      return `${user.id}/${fileName}`;
    },
    [isAdminEditor, user?.id]
  );

  const getPublicUrl = (bucketName: string, objectPath: string) =>
    supabase.storage.from(bucketName).getPublicUrl(objectPath).data.publicUrl;

  const uploadToSupabase = async (file: File, objectPath: string) => {
    setLoading(true);
    const { error } = await supabase.storage.from(bucket).upload(objectPath, file, {
      upsert: false,
    });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      setLoading(false);
      return null;
    }
    const publicUrl = getPublicUrl(bucket, objectPath);
    setLoading(false);
    toast.success("✅ Photo uploaded!");
    return publicUrl;
  };

  const saveUserImageUrlToDB = async (imageId: string, imageUrl: string) => {
    if (!user?.id) {
      toast.error("No authenticated user found");
      return;
    }
    const { data: userData, error: fetchError } = await supabase
      .from("Users")
      .select("images")
      .eq("auth_id", user.id)
      .single();

    if (fetchError) {
      toast.error("Failed to fetch user data");
      return;
    }

    const newImage = { id: imageId, url: imageUrl };
    const updatedImages = Array.isArray(userData?.images)
      ? [...userData.images, newImage]
      : [newImage];

    const { error: updateError } = await supabase
      .from("Users")
      .update({ images: updatedImages })
      .eq("auth_id", user.id);

    if (updateError) {
      toast.error("Failed to save image URL");
      return;
    }
    toast.success("✅ Image saved to your account");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      const fileExt = file.name.split(".").pop() || "jpg";
      const imageId = generateId();
      const objectFileName = `${imageId}.${fileExt}`;
      const objectPath = pathForUpload(objectFileName);

      const url = await uploadToSupabase(file, objectPath);
      if (!url) continue;

      if (isAdminEditor) {
        // Admin: do not persist URL in DB
        setImages((prev: any[]) => [...prev, { id: imageId, src: url, fileName: objectPath }]);
      } else {
        setImages((prev: any[]) => [...prev, { id: imageId, src: url, fileName: objectPath }]);
        await saveUserImageUrlToDB(imageId, url);
        // Optional auto-delete (adjust TTL)
        handleAutoDeletedImage(user?.id, imageId, objectPath, fetchImages, 7 * 24 * 60 * 60 * 1000);
      }
    }

    e.target.value = "";
  };

  const handleDelete = async (id: any) => {
    const imgToDelete: any = images.find((img: any) => img.id === id);
    if (!imgToDelete?.fileName) return;

    const { error } = await supabase.storage.from(bucket).remove([imgToDelete.fileName]);
    if (error) {
      toast.error("Failed to delete");
      return;
    }

    if (!isAdminEditor && user?.id) {
      const { data: userData, error: fetchError } = await supabase
        .from("Users")
        .select("images")
        .eq("auth_id", user.id)
        .single();

      if (!fetchError && Array.isArray(userData?.images)) {
        const updatedImages = userData.images.filter((img: any) => img.id !== id);
        await supabase.from("Users").update({ images: updatedImages }).eq("auth_id", user.id);
      }
    }

    setImages((prev) => prev.filter((img: any) => img.id !== id));
    toast.success("🗑️ Deleted");
  };

  const fetchUserImages = async () => {
    if (!user?.id) return;
    const { data, error } = await supabase.from("Users").select("images").eq("auth_id", user.id).single();
    if (error) return;

    const formatted = Array.isArray(data?.images)
      ? data.images.map((img: any) => ({ id: img.id, src: img.url }))
      : [];
    setImages(formatted);
  };

  const fetchAdminImages = async () => {
    // why: admin does not store URLs; we list bucket and render public URLs directly
    const { data, error } = await supabase.storage.from(BUCKETS.ADMIN).list("", {
      limit: 1000,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (error) return;

    const mapped: any[] = (data || [])
      .filter((o) => o.id && o.name && !o.name.endsWith("/"))
      .map((o) => {
        const src = getPublicUrl(BUCKETS.ADMIN, o.name);
        return { id: o.id.toString(), src, fileName: o.name };
      });

    setImages(mapped);
  };

  const fetchImages = useCallback(async () => {
    if (isAdminEditor) return fetchAdminImages();
    return fetchUserImages();
  }, [isAdminEditor, user?.id]);

  useEffect(() => {
    fetchImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminEditor, user?.id]);

  const applyFilter = (filterCss: string) => {
    setDraggableImages((prev) =>
      prev.map((img) => (img.id === activeFilterImageId ? { ...img, filter: filterCss } : img))
    );
  };

  if (imageFilter) {
    const selectedImage = draggableImages.find((img) => img.id === activeFilterImageId);
    const previewImg =
      selectedImage?.src || "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400";

    return (
      <PopupWrapper
        title="Image Filter"
        onClose={() => setImageFilter(false)}
        sx={{
          width: { md: 300, sm: 300, xs: "100%" },
          height: { md: 600, sm: 600, xs: "45vh" },
          left: activeIndex === 1 ? { md: "17%", sm: "0%", xs: "auto" } : "17%",
          zIndex: 99,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {filters.map((f) => (
            <Box
              key={f.name}
              onClick={() => applyFilter(f.css)}
              sx={{
                width: 120,
                height: 100,
                borderRadius: 2,
                border: "2px solid #3a7bd5",
                cursor: "pointer",
                overflow: "hidden",
              }}
            >
              <Box component="img" src={previewImg} sx={{ width: "100%", height: "100%", objectFit: "cover", filter: f.css }} />
            </Box>
          ))}
        </Box>
      </PopupWrapper>
    );
  }

  return (
    <PopupWrapper
      title={isAdminEditor ? "Admin Photos" : "Photos"}
      onClose={onClose}
      sx={{
        width: { md: 300, sm: 300, xs: "100%" },
        height: { md: 600, sm: 600, xs: "45vh" },
        mt: { md: 0, sm: 0, xs: 0 },
        left: activeIndex === 1 ? { md: "17%", sm: "0%", xs: "auto" } : "17%",
        zIndex: 99,
      }}
    >
      <Typography sx={{ color: "#414141ff", textAlign: "start", fontSize: "15px", fontFamily: "sans-serif", mb: 2 }}>
        {isAdminEditor ? "Admin uploads are shown directly from bucket." : "You can upload any .png .jpeg or .heic file."}
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          overflow: "auto",
          height: "auto",
          "&::-webkit-scrollbar": { height: "6px", width: "5px" },
          "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1", borderRadius: "20px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: COLORS.primary, borderRadius: "20px" },
        }}
      >
        <Box
          component="input"
          type="file"
          accept="image/png, image/jpeg, image/heic"
          sx={{
            position: "absolute",
            width: { lg: "115px", md: "115px", sm: "115px", xs: "100px" },
            height: { lg: "115px", md: "115px", sm: "115px", xs: "100px" },
            opacity: 0,
            cursor: "pointer",
            top: 100,
            left: 20,
            zIndex: 10,
          }}
          onChange={handleFileChange}
          multiple
        />

        <Box
          sx={{
            width: { lg: "115px", md: "115px", sm: "115px", xs: "100px" },
            height: { lg: "115px", md: "115px", sm: "115px", xs: "100px" },
            borderRadius: "5px",
            border: `2px solid ${loading ? "#855833ff" : "#3a7bd5"} `,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            userSelect: "none",
            pointerEvents: "none",
            color: "#3a7bd5",
            fontWeight: "bold",
            flexDirection: "column",
            fontSize: loading ? "14px" : "20px",
            p: 2,
          }}
        >
          <ControlPoint fontSize="large" />
          {loading ? "Uploading..." : "Add Photo"}
        </Box>

        {images.map(({ id, src }) => (
          <Box
            key={id}
            onClick={() => {
              setSelectedImage((prev: any) => {
                const isSelected = prev.includes(id);
                if (!isSelected) setActiveFilterImageId(id);
                setDraggableImages((imgs: any[]) =>
                  imgs.map((img) =>
                    img.id === id
                      ? { ...img, zIndex: !isSelected ? Math.max(...imgs.map((i) => i.zIndex || 0)) + 1 : img.zIndex }
                      : img
                  )
                );
                return isSelected ? prev.filter((i: any) => i !== id) : [...prev, id];
              });
            }}
            sx={{
              width: { lg: "115px", md: "115px", sm: "115px", xs: "95px" },
              height: { lg: "115px", md: "115px", sm: "115px", xs: "95px" },
              border: `2px solid ${selectedImg?.includes(id) ? "#3a7bd5" : "#bd7082ff"}`,
              borderRadius: 2,
              position: "relative",
              cursor: "pointer",
              overflow: "hidden",
              transition: "border 0.2s ease",
              "&:hover": { border: "2px solid #d34767" },
            }}
          >
            <Box component="img" src={src} alt="Uploaded" sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 1.6 }} />

            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(id);
              }}
              sx={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
                bgcolor: "#f0f1f3",
                "&:hover": { bgcolor: "#e5e6e8" },
                zIndex: 99,
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
              size="small"
              aria-label="Delete uploaded image"
            >
              <Delete fontSize="small" sx={{ color: "black", "&:hover": { color: "red" }, fontSize: 15 }} />
            </IconButton>

            {selectedImg?.includes(id) && (
              <IconButton
                sx={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  bgcolor: "#3a7bd5",
                  color: "white",
                  border: "2px solid white",
                  width: 24,
                  height: 24,
                  zIndex: 99,
                  "&:hover": { bgcolor: "#356fcf" },
                }}
                size="small"
                aria-label="Selected image"
              >
                <Check sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
        ))}
      </Box>
    </PopupWrapper>
  );
};

export default PhotoPopup;
