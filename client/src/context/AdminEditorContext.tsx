import React, { createContext, useContext, useState } from "react";

type FormDataType = {
  cardName?: string;
  cardCategory?: string;
  sku?: string;
  actualPrice?: string;
  salePrice?: string;
  description?: string;
  cardImage?: string;
  layout_type?: "isMultipleLayout" | "isShapeLayout" | null;
};

export type ElementType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src?: string | null;
};

export type TextElementType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
};

export type StickerType = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sticker: string;
  zIndex: number;
};

type AdminCardEditorContextType = {
  formData: FormDataType | null;
  setFormData: React.Dispatch<React.SetStateAction<FormDataType | null>>;
  selectedShapeImage: string | null;
  setSelectedShapeImage: React.Dispatch<React.SetStateAction<string | null>>;
  uploadedShapeImage: string | null;
  setUploadedShapeImage: React.Dispatch<React.SetStateAction<string | null>>;

  // legacy (first slide / left) – kept for compatibility
  elements: ElementType[];
  setElements: React.Dispatch<React.SetStateAction<ElementType[]>>;
  textElements: TextElementType[];
  setTextElements: React.Dispatch<React.SetStateAction<TextElementType[]>>;
  stickerElements: StickerType[];
  setStickerElements: React.Dispatch<React.SetStateAction<StickerType[]>>;

  // legacy right (last slide)
  lastElements: ElementType[];
  setLastElements: React.Dispatch<React.SetStateAction<ElementType[]>>;
  lastTextElements: TextElementType[];
  setLastTextElements: React.Dispatch<React.SetStateAction<TextElementType[]>>;
  lastStickerElements: StickerType[];
  setLastStickerElements: React.Dispatch<React.SetStateAction<StickerType[]>>;

  lastSlideImage: string | null;
  setLastSlideImage: React.Dispatch<React.SetStateAction<string | null>>;
  lastSlideMessage: string;
  setLastSlideMessage: React.Dispatch<React.SetStateAction<string>>;

  // NEW: MainSlide (mid) left & right
  midLeftElements: ElementType[];
  setMidLeftElements: React.Dispatch<React.SetStateAction<ElementType[]>>;
  midLeftTextElements: TextElementType[];
  setMidLeftTextElements: React.Dispatch<React.SetStateAction<TextElementType[]>>;
  midLeftStickerElements: StickerType[];
  setMidLeftStickerElements: React.Dispatch<React.SetStateAction<StickerType[]>>;

  midRightElements: ElementType[];
  setMidRightElements: React.Dispatch<React.SetStateAction<ElementType[]>>;
  midRightTextElements: TextElementType[];
  setMidRightTextElements: React.Dispatch<React.SetStateAction<TextElementType[]>>;
  midRightStickerElements: StickerType[];
  setMidRightStickerElements: React.Dispatch<React.SetStateAction<StickerType[]>>;

  // which mid canvas is active for the shared toolbar
  activeMid: "left" | "right";
  setActiveMid: React.Dispatch<React.SetStateAction<"left" | "right">>;

  resetEditor: () => void;
};

const AdminCardEditorContext = createContext<AdminCardEditorContextType | undefined>(undefined);

export const AdminCardEditorProvider = ({ children }: { children: React.ReactNode }) => {
  const [formData, setFormData] = useState<FormDataType | null>(null);
  const [selectedShapeImage, setSelectedShapeImage] = useState<string | null>(null);
  const [uploadedShapeImage, setUploadedShapeImage] = useState<string | null>(null);

  // legacy slices
  const [elements, setElements] = useState<ElementType[]>([]);
  const [textElements, setTextElements] = useState<TextElementType[]>([]);
  const [stickerElements, setStickerElements] = useState<StickerType[]>([]);
  const [lastElements, setLastElements] = useState<ElementType[]>([]);
  const [lastTextElements, setLastTextElements] = useState<TextElementType[]>([]);
  const [lastStickerElements, setLastStickerElements] = useState<StickerType[]>([]);
  const [lastSlideImage, setLastSlideImage] = useState<string | null>(null);
  const [lastSlideMessage, setLastSlideMessage] = useState<string>("");

  // NEW: mid (MainSlide) slices
  const [midLeftElements, setMidLeftElements] = useState<ElementType[]>([]);
  const [midLeftTextElements, setMidLeftTextElements] = useState<TextElementType[]>([]);
  const [midLeftStickerElements, setMidLeftStickerElements] = useState<StickerType[]>([]);

  const [midRightElements, setMidRightElements] = useState<ElementType[]>([]);
  const [midRightTextElements, setMidRightTextElements] = useState<TextElementType[]>([]);
  const [midRightStickerElements, setMidRightStickerElements] = useState<StickerType[]>([]);

  const [activeMid, setActiveMid] = useState<"left" | "right">("left");

  const resetEditor = () => {
    setElements([]);
    setTextElements([]);
    setStickerElements([]);
    setUploadedShapeImage(null);
    setSelectedShapeImage(null);
    setFormData(null);
    setLastSlideImage(null);
    setLastSlideMessage("");
    setLastElements([]);
    setLastTextElements([]);
    setLastStickerElements([]);

    // reset mids
    setMidLeftElements([]);
    setMidLeftTextElements([]);
    setMidLeftStickerElements([]);
    setMidRightElements([]);
    setMidRightTextElements([]);
    setMidRightStickerElements([]);
    setActiveMid("left");
  };

  return (
    <AdminCardEditorContext.Provider
      value={{
        formData,
        setFormData,
        selectedShapeImage,
        setSelectedShapeImage,
        uploadedShapeImage,
        setUploadedShapeImage,

        elements,
        setElements,
        textElements,
        setTextElements,
        stickerElements,
        setStickerElements,

        lastElements,
        setLastElements,
        lastTextElements,
        setLastTextElements,
        lastStickerElements,
        setLastStickerElements,
        lastSlideImage,
        setLastSlideImage,
        lastSlideMessage,
        setLastSlideMessage,

        midLeftElements,
        setMidLeftElements,
        midLeftTextElements,
        setMidLeftTextElements,
        midLeftStickerElements,
        setMidLeftStickerElements,

        midRightElements,
        setMidRightElements,
        midRightTextElements,
        setMidRightTextElements,
        midRightStickerElements,
        setMidRightStickerElements,

        activeMid,
        setActiveMid,

        resetEditor,
      }}
    >
      {children}
    </AdminCardEditorContext.Provider>
  );
};

export const useCardEditor = () => {
  const context = useContext(AdminCardEditorContext);
  if (!context) throw new Error("useCardEditor must be used inside AdminCardEditorProvider");
  return context;
};