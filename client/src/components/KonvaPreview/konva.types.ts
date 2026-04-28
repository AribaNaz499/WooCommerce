export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface ImageLayer {
  kind: 'image';
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  filter?: string;
  shapePath?: string;
}

export interface StickerLayer {
  kind: 'sticker';
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
}

export interface TextLayer {
  kind: 'text';
  id: string;
  value: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: number | string;
  fontFamily: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  rotation: number;
  lineHeight?: number;
  letterSpacing?: number;
  zIndex: number;
}

export interface AILayer {
  kind: 'ai';
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;  // ✅ Added rotation as optional
  zIndex: number;
}

export interface QRLayer {
  kind: 'qr';
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  type: 'video' | 'audio';
}

export type Layer = ImageLayer | StickerLayer | TextLayer | AILayer | QRLayer;

export interface KonvaPreviewProps {
  width: number;
  height: number;
  bgImage?: string | null;
  bgColor?: string;
  layers: Layer[];
  scale?: number;
  borderRadius?: number;
  onLayerDragEnd?: (id: string, x: number, y: number) => void;
  onLayerTransform?: (id: string, x: number, y: number, width: number, height: number, rotation: number) => void;
  isEditable?: boolean;
  selectedLayerId?: string | null;
  onLayerSelect?: (id: string | null) => void;
}