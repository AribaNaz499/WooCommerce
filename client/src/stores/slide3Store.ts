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

interface ImagePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Slide3State {
  // Basic state
  activeIndex3: number;
  title3: string;
  activePopup3: string | null;
  selectedImg3: number[];
  showOneTextRightSideBox3: boolean;
  oneTextValue3: string;
  multipleTextValue3: boolean;
  selectedLayout3: "blank" | "oneText" | "multipleText";
  
  // Font and text properties
  fontSize3: number;
  fontWeight3: number;
  textAlign3: "start" | "center" | "end";
  verticalAlign3: "top" | "center" | "bottom";
  fontColor3: string;
  fontFamily3: string;
  rotation3: number;
  
  // Text elements
  textElements3: TextElement[];
  selectedTextId3: string | null;
  texts3: any[];
  editingIndex3: number | null;
  
  // Media
  images3: { id: number; src: string }[];
  video3: File[] | null;
  audio3: File[] | null;
  poster3: string | null;
  selectedVideoUrl3: string | null;
  selectedAudioUrl3: string | null;
  
  // AI and preview
  isAIimage3: boolean;
  selectedAIimageUrl3: string | null;
  selectedPreviewImage3: string | null;
  
  // Draggable elements
  draggableImages3: DraggableImage[];
  qrPosition3: DraggableQR;
  qrAudioPosition3: DraggableQR;
  aimage3: ImagePosition;
  
  // Positions and sizes
  textPositions3: Position[];
  textSizes3: Size[];
  imagePositions3: Record<number, Position>;
  imageSizes3: Record<number, Size>;
  
  // Stickers
  selectedStickers3: StickerItem[];
  
  // UI state
  tips3: boolean;
  upload3: boolean;
  duration3: number | null;
  isSlideActive3: boolean;
  isEditable3: boolean;
  slide3DataStore3: any[];
  
  // Actions
  setActiveIndex3: (index: number) => void;
  setTitle3: (title: string) => void;
  setActivePopup3: (popup: string | null) => void;
  setSelectedImage3: (images: number[]) => void;
  setShowOneTextRightSideBox3: (show: boolean) => void;
  setOneTextValue3: (value: string) => void;
  setMultipleTextValue3: (value: boolean) => void;
  setSelectedLayout3: (layout: "blank" | "oneText" | "multipleText") => void;
  setFontSize3: (size: number) => void;
  setFontWeight3: (weight: number) => void;
  setTextAlign3: (align: "start" | "center" | "end") => void;
  setVerticalAlign3: (align: "top" | "center" | "bottom") => void;
  setFontColor3: (color: string) => void;
  setFontFamily3: (family: string) => void;
  setRotation3: (rotation: number) => void;
  setTextElements3: (elements: TextElement[]) => void;
  setSelectedTextId3: (id: string | null) => void;
  setTexts3: (texts: any[]) => void;
  setEditingIndex3: (index: number | null) => void;
  setImages3: (images: { id: number; src: string }[]) => void;
  setVideo3: (video: File[] | null) => void;
  setAudio3: (audio: File[] | null) => void;
  setPoster3: (poster: string | null) => void;
  setSelectedVideoUrl3: (url: string | null) => void;
  setSelectedAudioUrl3: (url: string | null) => void;
  setIsAIimage3: (isAI: boolean) => void;
  setSelectedAIimageUrl3: (url: string | null) => void;
  setSelectedPreviewImage3: (image: string | null) => void;
  setDraggableImages3: (images: DraggableImage[]) => void;
  setQrPosition3: (position: DraggableQR) => void;
  setQrAudioPosition3: (position: DraggableQR) => void;
  setAIImage3: (position: ImagePosition) => void;
  setTextPositions3: (positions: Position[]) => void;
  setTextSizes3: (sizes: Size[]) => void;
  setImagePositions3: (positions: Record<number, Position>) => void;
  setImageSizes3: (sizes: Record<number, Size>) => void;
  setSelectedStickers3: (stickers: StickerItem[]) => void;
  setTips3: (tips: boolean) => void;
  setUpload3: (upload: boolean) => void;
  setDuration3: (duration: number | null) => void;
  setIsSlideActive3: (active: boolean) => void;
  setIsEditable3: (editable: boolean) => void;
  setSlide3DataStore3: (payload: any[]) => void;
  
  // Sticker actions
  addSticker3: (sticker: Omit<StickerItem, "x" | "y" | "width" | "height" | "zIndex" | "rotation">) => void;
  updateSticker3: (index: number, data: Partial<StickerItem>) => void;
  removeSticker3: (index: number) => void;
}

export const useSlide3Store = create<Slide3State>()(
  persist(
    (set, get) => ({
      // Initial state
      activeIndex3: 0,
      title3: "Happy Birthday",
      activePopup3: null,
      selectedImg3: [],
      showOneTextRightSideBox3: false,
      oneTextValue3: "",
      multipleTextValue3: false,
      selectedLayout3: "blank",
      fontSize3: 30,
      fontWeight3: 400,
      textAlign3: "start",
      verticalAlign3: "top",
      fontColor3: fontColors[0],
      fontFamily3: "Roboto",
      rotation3: 0,
      textElements3: [],
      selectedTextId3: null,
      texts3: [
        {
          value: "",
          fontSize: 30,
          fontWeight: 400,
          fontColor: "#000000",
          fontFamily: "Roboto",
          verticalAlign: "center",
        },
        {
          value: "",
          fontSize: 30,
          fontWeight: 400,
          fontColor: "#000000",
          fontFamily: "Roboto",
          verticalAlign: "center",
        },
        {
          value: "",
          fontSize: 30,
          fontWeight: 400,
          fontColor: "#000000",
          fontFamily: "Roboto",
          verticalAlign: "center",
        },
      ],
      editingIndex3: null,
      images3: [],
      video3: null,
      audio3: null,
      poster3: null,
      selectedVideoUrl3: null,
      selectedAudioUrl3: null,
      isAIimage3: false,
      selectedAIimageUrl3: null,
      selectedPreviewImage3: null,
      draggableImages3: [],
      qrPosition3: {
        id: "qr1",
        url: "",
        x: 30,
        y: 10,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1000,
      },
      qrAudioPosition3: {
        id: "qr2",
        url: "",
        x: 30,
        y: 10,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1000,
      },
      aimage3: {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
      },
      textPositions3: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
      textSizes3: [{ width: 100, height: 30 }, { width: 100, height: 30 }, { width: 100, height: 30 }],
      imagePositions3: {},
      imageSizes3: {},
      selectedStickers3: [],
      tips3: false,
      upload3: false,
      duration3: null,
      isSlideActive3: false,
      isEditable3: true,
      slide3DataStore3: [],

      // Setters
      setActiveIndex3: (index) => set({ activeIndex3: index }),
      setTitle3: (title) => set({ title3: title }),
      setActivePopup3: (popup) => set({ activePopup3: popup }),
      setSelectedImage3: (images) => set({ selectedImg3: images }),
      setShowOneTextRightSideBox3: (show) => set({ showOneTextRightSideBox3: show }),
      setOneTextValue3: (value) => set({ oneTextValue3: value }),
      setMultipleTextValue3: (value) => set({ multipleTextValue3: value }),
      setSelectedLayout3: (layout) => set({ selectedLayout3: layout }),
      setFontSize3: (size) => set({ fontSize3: size }),
      setFontWeight3: (weight) => set({ fontWeight3: weight }),
      setTextAlign3: (align) => set({ textAlign3: align }),
      setVerticalAlign3: (align) => set({ verticalAlign3: align }),
      setFontColor3: (color) => set({ fontColor3: color }),
      setFontFamily3: (family) => set({ fontFamily3: family }),
      setRotation3: (rotation) => set({ rotation3: rotation }),
      setTextElements3: (elements) => set({ textElements3: elements }),
      setSelectedTextId3: (id) => set({ selectedTextId3: id }),
      setTexts3: (texts) => set({ texts3: texts }),
      setEditingIndex3: (index) => set({ editingIndex3: index }),
      setImages3: (images) => set({ images3: images }),
      setVideo3: (video) => set({ video3: video }),
      setAudio3: (audio) => set({ audio3: audio }),
      setPoster3: (poster) => set({ poster3: poster }),
      setSelectedVideoUrl3: (url) => set({ selectedVideoUrl3: url }),
      setSelectedAudioUrl3: (url) => set({ selectedAudioUrl3: url }),
      setIsAIimage3: (isAI) => set({ isAIimage3: isAI }),
      setSelectedAIimageUrl3: (url) => set({ selectedAIimageUrl3: url }),
      setSelectedPreviewImage3: (image) => set({ selectedPreviewImage3: image }),
      setDraggableImages3: (images) => set({ draggableImages3: images }),
      setQrPosition3: (position) => set({ qrPosition3: position }),
      setQrAudioPosition3: (position) => set({ qrAudioPosition3: position }),
      setAIImage3: (position) => set({ aimage3: position }),
      setTextPositions3: (positions) => set({ textPositions3: positions }),
      setTextSizes3: (sizes) => set({ textSizes3: sizes }),
      setImagePositions3: (positions) => set({ imagePositions3: positions }),
      setImageSizes3: (sizes) => set({ imageSizes3: sizes }),
      setSelectedStickers3: (stickers) => set({ selectedStickers3: stickers }),
      setTips3: (tips) => set({ tips3: tips }),
      setUpload3: (upload) => set({ upload3: upload }),
      setDuration3: (duration) => set({ duration3: duration }),
      setIsSlideActive3: (active) => set({ isSlideActive3: active }),
      setIsEditable3: (editable) => set({ isEditable3: editable }),
      setSlide3DataStore3: (payload) => set({ slide3DataStore3: payload }),

      // Sticker actions
      addSticker3: (sticker) => {
        const state = get();
        const newSticker: StickerItem = {
          ...sticker,
          x: 50 + state.selectedStickers3.length * 30,
          y: 50 + state.selectedStickers3.length * 30,
          width: 100,
          height: 100,
          zIndex: state.selectedStickers3.length + 1,
          rotation: 0,
        };
        set({ selectedStickers3: [...state.selectedStickers3, newSticker] });
      },

      updateSticker3: (index, data) => {
        const state = get();
        const updated = state.selectedStickers3.map((item, i) => 
          i === index ? { ...item, ...data } : item
        );
        set({ selectedStickers3: updated });
      },

      removeSticker3: (index) => {
        const state = get();
        const updated = state.selectedStickers3.filter((_, i) => i !== index);
        set({ selectedStickers3: updated });
      },
    }),
    {
      name: 'slide3-storage',
      partialize: (state) => ({
        activeIndex3: state.activeIndex3,
        title3: state.title3,
        selectedLayout3: state.selectedLayout3,
        oneTextValue3: state.oneTextValue3,
        multipleTextValue3: state.multipleTextValue3,
        textElements3: state.textElements3,
        texts3: state.texts3,
        fontSize3: state.fontSize3,
        fontWeight3: state.fontWeight3,
        fontColor3: state.fontColor3,
        fontFamily3: state.fontFamily3,
        textAlign3: state.textAlign3,
        verticalAlign3: state.verticalAlign3,
        rotation3: state.rotation3,
        images3: state.images3,
        imagePositions3: state.imagePositions3,
        imageSizes3: state.imageSizes3,
        video3: state.video3,
        audio3: state.audio3,
        duration3: state.duration3,
        poster3: state.poster3,
        isSlideActive3: state.isSlideActive3,
        selectedPreviewImage3: state.selectedPreviewImage3,
        selectedStickers3: state.selectedStickers3,
        qrPosition3: state.qrPosition3,
        qrAudioPosition3: state.qrAudioPosition3,
        aimage3: state.aimage3,
        textPositions3: state.textPositions3,
        textSizes3: state.textSizes3,
        draggableImages3: state.draggableImages3,
        isAIimage3: state.isAIimage3,
        selectedAIimageUrl3: state.selectedAIimageUrl3,
        selectedVideoUrl3: state.selectedVideoUrl3,
        selectedAudioUrl3: state.selectedAudioUrl3,
        isEditable3: state.isEditable3,
        slide3DataStore3: state.slide3DataStore3,
      }),
    }
  )
);
