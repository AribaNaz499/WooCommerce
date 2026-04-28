import { Box, Button, IconButton, InputBase, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  Close,
  Download,
  PhotoCameraBackOutlined,
  Send,
} from "@mui/icons-material";
import { GoogleGenerativeAI } from "@google/generative-ai";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { useSlide2 } from "../../../context/Slide2Context";
import { GoogleGenAI } from '@google/genai';

interface GeneAIType {
  onClose: () => void;
  activeIndex?: number;
  photoArt?: boolean;
}

type PhotoStyle = "photo_art" | "pencil_sketch" | "realistic";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const s = String(reader.result ?? "");
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    reader.readAsDataURL(file);
  });

const inferStyleFromPrompt = (p: string): PhotoStyle => {
  const s = p.toLowerCase();
  if (s.includes("pencil") || s.includes("sketch") || s.includes("drawing"))
    return "pencil_sketch";
  if (s.includes("realistic") || s.includes("hd") || s.includes("enhance"))
    return "realistic";
  return "photo_art";
};

const buildPhotoArtPrompt = (style: PhotoStyle, userPrompt: string) => {
  const core = userPrompt.trim() ? `User request: ${userPrompt.trim()}` : "";
  if (style === "pencil_sketch") {
    return [
      "Transform the provided photo into a detailed pencil sketch.",
      "Keep same subject and composition. Keep identity.",
      "Use realistic pencil shading, fine linework, paper texture.",
      core,
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (style === "realistic") {
    return [
      "Enhance the provided photo to a high-quality realistic look.",
      "Improve lighting, clarity, and color grading naturally.",
      "Keep same subject and composition. Do not add new objects unless asked.",
      core,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    "Turn the provided photo into artistic photo art (cinematic premium look).",
    "Creative color grading, tasteful contrast, subtle artistic texture.",
    "Keep same subject and composition. Do not add new objects unless asked.",
    core,
  ]
    .filter(Boolean).join('\n')

};

// Small helper for quota / 429 detection
const isQuotaError = (err: unknown) => {
  const msg = String((err as any)?.message ?? err ?? "");
  return msg.includes("429") || msg.toLowerCase().includes("quota");
};

const GeneAI2Popup = (props: GeneAIType) => {
  const { onClose, photoArt } = props;

  const {
    isAIimage2,
    setIsAIimage2,
    setSelectedAIimageUrl2,
    selectedAIimageUrl2,
  } = useSlide2();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ Single source of truth for API Key (use your testing key via ENV)
  // Vite: VITE_GEMINI_API_KEY, CRA: REACT_APP_GEMINI_API_KEY
  const API_KEY = 'AIzaSyBf01akwuBz6rMslZ_MVne3YTqevWxk7_k'

  // ✅ Prevent double submit
  const inFlightRef = useRef(false);

  // ---------------- Photo upload state ----------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string>("");
  const [uploadedMimeType, setUploadedMimeType] = useState<string>("");
  const [uploadedBase64, setUploadedBase64] = useState<string>("");

  useEffect(() => {
    return () => {
      if (uploadedPreview) URL.revokeObjectURL(uploadedPreview);
    };
  }, [uploadedPreview]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    if (uploadedPreview) URL.revokeObjectURL(uploadedPreview);

    const previewUrl = URL.createObjectURL(file);
    setUploadedPreview(previewUrl);
    setUploadedMimeType(file.type || "image/png");

    setLoading(true);
    try {
      const b64 = await fileToBase64(file);
      setUploadedBase64(b64);
      setIsAIimage2?.(false);
      setSelectedAIimageUrl2("");
    } finally {
      setLoading(false);
    }

    e.target.value = "";
  };

  const clearUploaded = () => {
    if (uploadedPreview) URL.revokeObjectURL(uploadedPreview);
    setUploadedPreview("");
    setUploadedBase64("");
    setUploadedMimeType("");
    setIsAIimage2?.(false);
    setSelectedAIimageUrl2("");
  };

  // ---------------- Card Design (your existing flow) ----------------

  const createCardDesign = (design: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    const bgColor = design.backgroundColor || "#FFE5E5";
    const textColor = design.textColor || "#333333";
    const accentColor = design.accentColor || "#FF69B4";

    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, adjustColorBrightness(bgColor, -20));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.strokeStyle = adjustColorBrightness(accentColor, 30);
    ctx.lineWidth = 3;
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

    if (design.theme?.includes("love") || design.theme?.includes("valentine")) {
      drawHearts(ctx, accentColor);
    } else if (design.theme?.includes("birthday")) {
      drawStars(ctx, accentColor);
    } else {
      drawFlowers(ctx, accentColor);
    }

    ctx.fillStyle = textColor.slice(0, 8);
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(design.title || "Greeting Card", canvas.width / 2, 150);

    ctx.font = "28px Georgia, serif";
    const message = design.message || "Best Wishes!";
    wrapText(ctx, message, canvas.width / 2, 400, canvas.width - 120, 40);

    ctx.font = "italic 20px Georgia";
    ctx.fillText(
      design.footer || "With Love",
      canvas.width / 2,
      canvas.height - 100
    );

    const dataUrl = canvas.toDataURL("image/png");
    setSelectedAIimageUrl2(dataUrl);
  };

  const adjustColorBrightness = (color: string, percent: number) => {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      "#" +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    );
  };

  const drawHearts = (ctx: CanvasRenderingContext2D, color: string) => {
    ctx.fillStyle = color + "40";
    const positions = [
      { x: 100, y: 100 },
      { x: 500, y: 150 },
      { x: 80, y: 600 },
      { x: 520, y: 650 },
    ];
    positions.forEach((pos) => drawHeart(ctx, pos.x, pos.y, 30));
  };

  const drawHeart = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(
      x - size / 2,
      y + size / 2,
      x,
      y + (size * 3) / 4,
      x,
      y + size
    );
    ctx.bezierCurveTo(
      x,
      y + (size * 3) / 4,
      x + size / 2,
      y + size / 2,
      x + size / 2,
      y + size / 4
    );
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
  };

  const drawStars = (ctx: CanvasRenderingContext2D, color: string) => {
    ctx.fillStyle = color + "60";
    const positions = [
      { x: 100, y: 120 },
      { x: 500, y: 100 },
      { x: 80, y: 650 },
      { x: 520, y: 620 },
      { x: 300, y: 200 },
    ];
    positions.forEach((pos) => drawStar(ctx, pos.x, pos.y, 25, 5));
  };

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    outerRadius: number,
    points: number
  ) => {
    const innerRadius = outerRadius / 2;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  const drawFlowers = (ctx: CanvasRenderingContext2D, color: string) => {
    ctx.fillStyle = color + "50";
    const positions = [
      { x: 100, y: 100 },
      { x: 500, y: 120 },
      { x: 90, y: 650 },
      { x: 510, y: 630 },
    ];
    positions.forEach((pos) => drawFlower(ctx, pos.x, pos.y, 20));
  };

  const drawFlower = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      const angle = (i * Math.PI) / 3;
      const petalX = x + size * Math.cos(angle);
      const petalY = y + size * Math.sin(angle);
      ctx.arc(petalX, petalY, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.arc(x, y, size / 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, currentY);
        line = words[i] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  };

  const parseGeminiResponse = (text: string) => {
    const design: any = {
      title: prompt.substring(0, 20) || "Greeting Card",
      message: "Wishing you all the best!",
      footer: "With Love & Joy",
      backgroundColor: "#FFE5E5",
      textColor: "#2C3E50",
      accentColor: "#FF69B4",
      theme: prompt.toLowerCase(),
    };

    const colorMatch = text.match(/#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)/gi);
    if (colorMatch && colorMatch.length > 0) {
      design.backgroundColor = colorMatch[0];
      if (colorMatch.length > 1) design.accentColor = colorMatch[1];
    }

    if (text.toLowerCase().includes("love") || text.toLowerCase().includes("valentine")) {
      design.theme = "love";
    } else if (text.toLowerCase().includes("birthday")) {
      design.theme = "birthday";
    }

    return design;
  };

  const handleGenerateDesign = async () => {
    if (!prompt.trim()) return;
    if (!API_KEY) {
      alert("API key missing. .env me VITE_GEMINI_API_KEY set karein.");
      return;
    }
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    setSelectedAIimageUrl2("");
    setIsAIimage2?.(false);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);

      // ✅ exp model par quota 0 issue ho sakta hai; stable use karo
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(
        `Create a greeting card design concept for: "${prompt}".
Provide:
1) Color palette (2-3 hex codes)
2) Design theme and style
3) Suggested text/message
4) Decorative elements
Keep it concise and creative!`
      );

      const response = await result.response;
      const text = response.text();
      const designData = parseGeminiResponse(text);
      setTimeout(() => createCardDesign(designData), 600);
    } catch (err) {
      if (isQuotaError(err)) {
        console.error("429 quota exceeded:", err);
        alert("Quota exceed ہوگئی ہے۔ تھوڑی دیر بعد try کریں یا plan/billing check کریں۔");
      } else {
        console.error("❌ Error generating Gemini design:", err);
        alert("Card generate نہیں ہوا. Console check کریں۔");
      }
    } finally {
      setLoading(false);
      setPrompt("");
      inFlightRef.current = false;
    }
  };

  const handleGeneratePhotoArt = async () => {
    if (!uploadedBase64 || !uploadedMimeType) return;
    if (!API_KEY) {
      alert("API key missing. .env me VITE_GEMINI_API_KEY set karein.");
      return;
    }
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    setSelectedAIimageUrl2("");
    setIsAIimage2?.(false);

    try {
      const style = inferStyleFromPrompt(prompt);
      const finalPrompt = buildPhotoArtPrompt(style, prompt);

      const ai = new GoogleGenAI({ apiKey: API_KEY });

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [
          { text: finalPrompt },
          { inlineData: { mimeType: uploadedMimeType, data: uploadedBase64 } },
        ],
        config: { responseModalities: ["TEXT", "IMAGE"] },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      const imgPart = parts.find((p: any) => p?.inlineData?.data);

      if (!imgPart?.inlineData?.data) {
        console.warn("No IMAGE returned. Text:", (response as any).text);
        alert("Image output نہیں آیا۔ Prompt tweak کر کے دوبارہ try کریں۔");
        return;
      }

      const outMime = imgPart.inlineData.mimeType || "image/png";
      const outB64 = imgPart.inlineData.data as string;
      const dataUrl = `data:${outMime};base64,${outB64}`;

      setSelectedAIimageUrl2(dataUrl);
    } catch (err) {
      if (isQuotaError(err)) {
        console.error("429 quota exceeded:", err);
        alert("Quota exceed ہوگئی ہے۔ تھوڑی دیر بعد try کریں یا plan/billing check کریں۔");
      } else {
        console.error("❌ Error generating Photo Art:", err);
        alert("Photo art generate نہیں ہوا. Console check کریں۔");
      }
    } finally {
      setLoading(false);
      setPrompt("");
      inFlightRef.current = false;
    }
  };

  const handleSend = () => {
    if (loading) return;
    if (photoArt) handleGeneratePhotoArt();
    else handleGenerateDesign();
  };

  return (
    <PopupWrapper
      title={photoArt ? "Photo Art" : "Gemini AI Designer"}
      onClose={onClose}
      sx={{
        width: { md: 300, sm: 300, xs: "95%" },
        height: { md: 600, sm: 600, xs: 450 },
        left: { md: "17%", sm: "0%", xs: 0 },
        overflowY: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <Box
        sx={{
          display: { md: "flex", sm: "flex", xs: "none" },
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography>
          🎨 Powered by Gemini {photoArt ? "Photo Art AI" : "AI + Canvas"}
        </Typography>
      </Box>

      <Box
        sx={{
          height: { md: 350, sm: 420, xs: 250 },
          border: "2px solid #acc9c9ff",
          borderRadius: 2,
          width: "100%",
          p: { md: photoArt ? 0 : 1, sm: 1, xs: 0 },
        }}
      >
        {photoArt ? (
          <>
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: 300,
                borderRadius: 2,
                bgcolor: "#f0f0f0",
                // border: "2px dashed #cfcfcf",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                overflow: "hidden",
              }}
              onClick={handlePickImage}
              role="button"
              aria-label="Upload image"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />

              {uploadedPreview ? (
                <Box
                  component="img"
                  src={uploadedPreview}
                  alt="Uploaded preview"
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    color: "#7a7a7a",
                    userSelect: "none",
                    pointerEvents: "none",
                  }}
                >
                  <PhotoCameraBackOutlined sx={{ fontSize: 64 }} />
                  <Typography sx={{ fontSize: 12 }}>Click to upload</Typography>
                </Box>
              )}

              {uploadedPreview && (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    clearUploaded();
                  }}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    bgcolor: "rgba(0,0,0,0.55)",
                    color: "white",
                    "&:hover": { bgcolor: "rgba(0,0,0,0.7)" },
                  }}
                  size="small"
                  aria-label="Remove image"
                >
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Box>

            {selectedAIimageUrl2 && (
              <Box
                sx={{
                  mt: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <Box
                  component="img"
                  src={selectedAIimageUrl2}
                  alt="AI output"
                  sx={{
                    width: "100%",
                    height: 200,
                    objectFit: "cover",
                    borderRadius: 2,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                  onClick={() => setIsAIimage2?.(true)}
                />
                <Box
                  component={"div"}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    borderRadius: 50,
                    width: 30,
                    height: 30,
                    zIndex: 2,
                    cursor: "pointer",
                    border: "1px solid gray",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(255,255,255,0.85)",
                  }}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = `${selectedAIimageUrl2}`;
                    a.download = `photo_art_${Date.now()}.png`;
                    a.click();
                  }}
                >
                  <Download fontSize="small" />
                </Box>

                {isAIimage2 && (
                  <Box
                    component={"div"}
                    sx={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      borderRadius: 50,
                      width: 22,
                      height: 22,
                      zIndex: 2,
                      bgcolor: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 0.5,
                    }}
                  >
                    <Check fontSize="small" sx={{ color: "white" }} />
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : (
          <>
            {selectedAIimageUrl2 && (
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <Box
                  component={"img"}
                  src={`${selectedAIimageUrl2}`}
                  alt="Generated design"
                  onClick={() => setIsAIimage2?.(true)}
                  sx={{
                    width: "100%",
                    height: { md: "100%", sm: "100%", xs: "250px" },
                    objectFit: "fill",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                />
                <Box
                  component={"div"}
                  sx={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    borderRadius: 50,
                    width: 30,
                    height: 30,
                    zIndex: 2,
                    cursor: "pointer",
                    border: "1px solid gray",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = `${selectedAIimageUrl2}`;
                    a.download = `card_design_${Date.now()}.png`;
                    a.click();
                  }}
                >
                  <Download />
                </Box>

                {isAIimage2 && (
                  <Box
                    component={"div"}
                    sx={{
                      position: "absolute",
                      bottom: 3,
                      right: 3,
                      borderRadius: 50,
                      width: 20,
                      height: 20,
                      zIndex: 2,
                      cursor: "pointer",
                      bgcolor: "black",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 1,
                    }}
                  >
                    <Check fontSize="small" sx={{ color: "white" }} />
                  </Box>
                )}
              </Box>
            )}
          </>
        )}

        {loading && (
          <Typography sx={{ textAlign: "center", color: "#666" }}>
            ✍️ Creating your design...
          </Typography>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderRadius: 2,
          bgcolor: "#ebf7f7ff",
          position: "relative",
          mt: 1,
          maxHeight: 90,
          overflowY: "auto",
          p: 1,
        }}
      >
        <InputBase
          placeholder={
            photoArt
              ? "e.g., pencil sketch / realistic / add warm filter"
              : "e.g., Birthday card"
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          sx={{ p: 1, width: "80%" }}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          multiline
          disabled={loading}
        />
      </Box>

      <Button
        sx={{
          border: "1px solid #212121",
          mt: 1,
          bgcolor: "#212121",
          color: "white",
          "&:hover": { bgcolor: "#333" },
        }}
        onClick={handleSend}
        disabled={loading || (photoArt ? !uploadedBase64 : !prompt.trim())}
        fullWidth
      >
        <Send />
      </Button>
    </PopupWrapper>
  );
};

export default GeneAI2Popup;
