import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Rect, Transformer, Group } from 'react-konva';
import type { KonvaPreviewProps, Layer as LayerType, ImageLayer, TextLayer } from '../../components/KonvaPreview/konva.types';

// ✅ Custom hook with CORS support - returns only the image
const useImageWithCORS = (src: string): HTMLImageElement | null => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!src) {
      setImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      setImage(img);
    };
    img.onerror = (err) => {
      console.error('Failed to load image:', src, err);
      setImage(null);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return image;
};

// Image wrapper with transformer (with CORS fix)
const ImageWrapper: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onTransform?: (x: number, y: number, width: number, height: number, rotation: number) => void;
}> = ({ src, x, y, width, height, rotation, isSelected, onSelect, onDragEnd, onTransform }) => {
  const image = useImageWithCORS(src); // ✅ Returns HTMLImageElement | null
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => onDragEnd?.(e.target.x(), e.target.y());
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    onTransform?.(node.x(), node.y(), node.width(), node.height(), node.rotation());
  };

  if (!image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={rotation}
        draggable={!!onDragEnd}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Text wrapper with transformer
const TextWrapper: React.FC<{
  layer: TextLayer;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onTransform?: (x: number, y: number, width: number, height: number, rotation: number) => void;
}> = ({ layer, isSelected, onSelect, onDragEnd, onTransform }) => {
  const textRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => onDragEnd?.(e.target.x(), e.target.y());
  const handleTransformEnd = () => {
    const node = textRef.current;
    if (!node) return;
    onTransform?.(node.x(), node.y(), node.width(), node.height(), node.rotation());
  };

  return (
    <>
      <KonvaText
        ref={textRef}
        x={layer.x}
        y={layer.y}
        width={layer.width}
        height={layer.height}
        text={layer.value}
        fontSize={layer.fontSize}
        fontFamily={layer.fontFamily}
        fill={layer.color}
        align={layer.textAlign}
        verticalAlign={layer.verticalAlign === 'middle' ? 'middle' : layer.verticalAlign}
        rotation={layer.rotation}
        lineHeight={layer.lineHeight || 1.4}
        letterSpacing={layer.letterSpacing}
        draggable={!!onDragEnd}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        wrap="word"
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 20 || newBox.height < 20) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

// QR Code component
const QRCodeRenderer: React.FC<{
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'video' | 'audio';
}> = ({ url, x, y, width, height, type }) => {
  const [qrImage, setQrImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const loadQRCode = async () => {
      try {
        const QRCode = await import('qrcode');
        const dataUrl = await QRCode.toDataURL(url, { width: Math.min(width, height), margin: 1 });
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => setQrImage(img);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      }
    };
    loadQRCode();
  }, [url, width, height]);

  if (!qrImage) return null;

  return (
    <Group x={x} y={y}>
      <Rect
        width={width + 40}
        height={height + 80}
        fill="white"
        cornerRadius={8}
        stroke="#ccc"
        strokeWidth={1}
      />
      <KonvaImage
        image={qrImage}
        x={6}
        y={55}
        width={width}
        height={height}
      />
      <KonvaText
        x={width + 10}
        y={80}
        text={type === 'video' ? '🎬 Scan video' : '🎵 Scan audio'}
        fontSize={10}
        fill="#333"
        width={100}
      />
      <KonvaText
        x={width + 10}
        y={95}
        text={url.slice(0, 25) + '...'}
        fontSize={8}
        fill="#666"
        width={100}
      />
    </Group>
  );
};

// Helper component for AI and Sticker layers (with CORS fix)
const SimpleImageWrapper: React.FC<{
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onDragEnd?: (x: number, y: number) => void;
  onTransform?: (x: number, y: number, width: number, height: number, rotation: number) => void;
}> = ({ src, x, y, width, height, isSelected, onSelect, onDragEnd, onTransform }) => {
  const image = useImageWithCORS(src); // ✅ Returns HTMLImageElement | null
  const shapeRef = useRef<any>(null);
  const trRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleDragEnd = (e: any) => onDragEnd?.(e.target.x(), e.target.y());
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    onTransform?.(node.x(), node.y(), node.width(), node.height(), node.rotation());
  };

  if (!image) return null;

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={x}
        y={y}
        width={width}
        height={height}
        draggable={!!onDragEnd}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
        />
      )}
    </>
  );
};

// Main Component
const KonvaPreview = forwardRef<any, KonvaPreviewProps>(({
  width,
  height,
  bgImage,
  bgColor = '#fff',
  layers,
  scale = 1,
  borderRadius = 12,
  onLayerDragEnd,
  onLayerTransform,
  isEditable = false,
  selectedLayerId,
  onLayerSelect,
}, ref) => {
  const stageRef = useRef<any>(null);
  const [backgroundImg, setBackgroundImg] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (bgImage) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => setBackgroundImg(img);
      img.onerror = (err) => console.error('Failed to load background image:', bgImage, err);
      img.src = bgImage;
    } else {
      setBackgroundImg(null);
    }
  }, [bgImage]);

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  const toDataURL = useCallback((mimeType: string = 'image/png') => {
    try {
      return stageRef.current?.toDataURL({ mimeType, pixelRatio: 2 }) || null;
    } catch (error) {
      console.error('Failed to export canvas:', error);
      return null;
    }
  }, []);

  useImperativeHandle(ref, () => ({ toDataURL }), [toDataURL]);

  return (
    <div
      style={{
        width,
        height,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        boxShadow: '3px 5px 8px rgba(0,0,0,0.25)',
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <Stage ref={stageRef} width={width} height={height} style={{ backgroundColor: bgImage ? 'transparent' : bgColor }}>
        <Layer>
          {/* Background */}
          {backgroundImg ? (
            <KonvaImage
              image={backgroundImg}
              x={0}
              y={0}
              width={width}
              height={height}
              fit="cover"
            />
          ) : (
            <Rect x={0} y={0} width={width} height={height} fill={bgColor} />
          )}

          {/* Render all layers */}
          {sortedLayers.map((layer) => {
            const isSelected = isEditable && selectedLayerId === layer.id;
            const handleSelect = () => onLayerSelect?.(layer.id);
            const handleDragEnd = (x: number, y: number) => onLayerDragEnd?.(layer.id, x, y);
            const handleTransform = (x: number, y: number, w: number, h: number, r: number) =>
              onLayerTransform?.(layer.id, x, y, w, h, r);

            switch (layer.kind) {
              case 'image':
                return (
                  <ImageWrapper
                    key={layer.id}
                    src={layer.src}
                    x={layer.x}
                    y={layer.y}
                    width={layer.width}
                    height={layer.height}
                    rotation={(layer as ImageLayer).rotation || 0}
                    isSelected={isSelected}
                    onSelect={handleSelect}
                    onDragEnd={onLayerDragEnd ? handleDragEnd : undefined}
                    onTransform={onLayerTransform ? handleTransform : undefined}
                  />
                );
              case 'sticker':
                return (
                  <ImageWrapper
                    key={layer.id}
                    src={layer.src}
                    x={layer.x}
                    y={layer.y}
                    width={layer.width}
                    height={layer.height}
                    rotation={layer.rotation || 0}
                    isSelected={isSelected}
                    onSelect={handleSelect}
                    onDragEnd={onLayerDragEnd ? handleDragEnd : undefined}
                    onTransform={onLayerTransform ? handleTransform : undefined}
                  />
                );
              case 'ai':
                return (
                  <SimpleImageWrapper
                    key={layer.id}
                    src={layer.src}
                    x={layer.x}
                    y={layer.y}
                    width={layer.width}
                    height={layer.height}
                    isSelected={isSelected}
                    onSelect={handleSelect}
                    onDragEnd={onLayerDragEnd ? handleDragEnd : undefined}
                    onTransform={onLayerTransform ? handleTransform : undefined}
                  />
                );
              case 'text':
                return (
                  <TextWrapper
                    key={layer.id}
                    layer={layer}
                    isSelected={isSelected}
                    onSelect={handleSelect}
                    onDragEnd={onLayerDragEnd ? handleDragEnd : undefined}
                    onTransform={onLayerTransform ? handleTransform : undefined}
                  />
                );
              case 'qr':
                return (
                  <QRCodeRenderer
                    key={layer.id}
                    url={layer.url}
                    x={layer.x}
                    y={layer.y}
                    width={layer.width}
                    height={layer.height}
                    type={layer.type}
                  />
                );
              default:
                return null;
            }
          })}
        </Layer>
      </Stage>
    </div>
  );
});

export default KonvaPreview;