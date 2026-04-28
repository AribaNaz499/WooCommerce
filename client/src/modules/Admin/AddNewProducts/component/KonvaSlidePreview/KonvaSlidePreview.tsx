import { useEffect, useMemo, useState } from "react";
import { Box, Typography } from "@mui/material";
import { CollectionsOutlined } from "@mui/icons-material";
import { Group, Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";

export type KonvaLayerNode =
  | { kind: "image"; id: string; z: number; node: any }
  | { kind: "sticker"; id: string; z: number; node: any }
  | { kind: "text"; id: string; z: number; node: any }
  | { kind: "ai"; id: string; z: number; node: any };

export type KonvaTextBlock = {
  value?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontWeight?: number | string;
  fontColor?: string;
  fontFamily?: string;
  textAlign?: string;
  verticalAlign?: string;
  rotation?: number;
  lineHeight?: number;
  letterSpacing?: number | string;
  zIndex?: number;
};

export type KonvaSlidePreviewProps = {
  width?: number | string;
  height?: number | string;
  scale?: number;
  bgColor?: string | null;
  bgImage?: string | null;
  bgRect?: any;
  layers?: KonvaLayerNode[];
  showEmpty?: boolean;
  showOneText?: boolean;
  oneText?: KonvaTextBlock;
  multipleText?: boolean;
  texts?: KonvaTextBlock[];
  borderRadius?: number;
};

export const num = (v: any, d = 0) => (typeof v === "number" && !Number.isNaN(v) ? v : d);
export const str = (v: any, d = "") => (typeof v === "string" ? v : d);
export const bool = (v: any, d = false) => (typeof v === "boolean" ? v : d);

const toCanvasNumber = (v: number | string | undefined, fallback: number) => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const parsed = Number(v);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const useHtmlImage = (src?: string | null) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src || !String(src).trim()) {
      setImage(null);
      return;
    }

    let alive = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (alive) setImage(img);
    };
    img.onerror = () => {
      if (alive) setImage(null);
    };
    img.src = src;

    return () => {
      alive = false;
    };
  }, [src]);

  return image;
};

const getCoverCrop = (image: HTMLImageElement | null, width: number, height: number) => {
  if (!image?.naturalWidth || !image?.naturalHeight) return undefined;

  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;

  if (imageRatio > boxRatio) {
    const cropWidth = image.naturalHeight * boxRatio;
    return {
      cropX: (image.naturalWidth - cropWidth) / 2,
      cropY: 0,
      cropWidth,
      cropHeight: image.naturalHeight,
    };
  }

  const cropHeight = image.naturalWidth / boxRatio;
  return {
    cropX: 0,
    cropY: (image.naturalHeight - cropHeight) / 2,
    cropWidth: image.naturalWidth,
    cropHeight,
  };
};

const getContainBox = (image: HTMLImageElement | null, width: number, height: number) => {
  if (!image?.naturalWidth || !image?.naturalHeight) {
    return { x: 0, y: 0, width, height };
  }

  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;

  return {
    x: (width - drawWidth) / 2,
    y: (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  };
};

const alignToKonva = (value?: string) => {
  if (value === "start") return "left";
  if (value === "end") return "right";
  if (value === "right") return "right";
  if (value === "left") return "left";
  return "center";
};

const verticalToKonva = (value?: string) => {
  if (value === "top") return "top";
  if (value === "bottom") return "bottom";
  return "middle";
};

const fontStyle = (weight?: number | string) => {
  if (weight === "bold" || Number(weight) >= 600) return "bold";
  return "normal";
};

const letterSpacingNumber = (value: any) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePolygonClip = (clipPath: string, width: number, height: number) => {
  const match = clipPath.match(/^polygon\((.+)\)$/i);
  if (!match) return null;

  const points = match[1]
    .split(",")
    .map((point) => point.trim().split(/\s+/))
    .map(([rawX, rawY]) => {
      const x = rawX?.endsWith("%") ? (parseFloat(rawX) / 100) * width : parseFloat(rawX);
      const y = rawY?.endsWith("%") ? (parseFloat(rawY) / 100) * height : parseFloat(rawY);
      return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
    })
    .filter(Boolean) as number[][];

  return points.length >= 3 ? points : null;
};

function CoverImage({
  src,
  x,
  y,
  width,
  height,
  rotation = 0,
  zIndex,
  objectFit = "fill",
  clipPath,
}: {
  src?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  zIndex?: number;
  objectFit?: "fill" | "contain" | "cover";
  clipPath?: string;
}) {
  const image = useHtmlImage(src);
  const coverCrop = objectFit === "cover" ? getCoverCrop(image, width, height) : undefined;
  const containBox = objectFit === "contain" ? getContainBox(image, width, height) : null;
  const polygon = clipPath && clipPath !== "none" ? parsePolygonClip(clipPath, width, height) : null;

  if (!image) return null;

  return (
    <Group
      x={rotation ? x + width / 2 : x}
      y={rotation ? y + height / 2 : y}
      offsetX={rotation ? width / 2 : 0}
      offsetY={rotation ? height / 2 : 0}
      width={width}
      height={height}
      rotation={rotation}
      listening={false}
      clipFunc={
        polygon
          ? (ctx) => {
              ctx.beginPath();
              polygon.forEach(([px, py], index) => {
                if (index === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
              });
              ctx.closePath();
            }
          : undefined
      }
    >
      <KonvaImage
        image={image}
        x={containBox?.x ?? 0}
        y={containBox?.y ?? 0}
        width={containBox?.width ?? width}
        height={containBox?.height ?? height}
        listening={false}
        perfectDrawEnabled={false}
        {...coverCrop}
      />
    </Group>
  );
}

function KonvaTextBlockNode({ block, fallbackWidth, fallbackHeight }: {
  block: KonvaTextBlock;
  fallbackWidth: number;
  fallbackHeight: number;
}) {
  const width = num(block.width, fallbackWidth);
  const height = num(block.height, fallbackHeight);
  const x = num(block.x, 0);
  const y = num(block.y, 0);
  const rotation = num(block.rotation, 0);

  return (
    <Text
      x={rotation ? x + width / 2 : x}
      y={rotation ? y + height / 2 : y}
      offsetX={rotation ? width / 2 : 0}
      offsetY={rotation ? height / 2 : 0}
      width={width}
      height={height}
      text={str(block.value, "")}
      fontSize={num(block.fontSize, 16)}
      fontStyle={fontStyle(block.fontWeight)}
      fill={block.fontColor || "#000"}
      fontFamily={block.fontFamily || "Roboto"}
      align={alignToKonva(block.textAlign)}
      verticalAlign={verticalToKonva(block.verticalAlign)}
      rotation={rotation}
      lineHeight={num(block.lineHeight, 1.4)}
      letterSpacing={letterSpacingNumber(block.letterSpacing)}
      wrap="word"
      listening={false}
    />
  );
}

export default function KonvaSlidePreview({
  width = 505,
  height = 700,
  scale = 1,
  bgColor = "transparent",
  bgImage,
  bgRect,
  layers = [],
  showEmpty = false,
  showOneText = false,
  oneText,
  multipleText = false,
  texts = [],
  borderRadius = 12,
}: KonvaSlidePreviewProps) {
  const stageWidth = toCanvasNumber(width, 505);
  const stageHeight = toCanvasNumber(height, 700);
  const bg = bgRect ?? { x: 0, y: 0, width: stageWidth, height: stageHeight };

  const ordered = useMemo(() => [...layers].sort((a, b) => a.z - b.z), [layers]);

  if (showEmpty) {
    return (
      <Box
        sx={{
          width,
          height,
          display: "grid",
          placeItems: "center",
          bgcolor: bgColor ?? "transparent",
          borderRadius,
          overflow: "hidden",
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Box sx={{ textAlign: "center", opacity: 0.65 }}>
          <CollectionsOutlined sx={{ fontSize: 64 }} />
          <Typography sx={{ mt: 1, fontWeight: 700, fontSize: 14 }}>No preview yet</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width,
        height,
        overflow: "hidden",
        borderRadius,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      <Stage width={stageWidth} height={stageHeight} listening={false}>
        <Layer listening={false}>
          <Rect x={0} y={0} width={stageWidth} height={stageHeight} fill={bgColor || "transparent"} />

          {str(bgImage).trim().length > 0 ? (
            <CoverImage
              src={bgImage}
              x={num(bg.x, 0)}
              y={num(bg.y, 0)}
              width={num(bg.width, stageWidth)}
              height={num(bg.height, stageHeight)}
              objectFit="cover"
            />
          ) : null}

          {ordered.map((layer) => {
            if (layer.kind === "image") {
              const img = layer.node;
              return (
                <CoverImage
                  key={`img:${layer.id}`}
                  src={img.src}
                  x={num(img.x, 0)}
                  y={num(img.y, 0)}
                  width={num(img.width, 120)}
                  height={num(img.height, 120)}
                  rotation={num(img.rotation, 0)}
                  zIndex={layer.z}
                  clipPath={str(img.shapePath ?? img.clipPath ?? "none", "none")}
                />
              );
            }

            if (layer.kind === "sticker") {
              const st = layer.node;
              return (
                <CoverImage
                  key={`st:${layer.id}`}
                  src={st.sticker}
                  x={num(st.x, 0)}
                  y={num(st.y, 0)}
                  width={num(st.width, 80)}
                  height={num(st.height, 80)}
                  rotation={num(st.rotation, 0)}
                  zIndex={layer.z}
                  objectFit="contain"
                />
              );
            }

            if (layer.kind === "text") {
              const t = layer.node;
              const size = t.size ?? { width: t.width, height: t.height };
              const pos = t.position ?? { x: t.x, y: t.y };
              return (
                <KonvaTextBlockNode
                  key={`tx:${layer.id}`}
                  block={{
                    value: t.value,
                    x: pos.x,
                    y: pos.y,
                    width: size.width,
                    height: size.height,
                    fontSize: t.fontSize,
                    fontWeight: t.fontWeight,
                    fontColor: t.fontColor,
                    fontFamily: t.fontFamily,
                    textAlign: t.textAlign,
                    verticalAlign: t.verticalAlign,
                    rotation: t.rotation,
                    lineHeight: t.lineHeight,
                    letterSpacing: t.letterSpacing,
                  }}
                  fallbackWidth={200}
                  fallbackHeight={40}
                />
              );
            }

            if (layer.kind === "ai") {
              const ai = layer.node;
              return (
                <CoverImage
                  key="ai"
                  src={ai.src}
                  x={num(ai.x, 0)}
                  y={num(ai.y, 0)}
                  width={num(ai.width, 200)}
                  height={num(ai.height, 200)}
                  zIndex={layer.z}
                />
              );
            }

            return null;
          })}

          {showOneText && oneText ? (
            <KonvaTextBlockNode
              block={{
                ...oneText,
                x: oneText.x ?? 10,
                y: oneText.y ?? 10,
                width: oneText.width ?? stageWidth - 20,
                height: oneText.height ?? stageHeight - 20,
              }}
              fallbackWidth={stageWidth - 20}
              fallbackHeight={stageHeight - 20}
            />
          ) : null}

          {multipleText && texts.length > 0
            ? texts.map((t, index) => (
                <KonvaTextBlockNode
                  key={`mtext-${index}`}
                  block={{
                    ...t,
                    x: t.x ?? 10,
                    y: t.y ?? 10 + index * ((stageHeight - 20) / texts.length),
                    width: t.width ?? stageWidth - 20,
                    height: t.height ?? (stageHeight - 20) / texts.length,
                  }}
                  fallbackWidth={stageWidth - 20}
                  fallbackHeight={(stageHeight - 20) / texts.length}
                />
              ))
            : null}
        </Layer>
      </Stage>
    </Box>
  );
}
