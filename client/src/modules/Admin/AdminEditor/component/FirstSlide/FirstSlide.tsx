import { useRef } from "react";
import { Box, Typography } from "@mui/material";
import { useCardEditor } from "../../../../../context/AdminEditorContext";
import { useNavigate } from "react-router-dom";
import LandingButton from "../../../../../components/LandingButton/LandingButton";
import { ADMINS_DASHBOARD } from "../../../../../constant/route";
import type { EditorCanvasHandle } from "../EditorCanvas/EditorCanvas";
import EditorCanvas from "../EditorCanvas/EditorCanvasKonva";
import SharedToolbar from "../SharedToolbar/SharedToolbar";

type FirstSlideProps = { firstSlide?: any };

const FirstSlide = (_props: FirstSlideProps) => {
  const {
    formData,
    elements,
    setElements,
    textElements,
    setTextElements,
    stickerElements,
    setStickerElements,
    selectedShapeImage,
    uploadedShapeImage,
  } = useCardEditor();

  const navigate = useNavigate();
  const canvasRef = useRef<EditorCanvasHandle | null>(null);
  const isCandleCategory = /candle/i.test(String(formData?.cardCategory ?? ""));
  const canvasScale = isCandleCategory ? 1.5 : 1;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography sx={{ fontSize: "25px" }}>First Slide</Typography>
        <LandingButton
          title="Save Changes"
          onClick={() => {
            navigate(ADMINS_DASHBOARD.ADD_NEW_CARDS, {
              state: {
                formData: {
                  elements,
                  textElements,
                  selectedShapeImage,
                  uploadedShapeImage,
                  stickerElements,
                },
              },
            });
          }}
        />
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
          elements={elements}
          setElements={setElements}
          textElements={textElements}
          setTextElements={setTextElements}
          stickerElements={stickerElements}
          setStickerElements={setStickerElements}
          canvasScale={canvasScale}
        />

        <Box sx={{ position: "relative", alignSelf: "flex-start" }}>
          <SharedToolbar activeRef={canvasRef} />
        </Box>
      </Box>
    </>
  );
};

export default FirstSlide;
