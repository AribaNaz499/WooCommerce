import { Box, IconButton, InputBase, Typography } from "@mui/material";
import { useState, useRef } from "react";
import { Check, Download, Send } from "@mui/icons-material";
import { GoogleGenerativeAI } from "@google/generative-ai";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { useSlide4 } from "../../../context/Slide4Context";

interface GeneAIType {
  onClose: () => void;
  activeIndex?: number;
}

const GeneAI4Popup = (props: GeneAIType) => {
  const { onClose } = props;

  const {
    isAIimage4,
    setIsAIimage4,
    setSelectedAIimageUrl4,
    selectedAIimageUrl4,
  } = useSlide4();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const createCardDesign = (design: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 800;

    // Parse colors from design or use defaults
    const bgColor = design.backgroundColor || "#FFE5E5";
    const textColor = design.textColor || "#333333";
    const accentColor = design.accentColor || "#FF69B4";

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, bgColor);
    gradient.addColorStop(1, adjustColorBrightness(bgColor, -20));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add decorative border
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Add inner border
    ctx.strokeStyle = adjustColorBrightness(accentColor, 30);
    ctx.lineWidth = 3;
    ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

    // Add decorative elements (hearts, stars, etc.)
    if (design.theme?.includes("love") || design.theme?.includes("valentine")) {
      drawHearts(ctx, accentColor);
    } else if (design.theme?.includes("birthday")) {
      drawStars(ctx, accentColor);
    } else {
      drawFlowers(ctx, accentColor);
    }

    // Add main text
    ctx.fillStyle = textColor.slice(0, 8);
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText(design.title || "Greeting Card", canvas.width / 2, 150);

    // Add message
    ctx.font = "28px Georgia, serif";
    const message = design.message || "Best Wishes!";
    wrapText(ctx, message, canvas.width / 2, 400, canvas.width - 120, 40);

    // Add decorative footer
    ctx.font = "italic 20px Georgia";
    ctx.fillText(
      design.footer || "With Love",
      canvas.width / 2,
      canvas.height - 100
    );

    // Convert to image
    const dataUrl = canvas.toDataURL("image/png");
    setSelectedAIimageUrl4(dataUrl);
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
    positions.forEach((pos) => {
      drawHeart(ctx, pos.x, pos.y, 30);
    });
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
    positions.forEach((pos) => {
      drawStar(ctx, pos.x, pos.y, 25, 5);
    });
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
    positions.forEach((pos) => {
      drawFlower(ctx, pos.x, pos.y, 20);
    });
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
    // Center
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

    // Parse colors from Gemini response
    const colorMatch = text.match(/#[0-9A-Fa-f]{6}|rgb\(\d+,\s*\d+,\s*\d+\)/gi);
    if (colorMatch && colorMatch.length > 0) {
      design.backgroundColor = colorMatch[0];
      if (colorMatch.length > 1) design.accentColor = colorMatch[1];
    }

    // Try to extract theme
    if (
      text.toLowerCase().includes("love") ||
      text.toLowerCase().includes("valentine")
    ) {
      design.theme = "love";
    } else if (text.toLowerCase().includes("birthday")) {
      design.theme = "birthday";
    }

    return design;
  };

  const handleGenerateDesign = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setSelectedAIimageUrl4("");

    try {
      const genAI = new GoogleGenerativeAI(
        "AIzaSyCOr6PVpYJ6tOltUM8qkhbf0Pm-F15XM6U"
      );

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const result = await model.generateContent(
        `Create a greeting card design concept for: "${prompt}".
        
        Provide:
        1. Color palette (suggest 2-3 hex color codes)
        2. Design theme and style
        3. Suggested text/message
        4. Decorative elements
        
        Keep it concise and creative!`
      );

      const response = await result.response;
      const text = response.text();

      // Parse response and create visual design
      const designData = parseGeminiResponse(text);
      setTimeout(() => createCardDesign(designData), 1000);
    } catch (err: any) {
      console.error("❌ Error generating Gemini design:", err);
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  return (
    <PopupWrapper
      title="Gemini AI Designer"
      onClose={onClose}
      sx={{
        width: { md: 300, sm: 280, xs: "95%" },
        height: { md: 600, sm: 600, xs: 450 },
        left: { md: "58%", sm: "0%", xs: 0 },
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography>🎨 Powered by Gemini AI + Canvas</Typography>
      </Box>

      <Box
        sx={{
          height: { md: 420, sm: 420, xs: 250 },
          border: "2px solid #acc9c9ff",
          borderRadius: 2,
          width: "100%",
          p: { md: 1, sm: 1, xs: 0 },
        }}
      >
        {selectedAIimageUrl4 && (
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
              component={'img'}
              src={`${selectedAIimageUrl4}`}
              alt="Generated design"
              onClick={() => {
                if (setIsAIimage4) {
                  setIsAIimage4(true);
                }
              }}
              sx={{
                maxWidth: "100%",
                height: { md: '100%', sm: '100%', xs: '250px' },

                objectFit: "cover",
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
                a.href = `${selectedAIimageUrl4}`;
                a.download = `card_design_${Date.now()}.png`;
                a.click();
              }}
            >
              <Download />
            </Box>

            {isAIimage4 && (
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
                  bgcolor: isAIimage4 ? "black" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "blueviolet",
                  p: 1,
                }}
              >
                <Check
                  fontSize="small"
                  sx={{ color: isAIimage4 ? "white" : "black" }}
                />
              </Box>
            )}
          </Box>
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
        }}
      >
        <InputBase
          placeholder="e.g., Birthday card"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          sx={{ p: 1, width: "90%" }}
          onKeyDown={(e) => e.key === "Enter" && handleGenerateDesign()}
          multiline
          disabled={loading}
        />
        <IconButton
          sx={{
            position: "absolute",
            right: 5,
            border: "1px solid #212121",
            bgcolor: "#212121",
            color: "white",
            "&:hover": { bgcolor: "#333" },
          }}
          onClick={handleGenerateDesign}
          disabled={loading}
        >
          <Send />
        </IconButton>
      </Box>
    </PopupWrapper>
  );
};

export default GeneAI4Popup;
