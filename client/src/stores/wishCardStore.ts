import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface WishCardState {
  // Basic state
  activeIndex: number;
  title: string;
  activePopup: string | null;
  selectedImg: number | null;
  showOneTextRightSideBox: boolean;
  oneTextValue: string;
  multipleTextValue: boolean;
  
  // Font and text properties
  fontSize: number;
  fontWeight: number;
  textAlign: "start" | "center" | "end";
  fontColor: string;
  fontFamily: string;
  rotation: number;
  
  // Text elements
  texts: string[];
  editingIndex: number | null;
  
  // Media
  images: { id: number; src: string }[];
  video: File | null;
  poster: string | null;
  
  // Positions and sizes
  textPositions: Position[];
  textSizes: Size[];
  imagePositions: Record<number, Position>;
  imageSizes: Record<number, Size>;
  
  // UI state
  tips: boolean;
  upload: boolean;
  duration: number | null;
  
  // Actions
  setActiveIndex: (index: number) => void;
  setTitle: (title: string) => void;
  setActivePopup: (popup: string | null) => void;
  setSelectedImage: (image: number | null) => void;
  setShowOneTextRightSideBox: (show: boolean) => void;
  setOneTextValue: (value: string) => void;
  setMultipleTextValue: (value: boolean) => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: number) => void;
  setTextAlign: (align: "start" | "center" | "end") => void;
  setFontColor: (color: string) => void;
  setFontFamily: (family: string) => void;
  setRotation: (rotation: number) => void;
  setTexts: (texts: string[]) => void;
  setEditingIndex: (index: number | null) => void;
  setImages: (images: { id: number; src: string }[]) => void;
  setVideo: (video: File | null) => void;
  setPoster: (poster: string | null) => void;
  setTextPositions: (positions: Position[]) => void;
  setTextSizes: (sizes: Size[]) => void;
  setImagePositions: (positions: Record<number, Position>) => void;
  setImageSizes: (sizes: Record<number, Size>) => void;
  setTips: (tips: boolean) => void;
  setUpload: (upload: boolean) => void;
  setDuration: (duration: number | null) => void;
}

export const useWishCardStore = create<WishCardState>()(
  persist(
    (set) => ({
      // Initial state
      activeIndex: 0,
      title: "Happy Birthday",
      activePopup: null,
      selectedImg: null,
      showOneTextRightSideBox: false,
      oneTextValue: "",
      multipleTextValue: false,
      fontSize: 20,
      fontWeight: 400,
      textAlign: "center",
      fontColor: fontColors[0],
      fontFamily: "Roboto",
      rotation: 0,
      texts: ["", "", ""],
      editingIndex: null,
      images: [],
      video: null,
      poster: null,
      textPositions: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
      textSizes: [{ width: 100, height: 30 }, { width: 100, height: 30 }, { width: 100, height: 30 }],
      imagePositions: {},
      imageSizes: {},
      tips: false,
      upload: false,
      duration: null,

      // Setters
      setActiveIndex: (index) => set({ activeIndex: index }),
      setTitle: (title) => set({ title }),
      setActivePopup: (popup) => set({ activePopup: popup }),
      setSelectedImage: (image) => set({ selectedImg: image }),
      setShowOneTextRightSideBox: (show) => set({ showOneTextRightSideBox: show }),
      setOneTextValue: (value) => set({ oneTextValue: value }),
      setMultipleTextValue: (value) => set({ multipleTextValue: value }),
      setFontSize: (size) => set({ fontSize: size }),
      setFontWeight: (weight) => set({ fontWeight: weight }),
      setTextAlign: (align) => set({ textAlign: align }),
      setFontColor: (color) => set({ fontColor: color }),
      setFontFamily: (family) => set({ fontFamily: family }),
      setRotation: (rotation) => set({ rotation }),
      setTexts: (texts) => set({ texts }),
      setEditingIndex: (index) => set({ editingIndex: index }),
      setImages: (images) => set({ images }),
      setVideo: (video) => set({ video }),
      setPoster: (poster) => set({ poster }),
      setTextPositions: (positions) => set({ textPositions: positions }),
      setTextSizes: (sizes) => set({ textSizes: sizes }),
      setImagePositions: (positions) => set({ imagePositions: positions }),
      setImageSizes: (sizes) => set({ imageSizes: sizes }),
      setTips: (tips) => set({ tips }),
      setUpload: (upload) => set({ upload }),
      setDuration: (duration) => set({ duration }),
    }),
    {
      name: 'wishcard-storage',
      partialize: (state) => ({
        activeIndex: state.activeIndex,
        title: state.title,
        selectedImg: state.selectedImg,
        oneTextValue: state.oneTextValue,
        multipleTextValue: state.multipleTextValue,
        fontSize: state.fontSize,
        fontWeight: state.fontWeight,
        textAlign: state.textAlign,
        fontColor: state.fontColor,
        fontFamily: state.fontFamily,
        rotation: state.rotation,
        texts: state.texts,
        editingIndex: state.editingIndex,
        images: state.images,
        video: state.video,
        poster: state.poster,
        textPositions: state.textPositions,
        textSizes: state.textSizes,
        imagePositions: state.imagePositions,
        imageSizes: state.imageSizes,
        tips: state.tips,
        upload: state.upload,
        duration: state.duration,
      }),
    }
  )
);
