import { useMemo } from "react";
import { useSlide1 } from "../../../../../context/Slide1Context";
import KonvaSlidePreview, {
  bool,
  KonvaLayerNode,
  num,
  str,
} from "../KonvaSlidePreview/KonvaSlidePreview";

export type Slide1PreviewBoxProps = {
  width?: number | string;
  height?: number | string;
  scale?: number;
  borderRadius?: number;
};

export default function Slide1PreviewBox({
  width = 505,
  height = 700,
  scale = 1,
  borderRadius = 12,
}: Slide1PreviewBoxProps) {
  const s1 = useSlide1();

  const {
    bgColor1,
    bgImage1,
    bgRect1,
    draggableImages1,
    selectedImg1,
    selectedStickers1,
    textElements1,
    showOneTextRightSideBox1,
    oneTextValue1,
    fontSize1,
    fontWeight1,
    fontColor1,
    fontFamily1,
    textAlign1,
    verticalAlign1,
    rotation1,
    lineHeight1,
    letterSpacing1,
    multipleTextValue1,
    texts1,
    isAIimage1,
    selectedAIimageUrl1,
    aimage1,
  } = s1 as any;

  const layers = useMemo<KonvaLayerNode[]>(() => {
    const out: KonvaLayerNode[] = [];

    const images: any[] = Array.isArray(draggableImages1) ? draggableImages1 : [];
    const selectedIds = new Set(Array.isArray(selectedImg1) ? selectedImg1 : []);
    images
      .filter((img: any) => selectedIds.has(img.id))
      .forEach((img: any) => {
        out.push({
          kind: "image",
          id: str(img.id),
          z: num(img.zIndex, 1),
          node: img,
        });
      });

    const stickers: any[] = Array.isArray(selectedStickers1) ? selectedStickers1 : [];
    stickers.forEach((st, idx) => {
      out.push({
        kind: "sticker",
        id: str(st.id, `st-${idx}`),
        z: num(st.zIndex, 1),
        node: st,
      });
    });

    const texts: any[] = Array.isArray(textElements1) ? textElements1 : [];
    texts.forEach((t, idx) => {
      out.push({
        kind: "text",
        id: str(t.id, `tx-${idx}`),
        z: num(t.zIndex, 1),
        node: t,
      });
    });

    if (bool(isAIimage1, false) && str(selectedAIimageUrl1).trim().length > 0) {
      out.push({
        kind: "ai",
        id: "ai-image",
        z: 9999,
        node: {
          src: selectedAIimageUrl1,
          x: num(aimage1?.x, 0),
          y: num(aimage1?.y, 0),
          width: num(aimage1?.width, 200),
          height: num(aimage1?.height, 200),
        },
      });
    }

    return out;
  }, [
    draggableImages1,
    selectedImg1,
    selectedStickers1,
    textElements1,
    isAIimage1,
    selectedAIimageUrl1,
    aimage1,
  ]);

  const isEmptyPreview = useMemo(() => {
    const hasBgImage = str(bgImage1).trim().length > 0;
    const hasLayers = layers.length > 0;
    const hasOneText =
      bool(showOneTextRightSideBox1, false) && str(oneTextValue1).trim().length > 0;
    const hasMultiText =
      bool(multipleTextValue1, false) &&
      Array.isArray(texts1) &&
      texts1.some((t: any) => str(t?.value).trim().length > 0);

    return !(hasBgImage || hasLayers || hasOneText || hasMultiText);
  }, [bgImage1, layers, showOneTextRightSideBox1, oneTextValue1, multipleTextValue1, texts1]);

  return (
    <KonvaSlidePreview
      width={width}
      height={height}
      scale={scale}
      bgColor={bgColor1 ?? "transparent"}
      bgImage={bgImage1}
      bgRect={bgRect1}
      layers={layers}
      showEmpty={isEmptyPreview}
      borderRadius={borderRadius}
      showOneText={bool(showOneTextRightSideBox1, false)}
      oneText={{
        value: oneTextValue1,
        fontSize: fontSize1,
        fontWeight: fontWeight1,
        fontColor: fontColor1,
        fontFamily: fontFamily1,
        textAlign: textAlign1,
        verticalAlign: verticalAlign1,
        rotation: rotation1,
        lineHeight: lineHeight1,
        letterSpacing: letterSpacing1,
      }}
      multipleText={bool(multipleTextValue1, false)}
      texts={
        Array.isArray(texts1)
          ? texts1.map((t: any, index: number) => ({
              value: t.value,
              x: t.x,
              y: t.y ?? index * 220,
              width: t.width,
              height: t.height,
              fontSize: t.fontSize1 ?? t.fontSize,
              fontWeight: t.fontWeight1 ?? t.fontWeight,
              fontColor: t.fontColor1 ?? t.fontColor,
              fontFamily: t.fontFamily1 ?? t.fontFamily,
              textAlign: t.textAlign,
              verticalAlign: t.verticalAlign,
              rotation: t.rotation,
              lineHeight: t.lineHeight,
              letterSpacing: t.letterSpacing,
              zIndex: t.zIndex,
            }))
          : []
      }
    />
  );
}
