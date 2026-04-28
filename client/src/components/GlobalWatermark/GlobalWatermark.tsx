import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";

const GlobalWatermark: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const showWatermark = () => {
      setVisible(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setVisible(false), 800);
    };

    // 1️⃣ When user switches tab or window
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        showWatermark();
      }
    };

    // 2️⃣ Detect possible DevTools opening
    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      if (widthDiff || heightDiff) showWatermark();
    };

    // 3️⃣ Detect certain keys often linked with screenshots or printing
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();
      const combo = [
        "printscreen",
        "f12", // DevTools
        "p", 
        // "s", // Windows+S or Cmd+Shift+S style combos
      ];

      if (
        combo.includes(key) ||
        (e.ctrlKey && key === "p") ||
        (e.metaKey && key === "p") ||
        (e.ctrlKey && key === "s")
        // (e.metaKey && key === "s")
      ) {
        showWatermark();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", detectDevTools);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", detectDevTools);
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        pointerEvents: "none",
        userSelect: "none",
        display: "grid",
        placeItems: "center",
        fontSize: "3rem",
        fontWeight: 700,
        color: "rgba(0,0,0,0.1)",
        textTransform: "uppercase",
        transform: "rotate(-30deg)",
        // backgroundImage: visible ?  `repeating-linear-gradient(
        //   45deg,
        //   rgba(71, 70, 70, 0) 0px,
        //   rgba(51, 51, 51, 0.03) 1px,
        //   transparent 1px,
        //   transparent 60px
        // )`  : '',
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      <Box
        component={"img"}
        src="/assets/images/watermarkDIY.png"
        alt="watermark"
        sx={{ width: "100%", height: "100%", objectFit: "cover",opacity:0.6, }}
      />
    </div>
  );
};

export default GlobalWatermark;
