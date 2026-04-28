import React, { createContext, useContext, useEffect, useState } from "react";
import { safeGetStorage, safeSetLocalStorage } from "../lib/storage";
import { getDraftCardId } from "../lib/draftCardId";
import { clearSlideStateFromIdb, getSlideStateKeys, loadSlideStateFromIdb, saveSlideStateToIdb } from "../lib/idbSlideState";

const fontColors = [
  "#000000",
  "#FF0000",
  "#008000",
  "#0000FF",
  "#FFA500",
  "#800080",
  "#00FFFF",
  "#FFC0CB",
  "#808080",
  "#FFD700",
];

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface TextElement {
  id: string;
  value: string;
  fontSize: number;
  fontWeight: number;
  fontColor: string;
  fontFamily: string;
  textAlign: "top" | "center" | "end";
  rotation: number;
  zIndex: number;
  position: Position;
  size: Size;
  isEditing?: boolean;
  lineHeight?: number,
  letterSpacing?: number,
  verticalAlign?: "top" | "center" | "bottom";
}

interface DraggableImage {
  id: string | any;
  src: string;
  originalSrc?: string | any;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex?: number;
  filter?: string;
  shapePath?: string | null;
}

interface DraggableQR {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex?: number;
}
interface DraggableAudioQR {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex?: number;
}

interface StickerItem {
  id: string;
  sticker: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation: number;
}

interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Slide2ContextType {
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  activePopup: string | null;
  setActivePopup: React.Dispatch<React.SetStateAction<string | null>>;
  selectedImg: number[] | any;
  setSelectedImage: React.Dispatch<React.SetStateAction<number[]>>;
  showOneTextRightSideBox: boolean;
  setShowOneTextRightSideBox: React.Dispatch<React.SetStateAction<boolean>>;
  oneTextValue: string;
  setOneTextValue: React.Dispatch<React.SetStateAction<string>>;
  multipleTextValue: boolean;
  setMultipleTextValue: React.Dispatch<React.SetStateAction<boolean>>;

  lineHeight2: number;
  setLineHeight2: React.Dispatch<React.SetStateAction<number>>;
  letterSpacing2: number;
  setLetterSpacing2: React.Dispatch<React.SetStateAction<number>>;

  // Layout selection
  selectedLayout: "blank" | "oneText" | "multipleText";
  setSelectedLayout: React.Dispatch<
    React.SetStateAction<"blank" | "oneText" | "multipleText">
  >;

  // Global defaults (for new text elements)
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  fontWeight: number;
  setFontWeight: React.Dispatch<React.SetStateAction<number>>;
  textAlign: "start" | "center" | "end";
  verticalAlign?: "top" | "center" | "bottom";
  setVerticalAlign: React.Dispatch<
    React.SetStateAction<"top" | "center" | "bottom">
  >;
  setTextAlign: React.Dispatch<
    React.SetStateAction<"start" | "center" | "end">
  >;
  fontColor: string;
  setFontColor: React.Dispatch<React.SetStateAction<string>>;
  fontFamily: string;
  setFontFamily: React.Dispatch<React.SetStateAction<string>>;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  defaultFontSize: number;
  setDefaultFontSize: React.Dispatch<React.SetStateAction<number>>;
  defaultFontWeight: number;
  setDefaultFontWeight: React.Dispatch<React.SetStateAction<number>>;
  defaultFontColor: string;
  setDefaultFontColor: React.Dispatch<React.SetStateAction<string>>;
  defaultFontFamily: string;
  setDefaultFontFamily: React.Dispatch<React.SetStateAction<string>>;
  defaultTextAlign: "start" | "center" | "end";
  setDefaultTextAlign: React.Dispatch<
    React.SetStateAction<"start" | "center" | "end">
  >;
  defaultVerticalAlign: "top" | "center" | "bottom";
  setDefaultVerticalAlign: React.Dispatch<
    React.SetStateAction<"top" | "center" | "bottom">
  >;
  defaultRotation: number;
  setDefaultRotation: React.Dispatch<React.SetStateAction<number>>;

  // Individual text elements management
  textElements: TextElement[];
  setTextElements: React.Dispatch<React.SetStateAction<TextElement[]>>;
  selectedTextId: string | null;
  setSelectedTextId: React.Dispatch<React.SetStateAction<string | null>>;

  // Legacy support
  texts: string[] | any[];
  setTexts: React.Dispatch<React.SetStateAction<any[]>>;
  editingIndex: number | null;
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;

  images: { id: number; src: string }[];
  setImages: React.Dispatch<
    React.SetStateAction<{ id: number; src: string }[]>
  >;
  video: File[] | null;
  setVideo: React.Dispatch<React.SetStateAction<File[] | null>>;
  audio: File[] | null;
  setAudio: React.Dispatch<React.SetStateAction<File[] | null>>;
  tips: boolean;
  setTips: React.Dispatch<React.SetStateAction<boolean>>;
  upload: boolean;
  setUpload: React.Dispatch<React.SetStateAction<boolean>>;
  duration: number | null;
  setDuration: React.Dispatch<React.SetStateAction<number | null>>;
  isAIimage2?: boolean;
  setIsAIimage2?: React.Dispatch<React.SetStateAction<boolean | any>>;
  selectedAIimageUrl2: string | null;
  setSelectedAIimageUrl2: React.Dispatch<React.SetStateAction<string | null>>;

  aimage2: ImagePosition;
  setAIImage2: React.Dispatch<React.SetStateAction<ImagePosition>>;

  selectedPreviewImage?: string | null;
  setSelectedPreviewImage?: React.Dispatch<React.SetStateAction<string | null>>;

  draggableImages: DraggableImage[];
  setDraggableImages: React.Dispatch<React.SetStateAction<DraggableImage[]>>;
  imageFilter?: boolean,
  setImageFilter?: any,
  imageSketch?: boolean,
  setImageSketch?: any,

  activeFilterImageId?: string | null | any,
  setActiveFilterImageId?: any

  qrPosition: DraggableQR;
  setQrPosition: React.Dispatch<React.SetStateAction<DraggableQR>>;
  qrAudioPosition: DraggableAudioQR;
  setQrAudioPosition: React.Dispatch<React.SetStateAction<DraggableAudioQR>>;

  // New properties for position and size
  textPositions: Position[];
  setTextPositions: React.Dispatch<React.SetStateAction<Position[]>>;
  textSizes: Size[];
  setTextSizes: React.Dispatch<React.SetStateAction<Size[]>>;
  imagePositions: Record<number, Position>; // keyed by image id
  setImagePositions: React.Dispatch<
    React.SetStateAction<Record<number, Position>>
  >;
  imageSizes: Record<number, Size>; // keyed by image id
  setImageSizes: React.Dispatch<React.SetStateAction<Record<number, Size>>>;
  poster: string | null;
  setPoster: React.Dispatch<React.SetStateAction<string | null>>;
  selectedVideoUrl: string | null;
  setSelectedVideoUrl: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedAudioUrl: React.Dispatch<React.SetStateAction<string | null>>;
  selectedAudioUrl: string | null;

  // Slide state management
  isSlideActive: boolean;
  setIsSlideActive: React.Dispatch<React.SetStateAction<boolean>>;
  slide2DataStore?: any[];

  isEditable: boolean; // NEW: To control edit/view mode
  setIsEditable: React.Dispatch<React.SetStateAction<boolean>>;

  // For Sticker
  selectedStickers2: StickerItem[];
  setSelectedStickers2: any;
  addSticker2: (
    sticker: Omit<StickerItem, "x" | "y" | "width" | "height" | "zIndex">
  ) => void;
  updateSticker2: (index: number, data: Partial<StickerItem>) => void;
  removeSticker2: (index: number) => void;
  resetSlide2State: () => void | any;

  layout2?: any,
  setLayout2?: any,
  // ------------------------ Adding Admin Editor -------------------------------------------------------------------------------------------
  bgEdit2: boolean, setBgEdit2: any,
  bgLocked2: boolean, setBgLocked2: any,
  bgRect2: any, setBgRect2: any,
  bgColor2: string | null;
  setBgColor2: React.Dispatch<React.SetStateAction<string | null>>;
  bgImage2: string | null;
  setBgImage2: React.Dispatch<React.SetStateAction<string | null>>;
  selectedShapePath2: string | null;
  setSelectedShapePath2: React.Dispatch<React.SetStateAction<string | null>>;
  selectedShapeImageId2: string | number | null;
  setSelectedShapeImageId2: React.Dispatch<React.SetStateAction<string | number | null>>;
  canEditBg2?: boolean;
  setCanEditBg2?: any;
  canEditImages2?: boolean;
  setCanEditImages2?: any;
  canEditStickers2?: boolean;
  setCanEditStickers2?: any,
  setEditAll2: any,
}

const Slide2Context = createContext<Slide2ContextType | undefined>(undefined);

export const Slide2Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [title, setTitle] = useState("Happy Birthday");
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [selectedImg, setSelectedImage] = useState<number[]>([]);
  const [showOneTextRightSideBox, setShowOneTextRightSideBox] = useState(false);
  const [oneTextValue, setOneTextValue] = useState("");
  const [multipleTextValue, setMultipleTextValue] = useState(false);

  // Layout selection
  const [selectedLayout, setSelectedLayout] = useState<
    "blank" | "oneText" | "multipleText"
  >("blank");
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState<string | null>(null);
  const [selectedAIimageUrl2, setSelectedAIimageUrl2] = useState<string | null>(
    null
  );
  const [isAIimage2, setIsAIimage2] = useState<boolean>(false);

  const [selectedPreviewImage, setSelectedPreviewImage] = useState<
    string | null
  >(null);

  // Image Resizing.
  const [draggableImages, setDraggableImages] = useState<DraggableImage[]>([]);
  const [imageFilter, setImageFilter] = useState(false)
  const [imageSketch, setImageSketch] = useState(false)
  const [activeFilterImageId, setActiveFilterImageId] = useState<string | null>(null);

  //  ADD for Admin Editor ===============================================================================================================================================================================
  const [bgEdit2, setBgEdit2] = useState(false);
  const [bgLocked2, setBgLocked2] = useState<boolean>(false);
  const [bgRect2, setBgRect2] = useState<any>({ x: 40, y: 40, width: 300, height: 400 });

  const [bgColor2, setBgColor2] = useState<string | null>(null);
  const [bgImage2, setBgImage2] = useState<string | null>(null);
  const [selectedShapePath2, setSelectedShapePath2] = useState<string | null>(null);
  const [selectedShapeImageId2, setSelectedShapeImageId2] = useState<string | number | null>(null);
  const [canEditBg2, setCanEditBg2] = useState<boolean>(true);
  const [canEditImages2, setCanEditImages2] = useState<boolean>(true);
  const [canEditStickers2, setCanEditStickers2] = useState<boolean>(true);


  const setEditAll2 = (on: boolean) => {
    setCanEditBg2(on);
    setCanEditImages2(on);
    setCanEditStickers2(on);
  };




  // QR Resizing and Moving
  const [qrPosition, setQrPosition] = useState<DraggableQR>({
    id: "qr1",
    url: "",
    x: 0,
    y: 0,
    width: 70,
    height: 105,
    rotation: 0,
    zIndex: 1000,
  });

  const [qrAudioPosition, setQrAudioPosition] = useState<DraggableAudioQR>({
    id: "qr2",
    url: "",
    x: 0,
    y: 0,
    width: 70,
    height: 105,
    rotation: 0,
    zIndex: 1000,
  });

  const [aimage2, setAIImage2] = useState<ImagePosition>({
    x: 30,
    y: 30,
    width: 300,
    height: 400,
    // zindex: 1000,
  });

  // Global defaults (for new text elements)
  const [fontSize, setFontSize] = useState(20);
  const [fontWeight, setFontWeight] = useState(400);
  const [textAlign, setTextAlign] = useState<"start" | "center" | "end">(
    "start"
  );
  const [verticalAlign, setVerticalAlign] = useState<
    "top" | "center" | "bottom"
  >("top");
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [fontColor, setFontColor] = useState(fontColors[0]);
  const [rotation, setRotation] = useState(0);

  // Individual text elements management
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);



  // Legacy support
  const [texts, setTexts] = useState([
    {
      value: "",
      fontSize: 20,
      fontWeight: 400,
      fontColor: "#000000",
      fontFamily: "Roboto",
      verticalAlign: "center",
      textAlign: "center",
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    {
      value: "",
      fontSize: 20,
      fontWeight: 400,
      fontColor: "#000000",
      fontFamily: "Roboto",
      verticalAlign: "center",
      textAlign: "center",
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    {
      value: "",
      fontSize: 20,
      fontWeight: 400,
      fontColor: "#000000",
      fontFamily: "Roboto",
      verticalAlign: "center",
      textAlign: "center",
      lineHeight: 1.5,
      letterSpacing: 0,
    },
  ]);

  const [lineHeight2, setLineHeight2] = useState(1.5);
  const [letterSpacing2, setLetterSpacing2] = useState(0);
  // Layout with uploaded images for preview
  const [layout2, setLayout2] = useState<any>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [images, setImages] = useState<{ id: number; src: string }[]>([]);
  const [video, setVideo] = useState<File[] | null>(null);
  const [audio, setAudio] = useState<File[] | null>(null);
  const [tips, setTips] = useState(false);
  const [upload, setUpload] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [poster, setPoster] = useState<string | null>(null);

  // --- 💾 Persist heavy image data to IndexedDB ---
  useEffect(() => {
    const [key] = getSlideStateKeys(2, getDraftCardId());
    void saveSlideStateToIdb(key, { images, draggableImages }).catch(() => {});
  }, [images, draggableImages]);

  // New states for position and size
  const [textPositions, setTextPositions] = useState<Position[]>(
    texts.map(() => ({ x: 0, y: 0 }))
  );
  const [textSizes, setTextSizes] = useState<Size[]>(
    texts.map(() => ({ width: 100, height: 30 }))
  );

  // For images, use an object keyed by image id for quick lookup
  const [imagePositions, setImagePositions] = useState<
    Record<number, Position>
  >({});
  const [imageSizes, setImageSizes] = useState<Record<number, Size>>({});

  // Slide state management
  const [isSlideActive, setIsSlideActive] = useState(false);
  const [isEditable, setIsEditable] = useState(true);

  const [slide2DataStore, setSlide2DataStore] = useState<any[]>([]);

  const [selectedStickers2, setSelectedStickers2] = useState<StickerItem[]>([]);

  const addSticker2 = (
    sticker: Omit<
      StickerItem,
      "x" | "y" | "width" | "height" | "zIndex" | "rotation"
    >
  ) => {
    setSelectedStickers2((prev) => {
      const isFirstSticker = prev.length === 0;
      const newSticker: StickerItem = {
        ...sticker,
        x: isFirstSticker ? 30 : 30 + prev.length * 20,
        y: isFirstSticker ? 30 : 30 + prev.length * 20,
        width: isFirstSticker ? 120 : 100,
        height: isFirstSticker ? 120 : 100,
        zIndex: prev.length + 2,
        rotation: 0,
      };
      const updated = [...prev, newSticker];
      return updated;
    });
  };

  const updateSticker2 = (index: number, data: Partial<StickerItem>) => {
    setSelectedStickers2((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...data } : item))
    );
  };

  const removeSticker2 = (index: number) => {
    setSelectedStickers2((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  };

  // ✅ Reset all context state to initial values
  const resetSlide2State = () => {
    // 🧹 Clear persisted local storage
    clearSlide2LocalData();

    // Base states
    setActiveIndex(0);
    setTitle("Happy Birthday");
    setActivePopup(null);
    setSelectedImage([]);
    setShowOneTextRightSideBox(false);
    setOneTextValue("");
    setMultipleTextValue(false);

    // Layout & selections
    setSelectedLayout("blank");
    setSelectedVideoUrl(null);
    setSelectedAudioUrl(null);
    setSelectedAIimageUrl2(null);
    setIsAIimage2(false);
    setSelectedPreviewImage(null);

    // Images & draggable
    setImages([]);
    setDraggableImages([]);

    // Stickers
    setSelectedStickers2([]);

    // QR positions
    setQrPosition({
      id: "qr1",
      url: "",
      x: 20,
      y: 10,
      width: 59,
      height: 105,
      rotation: 0,
      zIndex: 1000,
    });

    setQrAudioPosition({
      id: "qr2",
      url: "",
      x: 20,
      y: 10,
      width: 59,
      height: 105,
      rotation: 0,
      zIndex: 1000,
    });

    // AI image position
    setAIImage2({
      x: 30,
      y: 30,
      width: 300,
      height: 400,
    });

    // Fonts & text defaults
    setFontSize(20);
    setFontWeight(400);
    setTextAlign("start");
    setVerticalAlign("top");
    setFontFamily("Roboto");
    setFontColor("#000000");
    setRotation(0);
    setLineHeight2(1.5)
    setLetterSpacing2(0)

    // Text elements
    setTextElements([]);
    setSelectedTextId(null);
    setTexts([
      {
        value: "",
        fontSize: 20,
        fontWeight: 400,
        fontColor: "#000000",
        fontFamily: "Roboto",
        verticalAlign: "center",
        textAlign: "center",
        lineHeight: 1.5,
        letterSpacing: 0,
      },
      {
        value: "",
        fontSize: 20,
        fontWeight: 400,
        fontColor: "#000000",
        fontFamily: "Roboto",
        verticalAlign: "center",
        textAlign: "center",
        lineHeight: 1.5,
        letterSpacing: 0,
      },
      {
        value: "",
        fontSize: 20,
        fontWeight: 400,
        fontColor: "#000000",
        fontFamily: "Roboto",
        verticalAlign: "center",
        textAlign: "center",
        lineHeight: 1.5,
        letterSpacing: 0,
      },
    ]);

    // Misc editing states
    setEditingIndex(null);
    setTips(false);
    setUpload(false);
    setDuration(null);
    setPoster(null);

    // Position & size data
    setTextPositions([]);
    setTextSizes([]);
    setImagePositions({});
    setImageSizes({});

    // Video / audio files
    setVideo(null);
    setAudio(null);

    // Slide states
    setIsSlideActive(false);
    setIsEditable(true);

    // Typography adjustments
    setLineHeight2(1.5);
    setLetterSpacing2(0);

    // Clear data store snapshot
    setSlide2DataStore([]);
  };

  // Passed value to storing and state recognizing.
  useEffect(() => {
    try {
      const saved = safeGetStorage("slide2_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        const currentDraftId = getDraftCardId();
        const savedDraftId = parsed?.draftId;
        if (currentDraftId) {
          if (!savedDraftId || savedDraftId !== currentDraftId) return;
        }

        if (parsed.textElements) setTextElements(parsed.textElements);
        if (parsed.draggableImages) setDraggableImages(parsed.draggableImages);
        if (parsed.images) setImages(parsed.images);
        if (parsed.selectedImg) setSelectedImage(parsed.selectedImg);
        if (parsed.selectedVideoUrl) setSelectedVideoUrl(parsed.selectedVideoUrl);
        if (parsed.selectedAudioUrl) setSelectedAudioUrl(parsed.selectedAudioUrl);
        if (parsed.selectedLayout) setSelectedLayout(parsed.selectedLayout);
        if (parsed.oneTextValue) setOneTextValue(parsed.oneTextValue);
        if (parsed.showOneTextRightSideBox) setShowOneTextRightSideBox(parsed.showOneTextRightSideBox);
        if (parsed.multipleTextValue)
          setMultipleTextValue(parsed.multipleTextValue);
        if (parsed.selectedStickers2)
          setSelectedStickers2(parsed.selectedStickers2);
        if (parsed.qrPosition) setQrPosition(parsed.qrPosition);
        if (parsed.qrAudioPosition) setQrAudioPosition(parsed.qrAudioPosition);
        if (parsed.aimage2) setAIImage2(parsed.aimage2);
        if (typeof parsed.isAIimage2 === "boolean") setIsAIimage2(parsed.isAIimage2);
        if (parsed.selectedAIimageUrl2)
          setSelectedAIimageUrl2(parsed.selectedAIimageUrl2);

        if (parsed.bgColor2 !== undefined) setBgColor2(parsed.bgColor2);
        if (parsed.bgImage2 !== undefined) setBgImage2(parsed.bgImage2);
        if (Object.prototype.hasOwnProperty.call(parsed, "selectedShapePath2")) setSelectedShapePath2(parsed.selectedShapePath2);

        if (parsed.fontSize) setFontSize(parsed.fontSize);
        if (parsed.fontWeight) setFontWeight(parsed.fontWeight);
        if (parsed.fontFamily) setFontFamily(parsed.fontFamily);
        if (parsed.fontColor) setFontColor(parsed.fontColor);
        if (parsed.textAlign) setTextAlign(parsed.textAlign);
        if (parsed.verticalAlign) setVerticalAlign(parsed.verticalAlign);
        const restoredLetterSpacing = parsed.letterSpacing2 ?? parsed.letterSpacing;
        const restoredLineHeight = parsed.lineHeight2 ?? parsed.lineHeight;
        if (restoredLetterSpacing !== undefined) setLetterSpacing2(restoredLetterSpacing);
        if (restoredLineHeight !== undefined) setLineHeight2(restoredLineHeight);
        if (parsed.rotation !== undefined) setRotation(parsed.rotation);

        const hasHeavyLocal =
          (parsed.images && parsed.images.length) ||
          (parsed.draggableImages && parsed.draggableImages.length);
        if (hasHeavyLocal) {
          const [key] = getSlideStateKeys(2, parsed?.draftId ?? getDraftCardId());
          void saveSlideStateToIdb(key, {
            images: parsed.images ?? [],
            draggableImages: parsed.draggableImages ?? [],
          }).catch(() => {});
          try {
            localStorage.removeItem("slide2_state");
            sessionStorage.removeItem("slide2_state");
          } catch {}
        }

      }
    } catch (error) {
      console.error("❌ Error restoring slide2_state:", error);
    }
  }, []);

  // --- 🧠 Restore heavy image data from IndexedDB (if localStorage skipped it) ---
  useEffect(() => {
    if (images.length || draggableImages.length) return;
    let cancelled = false;
    (async () => {
      try {
        const keys = getSlideStateKeys(2, getDraftCardId());
        for (const key of keys) {
          const heavy = await loadSlideStateFromIdb<{
            images?: { id: number; src: string }[];
            draggableImages?: DraggableImage[];
          }>(key);
          if (!heavy) continue;
          if (cancelled) return;
          if (heavy.images) setImages(heavy.images);
          if (heavy.draggableImages) setDraggableImages(heavy.draggableImages);
          return;
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [images.length, draggableImages.length]);

  // --- 💾 Auto-save changes ---
  useEffect(() => {
    const stateToSave = {
      draftId: getDraftCardId() ?? null,
      textElements,
      selectedImg,
      selectedVideoUrl,
      selectedAudioUrl,
      selectedLayout,
      oneTextValue,
      multipleTextValue,
      showOneTextRightSideBox,
      selectedStickers2,
      qrPosition,
      qrAudioPosition,
      aimage2,
      isAIimage2,
      selectedAIimageUrl2,

      fontSize,
      fontWeight,
      fontFamily,
      fontColor,
      textAlign,
      verticalAlign,
      letterSpacing2,
      lineHeight2,
      rotation,

      bgColor2,
      bgImage2,
      selectedShapePath2,
      layout2,

    };

    const payload = JSON.stringify(stateToSave);
    const ok = safeSetLocalStorage("slide2_state", payload, {
      clearOnFail: ["slides_backup", "slide2_state"],
      fallbackToSession: true,
    });
    if (!ok) {
      console.error("❌ Error saving slide2_state: storage full");
    }
  }, [
    textElements,
    selectedImg,
    selectedVideoUrl,
    selectedAudioUrl,
    selectedLayout,
    oneTextValue,
    multipleTextValue,
    selectedStickers2,
    qrPosition,
    qrAudioPosition,
    aimage2,
    isAIimage2,
    selectedAIimageUrl2,
    showOneTextRightSideBox,

    fontSize,
    fontWeight,
    fontFamily,
    fontColor,
    textAlign,
    verticalAlign,
    letterSpacing2,
    lineHeight2,
    rotation,


    bgColor2,
    bgImage2,
    selectedShapePath2,
    layout2,
  ]);

  // --- 🧹 Clear localStorage ---
  const clearSlide2LocalData = () => {
    try {
      localStorage.removeItem("slide2_state");
      sessionStorage.removeItem("slide2_state");
      const keys = getSlideStateKeys(2, getDraftCardId());
      keys.forEach((key) => {
        void clearSlideStateFromIdb(key).catch(() => {});
      });
      console.log("🧹 Cleared Slide2 saved state");
    } catch (error) {
      console.error("Error clearing slide2_state:", error);
    }
  };



  return (
    <Slide2Context.Provider
      value={{
        activeIndex,
        setActiveIndex,
        title,
        setTitle,
        activePopup,
        setActivePopup,
        selectedImg,
        setSelectedImage,
        showOneTextRightSideBox,
        setShowOneTextRightSideBox,
        oneTextValue,
        setOneTextValue,
        multipleTextValue,
        setMultipleTextValue,
        defaultFontColor: fontColors[0],
        setDefaultFontColor: () => { },
        defaultFontSize: 20,
        setDefaultFontSize: () => { },
        defaultFontWeight: 400,
        setDefaultFontWeight: () => { },
        defaultFontFamily: "Roboto",
        setDefaultFontFamily: () => { },
        defaultTextAlign: "start",
        setDefaultTextAlign: () => { },
        defaultVerticalAlign: "top",
        setDefaultVerticalAlign: () => { },
        defaultRotation: 0,
        setDefaultRotation: () => { },

        // Layout selection
        selectedLayout,
        setSelectedLayout,

        // Global defaults
        fontSize,
        setFontSize,
        fontWeight,
        setFontWeight,
        textAlign,
        setTextAlign,
        fontColor,
        setFontColor,
        fontFamily,
        setFontFamily,
        rotation,
        setRotation,

        // Individual text elements management
        textElements,
        setTextElements,
        selectedTextId,
        setSelectedTextId,

        // Legacy support
        texts,
        setTexts,
        editingIndex,
        setEditingIndex,

        images,
        setImages,

        addSticker2,
        selectedStickers2,
        setSelectedStickers2,
        updateSticker2,
        removeSticker2,

        selectedPreviewImage,
        setSelectedPreviewImage,
        draggableImages,
        setDraggableImages,

        video,
        setVideo,
        audio,
        setAudio,

        aimage2,
        setAIImage2,

        tips,
        setTips,
        upload,
        setUpload,
        duration,
        setDuration,
        selectedVideoUrl,
        setSelectedVideoUrl,
        selectedAudioUrl,
        setSelectedAudioUrl,
        qrPosition,
        setQrPosition,
        qrAudioPosition,
        setQrAudioPosition,

        // New values
        textPositions,
        setTextPositions,
        textSizes,
        setTextSizes,


        lineHeight2,
        setLineHeight2,
        letterSpacing2,
        setLetterSpacing2,



        imagePositions,
        setImagePositions,
        imageSizes,
        setImageSizes,
        poster,
        setPoster,
        isAIimage2,
        setIsAIimage2,
        setSelectedAIimageUrl2,
        selectedAIimageUrl2,
        setImageFilter,
        imageFilter,
        setImageSketch,
        imageSketch,
        activeFilterImageId,
        setActiveFilterImageId,

        // Slide state management
        isSlideActive,
        setIsSlideActive,
        isEditable,
        setIsEditable,
        verticalAlign,
        setVerticalAlign,

        slide2DataStore,
        // Reset function
        resetSlide2State,

        layout2,
        setLayout2,

        bgColor2, setBgColor2,
        bgImage2, setBgImage2,
        bgEdit2, setBgEdit2,
        bgLocked2, setBgLocked2,
        bgRect2, setBgRect2,
        selectedShapePath2,
        setSelectedShapePath2,
        selectedShapeImageId2,
        setSelectedShapeImageId2,
        canEditBg2, setCanEditBg2,
        canEditImages2, setCanEditImages2,
        canEditStickers2, setCanEditStickers2,
        setEditAll2,
      }}
    >
      {children}
    </Slide2Context.Provider>
  );
};

export const useSlide2 = () => {
  const context = useContext(Slide2Context);
  if (!context) {
    throw new Error("useWishCard must be used within a WishCardProvider");
  }
  return context;
};
