import React, { createContext, useContext, useState } from "react";

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

interface WishCardContextType {
  activeIndex: number;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  activePopup: string | null;
  setActivePopup: React.Dispatch<React.SetStateAction<string | null>>;
  selectedImg: number | null;
  setSelectedImage: React.Dispatch<React.SetStateAction<number | null>>;
  showOneTextRightSideBox: boolean;
  setShowOneTextRightSideBox: React.Dispatch<React.SetStateAction<boolean>>;
  oneTextValue: string;
  setOneTextValue: React.Dispatch<React.SetStateAction<string>>;
  multipleTextValue: boolean;
  setMultipleTextValue: React.Dispatch<React.SetStateAction<boolean>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  fontWeight: number;
  setFontWeight: React.Dispatch<React.SetStateAction<number>>;
  textAlign: "start" | "center" | "end";
  setTextAlign: React.Dispatch<
    React.SetStateAction<"start" | "center" | "end">
  >;
  fontColor: string;
  setFontColor: React.Dispatch<React.SetStateAction<string>>;
  texts: string[];
  setTexts: React.Dispatch<React.SetStateAction<string[]>>;
  editingIndex: number | null;
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  rotation: number;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  images: { id: number; src: string }[];
  setImages: React.Dispatch<
    React.SetStateAction<{ id: number; src: string }[]>
  >;
  video: File | null;
  setVideo: React.Dispatch<React.SetStateAction<File | null>>;
  tips: boolean;
  setTips: React.Dispatch<React.SetStateAction<boolean>>;
  upload: boolean;
  setUpload: React.Dispatch<React.SetStateAction<boolean>>;
  duration: number | null;
  setDuration: React.Dispatch<React.SetStateAction<number | null>>;
  // Font Family
  fontFamily: string;
  setFontFamily: React.Dispatch<React.SetStateAction<string>>;
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
}

const WishCardContext = createContext<WishCardContextType | undefined>(
  undefined
);

export const WishCardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [title, setTitle] = useState("Happy Birthday");
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [selectedImg, setSelectedImage] = useState<number | null>(null);
  const [showOneTextRightSideBox, setShowOneTextRightSideBox] = useState(false);
  const [oneTextValue, setOneTextValue] = useState("");
  const [multipleTextValue, setMultipleTextValue] = useState(false);
  const [fontSize, setFontSize] = useState(20);
  const [fontWeight, setFontWeight] = useState(400);
  const [textAlign, setTextAlign] = useState<"start" | "center" | "end">(
    "center"
  );
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [fontColor, setFontColor] = useState(fontColors[0]);
  const [texts, setTexts] = useState(["", "", ""]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [images, setImages] = useState<{ id: number; src: string }[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [tips, setTips] = useState(false);
  const [upload, setUpload] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [poster, setPoster] = useState<string | null>(null);

  // New states for position and size
  // Initialize textPositions and textSizes with default values matching texts length
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

  return (
    <WishCardContext.Provider
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
        fontSize,
        setFontSize,
        fontWeight,
        setFontWeight,
        textAlign,
        setTextAlign,
        fontColor,
        setFontColor,
        // ❗ NEW: Add font family to the context value
        fontFamily,
        setFontFamily,
        texts,
        setTexts,
        editingIndex,
        setEditingIndex,
        rotation,
        setRotation,
        images,
        setImages,
        video,
        setVideo,
        tips,
        setTips,
        upload,
        setUpload,
        duration,
        setDuration,

        // New values
        textPositions,
        setTextPositions,
        textSizes,
        setTextSizes,
        imagePositions,
        setImagePositions,
        imageSizes,
        setImageSizes,
        poster,
        setPoster,
      }}
    >
      {children}
    </WishCardContext.Provider>
  );
};

export const useWishCard = () => {
  const context = useContext(WishCardContext);
  if (!context) {
    throw new Error("useWishCard must be used within a WishCardProvider");
  }
  return context;
};
