// src/components/ImageCropModal/ImageCropModal.tsx
import { Box, Button, Modal, Slider, Stack, Typography } from "@mui/material";
import { useState } from "react";
import Cropper from "react-easy-crop";

interface Props {
  open: boolean;
  imageSrc: string;
  aspect?: number;  // ← ADD THIS LINE (optional)
  onClose: () => void;
  onApply: (croppedImage: string) => void;
}

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", (error) => reject(error));
    img.setAttribute("crossOrigin", "anonymous");
    img.src = url;
  });

const getCroppedImg = async (imageSrc: string, crop: Area): Promise<string> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return imageSrc;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width;
  canvas.height = crop.height;

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return canvas.toDataURL("image/jpeg", 1);
};

const ImageCropModal = ({ open, imageSrc, aspect = 1, onClose, onApply }: Props) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleApply = async () => {
    if (!croppedAreaPixels) return;
    
    setLoading(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onApply(croppedImage);
      onClose();
    } catch (error) {
      console.error("Crop failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={loading ? undefined : onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "90%", sm: 600 },
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 3,
          outline: "none",
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Crop Image
        </Typography>

        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: 400,
            bgcolor: "#000",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}  // ← USE THE ASPECT PROP HERE
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            showGrid={true}
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography gutterBottom>Zoom</Typography>
          <Slider
            value={zoom}
            min={1}
            max={3}
            step={0.01}
            onChange={(_, value) => setZoom(value as number)}
          />
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleApply} disabled={loading}>
            {loading ? "Processing..." : "Apply Crop"}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
};

export default ImageCropModal;