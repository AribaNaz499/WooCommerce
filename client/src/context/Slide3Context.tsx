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
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex?: number;
  filter?: string
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

interface Slide3ContextType {
  activeIndex3: number;
  setActiveIndex3: React.Dispatch<React.SetStateAction<number>>;
  title3: string;
  setTitle3: React.Dispatch<React.SetStateAction<string>>;
  activePopup3: string | null;
  setActivePopup3: React.Dispatch<React.SetStateAction<string | null>>;
  selectedImg3: number[];
  setSelectedImage3: React.Dispatch<React.SetStateAction<number[]>>;
  showOneTextRightSideBox3: boolean;
  setShowOneTextRightSideBox3: React.Dispatch<React.SetStateAction<boolean>>;
  oneTextValue3: string;
  setOneTextValue3: React.Dispatch<React.SetStateAction<string>>;
  multipleTextValue3: boolean;
  setMultipleTextValue3: React.Dispatch<React.SetStateAction<boolean>>;

  lineHeight3: number;
  setLineHeight3: React.Dispatch<React.SetStateAction<number>>;
  letterSpacing3: number;
  setLetterSpacing3: React.Dispatch<React.SetStateAction<number>>;


  aimage3: ImagePosition;
  setAIImage3: React.Dispatch<React.SetStateAction<ImagePosition>>;

  // Layout selection
  selectedLayout3: "blank" | "oneText" | "multipleText";
  setSelectedLayout3: React.Dispatch<
    React.SetStateAction<"blank" | "oneText" | "multipleText">
  >;

  // Global defaults (for new text elements)
  fontSize3: number;
  setFontSize3: React.Dispatch<React.SetStateAction<number>>;
  fontWeight3: number;
  setFontWeight3: React.Dispatch<React.SetStateAction<number>>;
  textAlign3: "start" | "center" | "end";
  verticalAlign3?: "top" | "center" | "bottom";
  setVerticalAlign3: React.Dispatch<
    React.SetStateAction<"top" | "center" | "bottom">
  >;
  setTextAlign3: React.Dispatch<
    React.SetStateAction<"start" | "center" | "end">
  >;
  fontColor3: string;
  setFontColor3: React.Dispatch<React.SetStateAction<string>>;
  fontFamily3: string;
  setFontFamily3: React.Dispatch<React.SetStateAction<string>>;
  rotation3: number;
  setRotation3: React.Dispatch<React.SetStateAction<number>>;

  // Individual text elements management
  textElements3: TextElement[];
  setTextElements3: React.Dispatch<React.SetStateAction<TextElement[]>>;
  selectedTextId3: string | null;
  setSelectedTextId3: React.Dispatch<React.SetStateAction<string | null>>;

  // Legacy support
  texts3: string[] | any[];
  setTexts3: React.Dispatch<React.SetStateAction<any[]>>;
  editingIndex3: number | null;
  setEditingIndex3: React.Dispatch<React.SetStateAction<number | null>>;

  images3: { id: number; src: string }[];
  setImages3: React.Dispatch<
    React.SetStateAction<{ id: number; src: string }[]>
  >;

  imageFilter3?: boolean,
  setImageFilter3?: any,


  video3: File[] | null;
  setVideo3: React.Dispatch<React.SetStateAction<File[] | null>>;
  audio3: File[] | null;
  setAudio3: React.Dispatch<React.SetStateAction<File[] | null>>;
  tips3: boolean;
  setTips3: React.Dispatch<React.SetStateAction<boolean>>;
  upload3: boolean;
  setUpload3: React.Dispatch<React.SetStateAction<boolean>>;
  duration3: number | null;
  setDuration3: React.Dispatch<React.SetStateAction<number | null>>;
  isAIimage3?: boolean;
  setIsAIimage3?: React.Dispatch<React.SetStateAction<boolean | any>>;
  selectedAIimageUrl3: string | null;
  setSelectedAIimageUrl3: React.Dispatch<React.SetStateAction<string | null>>;

  selectedPreviewImage3?: string | null;
  setSelectedPreviewImage3?: React.Dispatch<
    React.SetStateAction<string | null>
  >;

  draggableImages3: DraggableImage[];
  setDraggableImages3: React.Dispatch<React.SetStateAction<DraggableImage[]>>;

  qrPosition3: DraggableQR;
  setQrPosition3: React.Dispatch<React.SetStateAction<DraggableQR>>;
  // New properties for position and size
  textPositions3: Position[];
  setTextPositions3: React.Dispatch<React.SetStateAction<Position[]>>;
  textSizes3: Size[];
  setTextSizes3: React.Dispatch<React.SetStateAction<Size[]>>;
  imagePositions3: Record<number, Position>; // keyed by image id
  setImagePositions3: React.Dispatch<
    React.SetStateAction<Record<number, Position>>
  >;
  setSelectedAudioUrl3: React.Dispatch<React.SetStateAction<string | null>>;
  selectedAudioUrl3: string | null;
  qrAudioPosition3: DraggableQR;
  setQrAudioPosition3: React.Dispatch<React.SetStateAction<DraggableQR>>;

  imageSizes3: Record<number, Size>; // keyed by image id
  setImageSizes3: React.Dispatch<React.SetStateAction<Record<number, Size>>>;
  poster3: string | null;
  setPoster3: React.Dispatch<React.SetStateAction<string | null>>;
  selectedVideoUrl3: string | null;
  setSelectedVideoUrl3: React.Dispatch<React.SetStateAction<string | null>>;

  activeFilterImageId3?: string | null | any,
  setActiveFilterImageId3?: any

  // Slide state management
  isSlideActive3: boolean;
  setIsSlideActive3: React.Dispatch<React.SetStateAction<boolean>>;
  slide3DataStore3?: any[];

  isEditable3: boolean; // NEW: To control edit/view mode
  setIsEditable3: React.Dispatch<React.SetStateAction<boolean>>;

  // For Sticker
  selectedStickers3: StickerItem[];
  setSelectedStickers3: any;
  addSticker3: (
    sticker: Omit<StickerItem, "x" | "y" | "width" | "height" | "zIndex">
  ) => void;
  updateSticker3: (index: number, data: Partial<StickerItem>) => void;
  removeSticker3: (index: number) => void;
  resetSlide3State: () => void | any;

  layout3?: any,
  setLayout3?: any,

  // ------------------------ Adding Admin Editor -------------------------------------------------------------------------------------------
  bgEdit3: boolean, setBgEdit3: any,
  bgLocked3: boolean, setBgLocked3: any,
  bgRect3: any, setBgRect3: any,
  bgColor3: string | null;
  setBgColor3: React.Dispatch<React.SetStateAction<string | null>>;
  bgImage3: string | null;
  setBgImage3: React.Dispatch<React.SetStateAction<string | null>>;
  selectedShapePath3: string | null;
  setSelectedShapePath3: React.Dispatch<React.SetStateAction<string | null>>;
  selectedShapeImageId3: string | number | null;
  setSelectedShapeImageId3: React.Dispatch<React.SetStateAction<string | number | null>>;
  canEditBg3?: boolean;
  setCanEditBg3?: any;
  canEditImages3?: boolean;
  setCanEditImages3?: any;
  canEditStickers3?: boolean;
  setCanEditStickers3?: any,
  setEditAll3: any,

}

const Slide3Context = createContext<Slide3ContextType | undefined>(undefined);

export const Slide3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeIndex3, setActiveIndex3] = useState(0);
  const [title3, setTitle3] = useState("Happy Birthday");
  const [activePopup3, setActivePopup3] = useState<string | null>(null);
  const [selectedImg3, setSelectedImage3] = useState<number[]>([]);
  const [showOneTextRightSideBox3, setShowOneTextRightSideBox3] =
    useState(false);
  const [oneTextValue3, setOneTextValue3] = useState("");
  const [multipleTextValue3, setMultipleTextValue3] = useState(false);

  // Layout selection
  const [selectedLayout3, setSelectedLayout3] = useState<
    "blank" | "oneText" | "multipleText"
  >("blank");
  const [selectedVideoUrl3, setSelectedVideoUrl3] = useState<string | null>(
    null
  );
  const [selectedAudioUrl3, setSelectedAudioUrl3] = useState<string | null>(
    null
  );
  const [selectedPreviewImage3, setSelectedPreviewImage3] = useState<
    string | null
  >(null);

  const [selectedAIimageUrl3, setSelectedAIimageUrl3] = useState<string | null>(
    null
  );
  const [isAIimage3, setIsAIimage3] = useState<boolean>(false);

  // Sticker Selection
  const [selectedStickers3, setSelectedStickers3] = useState<StickerItem[]>([]);

  // Image Resizing.
  const [draggableImages3, setDraggableImages3] = useState<DraggableImage[]>(
    []
  );
  const [imageFilter3, setImageFilter3] = useState(false)
  const [activeFilterImageId3, setActiveFilterImageId3] = useState<string | null>(null);

  const [bgEdit3, setBgEdit3] = useState(false);
  const [bgLocked3, setBgLocked3] = useState<boolean>(false);
  const [bgRect3, setBgRect3] = useState<any>({ x: 40, y: 40, width: 300, height: 400 });
  const [bgColor3, setBgColor3] = useState<string | null>(null);
  const [bgImage3, setBgImage3] = useState<string | null>(null);
  const [selectedShapePath3, setSelectedShapePath3] = useState<string | null>(null);
  const [selectedShapeImageId3, setSelectedShapeImageId3] = useState<string | number | null>(null);
  const [canEditBg3, setCanEditBg3] = useState<boolean>(true);
  const [canEditImages3, setCanEditImages3] = useState<boolean>(true);
  const [canEditStickers3, setCanEditStickers3] = useState<boolean>(true);


  const setEditAll3 = (on: boolean) => {
    setCanEditBg3(on);
    setCanEditImages3(on);
    setCanEditStickers3(on);
  };



  // QR Resizing and Moving
  const [qrPosition3, setQrPosition3] = useState<DraggableQR>({
    id: "qr1",
    url: "",
    x: 0,
    y: 0,
    width: 70,
    height: 105,
    rotation: 0,
    zIndex: 1000,
  });
  const [qrAudioPosition3, setQrAudioPosition3] = useState<DraggableQR>({
    id: "qr2",
    url: "",
    x: 0,
    y: 0,
    width: 70,
    height: 105,
    rotation: 0,
    zIndex: 1000,
  });

  const [aimage3, setAIImage3] = useState<ImagePosition>({
    x: 30,
    y: 30,
    width: 300,
    height: 400,
    // zindex: 1000,
  });

  // Global defaults (for new text elements)
  const [fontSize3, setFontSize3] = useState(20);
  const [fontWeight3, setFontWeight3] = useState(400);
  const [textAlign3, setTextAlign3] = useState<"start" | "center" | "end">(
    "start"
  );
  const [verticalAlign3, setVerticalAlign3] = useState<
    "top" | "center" | "bottom"
  >("top");
  const [fontFamily3, setFontFamily3] = useState("Roboto");
  const [fontColor3, setFontColor3] = useState(fontColors[0]);
  const [rotation3, setRotation3] = useState(0);

  // Individual text elements management
  const [textElements3, setTextElements3] = useState<TextElement[]>([]);
  const [selectedTextId3, setSelectedTextId3] = useState<string | null>(null);

  // Legacy support
  const [texts3, setTexts3] = useState([
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

  const [lineHeight3, setLineHeight3] = useState(1.5);
  const [letterSpacing3, setLetterSpacing3] = useState(0);

  const [editingIndex3, setEditingIndex3] = useState<number | null>(null);

  const [images3, setImages3] = useState<{ id: number; src: string }[]>([]);
  const [video3, setVideo3] = useState<File[] | null>(null);
  const [audio3, setAudio3] = useState<File[] | null>(null);
  const [tips3, setTips3] = useState(false);
  const [upload3, setUpload3] = useState(false);
  const [duration3, setDuration3] = useState<number | null>(null);
  const [poster3, setPoster3] = useState<string | null>(null);

  // --- 💾 Persist heavy image data to IndexedDB ---
  useEffect(() => {
    const [key] = getSlideStateKeys(3, getDraftCardId());
    void saveSlideStateToIdb(key, { images3, draggableImages3 }).catch(() => {});
  }, [images3, draggableImages3]);

  // New states for position and size
  const [textPositions3, setTextPositions3] = useState<Position[]>(
    texts3.map(() => ({ x: 0, y: 0 }))
  );
  const [textSizes3, setTextSizes3] = useState<Size[]>(
    texts3.map(() => ({ width: 100, height: 30 }))
  );

  // For images, use an object keyed by image id for quick lookup
  const [imagePositions3, setImagePositions3] = useState<
    Record<number, Position>
  >({});
  const [imageSizes3, setImageSizes3] = useState<Record<number, Size>>({});

  // Slide state management
  const [isSlideActive3, setIsSlideActive3] = useState(false);
  const [isEditable3, setIsEditable3] = useState(true);

  const [slide3DataStore3, setSlide3DataStore3] = useState<any[]>([]);

  const addSticker3 = (
    sticker: Omit<
      StickerItem,
      "x" | "y" | "width" | "height" | "zIndex" | "rotation"
    >
  ) => {
    setSelectedStickers3((prev) => {
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

  const updateSticker3 = (index: number, data: Partial<StickerItem>) => {
    setSelectedStickers3((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...data } : item))
    );
  };

  const removeSticker3 = (index: number) => {
    setSelectedStickers3((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated;
    });
  };

  // ✅ Reset all context state to initial values
  const resetSlide3State = () => {
    // 🧹 Clear persisted local storage
    clearSlide3LocalData();

    // Base states
    setActiveIndex3(0);
    setTitle3("Happy Birthday");
    setActivePopup3(null);
    setSelectedImage3([]);
    setShowOneTextRightSideBox3(false);
    setOneTextValue3("");
    setMultipleTextValue3(false);

    // Layout & selections
    setSelectedLayout3("blank");
    setSelectedVideoUrl3(null);
    setSelectedAudioUrl3(null);
    setSelectedAIimageUrl3(null);
    setIsAIimage3(false);
    setSelectedPreviewImage3(null);

    // Images & draggable
    setImages3([]);
    setDraggableImages3([]);

    // Stickers
    setSelectedStickers3([]);

    // QR positions
    setQrPosition3({
      id: "qr1",
      url: "",
      x: 20,
      y: 10,
      width: 59,
      height: 105,
      rotation: 0,
      zIndex: 1000,
    });

    setQrAudioPosition3({
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
    setAIImage3({
      x: 30,
      y: 30,
      width: 300,
      height: 400,
    });

    // Fonts & text defaults
    setFontSize3(20);
    setFontWeight3(400);
    setTextAlign3("start");
    setVerticalAlign3("top");
    setFontFamily3("Roboto");
    setFontColor3("#000000");
    setRotation3(0);
    setLineHeight3(1.5)
    setLetterSpacing3(0)

    // Text elements
    setTextElements3([]);
    setSelectedTextId3(null);
    setTexts3([
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
    setEditingIndex3(null);
    setTips3(false);
    setUpload3(false);
    setDuration3(null);
    setPoster3(null);

    // Position & size data
    setTextPositions3([]);
    setTextSizes3([]);
    setImagePositions3({});
    setImageSizes3({});

    // Video / audio files
    setVideo3(null);
    setAudio3(null);

    // Slide states
    setIsSlideActive3(false);
    setIsEditable3(true);

    // Typography adjustments
    setLineHeight3(1.5);
    setLetterSpacing3(0);

    // Clear data store snapshot
    setSlide3DataStore3([]);
  };

  const [layout3, setLayout3] = useState<any>(null);




  useEffect(() => {
    try {
      const saved = safeGetStorage("slide3_state");
      if (saved) {
        const parsed = JSON.parse(saved);
        const currentDraftId = getDraftCardId();
        const savedDraftId = parsed?.draftId;
        if (currentDraftId) {
          if (!savedDraftId || savedDraftId !== currentDraftId) return;
        }

        if (parsed.textElements3) setTextElements3(parsed.textElements3);
        if (parsed.draggableImages3) setDraggableImages3(parsed.draggableImages3);
        if (parsed.images3) setImages3(parsed.images3);
        if (parsed.selectedImg3) setSelectedImage3(parsed.selectedImg3);
        if (parsed.selectedVideoUrl3) setSelectedVideoUrl3(parsed.selectedVideoUrl3);
        if (parsed.selectedAudioUrl3) setSelectedAudioUrl3(parsed.selectedAudioUrl3);
        if (parsed.selectedLayout3) setSelectedLayout3(parsed.selectedLayout3);
        if (parsed.oneTextValue3) setOneTextValue3(parsed.oneTextValue3);
        if (parsed.showOneTextRightSideBox3) setShowOneTextRightSideBox3(parsed.showOneTextRightSideBox3);
        if (parsed.multipleTextValue3)
          setMultipleTextValue3(parsed.multipleTextValue3);
        if (parsed.selectedStickers3)
          setSelectedStickers3(parsed.selectedStickers3);
        if (parsed.qrPosition3) setQrPosition3(parsed.qrPosition3);
        if (parsed.qrAudioPosition3) setQrAudioPosition3(parsed.qrAudioPosition3);
        if (parsed.aimage2) setAIImage3(parsed.aimage2);
        if (typeof parsed.isAIimage3 === "boolean") setIsAIimage3(parsed.isAIimage3);
        if (parsed.selectedAIimageUrl3)
          setSelectedAIimageUrl3(parsed.selectedAIimageUrl3);

        if (parsed.bgColor3 !== undefined) setBgColor3(parsed.bgColor3);
        if (parsed.bgImage3 !== undefined) setBgImage3(parsed.bgImage3);
        if (Object.prototype.hasOwnProperty.call(parsed, "selectedShapePath3")) setSelectedShapePath3(parsed.selectedShapePath3);

        if (parsed.fontSize3) setFontSize3(parsed.fontSize3);
        if (parsed.fontWeight3) setFontWeight3(parsed.fontWeight3);
        if (parsed.fontFamily3) setFontFamily3(parsed.fontFamily3);
        if (parsed.fontColor3) setFontColor3(parsed.fontColor3);
        if (parsed.textAlign3) setTextAlign3(parsed.textAlign3);
        if (parsed.verticalAlign3) setVerticalAlign3(parsed.verticalAlign3);
        if (parsed.letterSpacing3 !== undefined) setLetterSpacing3(parsed.letterSpacing3);
        if (parsed.lineHeight3 !== undefined) setLineHeight3(parsed.lineHeight3);
        if (parsed.rotation3 !== undefined) setRotation3(parsed.rotation3);

        const hasHeavyLocal =
          (parsed.images3 && parsed.images3.length) ||
          (parsed.draggableImages3 && parsed.draggableImages3.length);
        if (hasHeavyLocal) {
          const [key] = getSlideStateKeys(3, parsed?.draftId ?? getDraftCardId());
          void saveSlideStateToIdb(key, {
            images3: parsed.images3 ?? [],
            draggableImages3: parsed.draggableImages3 ?? [],
          }).catch(() => {});
          try {
            localStorage.removeItem("slide3_state");
            sessionStorage.removeItem("slide3_state");
          } catch {}
        }

      }
    } catch (error) {
      console.error("❌ Error restoring slide3_state:", error);
    }
  }, []);

  // --- 🧠 Restore heavy image data from IndexedDB (if localStorage skipped it) ---
  useEffect(() => {
    if (images3.length || draggableImages3.length) return;
    let cancelled = false;
    (async () => {
      try {
        const keys = getSlideStateKeys(3, getDraftCardId());
        for (const key of keys) {
          const heavy = await loadSlideStateFromIdb<{
            images3?: { id: number; src: string }[];
            draggableImages3?: DraggableImage[];
          }>(key);
          if (!heavy) continue;
          if (cancelled) return;
          if (heavy.images3) setImages3(heavy.images3);
          if (heavy.draggableImages3) setDraggableImages3(heavy.draggableImages3);
          return;
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [images3.length, draggableImages3.length]);

  // --- 💾 Auto-save changes ---
  useEffect(() => {
    const stateToSave = {
      draftId: getDraftCardId() ?? null,
      textElements3,
      selectedImg3,
      selectedVideoUrl3,
      selectedAudioUrl3,
      selectedLayout3,
      oneTextValue3,
      multipleTextValue3,
      selectedStickers3,
      qrPosition3,
      qrAudioPosition3,
      aimage3,
      isAIimage3,
      selectedAIimageUrl3,
      showOneTextRightSideBox3,

      fontSize3,
      fontWeight3,
      fontFamily3,
      fontColor3,
      textAlign3,
      verticalAlign3,
      letterSpacing3,
      lineHeight3,
      rotation3,

      bgColor3,
      bgImage3,
      selectedShapePath3,
      layout3
    };

    const payload = JSON.stringify(stateToSave);
    const ok = safeSetLocalStorage("slide3_state", payload, {
      clearOnFail: ["slides_backup", "slide3_state"],
      fallbackToSession: true,
    });
    if (!ok) {
      console.error("❌ Error saving slide3_state: storage full");
    }
  }, [
    textElements3,
    selectedImg3,
    selectedVideoUrl3,
    selectedAudioUrl3,
    selectedLayout3,
    oneTextValue3,
    multipleTextValue3,
    selectedStickers3,
    qrPosition3,
    qrAudioPosition3,
    aimage3,
    isAIimage3,
    selectedAIimageUrl3,
    showOneTextRightSideBox3,
    fontSize3,
    fontWeight3,
    fontFamily3,
    fontColor3,
    textAlign3,
    verticalAlign3,
    letterSpacing3,
    lineHeight3,
    rotation3,

    bgColor3,
    bgImage3,
    selectedShapePath3,
    layout3
  ]);

  // --- 🧹 Clear localStorage ---
  const clearSlide3LocalData = () => {
    try {
      localStorage.removeItem("slide3_state");
      sessionStorage.removeItem("slide3_state");
      const keys = getSlideStateKeys(3, getDraftCardId());
      keys.forEach((key) => {
        void clearSlideStateFromIdb(key).catch(() => {});
      });
    } catch (error) {
      console.error("Error clearing slide3_state:", error);
    }
  };


  return (
    <Slide3Context.Provider
      value={{
        activeIndex3,
        setActiveIndex3,
        title3,
        setTitle3,
        activePopup3,
        setActivePopup3,
        selectedImg3,
        setSelectedImage3,
        showOneTextRightSideBox3,
        setShowOneTextRightSideBox3,
        oneTextValue3,
        setOneTextValue3,
        multipleTextValue3,
        setMultipleTextValue3,

        // Layout selection
        selectedLayout3,
        setSelectedLayout3,

        // Global defaults
        fontSize3,
        setFontSize3,
        fontWeight3,
        setFontWeight3,
        textAlign3,
        setTextAlign3,
        fontColor3,
        setFontColor3,
        fontFamily3,
        setFontFamily3,
        rotation3,
        setRotation3,

        // Individual text elements management
        textElements3,
        setTextElements3,
        selectedTextId3,
        setSelectedTextId3,

        // Legacy support
        texts3,
        setTexts3,
        editingIndex3,
        setEditingIndex3,

        images3,
        setImages3,
        addSticker3,
        selectedStickers3,
        setSelectedStickers3,
        updateSticker3,
        removeSticker3,

        selectedPreviewImage3,
        setSelectedPreviewImage3,
        draggableImages3,
        setDraggableImages3,

        video3,
        setVideo3,
        audio3,
        setAudio3,

        aimage3,
        setAIImage3,
        activeFilterImageId3,
        setActiveFilterImageId3,

        tips3,
        setTips3,
        upload3,
        setUpload3,
        duration3,
        setDuration3,
        selectedVideoUrl3,
        setSelectedVideoUrl3,
        selectedAudioUrl3,
        setSelectedAudioUrl3,
        qrPosition3,
        setQrPosition3,
        qrAudioPosition3,
        setQrAudioPosition3,
        isAIimage3,
        setIsAIimage3,
        setSelectedAIimageUrl3,
        selectedAIimageUrl3,

        // New values
        textPositions3,
        setTextPositions3,
        textSizes3,
        setTextSizes3,


        lineHeight3,
        setLineHeight3,
        letterSpacing3,
        setLetterSpacing3,

        imagePositions3,
        setImagePositions3,
        imageSizes3,
        setImageSizes3,
        poster3,
        setPoster3,
        setImageFilter3,
        imageFilter3,

        // Slide state management
        isSlideActive3,
        setIsSlideActive3,
        isEditable3,
        setIsEditable3,
        verticalAlign3,
        setVerticalAlign3,

        slide3DataStore3,
        // reset All State
        resetSlide3State,

        layout3,
        setLayout3,

        bgColor3, setBgColor3,
        bgImage3, setBgImage3,
        bgEdit3, setBgEdit3,
        bgLocked3, setBgLocked3,
        bgRect3, setBgRect3,
        selectedShapePath3,
        setSelectedShapePath3,
        selectedShapeImageId3,
        setSelectedShapeImageId3,
        canEditBg3, setCanEditBg3,
        canEditImages3, setCanEditImages3,
        canEditStickers3, setCanEditStickers3,
        setEditAll3,

      }}
    >
      {children}
    </Slide3Context.Provider>
  );
};

export const useSlide3 = () => {
  const context = useContext(Slide3Context);
  if (!context) {
    throw new Error("useWishCard must be used within a WishCardProvider");
  }
  return context;
};
