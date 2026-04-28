import { forwardRef, useImperativeHandle, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Group } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";

type ElementEl = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string | null;
  zIndex?: number;
  rotation?: number;
  clipPath?: string | null;
};

type StickerEl = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  rotation?: number;
  sticker?: string | null;
};

type TextEl = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string | null;
  value?: string | null;
  textAlign?: "left" | "center" | "right" | "start" | "end";
  verticalAlign?: "top" | "center" | "bottom";
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  fontColor?: string;
  fontWeight?: number;
  italic?: boolean;
  zIndex?: number;
  lineHeight?: number;
  letterSpacing?: number;
};

type UserKonvaPreviewProps = {
  width: number;
  height: number;
  bgColor?: string | null;
  bgImage?: string | null;
  elements?: ElementEl[];
  stickers?: StickerEl[];
  textElements?: TextEl[];
  scale?: number;
  borderRadius?: number;
  boxShadow?: string;
  listening?: boolean;
};

export type UserKonvaPreviewHandle = {
  toDataURL: (mimeType?: string) => string | null;
};

const coverCrop = (image: HTMLImageElement, width: number, height: number) => {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;

  if (imageRatio > targetRatio) {
    const cropWidth = image.height * targetRatio;
    return {
      cropX: (image.width - cropWidth) / 2,
      cropY: 0,
      cropWidth,
      cropHeight: image.height,
    };
  }

  const cropHeight = image.width / targetRatio;
  return {
    cropX: 0,
    cropY: (image.height - cropHeight) / 2,
    cropWidth: image.width,
    cropHeight,
  };
};

const parsePolygonClip = (clipPath?: string | null) => {
  if (!clipPath?.startsWith("polygon(")) return null;
  const points = clipPath
    .slice("polygon(".length, -1)
    .split(",")
    .map((point) => {
      const [xRaw, yRaw] = point.trim().split(/\s+/);
      const x = Number.parseFloat(xRaw);
      const y = Number.parseFloat(yRaw);
      if (Number.isNaN(x) || Number.isNaN(y)) return null;
      return { x: x / 100, y: y / 100 };
    })
    .filter((point): point is { x: number; y: number } => Boolean(point));

  return points.length >= 3 ? points : null;
};

const CanvasImage = ({
  src,
  x,
  y,
  width,
  height,
  rotation = 0,
  objectFit = "fill",
  clipPath,
}: {
  src?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  objectFit?: "fill" | "cover" | "contain";
  clipPath?: string | null;
}) => {
  const [image] = useImage(src || "", "anonymous");
  if (!src || !image || width <= 0 || height <= 0) return null;

  const polygon = parsePolygonClip(clipPath);
  const groupX = x + width / 2;
  const groupY = y + height / 2;
  const cropProps = objectFit === "cover" ? coverCrop(image, width, height) : {};

  let drawWidth = width;
  let drawHeight = height;
  if (objectFit === "contain") {
    const ratio = Math.min(width / image.width, height / image.height);
    drawWidth = image.width * ratio;
    drawHeight = image.height * ratio;
  }

  return (
    <Group
      x={groupX}
      y={groupY}
      rotation={rotation}
      clipFunc={
        polygon
          ? (ctx: Konva.Context) => {
              ctx.beginPath();
              polygon.forEach((point, index) => {
                const px = point.x * width - width / 2;
                const py = point.y * height - height / 2;
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
        x={-drawWidth / 2}
        y={-drawHeight / 2}
        width={drawWidth}
        height={drawHeight}
        {...cropProps}
      />
    </Group>
  );
};

const CanvasText = ({ item }: { item: TextEl }) => {
  const text = item.text ?? item.value ?? "";
  if (!text) return null;

  const align =
    item.textAlign === "start"
      ? "left"
      : item.textAlign === "end"
        ? "right"
        : item.textAlign ?? "center";
  const verticalAlign = item.verticalAlign === "center" ? "middle" : item.verticalAlign ?? "middle";
  const fontStyle = `${item.fontWeight && item.fontWeight >= 600 ? "bold" : ""}${
    item.italic ? " italic" : ""
  }`.trim() || "normal";

  return (
    <KonvaText
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      text={text}
      fontSize={item.fontSize ?? 18}
      fontFamily={item.fontFamily ?? "Roboto"}
      fill={item.color ?? item.fontColor ?? "#000000"}
      fontStyle={fontStyle}
      align={align}
      verticalAlign={verticalAlign}
      lineHeight={item.lineHeight ?? 1.2}
      letterSpacing={item.letterSpacing ?? 0}
      wrap="word"
    />
  );
};

const UserKonvaPreview = forwardRef<UserKonvaPreviewHandle, UserKonvaPreviewProps>(
  (
    {
      width,
      height,
      bgColor = "#ffffff",
      bgImage,
      elements = [],
      stickers = [],
      textElements = [],
      scale = 1,
      borderRadius = 0,
      boxShadow = "none",
      listening = false,
    },
    ref,
  ) => {
    const stageRef = useRef<Konva.Stage | null>(null);

    useImperativeHandle(ref, () => ({
      toDataURL: (mimeType = "image/png") =>
        stageRef.current?.toDataURL({ pixelRatio: 2, mimeType }) ?? null,
    }));

    const layers = [
      ...elements
        .filter((item) => Boolean(item.src))
        .map((item) => ({ kind: "element" as const, item, zIndex: item.zIndex ?? 0 })),
      ...stickers
        .filter((item) => Boolean(item.sticker))
        .map((item) => ({ kind: "sticker" as const, item, zIndex: item.zIndex ?? 1 })),
      ...textElements
        .filter((item) => Boolean((item.text ?? item.value ?? "").trim()))
        .map((item) => ({ kind: "text" as const, item, zIndex: (item.zIndex ?? 1) + 1000 })),
    ].sort((a, b) => a.zIndex - b.zIndex);

    return (
      <div
        style={{
          width,
          height,
          borderRadius,
          boxShadow,
          overflow: "hidden",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: "top left",
        }}
      >
        <Stage ref={stageRef} width={width} height={height} listening={listening}>
          <Layer listening={listening}>
            <Rect x={0} y={0} width={width} height={height} fill={bgColor ?? "transparent"} />
            {bgImage && (
              <CanvasImage src={bgImage} x={0} y={0} width={width} height={height} objectFit="cover" />
            )}
            {layers.map((layer) => {
              if (layer.kind === "text") {
                return <CanvasText key={`text-${layer.item.id}`} item={layer.item} />;
              }

              if (layer.kind === "sticker") {
                return (
                  <CanvasImage
                    key={`sticker-${layer.item.id}`}
                    src={layer.item.sticker}
                    x={layer.item.x}
                    y={layer.item.y}
                    width={layer.item.width}
                    height={layer.item.height}
                    rotation={layer.item.rotation}
                    objectFit="contain"
                  />
                );
              }

              return (
                <CanvasImage
                  key={`element-${layer.item.id}`}
                  src={layer.item.src}
                  x={layer.item.x}
                  y={layer.item.y}
                  width={layer.item.width}
                  height={layer.item.height}
                  rotation={layer.item.rotation}
                  clipPath={layer.item.clipPath}
                  objectFit={layer.item.id === "bg-image" ? "cover" : "fill"}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
    );
  },
);

UserKonvaPreview.displayName = "UserKonvaPreview";

export default UserKonvaPreview;
