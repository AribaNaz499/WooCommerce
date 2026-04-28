import { forwardRef, useMemo } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { Close } from "@mui/icons-material";
import QrGenerator from "../../../../../components/QR-code/Qrcode";
import KonvaSlidePreview, {
  KonvaLayerNode,
  num,
  str,
} from "../KonvaSlidePreview/KonvaSlidePreview";

type Ctx = any;

type Props = {
  width?: number;
  height?: number;
  ctx: Ctx;
};

const get = (o: any, k: string, d?: any) => (o && o[k] !== undefined ? o[k] : d);

const EditorPreviewSlide = forwardRef<HTMLDivElement, Props>(
  ({ width = 500, height = 700, ctx }, ref) => {
    const bgImage = get(ctx, "bgImage1") ?? get(ctx, "bgImage") ?? null;
    const bgColor = get(ctx, "bgColor1") ?? get(ctx, "bgColor") ?? "#fff";
    const bgRect = get(ctx, "bgRect1") ?? get(ctx, "bgRect") ?? null;

    const multipleText = !!(get(ctx, "multipleTextValue1") ?? get(ctx, "multipleTextValue"));
    const texts = get(ctx, "texts1") ?? get(ctx, "texts") ?? [];
    const showOneText = !!(
      get(ctx, "showOneTextRightSideBox1") ?? get(ctx, "showOneTextRightSideBox")
    );
    const oneTextValue = get(ctx, "oneTextValue1") ?? get(ctx, "oneTextValue") ?? "";
    const fontSize = get(ctx, "fontSize1") ?? get(ctx, "fontSize");
    const fontWeight = get(ctx, "fontWeight1") ?? get(ctx, "fontWeight");
    const fontColor = get(ctx, "fontColor1") ?? get(ctx, "fontColor");
    const fontFamily = get(ctx, "fontFamily1") ?? get(ctx, "fontFamily");
    const textAlign = get(ctx, "textAlign1") ?? get(ctx, "textAlign") ?? "center";
    const verticalAlign = get(ctx, "verticalAlign1") ?? get(ctx, "verticalAlign") ?? "center";
    const rotation = get(ctx, "rotation1") ?? get(ctx, "rotation") ?? 0;
    const lineHeight = get(ctx, "lineHeight1") ?? get(ctx, "lineHeight");
    const letterSpacing = get(ctx, "letterSpacing1") ?? get(ctx, "letterSpacing");

    const draggables = get(ctx, "draggableImages1") ?? get(ctx, "draggableImages") ?? [];
    const selectedImg = get(ctx, "selectedImg1") ?? get(ctx, "selectedImg") ?? [];
    const stickers = get(ctx, "selectedStickers1") ?? get(ctx, "selectedStickers") ?? [];

    const videoUrl = get(ctx, "selectedVideoUrl1") ?? get(ctx, "selectedVideoUrl") ?? null;
    const qrVideo = get(ctx, "qrPosition1") ?? get(ctx, "qrPosition") ?? {};
    const audioUrl = get(ctx, "selectedAudioUrl1") ?? get(ctx, "selectedAudioUrl") ?? null;
    const qrAudio = get(ctx, "qrAudioPosition1") ?? get(ctx, "qrAudioPosition") ?? {};

    const isAI = !!(get(ctx, "isAIimage1") ?? get(ctx, "isAIimage"));
    const ai = get(ctx, "aimage1") ?? get(ctx, "aimage") ?? null;
    const aiUrl = get(ctx, "selectedAIimageUrl1") ?? get(ctx, "selectedAIimageUrl") ?? null;

    const layers = useMemo<KonvaLayerNode[]>(() => {
      const out: KonvaLayerNode[] = [];
      const selectedSet = new Set(Array.isArray(selectedImg) ? selectedImg : []);

      if (Array.isArray(draggables)) {
        draggables
          .filter((img: any) => (Array.isArray(selectedImg) ? selectedSet.has(img.id) : true))
          .forEach((img: any) => {
            out.push({
              kind: "image",
              id: str(img.id),
              z: num(img.zIndex, 1),
              node: img,
            });
          });
      }

      if (Array.isArray(stickers)) {
        stickers.forEach((st: any, index: number) => {
          out.push({
            kind: "sticker",
            id: str(st.id, `st-${index}`),
            z: num(st.zIndex, 1),
            node: st,
          });
        });
      }

      if (isAI && ai && str(aiUrl).trim().length > 0) {
        out.push({
          kind: "ai",
          id: "ai-image",
          z: 10,
          node: {
            src: aiUrl,
            x: ai?.x ?? 0,
            y: ai?.y ?? 0,
            width: ai?.width ?? 200,
            height: ai?.height ?? 200,
          },
        });
      }

      return out;
    }, [draggables, selectedImg, stickers, isAI, ai, aiUrl]);

    return (
      <Box
        ref={ref}
        sx={{
          width,
          height,
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
          boxShadow: "3px 5px 8px rgba(0,0,0,0.25)",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <KonvaSlidePreview
          width={width}
          height={height}
          bgColor={bgColor ?? "#fff"}
          bgImage={bgImage}
          bgRect={bgRect}
          layers={layers}
          borderRadius={12}
          showOneText={showOneText}
          oneText={{
            value: oneTextValue,
            fontSize,
            fontWeight,
            fontColor,
            fontFamily,
            textAlign,
            verticalAlign,
            rotation,
            lineHeight,
            letterSpacing,
            x: 0,
            y: 0,
            width,
            height,
          }}
          multipleText={multipleText}
          texts={
            Array.isArray(texts)
              ? texts.map((t: any, index: number) => ({
                  value: t.value,
                  x: t.x ?? 0,
                  y: t.y ?? index * 220,
                  width: t.width ?? width,
                  height: t.height ?? 210,
                  fontSize: t.fontSize1 ?? t.fontSize,
                  fontWeight: t.fontWeight1 ?? t.fontWeight,
                  fontColor: t.fontColor1 ?? t.fontColor,
                  fontFamily: t.fontFamily1 ?? t.fontFamily,
                  textAlign: t.textAlign ?? "center",
                  verticalAlign: t.verticalAlign,
                  rotation: t.rotation,
                  lineHeight: t.lineHeight,
                  letterSpacing: t.letterSpacing,
                }))
              : []
          }
        />

        {videoUrl && (
          <Box
            sx={{
              position: "absolute",
              left: qrVideo?.x || 0,
              top: qrVideo?.y || 0,
              width: (qrVideo?.width || 120) + 40,
              height: 200,
              zIndex: qrVideo?.zIndex ?? 999,
              pointerEvents: "none",
            }}
          >
            <Box
              component="img"
              src="/assets/images/video-qr-tips.png"
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            <Box sx={{ position: "absolute", top: 55, left: 6, borderRadius: 2 }}>
              <QrGenerator url={videoUrl} size={Math.min(qrVideo?.width || 120, qrVideo?.height || 120)} />
            </Box>
            <Typography
              sx={{ position: "absolute", top: 80, right: 15, fontSize: "10px", width: "105px", textAlign: "right" }}
            >
              {(videoUrl || "").slice(0, 20)}.....
            </Typography>
            <IconButton
              size="small"
              sx={{ position: "absolute", top: 0, right: 0, bgcolor: "black", color: "white", width: 22, height: 22 }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          </Box>
        )}

        {audioUrl && (
          <Box
            sx={{
              position: "absolute",
              left: qrAudio?.x || 0,
              top: qrAudio?.y || 0,
              width: (qrAudio?.width || 120) + 40,
              height: 200,
              zIndex: qrAudio?.zIndex ?? 999,
              pointerEvents: "none",
            }}
          >
            <Box
              component="img"
              src="/assets/images/audio-qr-tips.png"
              alt=""
              sx={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            <Box sx={{ position: "absolute", top: 55, left: 6, borderRadius: 2 }}>
              <QrGenerator url={audioUrl} size={Math.min(qrAudio?.width || 120, qrAudio?.height || 120)} />
            </Box>
            <Typography
              sx={{ position: "absolute", top: 78, right: 15, fontSize: "10px", width: "105px", textAlign: "right" }}
            >
              {(audioUrl || "").slice(0, 20)}.....
            </Typography>
            <IconButton
              size="small"
              sx={{ position: "absolute", top: 0, right: 0, bgcolor: "black", color: "white", width: 22, height: 22 }}
            >
              <Close fontSize="inherit" />
            </IconButton>
          </Box>
        )}
      </Box>
    );
  },
);

export default EditorPreviewSlide;
