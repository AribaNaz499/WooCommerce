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

interface Slide4ContextType {
  activeIndex4: number;
  setActiveIndex4: React.Dispatch<React.SetStateAction<number>>;
  title4: string;
  setTitle4: React.Dispatch<React.SetStateAction<string>>;
  activePopup4: string | null;
  setActivePopup4: React.Dispatch<React.SetStateAction<string | null>>;
  selectedImg4: number[] | any;
  setSelectedImage4: React.Dispatch<React.SetStateAction<number[]>>;
  showOneTextRightSideBox4: boolean;
  setShowOneTextRightSideBox4: React.Dispatch<React.SetStateAction<boolean>>;
  oneTextValue4: string;
  setOneTextValue4: React.Dispatch<React.SetStateAction<string>>;
  multipleTextValue4: boolean;
  setMultipleTextValue4: React.Dispatch<React.SetStateAction<boolean>>;

  lineHeight4: number;
  setLineHeight4: React.Dispatch<React.SetStateAction<number>>;
  letterSpacing4: number;
  setLetterSpacing4: React.Dispatch<React.SetStateAction<number>>;

  // Layout selection
  selectedLayout4: "blank" | "oneText" | "multipleText";
  setSelectedLayout4: React.Dispatch<
    React.SetStateAction<"blank" | "oneText" | "multipleText">
  >;

  // Global defaults (for new text elements)
  fontSize4: number;
  setFontSize4: React.Dispatch<React.SetStateAction<number>>;
  fontWeight4: number;
  setFontWeight4: React.Dispatch<React.SetStateAction<number>>;
  textAlign4: "start" | "center" | "end";
  verticalAlign4?: "top" | "center" | "bottom";
  setVerticalAlign4: React.Dispatch<
    React.SetStateAction<"top" | "center" | "bottom">
  >;
  setTextAlign4: React.Dispatch<
    React.SetStateAction<"start" | "center" | "end">
  >;
  fontColor4: string;
  setFontColor4: React.Dispatch<React.SetStateAction<string>>;
  fontFamily4: string;
  setFontFamily4: React.Dispatch<React.SetStateAction<string>>;
  rotation4: number;
  setRotation4: React.Dispatch<React.SetStateAction<number>>;
  defaultFontSize4: number;
  setDefaultFontSize4: React.Dispatch<React.SetStateAction<number>>;
  defaultFontWeight4: number;
  setDefaultFontWeight4: React.Dispatch<React.SetStateAction<number>>;
  defaultFontColor4: string;
  setDefaultFontColor4: React.Dispatch<React.SetStateAction<string>>;
  defaultFontFamily4: string;
  setDefaultFontFamily4: React.Dispatch<React.SetStateAction<string>>;
  defaultTextAlign4: "start" | "center" | "end";
  setDefaultTextAlign4: React.Dispatch<
    React.SetStateAction<"start" | "center" | "end">
  >;
  defaultVerticalAlign4: "top" | "center" | "bottom";
  setDefaultVerticalAlign4: React.Dispatch<
    React.SetStateAction<"top" | "center" | "bottom">
  >;
  defaultRotation4: number;
  setDefaultRotation4: React.Dispatch<React.SetStateAction<number>>;

  // Individual text elements management
  textElements4: TextElement[];
  setTextElements4: React.Dispatch<React.SetStateAction<TextElement[]>>;
  selectedTextId4: string | null;
  setSelectedTextId4: React.Dispatch<React.SetStateAction<string | null>>;

  // Legacy support
  texts4: string[] | any[];
  setTexts4: React.Dispatch<React.SetStateAction<any[]>>;
  editingIndex4: number | null;
  setEditingIndex4: React.Dispatch<React.SetStateAction<number | null>>;

  images4: { id: number; src: string }[];
  setImages4: React.Dispatch<
    React.SetStateAction<{ id: number; src: string }[]>
  >;
  video4: File[] | null;
  setVideo4: React.Dispatch<React.SetStateAction<File[] | null>>;
  audio4: File[] | null;
  setAudio4: React.Dispatch<React.SetStateAction<File[] | null>>;
  tips4: boolean;
  setTips4: React.Dispatch<React.SetStateAction<boolean>>;
  upload4: boolean;
  setUpload4: React.Dispatch<React.SetStateAction<boolean>>;
  duration4: number | null;
  setDuration4: React.Dispatch<React.SetStateAction<number | null>>;
  isAIimage4?: boolean;
  setIsAIimage4?: React.Dispatch<React.SetStateAction<boolean | any>>;
  selectedAIimageUrl4: string | null;
  setSelectedAIimageUrl4: React.Dispatch<React.SetStateAction<string | null>>;

  aimage4: ImagePosition;
  setAIImage4: React.Dispatch<React.SetStateAction<ImagePosition>>;

  selectedPreviewImage4?: string | null;
  setSelectedPreviewImage4?: React.Dispatch<React.SetStateAction<string | null>>
  draggableImages4: DraggableImage[];
  setDraggableImages4: React.Dispatch<React.SetStateAction<DraggableImage[]>>;
  imageFilter4?: boolean,
  setImageFilter4?: any,
  imageSketch4?: boolean,
  setImageSketch4?: any,

  activeFilterImageId4?: string | null | any,
  setActiveFilterImageId4?: any

  qrPosition4: DraggableQR;
  setQrPosition4: React.Dispatch<React.SetStateAction<DraggableQR>>;
  qrAudioPosition4: DraggableAudioQR;
  setQrAudioPosition4: React.Dispatch<React.SetStateAction<DraggableAudioQR>>;

  // New properties for position and size
  textPositions4: Position[];
  setTextPositions4: React.Dispatch<React.SetStateAction<Position[]>>;
  textSizes4: Size[];
  setTextSizes4: React.Dispatch<React.SetStateAction<Size[]>>;
  imagePositions4: Record<number, Position>; // keyed by image id
  setImagePositions4: React.Dispatch<
    React.SetStateAction<Record<number, Position>>
  >;
  imageSizes4: Record<number, Size>; // keyed by image id
  setImageSizes4: React.Dispatch<React.SetStateAction<Record<number, Size>>>;
  poster4: string | null;
  setPoster4: React.Dispatch<React.SetStateAction<string | null>>;
  selectedVideoUrl4: string | null;
  setSelectedVideoUrl4: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedAudioUrl4: React.Dispatch<React.SetStateAction<string | null>>;
  selectedAudioUrl4: string | null;

  // Slide state management
  isSlideActive4: boolean;
  setIsSlideActive4: React.Dispatch<React.SetStateAction<boolean>>;
  slide4DataStore4: any[];

  isEditable4: boolean; // NEW: To control edit/view mode
  setIsEditable4: React.Dispatch<React.SetStateAction<boolean>>;

  // For Sticker
  selectedStickers4: StickerItem[];
  setSelectedStickers4: React.Dispatch<React.SetStateAction<StickerItem[]>>;
  addSticker4: (
    sticker: Omit<StickerItem, "x" | "y" | "width" | "height" | "zIndex">
  ) => void;
  updateSticker4: (index: number, data: Partial<StickerItem>) => void;
  removeSticker4: (index: number) => void;
  resetSlide4State: () => void | any;

  layout4?: any,
  setLayout4?: any,

  // ------------------------ Adding Admin Editor -------------------------------------------------------------------------------------------
  bgEdit4: boolean, setBgEdit4: any,
  bgLocked4: boolean, setBgLocked4: any,
  bgRect4: any, setBgRect4: any,
  bgColor4: string | null;
  setBgColor4: React.Dispatch<React.SetStateAction<string | null>>;
  bgImage4: string | null;
  setBgImage4: React.Dispatch<React.SetStateAction<string | null>>;
  selectedShapePath4: string | null;
  setSelectedShapePath4: React.Dispatch<React.SetStateAction<string | null>>;
  selectedShapeImageId4: string | number | null;
  setSelectedShapeImageId4: React.Dispatch<React.SetStateAction<string | number | null>>;
  canEditBg4?: boolean;
  setCanEditBg4?: any;
  canEditImages4?: boolean;
  setCanEditImages4?: any;
  canEditStickers4?: boolean;
  setCanEditStickers4?: any,
  setEditAll4: any,
}

const Slide4Context = createContext<Slide4ContextType | undefined>(undefined);

export const Slide4Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeIndex4, setActiveIndex4] = useState(0);
  const [title4, setTitle4] = useState("Happy Birthday");
  const [activePopup4, setActivePopup4] = useState<string | null>(null);
  const [selectedImg4, setSelectedImage4] = useState<number[]>([]);
  const [showOneTextRightSideBox4, setShowOneTextRightSideBox4] = useState(false);
  const [oneTextValue4, setOneTextValue4] = useState("");
  const [multipleTextValue4, setMultipleTextValue4] = useState(false);

  // Layout selection
  const [selectedLayout4, setSelectedLayout4] = useState<
    "blank" | "oneText" | "multipleText"
  >("blank");
  const [selectedVideoUrl4, setSelectedVideoUrl4] = useState<string | null>(null);
  const [selectedAudioUrl4, setSelectedAudioUrl4] = useState<string | null>(null);
  const [selectedAIimageUrl4, setSelectedAIimageUrl4] = useState<string | null>(
    null
  );
  const [isAIimage4, setIsAIimage4] = useState<boolean>(false);

  const [selectedPreviewImage4, setSelectedPreviewImage4] = useState<
    string | null
  >(null);

  // Image Resizing.
  const [draggableImages4, setDraggableImages4] = useState<DraggableImage[]>([]);
  const [imageFilter4, setImageFilter4] = useState(false)
  const [imageSketch4, setImageSketch4] = useState(false)
  const [activeFilterImageId4, setActiveFilterImageId4] = useState<string | null>(null);

  //  ADD for Admin Editor ===============================================================================================================================================================================
  const [bgEdit4, setBgEdit4] = useState(false);
  const [bgLocked4, setBgLocked4] = useState<boolean>(false);
  const [bgRect4, setBgRect4] = useState<any>({ x: 40, y: 40, width: 300, height: 400 });
  const [bgColor4, setBgColor4] = useState<string | null>(null);
  const [bgImage4, setBgImage4] = useState<string | null>(null);
  const [selectedShapePath4, setSelectedShapePath4] = useState<string | null>(null);
  const [selectedShapeImageId4, setSelectedShapeImageId4] = useState<string | number | null>(null);
  const [canEditBg4, setCanEditBg4] = useState<boolean>(true);
  const [canEditImages4, setCanEditImages4] = useState<boolean>(true);
  const [canEditStickers4, setCanEditStickers4] = useState<boolean>(true);


  const setEditAll4 = (on: boolean) => {
    setCanEditBg4(on);
    setCanEditImages4(on);
    setCanEditStickers4(on);
  };




  // QR Resizing and Moving
  const [qrPosition4, setQrPosition4] = useState<DraggableQR>({
    id: "qr1",
    url: "",
    x: 0,
    y: 0,
    width: 70,
    height: 105,
    rotation: 0,
    zIndex: 1000,
  });

  const [qrAudioPosition4, setQrAudioPosition4] = useState<DraggableAudioQR>({
    id: "qr2",
    url: "",
    x: 0,
    y: 0,
    width: 70,
    height: 105,
    rotation: 0,
    zIndex: 1000,
  });

  const [aimage4, setAIImage4] = useState<ImagePosition>({
    x: 30,
    y: 30,
    width: 300,
    height: 400,
    // zindex: 1000,
  });

  // Global defaults (for new text elements)
  const [fontSize4, setFontSize4] = useState(20);
  const [fontWeight4, setFontWeight4] = useState(400);
  const [textAlign4, setTextAlign4] = useState<"start" | "center" | "end">(
    "start"
  );
  const [verticalAlign4, setVerticalAlign4] = useState<
    "top" | "center" | "bottom"
  >("top");
  const [fontFamily4, setFontFamily4] = useState("Roboto");
  const [fontColor4, setFontColor4] = useState(fontColors[0]);
  const [rotation4, setRotation4] = useState(0);

  // Individual text elements management
  const [textElements4, setTextElements4] = useState<TextElement[]>([]);
  const [selectedTextId4, setSelectedTextId4] = useState<string | null>(null);



  // Legacy support
  const [texts4, setTexts4] = useState([
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

  const [lineHeight4, setLineHeight4] = useState(1.5);
  const [letterSpacing4, setLetterSpacing4] = useState(0);


  const [editingIndex4, setEditingIndex4] = useState<number | null>(null);

  const [images4, setImages4] = useState<{ id: number; src: string }[]>([]);
  const [layout4, setLayout4] = useState<any>(null);
  const [video4, setVideo4] = useState<File[] | null>(null);
  const [audio4, setAudio4] = useState<File[] | null>(null);
  const [tips4, setTips4] = useState(false);
  const [upload4, setUpload4] = useState(false);
  const [duration4, setDuration4] = useState<number | null>(null);
  const [poster4, setPoster4] = useState<string | null>(null);

  // --- 💾 Persist heavy image data to IndexedDB ---
  useEffect(() => {
    const [key] = getSlideStateKeys(4, getDraftCardId());
    void saveSlideStateToIdb(key, { images4, draggableImages4 }).catch(() => {});
  }, [images4, draggableImages4]);

  // New states for position and size
  const [textPositions4, setTextPositions4] = useState<Position[]>(
    texts4.map(() => ({ x: 0, y: 0 }))
  );
  const [textSizes4, setTextSizes4] = useState<Size[]>(
    texts4.map(() => ({ width: 100, height: 30 }))
  );

  // For images, use an object keyed by image id for quick lookup
  const [imagePositions4, setImagePositions4] = useState<
    Record<number, Position>
  >({});
  const [imageSizes4, setImageSizes4] = useState<Record<number, Size>>({});

  // Slide state management
  const [isSlideActive4, setIsSlideActive4] = useState(false);
  const [isEditable4, setIsEditable4] = useState(true);

  const [slide4DataStore4, setSlide4DataStore] = useState<any[]>([]);

  const [selectedStickers4, setSelectedStickers4] = useState<StickerItem[]>([]);

  const addSticker4 = (
    sticker: Omit<
      StickerItem,
      "x" | "y" | "width" | "height" | "zIndex" | "rotation"
    >
  ) => {
    setSelectedStickers4((prev) => {
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

  const updateSticker4 = (index: number, data: Partial<StickerItem>) => {
    setSelectedStickers4((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...data } : item))
    );
  };

  const removeSticker4 = (index: number) => {
    setSelectedStickers4((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  };

  // ✅ Reset all context state to initial values
  const resetSlide4State = () => {
    // 🧹 Clear persisted local storage
    clearSlide4LocalData();

    // Base states
    setActiveIndex4(0);
    setTitle4("Happy Birthday");
    setActivePopup4(null);
    setSelectedImage4([]);
    setShowOneTextRightSideBox4(false);
    setOneTextValue4("");
    setMultipleTextValue4(false);

    // Layout & selections
    setSelectedLayout4("blank");
    setSelectedVideoUrl4(null);
    setSelectedAudioUrl4(null);
    setSelectedAIimageUrl4(null);
    setIsAIimage4(false);
    setSelectedPreviewImage4(null);

    // Images & draggable
    setImages4([]);
    setDraggableImages4([]);

    // Stickers
    setSelectedStickers4([]);

    // QR positions
    setQrPosition4({
      id: "qr1",
      url: "",
      x: 20,
      y: 10,
      width: 59,
      height: 105,
      rotation: 0,
      zIndex: 1000,
    });

    setQrAudioPosition4({
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
    setAIImage4({
      x: 30,
      y: 30,
      width: 300,
      height: 400,
    });

    // Fonts & text defaults
    setFontSize4(20);
    setFontWeight4(400);
    setTextAlign4("start");
    setVerticalAlign4("top");
    setFontFamily4("Roboto");
    setFontColor4("#000000");
    setRotation4(0);
    setLineHeight4(1.5)
    setLetterSpacing4(0)

    // Text elements
    setTextElements4([]);
    setSelectedTextId4(null);
    setTexts4([
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
    setEditingIndex4(null);
    setTips4(false);
    setUpload4(false);
    setDuration4(null);
    setPoster4(null);

    // Position & size data
    setTextPositions4([]);
    setTextSizes4([]);
    setImagePositions4({});
    setImageSizes4({});


    setBgColor4(null)
    setBgImage4(null)
    setSelectedShapeImageId4(null)
    setSelectedShapePath4(null)

    // Video / audio files
    setVideo4(null);
    setAudio4(null);

    // Slide states
    setIsSlideActive4(false);
    setIsEditable4(true);

    // Typography adjustments
    setLineHeight4(1.5);
    setLetterSpacing4(0);

    // Clear data store snapshot
    setSlide4DataStore([]);
  };

  // Passed value to storing and state recognizing.
  useEffect(() => {
    try {
      const saved = safeGetStorage("slide4_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        const currentDraftId = getDraftCardId();
        const savedDraftId = parsed?.draftId;
        if (currentDraftId) {
          if (!savedDraftId || savedDraftId !== currentDraftId) return;
        }

        if (parsed.textElements4) setTextElements4(parsed.textElements4);
        if (parsed.draggableImages4) setDraggableImages4(parsed.draggableImages4);
        if (parsed.images4) setImages4(parsed.images4);
        if (parsed.selectedImg4) setSelectedImage4(parsed.selectedImg4);
        if (parsed.selectedVideoUrl4) setSelectedVideoUrl4(parsed.selectedVideoUrl4);
        if (parsed.selectedAudioUrl4) setSelectedAudioUrl4(parsed.selectedAudioUrl4);
        if (parsed.selectedLayout4) setSelectedLayout4(parsed.selectedLayout4);
        if (parsed.oneTextValue4) setOneTextValue4(parsed.oneTextValue4);
        if (parsed.showOneTextRightSideBox4) setShowOneTextRightSideBox4(parsed.showOneTextRightSideBox4);
        if (parsed.multipleTextValue4)
          setMultipleTextValue4(parsed.multipleTextValue4);
        if (parsed.selectedStickers4)
          setSelectedStickers4(parsed.selectedStickers4);
        if (parsed.qrPosition4) setQrPosition4(parsed.qrPosition4);
        if (parsed.qrAudioPosition4) setQrAudioPosition4(parsed.qrAudioPosition4);
        if (parsed.aimage4) setAIImage4(parsed.aimage4);
        if (typeof parsed.isAIimage4 === "boolean") setIsAIimage4(parsed.isAIimage4);
        if (parsed.selectedAIimageUrl4)
          setSelectedAIimageUrl4(parsed.selectedAIimageUrl4);

        if (parsed.bgColor4 !== undefined) setBgColor4(parsed.bgColor4);
        if (parsed.bgImage4 !== undefined) setBgImage4(parsed.bgImage4);
        if (Object.prototype.hasOwnProperty.call(parsed, "selectedShapePath4")) setSelectedShapePath4(parsed.selectedShapePath4);
        if (parsed.layout4) setLayout4(parsed.layout4);

        if (parsed.fontSize4) setFontSize4(parsed.fontSize4);
        if (parsed.fontWeight4) setFontWeight4(parsed.fontWeight4);
        if (parsed.fontFamily4) setFontFamily4(parsed.fontFamily4);
        if (parsed.fontColor4) setFontColor4(parsed.fontColor4);
        if (parsed.textAlign4) setTextAlign4(parsed.textAlign4);
        if (parsed.verticalAlign4) setVerticalAlign4(parsed.verticalAlign4);
        if (parsed.letterSpacing4 !== undefined) setLetterSpacing4(parsed.letterSpacing4);
        if (parsed.lineHeight4 !== undefined) setLineHeight4(parsed.lineHeight4);
        if (parsed.rotation4 !== undefined) setRotation4(parsed.rotation4);

        const hasHeavyLocal =
          (parsed.images4 && parsed.images4.length) ||
          (parsed.draggableImages4 && parsed.draggableImages4.length);
        if (hasHeavyLocal) {
          const [key] = getSlideStateKeys(4, parsed?.draftId ?? getDraftCardId());
          void saveSlideStateToIdb(key, {
            images4: parsed.images4 ?? [],
            draggableImages4: parsed.draggableImages4 ?? [],
          }).catch(() => {});
          try {
            localStorage.removeItem("slide4_state");
            sessionStorage.removeItem("slide4_state");
          } catch {}
        }

      }
    } catch (error) {
      console.error("❌ Error restoring slide4_state:", error);
    }
  }, []);

  // --- 🧠 Restore heavy image data from IndexedDB (if localStorage skipped it) ---
  useEffect(() => {
    if (images4.length || draggableImages4.length) return;
    let cancelled = false;
    (async () => {
      try {
        const keys = getSlideStateKeys(4, getDraftCardId());
        for (const key of keys) {
          const heavy = await loadSlideStateFromIdb<{
            images4?: { id: number; src: string }[];
            draggableImages4?: DraggableImage[];
          }>(key);
          if (!heavy) continue;
          if (cancelled) return;
          if (heavy.images4) setImages4(heavy.images4);
          if (heavy.draggableImages4) setDraggableImages4(heavy.draggableImages4);
          return;
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [images4.length, draggableImages4.length]);

  // --- 💾 Auto-save changes ---
  useEffect(() => {
    const stateToSave = {
      draftId: getDraftCardId() ?? null,
      textElements4,
      selectedImg4,
      selectedVideoUrl4,
      selectedAudioUrl4,
      selectedLayout4,
      oneTextValue4,
      multipleTextValue4,
      showOneTextRightSideBox4,
      selectedStickers4,
      qrPosition4,
      qrAudioPosition4,
      aimage4,
      isAIimage4,
      selectedAIimageUrl4,

      fontSize4,
      fontWeight4,
      fontFamily4,
      fontColor4,
      textAlign4,
      verticalAlign4,
      letterSpacing4,
      lineHeight4,
      rotation4,

      bgColor4,
      bgImage4,
      selectedShapePath4,
      layout4,
    };

    const payload = JSON.stringify(stateToSave);
    const ok = safeSetLocalStorage("slide4_state", payload, {
      clearOnFail: ["slides_backup", "slide4_state"],
      fallbackToSession: true,
    });
    if (!ok) {
      console.error("❌ Error saving slide4_state: storage full");
    }
  }, [
    textElements4,
    selectedImg4,
    selectedVideoUrl4,
    selectedAudioUrl4,
    selectedLayout4,
    oneTextValue4,
    multipleTextValue4,
    selectedStickers4,
    qrPosition4,
    qrAudioPosition4,
    aimage4,
    isAIimage4,
    selectedAIimageUrl4,
    showOneTextRightSideBox4,

    fontSize4,
    fontWeight4,
    fontFamily4,
    fontColor4,
    textAlign4,
    verticalAlign4,
    letterSpacing4,
    lineHeight4,
    rotation4,


    bgColor4,
    bgImage4,
    selectedShapePath4,
    layout4,
  ]);

  // --- 🧹 Clear localStorage ---
  const clearSlide4LocalData = () => {
    try {
      localStorage.removeItem("slide4_state");
      sessionStorage.removeItem("slide4_state");
      const keys = getSlideStateKeys(4, getDraftCardId());
      keys.forEach((key) => {
        void clearSlideStateFromIdb(key).catch(() => {});
      });
      console.log("🧹 Cleared Slide4 saved state");
    } catch (error) {
      console.error("Error clearing slide4_state:", error);
    }
  };

  return (
    <Slide4Context.Provider
      value={{
        activeIndex4,
        setActiveIndex4,
        title4,
        setTitle4,
        activePopup4,
        setActivePopup4,
        selectedImg4,
        setSelectedImage4,
        showOneTextRightSideBox4,
        setShowOneTextRightSideBox4,
        oneTextValue4,
        setOneTextValue4,
        multipleTextValue4,
        setMultipleTextValue4,
        defaultFontColor4: fontColors[0],
        setDefaultFontColor4: () => { },
        defaultFontSize4: 20,
        setDefaultFontSize4: () => { },
        defaultFontWeight4: 400,
        setDefaultFontWeight4: () => { },
        defaultFontFamily4: "Roboto",
        setDefaultFontFamily4: () => { },
        defaultTextAlign4: "start",
        setDefaultTextAlign4: () => { },
        defaultVerticalAlign4: "top",
        setDefaultVerticalAlign4: () => { },
        defaultRotation4: 0,
        setDefaultRotation4: () => { },

        // Layout selection
        selectedLayout4,
        setSelectedLayout4,

        // Global defaults
        fontSize4,
        setFontSize4,
        fontWeight4,
        setFontWeight4,
        textAlign4,
        setTextAlign4,
        fontColor4,
        setFontColor4,
        fontFamily4,
        setFontFamily4,
        rotation4,
        setRotation4,

        // Individual text elements management
        textElements4,
        setTextElements4,
        selectedTextId4,
        setSelectedTextId4,

        // Legacy support
        texts4,
        setTexts4,
        editingIndex4,
        setEditingIndex4,

        images4,
        setImages4,

        addSticker4,
        selectedStickers4,
        setSelectedStickers4,
        updateSticker4,
        removeSticker4,

        selectedPreviewImage4,
        setSelectedPreviewImage4,
        draggableImages4,
        setDraggableImages4,

        video4,
        setVideo4,
        audio4,
        setAudio4,

        aimage4,
        setAIImage4,

        tips4,
        setTips4,
        upload4,
        setUpload4,
        duration4,
        setDuration4,
        selectedVideoUrl4,
        setSelectedVideoUrl4,
        selectedAudioUrl4,
        setSelectedAudioUrl4,
        qrPosition4,
        setQrPosition4,
        qrAudioPosition4,
        setQrAudioPosition4,

        // New values
        textPositions4,
        setTextPositions4,
        textSizes4,
        setTextSizes4,
        slide4DataStore4,

        lineHeight4,
        setLineHeight4,
        letterSpacing4,
        setLetterSpacing4,



        imagePositions4,
        setImagePositions4,
        imageSizes4,
        setImageSizes4,
        poster4,
        setPoster4,
        isAIimage4,
        setIsAIimage4,
        setSelectedAIimageUrl4,
        selectedAIimageUrl4,
        setImageFilter4,
        imageFilter4,
        setImageSketch4,
        imageSketch4,
        activeFilterImageId4,
        setActiveFilterImageId4,

        // Slide state management
        isSlideActive4,
        setIsSlideActive4,
        isEditable4,
        setIsEditable4,
        verticalAlign4,
        setVerticalAlign4,

        resetSlide4State,
        layout4,
        setLayout4,

        bgColor4, setBgColor4,
        bgImage4, setBgImage4,
        bgEdit4, setBgEdit4,
        bgLocked4, setBgLocked4,
        bgRect4, setBgRect4,
        selectedShapePath4,
        setSelectedShapePath4,
        selectedShapeImageId4,
        setSelectedShapeImageId4,
        canEditBg4, setCanEditBg4,
        canEditImages4, setCanEditImages4,
        canEditStickers4, setCanEditStickers4,
        setEditAll4,
      }}
    >
      {children}
    </Slide4Context.Provider>
  );
};

export const useSlide4 = () => {
  const context = useContext(Slide4Context);
  if (!context) {
    throw new Error("useWishCard must be used within a WishCardProvider");
  }
  return context;
};
