import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect } from 'react-konva';
import useImage from 'use-image';

interface Position {
  x: number;
  y: number;
}

interface Element {
  type: 'text' | 'image' | 'sticker';
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string;
  text?: string;
  value?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  fontStyle?: string;
  color?: string;
  fill?: string;
  textAlign?: 'left' | 'center' | 'right';
  rotation?: number;
  zIndex?: number;
  curve?: number;
  textDecoration?: string;
  lineHeight?: number;
}

interface TempletKonvaPreviewProps {
  width: number;
  height: number;
  bgImage?: string | null;
  bgColor?: string;
  elements: Element[];
  scale?: number;
  borderRadius?: number;
}

const ImageWrapper: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSticker?: boolean;
}> = ({ src, x, y, width, height, isSticker }) => {
  const [image] = useImage(src);
  if (!image) return null;
  return (
    <KonvaImage
      image={image}
      x={x}
      y={y}
      width={width}
      height={height}
      objectFit={isSticker ? 'contain' : 'cover'}
    />
  );
};

const TextElement: React.FC<{
  element: Element;
  x: number;
  y: number;
  width: number;
  height: number;
}> = ({ element, x, y, width, height }) => {
  const textAlign = element.textAlign || 'center';
  const rotation = element.rotation || 0;
  const curve = element.curve || 0;
  const hasCurve = Math.abs(curve) > 0.5;
  const safeW = Math.max(1, width);
  const safeH = Math.max(1, height);
  const curvePx = (curve / 100) * (safeH / 2);
  const midY = safeH / 2;
  const curvePath = `M 0 ${midY} Q ${safeW / 2} ${midY - curvePx} ${safeW} ${midY}`;
  const curveId = `curve-${Math.random()}`;
  const textAnchor = textAlign === 'left' ? 'start' : textAlign === 'right' ? 'end' : 'middle';
  const startOffset = textAlign === 'left' ? '0%' : textAlign === 'right' ? '100%' : '50%';

  const fontFamily = element.fontFamily || 'Arial';
  const fontWeight = element.fontWeight || 400;
  const fontStyle = element.fontStyle || 'normal';
  const textDecoration = element.textDecoration || 'none';
  const fill = element.color || element.fill || '#111111';
  const fontSize = element.fontSize || 20;
  const lineHeight = element.lineHeight || 1.2;
  const text = element.text || element.value || '';

  if (hasCurve) {
    return (
      <svg
        width={safeW}
        height={safeH}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: safeW,
          height: safeH,
          overflow: 'visible',
        }}
      >
        <defs>
          <path id={curveId} d={curvePath} />
        </defs>
        <text
          fill={fill}
          fontFamily={fontFamily}
          fontSize={fontSize}
          fontWeight={fontWeight}
          fontStyle={fontStyle}
          textDecoration={textDecoration}
          textAnchor={textAnchor}
          dominantBaseline="middle"
        >
          <textPath href={`#${curveId}`} startOffset={startOffset}>
            {text}
          </textPath>
        </text>
      </svg>
    );
  }

  const justify = textAlign === 'left' ? 'flex-start' : textAlign === 'right' ? 'flex-end' : 'center';
  const transform = rotation ? `rotate(${rotation}deg)` : 'none';

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: safeW,
        height: safeH,
        display: 'flex',
        alignItems: 'center',
        justifyContent: justify,
        transform,
        transformOrigin: 'center',
        overflow: 'visible',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: justify,
          fontWeight,
          fontStyle,
          fontSize,
          fontFamily,
          color: fill,
          textDecoration,
          textAlign,
          whiteSpace: 'pre-wrap',
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          lineHeight,
          overflow: 'visible',
        }}
      >
        {text}
      </div>
    </div>
  );
};

const TempletKonvaPreview = forwardRef<any, TempletKonvaPreviewProps>(({
  width,
  height,
  bgImage,
  bgColor = '#fff',
  elements,
  scale = 1,
  borderRadius = 12,
}, ref) => {
  const stageRef = useRef<any>(null);
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (bgImage) {
      const img = new Image();
      img.src = bgImage;
      img.crossOrigin = 'Anonymous';
      img.onload = () => setBackgroundImg(img);
    } else {
      setBackgroundImg(null);
    }
  }, [bgImage]);

  const toDataURL = () => {
    return stageRef.current?.toDataURL({ pixelRatio: 2 }) || null;
  };

  useImperativeHandle(ref, () => ({ toDataURL }));

  const sortedElements = [...elements].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));

  return (
    <div
      style={{
        width,
        height,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <Stage ref={stageRef} width={width} height={height}>
        <Layer>
          {backgroundImg ? (
            <KonvaImage image={backgroundImg} x={0} y={0} width={width} height={height} fit="cover" />
          ) : (
            <Rect x={0} y={0} width={width} height={height} fill={bgColor} />
          )}

          {sortedElements.map((el, idx) => {
            if (el.type === 'image' || el.type === 'sticker') {
              return (
                <ImageWrapper
                  key={`img-${idx}`}
                  src={el.src || ''}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  isSticker={el.type === 'sticker'}
                />
              );
            }
            if (el.type === 'text') {
              return (
                <TextElement
                  key={`text-${idx}`}
                  element={el}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
});

export default TempletKonvaPreview;