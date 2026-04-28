import React, { useRef } from "react";
import { Box, Typography } from "@mui/material";
import { useCardEditor } from "../../../../../context/AdminEditorContext";
import type { EditorCanvasHandle } from "../EditorCanvas/EditorCanvas";
import EditorCanvas from "../EditorCanvas/EditorCanvasKonva";
import SharedToolbar from "../SharedToolbar/SharedToolbar";


const MainSlide: React.FC = () => {
  const {
    formData,
    midLeftElements,
    setMidLeftElements,
    midLeftTextElements,
    setMidLeftTextElements,
    midLeftStickerElements,
    setMidLeftStickerElements,
    midRightElements,
    setMidRightElements,
    midRightTextElements,
    setMidRightTextElements,
    midRightStickerElements,
    setMidRightStickerElements,
    activeMid,
    setActiveMid,
  } = useCardEditor();

  const leftRef = useRef<EditorCanvasHandle | null>(null);
  const rightRef = useRef<EditorCanvasHandle | null>(null);
  const activeRef = activeMid === "left" ? leftRef : rightRef;

  const isLeftActive = activeMid === "left";
  const isRightActive = activeMid === "right";
  const isCandleCategory = /candle/i.test(String(formData?.cardCategory ?? ""));
  const canvasScale = isCandleCategory ? 1.5 : 1;

  return (
    <Box>
      <Typography sx={{ fontSize: "25px" }}>Main Slide</Typography>

      <Box
        sx={{
          display: { md: "flex", sm: "flex", xs: "block" },
          width: "100%",
          gap: "20px",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <Box
          onClick={() => setActiveMid("left")}
          sx={{
            borderRadius: "14px",
            transition: "all .15s ease",
            border: isLeftActive ? "2px solid #1976d2" : "1px dashed rgba(0,0,0,0.2)",
            boxShadow: isLeftActive ? "0 0 0 4px rgba(25,118,210,0.12)" : "none",
            opacity: isLeftActive ? 1 : 0.5,
            cursor: "pointer",
          }}
        >
          <EditorCanvas
            ref={leftRef}
            elements={midLeftElements}
            setElements={setMidLeftElements}
            textElements={midLeftTextElements}
            setTextElements={setMidLeftTextElements}
            stickerElements={midLeftStickerElements}
            setStickerElements={setMidLeftStickerElements}
            onFocus={() => setActiveMid("left")}
            disabled={!isLeftActive}
            canvasScale={canvasScale}
          />
        </Box>

        <Box sx={{ position: "relative", alignSelf: "flex-start" }}>
          <SharedToolbar activeRef={activeRef} />
        </Box>

        <Box
          onClick={() => setActiveMid("right")}
          sx={{
            borderRadius: "14px",
            transition: "all .15s ease",
            border: isRightActive ? "2px solid #1976d2" : "1px dashed rgba(0,0,0,0.2)",
            boxShadow: isRightActive ? "0 0 0 4px rgba(25,118,210,0.12)" : "none",
            opacity: isRightActive ? 1 : 0.5,
            cursor: "pointer",
          }}
        >
          <EditorCanvas
            ref={rightRef}
            elements={midRightElements}
            setElements={setMidRightElements}
            textElements={midRightTextElements}
            setTextElements={setMidRightTextElements}
            stickerElements={midRightStickerElements}
            setStickerElements={setMidRightStickerElements}
            onFocus={() => setActiveMid("right")}
            disabled={!isRightActive}
            canvasScale={canvasScale}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default MainSlide;
