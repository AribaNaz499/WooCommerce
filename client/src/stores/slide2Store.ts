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
  verticalAlign?: "top" | "center" | "bottom";
}

interface DraggableImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
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

interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Slide2State {
  // Basic state
  activeIndex: number;
  title: string;
  activePopup: string | null;
  selectedImg: number[];
  showOneTextRightSideBox: boolean;
  oneTextValue: string;
  multipleTextValue: boolean;
  selectedLayout: "blank" | "oneText" | "multipleText";
  
  // Font and text properties
  fontSize: number;
  fontWeight: number;
  textAlign: "start" | "center" | "end";
  verticalAlign: "top" | "center" | "bottom";
  fontColor: string;
  fontFamily: string;
  rotation: number;
  
  // Text elements
  textElements: TextElement[];
  selectedTextId: string | null;
  texts: any[];
  editingIndex: number | null;
  
  // Media
  images: { id: number; src: string }[];
  video: File[] | null;
  audio: File[] | null;
  poster: string | null;
  selectedVideoUrl: string | null;
  selectedAudioUrl: string | null;
  
  // AI and preview
  isAIimage2: boolean;
  selectedAIimageUrl2: string | null;
  selectedPreviewImage: string | null;
  
  // Draggable elements
  draggableImages: DraggableImage[];
  qrPosition: DraggableQR;
  qrAudioPosition: DraggableAudioQR;
  aimage2: ImagePosition;
  
  // Positions and sizes
  textPositions: Position[];
  textSizes: Size[];
  imagePositions: Record<number, Position>;
  imageSizes: Record<number, Size>;
  
  // Stickers
  selectedStickers2: StickerItem[];
  
  // UI state
  tips: boolean;
  upload: boolean;
  duration: number | null;
  isSlideActive: boolean;
  isEditable: boolean;
  slide2DataStore: any[];
  
  // Actions
  setActiveIndex: (index: number) => void;
  setTitle: (title: string) => void;
  setActivePopup: (popup: string | null) => void;
  setSelectedImage: (images: number[]) => void;
  setShowOneTextRightSideBox: (show: boolean) => void;
  setOneTextValue: (value: string) => void;
  setMultipleTextValue: (value: boolean) => void;
  setSelectedLayout: (layout: "blank" | "oneText" | "multipleText") => void;
  setFontSize: (size: number) => void;
  setFontWeight: (weight: number) => void;
  setTextAlign: (align: "start" | "center" | "end") => void;
  setVerticalAlign: (align: "top" | "center" | "bottom") => void;
  setFontColor: (color: string) => void;
  setFontFamily: (family: string) => void;
  setRotation: (rotation: number) => void;
  setTextElements: (elements: TextElement[]) => void;
  setSelectedTextId: (id: string | null) => void;
  setTexts: (texts: any[]) => void;
  setEditingIndex: (index: number | null) => void;
  setImages: (images: { id: number; src: string }[]) => void;
  setVideo: (video: File[] | null) => void;
  setAudio: (audio: File[] | null) => void;
  setPoster: (poster: string | null) => void;
  setSelectedVideoUrl: (url: string | null) => void;
  setSelectedAudioUrl: (url: string | null) => void;
  setIsAIimage2: (isAI: boolean) => void;
  setSelectedAIimageUrl2: (url: string | null) => void;
  setSelectedPreviewImage: (image: string | null) => void;
  setDraggableImages: (images: DraggableImage[]) => void;
  setQrPosition: (position: DraggableQR) => void;
  setQrAudioPosition: (position: DraggableAudioQR) => void;
  setAIImage2: (position: ImagePosition) => void;
  setTextPositions: (positions: Position[]) => void;
  setTextSizes: (sizes: Size[]) => void;
  setImagePositions: (positions: Record<number, Position>) => void;
  setImageSizes: (sizes: Record<number, Size>) => void;
  setSelectedStickers2: (stickers: StickerItem[]) => void;
  setTips: (tips: boolean) => void;
  setUpload: (upload: boolean) => void;
  setDuration: (duration: number | null) => void;
  setIsSlideActive: (active: boolean) => void;
  setIsEditable: (editable: boolean) => void;
  setSlide2DataStore: (payload: any[]) => void;
  
  // Sticker actions
  addSticker2: (sticker: Omit<StickerItem, "x" | "y" | "width" | "height" | "zIndex" | "rotation">) => void;
  updateSticker2: (index: number, data: Partial<StickerItem>) => void;
  removeSticker2: (index: number) => void;
}

export const useSlide2Store = create<Slide2State>()(
  persist(
    (set, get) => ({
      // Initial state
      activeIndex: 0,
      title: "Happy Birthday",
      activePopup: null,
      selectedImg: [],
      showOneTextRightSideBox: false,
      oneTextValue: "",
      multipleTextValue: false,
      selectedLayout: "blank",
      fontSize: 20,
      fontWeight: 400,
      textAlign: "start",
      verticalAlign: "top",
      fontColor: fontColors[0],
      fontFamily: "Roboto",
      rotation: 0,
      textElements: [],
      selectedTextId: null,
      texts: [
        {
          value: "",
          fontSize: 20,
          fontWeight: 400,
          fontColor: "#000000",
          fontFamily: "Roboto",
          verticalAlign: "center",
        },
        {
          value: "",
          fontSize: 20,
          fontWeight: 400,
          fontColor: "#000000",
          fontFamily: "Roboto",
          verticalAlign: "center",
        },
        {
          value: "",
          fontSize: 20,
          fontWeight: 400,
          fontColor: "#000000",
          fontFamily: "Roboto",
          verticalAlign: "center",
        },
      ],
      editingIndex: null,
      images: [],
      video: null,
      audio: null,
      poster: null,
      selectedVideoUrl: null,
      selectedAudioUrl: null,
      isAIimage2: false,
      selectedAIimageUrl2: null,
      selectedPreviewImage: null,
      draggableImages: [],
      qrPosition: {
        id: "qr1",
        url: "",
        x: 20,
        y: 10,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1000,
      },
      qrAudioPosition: {
        id: "qr2",
        url: "",
        x: 20,
        y: 10,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1000,
      },
      aimage2: {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
      },
      textPositions: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
      textSizes: [{ width: 100, height: 30 }, { width: 100, height: 30 }, { width: 100, height: 30 }],
      imagePositions: {},
      imageSizes: {},
      selectedStickers2: [],
      tips: false,
      upload: false,
      duration: null,
      isSlideActive: false,
      isEditable: true,
      slide2DataStore: [],

      // Setters
      setActiveIndex: (index) => set({ activeIndex: index }),
      setTitle: (title) => set({ title }),
      setActivePopup: (popup) => set({ activePopup: popup }),
      setSelectedImage: (images) => set({ selectedImg: images }),
      setShowOneTextRightSideBox: (show) => set({ showOneTextRightSideBox: show }),
      setOneTextValue: (value) => set({ oneTextValue: value }),
      setMultipleTextValue: (value) => set({ multipleTextValue: value }),
      setSelectedLayout: (layout) => set({ selectedLayout: layout }),
      setFontSize: (size) => set({ fontSize: size }),
      setFontWeight: (weight) => set({ fontWeight: weight }),
      setTextAlign: (align) => set({ textAlign: align }),
      setVerticalAlign: (align) => set({ verticalAlign: align }),
      setFontColor: (color) => set({ fontColor: color }),
      setFontFamily: (family) => set({ fontFamily: family }),
      setRotation: (rotation) => set({ rotation }),
      setTextElements: (elements) => set({ textElements: elements }),
      setSelectedTextId: (id) => set({ selectedTextId: id }),
      setTexts: (texts) => set({ texts }),
      setEditingIndex: (index) => set({ editingIndex: index }),
      setImages: (images) => set({ images }),
      setVideo: (video) => set({ video }),
      setAudio: (audio) => set({ audio }),
      setPoster: (poster) => set({ poster }),
      setSelectedVideoUrl: (url) => set({ selectedVideoUrl: url }),
      setSelectedAudioUrl: (url) => set({ selectedAudioUrl: url }),
      setIsAIimage2: (isAI) => set({ isAIimage2: isAI }),
      setSelectedAIimageUrl2: (url) => set({ selectedAIimageUrl2: url }),
      setSelectedPreviewImage: (image) => set({ selectedPreviewImage: image }),
      setDraggableImages: (images) => set({ draggableImages: images }),
      setQrPosition: (position) => set({ qrPosition: position }),
      setQrAudioPosition: (position) => set({ qrAudioPosition: position }),
      setAIImage2: (position) => set({ aimage2: position }),
      setTextPositions: (positions) => set({ textPositions: positions }),
      setTextSizes: (sizes) => set({ textSizes: sizes }),
      setImagePositions: (positions) => set({ imagePositions: positions }),
      setImageSizes: (sizes) => set({ imageSizes: sizes }),
      setSelectedStickers2: (stickers) => set({ selectedStickers2: stickers }),
      setTips: (tips) => set({ tips }),
      setUpload: (upload) => set({ upload }),
      setDuration: (duration) => set({ duration }),
      setIsSlideActive: (active) => set({ isSlideActive: active }),
      setIsEditable: (editable) => set({ isEditable:editable }),
      setSlide2DataStore: (payload) => set({ slide2DataStore: payload }),

      // Sticker actions
      addSticker2: (sticker) => {
        const state = get();
        const newSticker: StickerItem = {
          ...sticker,
          x: 50 + state.selectedStickers2.length * 30,
          y: 50 + state.selectedStickers2.length * 30,
          width: 100,
          height: 100,
          zIndex: state.selectedStickers2.length + 1,
          rotation: 0,
        };
        set({ selectedStickers2: [...state.selectedStickers2, newSticker] });
      },

      updateSticker2: (index, data) => {
        const state = get();
        const updated = state.selectedStickers2.map((item, i) => 
          i === index ? { ...item, ...data } : item
        );
        set({ selectedStickers2: updated });
      },

      removeSticker2: (index) => {
        const state = get();
        const updated = state.selectedStickers2.filter((_, i) => i !== index);
        set({ selectedStickers2: updated });
      },
    }),
    {
      name: 'slide2-storage',
      partialize: (state) => ({
        activeIndex: state.activeIndex,
        title: state.title,
        selectedLayout: state.selectedLayout,
        oneTextValue: state.oneTextValue,
        multipleTextValue: state.multipleTextValue,
        textElements: state.textElements,
        texts: state.texts,
        fontSize: state.fontSize,
        fontWeight: state.fontWeight,
        fontColor: state.fontColor,
        fontFamily: state.fontFamily,
        textAlign: state.textAlign,
        verticalAlign: state.verticalAlign,
        rotation: state.rotation,
        images: state.images,
        imagePositions: state.imagePositions,
        imageSizes: state.imageSizes,
        video: state.video,
        audio: state.audio,
        duration: state.duration,
        poster: state.poster,
        isSlideActive: state.isSlideActive,
        selectedPreviewImage: state.selectedPreviewImage,
        selectedStickers2: state.selectedStickers2,
        qrPosition: state.qrPosition,
        qrAudioPosition: state.qrAudioPosition,
        aimage2: state.aimage2,
        textPositions: state.textPositions,
        textSizes: state.textSizes,
        draggableImages: state.draggableImages,
        isAIimage2: state.isAIimage2,
        selectedAIimageUrl2: state.selectedAIimageUrl2,
        selectedVideoUrl: state.selectedVideoUrl,
        selectedAudioUrl: state.selectedAudioUrl,
        isEditable: state.isEditable,
        slide2DataStore: state.slide2DataStore,
      }),
    }
  )
);
