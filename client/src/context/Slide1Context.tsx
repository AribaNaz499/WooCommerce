import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { safeGetStorage, safeSetLocalStorage } from "../lib/storage";
import { getDraftCardId } from "../lib/draftCardId";
import {
  clearSlideStateFromIdb,
  getSlideStateKeys,
  getSlideStateSnapshotKeys,
  loadSlideStateFromIdb,
  saveSlideStateToIdb,
} from "../lib/idbSlideState";
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

interface Slide1ContextType {
  activeIndex1: number;
  setActiveIndex1: React.Dispatch<React.SetStateAction<number>>;
  title1: string;
  setTitle1: React.Dispatch<React.SetStateAction<string>>;
  activePopup1: string | null;
  setActivePopup1: React.Dispatch<React.SetStateAction<string | null>>;
  selectedImg1: number[] | any;
  setSelectedImage1: React.Dispatch<React.SetStateAction<number[]>>;
  showOneTextRightSideBox1: boolean;
  setShowOneTextRightSideBox1: React.Dispatch<React.SetStateAction<boolean>>;
  oneTextValue1: string;
  setOneTextValue1: React.Dispatch<React.SetStateAction<string>>;
  multipleTextValue1: boolean;
  setMultipleTextValue1: React.Dispatch<React.SetStateAction<boolean>>;

  lineHeight1: number;
  setLineHeight1: React.Dispatch<React.SetStateAction<number>>;
  letterSpacing1: number;
  setLetterSpacing1: React.Dispatch<React.SetStateAction<number>>;

  // Layout selection
  selectedLayout1: "blank" | "oneText" | "multipleText";
  setSelectedLayout1: React.Dispatch<
    React.SetStateAction<"blank" | "oneText" | "multipleText">
  >;

  // Global defaults (for new text elements)
  fontSize1: number;
  setFontSize1: React.Dispatch<React.SetStateAction<number>>;
  fontWeight1: number;
  setFontWeight1: React.Dispatch<React.SetStateAction<number>>;
  textAlign1: "start" | "center" | "end";
  verticalAlign1?: "top" | "center" | "bottom";
  setVerticalAlign1: React.Dispatch<
    React.SetStateAction<"top" | "center" | "bottom">
  >;
  setTextAlign1: React.Dispatch<
    React.SetStateAction<"start" | "center" | "end">
  >;
  fontColor1: string;
  setFontColor1: React.Dispatch<React.SetStateAction<string>>;
  fontFamily1: string;
  setFontFamily1: React.Dispatch<React.SetStateAction<string>>;
  rotation1: number;
  setRotation1: React.Dispatch<React.SetStateAction<number>>;
  defaultFontSize1?: number;
  setDefaultFontSize1?: React.Dispatch<React.SetStateAction<number>>;
  defaultFontWeight1?: number;
  setDefaultFontWeight1?: React.Dispatch<React.SetStateAction<number>>;
  defaultFontColor1?: string;
  setDefaultFontColor1?: React.Dispatch<React.SetStateAction<string>>;
  defaultFontFamily1?: string;
  setDefaultFontFamily1?: React.Dispatch<React.SetStateAction<string>>;
  defaultTextAlign1?: "start" | "center" | "end";
  setDefaultTextAlign1?: React.Dispatch<
    React.SetStateAction<"start" | "center" | "end">
  >;
  defaultVerticalAlign1?: "top" | "center" | "bottom";
  setDefaultVerticalAlign1?: React.Dispatch<
    React.SetStateAction<"top" | "center" | "bottom">
  >;
  defaultRotation1?: number;
  setDefaultRotation1?: React.Dispatch<React.SetStateAction<number>>;

  // Individual text elements management
  textElements1: TextElement[];
  setTextElements1: React.Dispatch<React.SetStateAction<TextElement[]>>;
  selectedTextId1: string | null;
  setSelectedTextId1: React.Dispatch<React.SetStateAction<string | null>>;

  // Legacy support
  texts1: string[] | any[];
  setTexts1: React.Dispatch<React.SetStateAction<any[]>>;
  editingIndex1: number | null;
  setEditingIndex1: React.Dispatch<React.SetStateAction<number | null>>;

  images1: { id: number; src: string }[];
  setImages1: React.Dispatch<
    React.SetStateAction<{ id: number; src: string }[]>
  >;
  video1: File[] | null;
  setVideo1: React.Dispatch<React.SetStateAction<File[] | null>>;
  audio1: File[] | null;
  setAudio1: React.Dispatch<React.SetStateAction<File[] | null>>;
  tips1: boolean;
  setTips1: React.Dispatch<React.SetStateAction<boolean>>;
  upload1: boolean;
  setUpload1: React.Dispatch<React.SetStateAction<boolean>>;
  duration1: number | null;
  setDuration1: React.Dispatch<React.SetStateAction<number | null>>;
  isAIimage1?: boolean;
  setIsAIimage1?: React.Dispatch<React.SetStateAction<boolean | any>>;
  selectedAIimageUrl1: string | null;
  setSelectedAIimageUrl1: React.Dispatch<React.SetStateAction<string | null>>;

  aimage1: ImagePosition;
  setAIImage1: React.Dispatch<React.SetStateAction<ImagePosition>>;

  selectedPreviewImage1?: string | null;
  setSelectedPreviewImage1?: React.Dispatch<React.SetStateAction<string | null>>;

  draggableImages1: DraggableImage[];
  setDraggableImages1: React.Dispatch<React.SetStateAction<DraggableImage[]>>;
  imageFilter1?: boolean,
  setImageFilter1?: any,
  imageSketch1?: boolean,
  setImageSketch1?: any,

  activeFilterImageId1?: string | null | any,
  setActiveFilterImageId1?: any

  qrPosition1: DraggableQR;
  setQrPosition1: React.Dispatch<React.SetStateAction<DraggableQR>>;
  qrAudioPosition1: DraggableAudioQR;
  setQrAudioPosition1: React.Dispatch<React.SetStateAction<DraggableAudioQR>>;

  // New properties for position and size
  textPositions1: Position[];
  setTextPositions1: React.Dispatch<React.SetStateAction<Position[]>>;
  textSizes1: Size[];
  setTextSizes1: React.Dispatch<React.SetStateAction<Size[]>>;
  imagePositions1: Record<number, Position>; // keyed by image id
  setImagePositions1: React.Dispatch<
    React.SetStateAction<Record<number, Position>>
  >;
  imageSizes1: Record<number, Size>; // keyed by image id
  setImageSizes1: React.Dispatch<React.SetStateAction<Record<number, Size>>>;
  poster1: string | null;
  setPoster1: React.Dispatch<React.SetStateAction<string | null>>;
  selectedVideoUrl1: string | null;
  setSelectedVideoUrl1: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedAudioUrl1: React.Dispatch<React.SetStateAction<string | null>>;
  selectedAudioUrl1: string | null;

  // Slide state management
  isSlideActive1: boolean;
  setIsSlideActive1: React.Dispatch<React.SetStateAction<boolean>>;
  slide2DataStore1?: any[];

  isEditable1: boolean; // NEW: To control edit/view mode
  setIsEditable1: React.Dispatch<React.SetStateAction<boolean>>;

  setSlide1DataStore1?: any[];
  slide1DataStore1?: any;
  layout1?: any,
  setLayout1?: any,

  // For Sticker
  selectedStickers1: StickerItem[];
  addSticker1: (
    sticker: Omit<StickerItem, "x" | "y" | "width" | "height" | "zIndex">
  ) => void;
  updateSticker1: (index: number, data: Partial<StickerItem>) => void;
  removeSticker1: (index: number) => void;
  resetSlide1State: () => void | any;


  // ------------------------ Adding Admin Editor -------------------------------------------------------------------------------------------
  bgEdit1: boolean, setBgEdit1: any,
  bgLocked1: boolean, setBgLocked1: any,
  bgRect1: any, setBgRect1: any,
  bgColor1: string | null;
  setBgColor1: React.Dispatch<React.SetStateAction<string | null>>;
  bgImage1: string | null;
  setBgImage1: React.Dispatch<React.SetStateAction<string | null>>;
  selectedShapePath1: string | null;
  setSelectedShapePath1: React.Dispatch<React.SetStateAction<string | null>>;
  selectedShapeImageId1: string | number | null;
  setSelectedShapeImageId1: React.Dispatch<React.SetStateAction<string | number | null>>;
  canEditBg1?: boolean;
  setCanEditBg1?: any;
  canEditImages1?: boolean;
  setCanEditImages1?: any;
  canEditStickers1?: boolean;
  setCanEditStickers1?: any,
  setEditAll1: any,
}


const Slide1Context = createContext<Slide1ContextType | undefined>(undefined);

export const Slide1Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeIndex1, setActiveIndex1] = useState(0);
  const [title1, setTitle1] = useState("Happy Birthday");
  const [activePopup1, setActivePopup1] = useState<string | null>(null);
  const [selectedImg1, setSelectedImage1] = useState<number[]>([]);
  const [showOneTextRightSideBox1, setShowOneTextRightSideBox1] =
    useState(false);
  const [oneTextValue1, setOneTextValue1] = useState("");
  const [multipleTextValue1, setMultipleTextValue1] = useState(false);

  // Layout selection
  const [selectedLayout1, setSelectedLayout1] = useState<
    "blank" | "oneText" | "multipleText"
  >("blank");
  const [selectedVideoUrl1, setSelectedVideoUrl1] = useState<string | null>(
    null
  );
  const [selectedAudioUrl1, setSelectedAudioUrl1] = useState<string | null>(
    null
  );
  const [selectedPreviewImage1, setSelectedPreviewImage1] = useState<
    string | null
  >(null);

  const [selectedAIimageUrl1, setSelectedAIimageUrl1] = useState<string | null>(
    null
  );
  const [isAIimage1, setIsAIimage1] = useState<boolean>(false);

  // Sticker Selection
  const [selectedStickers1, setSelectedStickers1] = useState<StickerItem[]>([]);

  // Image Resizing.
  const [draggableImages1, setDraggableImages1] = useState<DraggableImage[]>(
    []
  );
  const [imageFilter1, setImageFilter1] = useState(false)
  const [activeFilterImageId1, setActiveFilterImageId1] = useState<string | null>(null);


  //  ADD for Admin Editor ===============================================================================================================================================================================
  const [bgColor1, setBgColor1] = useState<string | null>(null);
  const [bgImage1, setBgImage1] = useState<string | null>(null);
  const [selectedShapePath1, setSelectedShapePath1] = useState<string | null>(null);
  const [selectedShapeImageId1, setSelectedShapeImageId1] = useState<string | number | null>(null);
  const [canEditBg1, setCanEditBg1] = useState<boolean>(true);
  const [canEditImages1, setCanEditImages1] = useState<boolean>(true);
  const [canEditStickers1, setCanEditStickers1] = useState<boolean>(true);
  const [bgEdit1, setBgEdit1] = useState(false);
  const [bgLocked1, setBgLocked1] = useState<boolean>(false);
  const [bgRect1, setBgRect1] = useState<any>({ x: 40, y: 40, width: 300, height: 400 });


  const setEditAll1 = (on: boolean) => {
    setCanEditBg1(on);
    setCanEditImages1(on);
    setCanEditStickers1(on);
  };

  // QR Resizing and Moving
  const [qrPosition1, setQrPosition1] = useState<DraggableQR>({
    id: "qr1",
    url: "",
    x: 0,
    y: 0,
    width: 70,
    height: 105,
    rotation: 0,
    zIndex: 1000,
  });
  const [qrAudioPosition1, setQrAudioPosition1] = useState<DraggableQR>({
    id: "qr2",
    url: "",
    x: 0,
    y: 0,
    width: 70,
    height: 105,
    rotation: 0,
    zIndex: 1000,
  });

  const [aimage1, setAIImage1] = useState<ImagePosition>({
    x: 30,
    y: 30,
    width: 300,
    height: 400,
    // zindex: 1000,
  });

  // Global defaults (for new text elements)
  const [fontSize1, setFontSize1] = useState(20);
  const [fontWeight1, setFontWeight1] = useState(400);
  const [textAlign1, setTextAlign1] = useState<"start" | "center" | "end">(
    "start"
  );
  const [verticalAlign1, setVerticalAlign1] = useState<
    "top" | "center" | "bottom"
  >("top");
  const [fontFamily1, setFontFamily1] = useState("Roboto");
  const [fontColor1, setFontColor1] = useState(fontColors[0]);
  const [rotation1, setRotation1] = useState(0);

  // Individual text elements management
  const [textElements1, setTextElements1] = useState<TextElement[]>([]);
  const [selectedTextId1, setSelectedTextId1] = useState<string | null>(null);

  // Legacy support
  const [texts1, setTexts1] = useState([
    {
      value: "",
      fontSize: 30,
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
      fontSize: 30,
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
      fontSize: 30,
      fontWeight: 400,
      fontColor: "#000000",
      fontFamily: "Roboto",
      verticalAlign: "center",
      textAlign: "center",
      lineHeight: 1.5,
      letterSpacing: 0,
    },
  ]);

  const [lineHeight1, setLineHeight1] = useState(1.5);
  const [letterSpacing1, setLetterSpacing1] = useState(0);

  const [editingIndex1, setEditingIndex1] = useState<number | null>(null);

  const [images1, setImages1] = useState<{ id: number; src: string }[]>([]);
  const [video1, setVideo1] = useState<File[] | null>(null);
  const [audio1, setAudio1] = useState<File[] | null>(null);
  const [tips1, setTips1] = useState(false);
  const [upload1, setUpload1] = useState(false);
  const [duration1, setDuration1] = useState<number | null>(null);
  const [poster1, setPoster1] = useState<string | null>(null);

  // --- 💾 Persist heavy image data to IndexedDB ---
  useEffect(() => {
    const [key] = getSlideStateKeys(1, getDraftCardId());
    void saveSlideStateToIdb(key, { images1, draggableImages1 }).catch(() => {});
  }, [images1, draggableImages1]);

  // New states for position and size
  const [textPositions1, setTextPositions1] = useState<Position[]>(
    texts1.map(() => ({ x: 0, y: 0 }))
  );
  const [textSizes1, setTextSizes1] = useState<Size[]>(
    texts1.map(() => ({ width: 100, height: 10 }))
  );

  // For images, use an object keyed by image id for quick lookup
  const [imagePositions1, setImagePositions1] = useState<
    Record<number, Position>
  >({});
  const [imageSizes1, setImageSizes1] = useState<Record<number, Size>>({});

  // Slide state management
  const [isSlideActive1, setIsSlideActive1] = useState(false);
  const [isEditable1, setIsEditable1] = useState(true);

  const [slide1DataStore1, setSlide1DataStore1] = useState<any[]>([]);

  const addSticker1 = (
    sticker: Omit<
      StickerItem,
      "x" | "y" | "width" | "height" | "zIndex" | "rotation"
    >
  ) => {
    setSelectedStickers1((prev) => {
      const newSticker: StickerItem = {
        ...sticker,
        x: 0 + prev.length * 10,
        y: 0 + prev.length * 10,
        width: 100,
        height: 100,
        zIndex: prev.length + 2,
        rotation: 0,
      };
      const updated = [...prev, newSticker];
      return updated;
    });
  };

  const updateSticker1 = (index: number, data: Partial<StickerItem>) => {
    setSelectedStickers1((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...data } : item))
    );
  };
  // Layout with uploaded images for preview
  const [layout1, setLayout1] = useState<any>(null);

  const removeSticker1 = (index: number) => {
    setSelectedStickers1((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  };

  // ✅ Reset all context state to initial values
  const resetSlide1State = () => {
    setBgColor1(null)
    setBgImage1(null)
    setLayout1([])
    // Base states
    setActiveIndex1(0);
    setTitle1("Happy Birthday");
    setActivePopup1(null);
    setSelectedImage1([]);
    setShowOneTextRightSideBox1(false);
    setOneTextValue1("");
    setMultipleTextValue1(false);

    // Layout & selections
    setSelectedLayout1("blank");
    setSelectedVideoUrl1(null);
    setSelectedAudioUrl1(null);
    setSelectedAIimageUrl1(null);
    setIsAIimage1(false);
    setSelectedPreviewImage1(null);

    // Images & draggable
    setImages1([]);
    setDraggableImages1([]);

    // Stickers
    setSelectedStickers1([]);

    // QR positions
    setQrPosition1({
      id: "qr1",
      url: "",
      x: 20,
      y: 10,
      width: 59,
      height: 105,
      rotation: 0,
      zIndex: 1000,
    });

    setQrAudioPosition1({
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
    setAIImage1({
      x: 30,
      y: 30,
      width: 300,
      height: 400,
    });

    // Fonts & text defaults
    setFontSize1(20);
    setFontWeight1(400);
    setTextAlign1("start");
    setVerticalAlign1("top");
    setFontFamily1("Roboto");
    setFontColor1("#000000");
    setRotation1(0);
    setLineHeight1(1.5)
    setLetterSpacing1(0)

    // Text elements
    setTextElements1([]);
    setSelectedTextId1(null);
    setTexts1([
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
    setEditingIndex1(null);
    setTips1(false);
    setUpload1(false);
    setDuration1(null);
    setPoster1(null);

    // Position & size data
    setTextPositions1([]);
    setTextSizes1([]);
    setImagePositions1({});
    setImageSizes1({});

    // Video / audio files
    setVideo1(null);
    setAudio1(null);

    // Slide states
    setIsSlideActive1(false);
    setIsEditable1(true);

    // Typography adjustments
    setLineHeight1(1.5);
    setLetterSpacing1(0);

    // Clear data store snapshot
    setSlide1DataStore1([]);

    setBgColor1(null);
    setBgImage1(null);
    setSelectedShapePath1(null);
    clearSlide1LocalData();

  };

  const lastSavedStatePayloadRef = useRef("");
  const storageFullLoggedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const currentDraftId = getDraftCardId();
        const saved = safeGetStorage("slide1_state");
        let parsed: any = null;
        if (saved) {
          parsed = JSON.parse(saved);
        } else {
          const snapshotKeys = getSlideStateSnapshotKeys(1, currentDraftId);
          for (const key of snapshotKeys) {
            const snapshot = await loadSlideStateFromIdb<any>(key);
            if (snapshot) {
              parsed = snapshot;
              break;
            }
          }
        }
        if (!parsed || cancelled) return;
        const savedDraftId = parsed?.draftId;
        if (currentDraftId) {
          if (!savedDraftId || savedDraftId !== currentDraftId) return;
        }
        if (parsed.textElements1) setTextElements1(parsed.textElements1);
        if (parsed.draggableImages1) setDraggableImages1(parsed.draggableImages1);
        if (parsed.images1) setImages1(parsed.images1);
        if (parsed.selectedImg1) setSelectedImage1(parsed.selectedImg1);
        if (parsed.selectedVideoUrl1) setSelectedVideoUrl1(parsed.selectedVideoUrl1);
        if (parsed.selectedAudioUrl1) setSelectedAudioUrl1(parsed.selectedAudioUrl1);
        if (parsed.selectedLayout1) setSelectedLayout1(parsed.selectedLayout1);
        if (parsed.oneTextValue1) setOneTextValue1(parsed.oneTextValue1);
        if (parsed.showOneTextRightSideBox1) setShowOneTextRightSideBox1(parsed.showOneTextRightSideBox1);
        if (parsed.multipleTextValue1)
          setMultipleTextValue1(parsed.multipleTextValue1);
        if (parsed.selectedStickers1)
          setSelectedStickers1(parsed.selectedStickers1);
        if (parsed.qrPosition1) setQrPosition1(parsed.qrPosition1);
        if (parsed.qrAudioPosition1) setQrAudioPosition1(parsed.qrAudioPosition1);
        if (parsed.aimage1) setAIImage1(parsed.aimage1);
        if (typeof parsed.isAIimage1 === "boolean") setIsAIimage1(parsed.isAIimage1);
        if (parsed.selectedAIimageUrl1)
          setSelectedAIimageUrl1(parsed.selectedAIimageUrl1);

        if (parsed.layout1)
          setLayout1(parsed.layout1);

        if (parsed.bgColor1 !== undefined) setBgColor1(parsed.bgColor1);
        if (parsed.bgImage1 !== undefined) setBgImage1(parsed.bgImage1);
        if (parsed.bgRect1 !== undefined) setBgRect1(parsed.bgRect1);
        if (Object.prototype.hasOwnProperty.call(parsed, "selectedShapePath1")) setSelectedShapePath1(parsed.selectedShapePath1);

        if (parsed.fontSize1) setFontSize1(parsed.fontSize1);
        if (parsed.fontWeight1) setFontWeight1(parsed.fontWeight1);
        if (parsed.fontFamily1) setFontFamily1(parsed.fontFamily1);
        if (parsed.fontColor1) setFontColor1(parsed.fontColor1);
        if (parsed.textAlign1) setTextAlign1(parsed.textAlign1);
        if (parsed.verticalAlign1) setVerticalAlign1(parsed.verticalAlign1);
        if (parsed.letterSpacing1 !== undefined) setLetterSpacing1(parsed.letterSpacing1);
        if (parsed.lineHeight1 !== undefined) setLineHeight1(parsed.lineHeight1);
        if (parsed.rotation1 !== undefined) setRotation1(parsed.rotation1);

        try {
          lastSavedStatePayloadRef.current = JSON.stringify(parsed);
        } catch {}

        const hasHeavyLocal =
          (parsed.images1 && parsed.images1.length) ||
          (parsed.draggableImages1 && parsed.draggableImages1.length);
        if (hasHeavyLocal) {
          const [key] = getSlideStateKeys(1, savedDraftId ?? currentDraftId);
          void saveSlideStateToIdb(key, {
            images1: parsed.images1 ?? [],
            draggableImages1: parsed.draggableImages1 ?? [],
          }).catch(() => {});
          try {
            localStorage.removeItem("slide1_state");
            sessionStorage.removeItem("slide1_state");
          } catch {}
        }

      } catch (error) {
      console.error("❌ Error restoring slide1_state:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- 🧠 Restore heavy image data from IndexedDB (if localStorage skipped it) ---
  useEffect(() => {
    if (images1.length || draggableImages1.length) return;
    let cancelled = false;
    (async () => {
      try {
        const keys = getSlideStateKeys(1, getDraftCardId());
        for (const key of keys) {
          const heavy = await loadSlideStateFromIdb<{
            images1?: { id: number; src: string }[];
            draggableImages1?: DraggableImage[];
          }>(key);
          if (!heavy) continue;
          if (cancelled) return;
          if (heavy.images1) setImages1(heavy.images1);
          if (heavy.draggableImages1) setDraggableImages1(heavy.draggableImages1);
          return;
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [images1.length, draggableImages1.length]);

  // Auto-save changes
  useEffect(() => {
    const stateToSave = {
      draftId: getDraftCardId() ?? null,
      textElements1,
      selectedImg1,
      selectedVideoUrl1,
      selectedAudioUrl1,
      selectedLayout1,
      oneTextValue1,
      multipleTextValue1,
      selectedStickers1,
      qrPosition1,
      qrAudioPosition1,
      aimage1,
      isAIimage1,
      selectedAIimageUrl1,
      showOneTextRightSideBox1,

      fontSize1,
      fontWeight1,
      fontFamily1,
      fontColor1,
      textAlign1,
      verticalAlign1,
      letterSpacing1,
      lineHeight1,
      rotation1,

      bgColor1,
      bgImage1,
      bgRect1,
      selectedShapePath1,
      layout1,
    };

    const payload = JSON.stringify(stateToSave);
    if (payload === lastSavedStatePayloadRef.current) return;
    lastSavedStatePayloadRef.current = payload;

    const ok = safeSetLocalStorage("slide1_state", payload, {
      clearOnFail: ["slides_backup", "slide1_state"],
      fallbackToSession: true,
    });

    if (ok) {
      storageFullLoggedRef.current = false;
      const [snapshotKey] = getSlideStateSnapshotKeys(1, getDraftCardId());
      void clearSlideStateFromIdb(snapshotKey).catch(() => {});
      return;
    }

    const [snapshotKey] = getSlideStateSnapshotKeys(1, getDraftCardId());
    void saveSlideStateToIdb(snapshotKey, stateToSave)
      .then(() => {
        storageFullLoggedRef.current = false;
      })
      .catch(() => {
        if (!storageFullLoggedRef.current) {
          storageFullLoggedRef.current = true;
          console.error("Error saving slide1_state: storage full");
        }
      });
  }, [
    textElements1,
    selectedImg1,
    selectedVideoUrl1,
    selectedAudioUrl1,
    selectedLayout1,
    oneTextValue1,
    multipleTextValue1,
    selectedStickers1,
    qrPosition1,
    qrAudioPosition1,
    aimage1,
    isAIimage1,
    selectedAIimageUrl1,
    showOneTextRightSideBox1,
    fontSize1,
    fontWeight1,
    fontFamily1,
    fontColor1,
    textAlign1,
    verticalAlign1,
    letterSpacing1,
    lineHeight1,
    rotation1,
    bgColor1,
    bgImage1,
    bgRect1,
    selectedShapePath1,
    layout1,
  ]);

  // Clear localStorage
  const clearSlide1LocalData = () => {
    try {
      localStorage.removeItem("slide1_state");
      sessionStorage.removeItem("slide1_state");
      const keys = [
        ...getSlideStateKeys(1, getDraftCardId()),
        ...getSlideStateSnapshotKeys(1, getDraftCardId()),
      ];
      keys.forEach((key) => {
        void clearSlideStateFromIdb(key).catch(() => {});
      });
      console.log("Cleared Slide1 saved state");
    } catch (error) {
      console.error("Error clearing slide1_state:", error);
    }
  };


  return (
    <Slide1Context.Provider
      value={{
        activeIndex1,
        setActiveIndex1,
        title1,
        setTitle1,
        activePopup1,
        setActivePopup1,
        selectedImg1,
        setSelectedImage1,
        showOneTextRightSideBox1,
        setShowOneTextRightSideBox1,
        oneTextValue1,
        setOneTextValue1,
        multipleTextValue1,
        setMultipleTextValue1,

        // Layout selection
        selectedLayout1,
        setSelectedLayout1,

        // Global defaults (existing)
        fontSize1,
        setFontSize1,
        fontWeight1,
        setFontWeight1,
        textAlign1,
        setTextAlign1,
        fontColor1,
        setFontColor1,
        fontFamily1,
        setFontFamily1,
        rotation1,
        setRotation1,
        // Individual text elements management
        textElements1,
        setTextElements1,
        selectedTextId1,
        setSelectedTextId1,

        // Legacy support
        texts1,
        setTexts1,
        editingIndex1,
        setEditingIndex1,

        images1,
        setImages1,
        addSticker1,
        selectedStickers1,
        updateSticker1,
        removeSticker1,

        selectedPreviewImage1,
        setSelectedPreviewImage1,
        draggableImages1,
        setDraggableImages1,

        video1,
        setVideo1,
        audio1,
        setAudio1,

        aimage1,
        setAIImage1,
        activeFilterImageId1,
        setActiveFilterImageId1,

        tips1,
        setTips1,
        upload1,
        setUpload1,
        duration1,
        setDuration1,
        selectedVideoUrl1,
        setSelectedVideoUrl1,
        selectedAudioUrl1,
        setSelectedAudioUrl1,
        qrPosition1,
        setQrPosition1,
        qrAudioPosition1,
        setQrAudioPosition1,
        isAIimage1,
        setIsAIimage1,
        setSelectedAIimageUrl1,
        selectedAIimageUrl1,

        // New values
        textPositions1,
        setTextPositions1,
        textSizes1,
        setTextSizes1,

        lineHeight1,
        setLineHeight1,
        letterSpacing1,
        setLetterSpacing1,

        imagePositions1,
        setImagePositions1,
        imageSizes1,
        setImageSizes1,
        poster1,
        setPoster1,
        setImageFilter1,
        imageFilter1,

        // Slide state management
        isSlideActive1,
        setIsSlideActive1,
        isEditable1,
        setIsEditable1,
        verticalAlign1,
        setVerticalAlign1,

        slide1DataStore1,
        resetSlide1State,

        layout1,
        setLayout1,

        // + new background values
        bgColor1, setBgColor1,
        bgImage1, setBgImage1,
        bgEdit1, setBgEdit1,
        bgLocked1, setBgLocked1,
        bgRect1, setBgRect1,
        selectedShapePath1,
        setSelectedShapePath1,
        selectedShapeImageId1,
        setSelectedShapeImageId1,
        canEditBg1, setCanEditBg1,
        canEditImages1, setCanEditImages1,
        canEditStickers1, setCanEditStickers1,
        setEditAll1,
      }}
    >
      {children}
    </Slide1Context.Provider>
  );
};

export const useSlide1 = () => {
  const context = useContext(Slide1Context);
  if (!context) {
    throw new Error("useWishCard must be used within a WishCardProvider");
  }
  return context;
};
