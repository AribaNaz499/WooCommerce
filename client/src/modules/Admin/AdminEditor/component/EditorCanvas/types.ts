// Match exactly with AdminEditorContext types
export interface ElementType {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string | null;  // Make optional to match context
}

export interface StickerType {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sticker: string;
  zIndex: number;
}

export interface TextElementType {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  bold?: boolean;  // Make optional to match context
  italic?: boolean;  // Make optional to match context
  fontSize: number;
  fontFamily: string;
  color: string;
}