import { useMemo } from 'react';
import type { Layer } from '../../components/KonvaPreview/konva.types';

interface SlideContext {
  bgImage1?: string | null;
  bgColor1?: string;
  draggableImages1?: any[];
  selectedImg1?: string[];
  selectedStickers1?: any[];
  textElements1?: any[];
  showOneTextRightSideBox1?: boolean;
  oneTextValue1?: string;
  fontSize1?: number;
  fontWeight1?: number;
  fontColor1?: string;
  fontFamily1?: string;
  textAlign1?: string;
  verticalAlign1?: string;
  rotation1?: number;
  lineHeight1?: number;
  letterSpacing1?: number;
  multipleTextValue1?: boolean;
  texts1?: any[];
  isAIimage1?: boolean;
  selectedAIimageUrl1?: string;
  aimage1?: any;
  selectedVideoUrl1?: string | null;
  qrPosition1?: any;
  selectedAudioUrl1?: string | null;
  qrAudioPosition1?: any;
}

export const useKonvaLayers = (slideContext: SlideContext): {
  bgImage: string | null;
  bgColor: string;
  layers: Layer[];
} => {
  const layers = useMemo<Layer[]>(() => {
    const result: Layer[] = [];

    // 1. Convert draggable images
    const images = slideContext.draggableImages1 || [];
    const selectedIds = new Set(slideContext.selectedImg1 || []);
    
    images
      .filter((img: any) => selectedIds.has(img.id))
      .forEach((img: any) => {
        result.push({
          kind: 'image',
          id: img.id,
          src: img.src,
          x: img.x || 0,
          y: img.y || 0,
          width: img.width || 120,
          height: img.height || 120,
          rotation: img.rotation || 0,
          zIndex: img.zIndex || 1,
          filter: img.filter,
          shapePath: img.shapePath,
        });
      });

    // 2. Convert stickers
    const stickers = slideContext.selectedStickers1 || [];
    stickers.forEach((st: any, idx: number) => {
      result.push({
        kind: 'sticker',
        id: st.id || `sticker-${idx}`,
        src: st.sticker,
        x: st.x || 0,
        y: st.y || 0,
        width: st.width || 80,
        height: st.height || 80,
        rotation: st.rotation || 0,
        zIndex: st.zIndex || 1,
      });
    });

    // 3. Convert text elements
    const textElements = slideContext.textElements1 || [];
    textElements.forEach((t: any, idx: number) => {
      result.push({
        kind: 'text',
        id: t.id || `text-${idx}`,
        value: t.value || '',
        x: t.position?.x || t.x || 0,
        y: t.position?.y || t.y || 0,
        width: t.size?.width || t.width || 200,
        height: t.size?.height || t.height || 60,
        fontSize: t.fontSize || 16,
        fontWeight: t.fontWeight || 400,
        fontFamily: t.fontFamily || 'Roboto',
        color: t.fontColor || '#000000',
        textAlign: t.textAlign || 'center',
        verticalAlign: t.verticalAlign === 'top' ? 'top' : t.verticalAlign === 'bottom' ? 'bottom' : 'middle',
        rotation: t.rotation || 0,
        lineHeight: t.lineHeight,
        letterSpacing: t.letterSpacing,
        zIndex: t.zIndex || 50,
      });
    });

    // 4. Single text overlay
    if (slideContext.showOneTextRightSideBox1 && slideContext.oneTextValue1) {
      result.push({
        kind: 'text',
        id: 'one-text-overlay',
        value: slideContext.oneTextValue1,
        x: 20,
        y: 20,
        width: 460,
        height: 660,
        fontSize: slideContext.fontSize1 || 16,
        fontWeight: slideContext.fontWeight1 || 400,
        fontFamily: slideContext.fontFamily1 || 'Roboto',
        color: slideContext.fontColor1 || '#000000',
        textAlign: (slideContext.textAlign1 as any) || 'center',
        verticalAlign: slideContext.verticalAlign1 === 'top' ? 'top' : 
                       slideContext.verticalAlign1 === 'bottom' ? 'bottom' : 'middle',
        rotation: slideContext.rotation1 || 0,
        lineHeight: slideContext.lineHeight1,
        letterSpacing: slideContext.letterSpacing1,
        zIndex: 9000,
      });
    }

    // 5. Multiple texts
    if (slideContext.multipleTextValue1 && slideContext.texts1) {
      slideContext.texts1.forEach((t: any, idx: number) => {
        result.push({
          kind: 'text',
          id: `multi-text-${idx}`,
          value: t.value || '',
          x: t.x || 20,
          y: t.y || idx * 220,
          width: t.width || 460,
          height: t.height || 80,
          fontSize: t.fontSize1 || t.fontSize || 16,
          fontWeight: t.fontWeight1 || t.fontWeight || 400,
          fontFamily: t.fontFamily1 || t.fontFamily || 'Roboto',
          color: t.fontColor1 || t.fontColor || '#000000',
          textAlign: t.textAlign || 'center',
          verticalAlign: t.verticalAlign === 'top' ? 'top' : 
                        t.verticalAlign === 'bottom' ? 'bottom' : 'middle',
          rotation: t.rotation || 0,
          lineHeight: t.lineHeight,
          letterSpacing: t.letterSpacing,
          zIndex: 9000 + idx,
        });
      });
    }

    // 6. AI Image
    if (slideContext.isAIimage1 && slideContext.selectedAIimageUrl1) {
      result.push({
        kind: 'ai',
        id: 'ai-image',
        src: slideContext.selectedAIimageUrl1,
        x: slideContext.aimage1?.x || 0,
        y: slideContext.aimage1?.y || 0,
        width: slideContext.aimage1?.width || 200,
        height: slideContext.aimage1?.height || 200,
        zIndex: 9999,
      });
    }

    // 7. Video QR
    if (slideContext.selectedVideoUrl1 && slideContext.qrPosition1) {
      result.push({
        kind: 'qr',
        id: 'video-qr',
        url: slideContext.selectedVideoUrl1,
        x: slideContext.qrPosition1.x || 0,
        y: slideContext.qrPosition1.y || 0,
        width: slideContext.qrPosition1.width || 120,
        height: slideContext.qrPosition1.height || 120,
        zIndex: 999,
        type: 'video',
      });
    }

    // 8. Audio QR
    if (slideContext.selectedAudioUrl1 && slideContext.qrAudioPosition1) {
      result.push({
        kind: 'qr',
        id: 'audio-qr',
        url: slideContext.selectedAudioUrl1,
        x: slideContext.qrAudioPosition1.x || 0,
        y: slideContext.qrAudioPosition1.y || 0,
        width: slideContext.qrAudioPosition1.width || 120,
        height: slideContext.qrAudioPosition1.height || 120,
        zIndex: 999,
        type: 'audio',
      });
    }

    return result;
  }, [slideContext]);

  return {
    bgImage: slideContext.bgImage1 || null,
    bgColor: slideContext.bgColor1 || '#fff',
    layers,
  };
};