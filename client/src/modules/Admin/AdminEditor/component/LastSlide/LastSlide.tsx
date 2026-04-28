import { useRef } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useCardEditor } from "../../../../../context/AdminEditorContext";
import LandingButton from "../../../../../components/LandingButton/LandingButton";
import { ADMINS_DASHBOARD } from "../../../../../constant/route";
import type { EditorCanvasHandle } from "../EditorCanvas/EditorCanvas";
import EditorCanvas from "../EditorCanvas/EditorCanvasKonva";
import SharedToolbar from "../SharedToolbar/SharedToolbar";

const LastSlide = () => {
  const navigate = useNavigate();
  const {
    formData,
    lastElements,
    setLastElements,
    lastTextElements,
    setLastTextElements,
    lastStickerElements,
    setLastStickerElements,
    lastSlideImage,
    lastSlideMessage,

    // also include first slide slices to persist together if needed
    selectedShapeImage,
    uploadedShapeImage,
    elements,
    textElements,
    stickerElements,
  } = useCardEditor();

  const canvasRef = useRef<EditorCanvasHandle | null>(null);
  const isCandleCategory = /candle/i.test(String(formData?.cardCategory ?? ""));
  const canvasScale = isCandleCategory ? 1.5 : 1;

  const onSave = () => {
    navigate(ADMINS_DASHBOARD.ADD_NEW_CARDS, {
      state: {
        formData: {
          lastElements,
          lastTextElements,
          lastStickerElements,
          lastSlideImage,
          lastSlideMessage,
          selectedShapeImage,
          uploadedShapeImage,
          elements,
          textElements,
          stickerElements,
        },
      },
    });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography sx={{ fontSize: 25 }}>Last Slide</Typography>
        <LandingButton title="Save Changes" onClick={onSave} />
      </Box>

      <Box
        sx={{
          display: { md: "flex", sm: "flex", xs: "block" },
          gap: 2,
          justifyContent: "center",
          position: "relative",
        }}
      >
        <EditorCanvas
          ref={canvasRef}
          elements={lastElements}
          setElements={setLastElements}
          textElements={lastTextElements}
          setTextElements={setLastTextElements}
          stickerElements={lastStickerElements}
          setStickerElements={setLastStickerElements}
          canvasScale={canvasScale}
        />

        <Box sx={{ position: "relative", alignSelf: "flex-start" }}>
          <SharedToolbar activeRef={canvasRef} />
        </Box>
      </Box>
    </Box>
  );
};

export default LastSlide;
