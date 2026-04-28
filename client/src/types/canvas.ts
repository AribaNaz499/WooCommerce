export type CanvasImageSource = "user" | "pdf";

export interface CanvasImage {
  id: string | number;
  src: string;
  originalSrc?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex?: number;
  locked?: boolean;
  filter?: string;
  shapePath?: string | null;
  aspect?: number;
  naturalW?: number;
  naturalH?: number;
  source?: CanvasImageSource;
}
