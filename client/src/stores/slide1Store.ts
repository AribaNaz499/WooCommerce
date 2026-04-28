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

interface Slide1State {
  // Basic state
  activeIndex1: number;
  title1: string;
  activePopup1: string | null;
  selectedImg1: number[];
  showOneTextRightSideBox1: boolean;
  oneTextValue1: string;
  multipleTextValue1: boolean;
  selectedLayout1: "blank" | "oneText" | "multipleText";
  layout1: any;
  
  // Font and text properties
  fontSize1: number;
  fontWeight1: number;
  textAlign1: "start" | "center" | "end";
  verticalAlign1: "top" | "center" | "bottom";
  fontColor1: string;
  fontFamily1: string;
  rotation1: number;
  
  // Text elements
  textElements1: TextElement[];
  selectedTextId1: string | null;
  texts1: any[];
  editingIndex1: number | null;
  
  // Media
  images1: { id: number; src: string }[];
  video1: File[] | null;
  audio1: File[] | null;
  poster1: string | null;
  selectedVideoUrl1: string | null;
  selectedAudioUrl1: string | null;
  
  // AI and preview
  isAIimage: boolean;
  selectedAIimageUrl1: string | null;
  selectedPreviewImage1: string | null;
  
  // Draggable elements
  draggableImages1: DraggableImage[];
  qrPosition1: DraggableQR;
  qrAudioPosition1: DraggableAudioQR;
  aimage1: ImagePosition;
  
  // Positions and sizes
  textPositions1: Position[];
  textSizes1: Size[];
  imagePositions1: Record<number, Position>;
  imageSizes1: Record<number, Size>;
  
  // Stickers
  selectedStickers: StickerItem[];
  
  // UI state
  tips1: boolean;
  upload1: boolean;
  duration1: number | null;
  isSlideActive1: boolean;
  isEditable1: boolean;
  slide1DataStore: any[];
  
  // Actions
  setActiveIndex1: (index: number) => void;
  setTitle1: (title: string) => void;
  setActivePopup1: (popup: string | null) => void;
  setSelectedImage1: (images: number[]) => void;
  setShowOneTextRightSideBox1: (show: boolean) => void;
  setOneTextValue1: (value: string) => void;
  setMultipleTextValue1: (value: boolean) => void;
  setSelectedLayout1: (layout: "blank" | "oneText" | "multipleText") => void;
  setFontSize1: (size: number) => void;
  setFontWeight1: (weight: number) => void;
  setTextAlign1: (align: "start" | "center" | "end") => void;
  setVerticalAlign1: (align: "top" | "center" | "bottom") => void;
  setFontColor1: (color: string) => void;
  setFontFamily1: (family: string) => void;
  setRotation1: (rotation: number) => void;
  setTextElements1: (elements: TextElement[]) => void;
  setSelectedTextId1: (id: string | null) => void;
  setTexts1: (texts: any[]) => void;
  setEditingIndex1: (index: number | null) => void;
  setImages1: (images: { id: number; src: string }[]) => void;
  setVideo1: (video: File[] | null) => void;
  setAudio1: (audio: File[] | null) => void;
  setPoster1: (poster: string | null) => void;
  setSelectedVideoUrl1: (url: string | null) => void;
  setSelectedAudioUrl1: (url: string | null) => void;
  setIsAIimage: (isAI: boolean) => void;
  setSelectedAIimageUrl1: (url: string | null) => void;
  setSelectedPreviewImage1: (image: string | null) => void;
  setDraggableImages1: (images: DraggableImage[]) => void;
  setQrPosition1: (position: DraggableQR) => void;
  setQrAudioPosition1: (position: DraggableAudioQR) => void;
  setAIImage1: (position: ImagePosition) => void;
  setTextPositions1: (positions: Position[]) => void;
  setTextSizes1: (sizes: Size[]) => void;
  setImagePositions1: (positions: Record<number, Position>) => void;
  setImageSizes1: (sizes: Record<number, Size>) => void;
  setSelectedStickers: (stickers: StickerItem[]) => void;
  setTips1: (tips: boolean) => void;
  setUpload1: (upload: boolean) => void;
  setDuration1: (duration: number | null) => void;
  setIsSlideActive1: (active: boolean) => void;
  setIsEditable1: (editable: boolean) => void;
  setLayout1: (layout: any) => void;
  setSlide1DataStore: (payload: any[]) => void;
  
  // Sticker actions
  addSticker: (sticker: Omit<StickerItem, "x" | "y" | "width" | "height" | "zIndex" | "rotation">) => void;
  updateSticker: (index: number, data: Partial<StickerItem>) => void;
  removeSticker: (index: number) => void;
}

export const useSlide1Store = create<Slide1State>()(
  persist(
    (set, get) => ({
      // Initial state
      activeIndex1: 0,
      title1: "Happy Birthday",
      activePopup1: null,
      selectedImg1: [],
      showOneTextRightSideBox1: false,
      oneTextValue1: "",
      multipleTextValue1: false,
      selectedLayout1: "blank",
      layout1: null,
      fontSize1: 20,
      fontWeight1: 400,
      textAlign1: "start",
      verticalAlign1: "top",
      fontColor1: fontColors[0],
      fontFamily1: "Roboto",
      rotation1: 0,
      textElements1: [],
      selectedTextId1: null,
      texts1: [
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
      editingIndex1: null,
      images1: [],
      video1: null,
      audio1: null,
      poster1: null,
      selectedVideoUrl1: null,
      selectedAudioUrl1: null,
      isAIimage: false,
      selectedAIimageUrl1: null,
      selectedPreviewImage1: null,
      draggableImages1: [],
      qrPosition1: {
        id: "qr1",
        url: "",
        x: 20,
        y: 10,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1000,
      },
      qrAudioPosition1: {
        id: "qr2",
        url: "",
        x: 20,
        y: 10,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 1000,
      },
      aimage1: {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
      },
      textPositions1: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
      textSizes1: [{ width: 100, height: 30 }, { width: 100, height: 30 }, { width: 100, height: 30 }],
      imagePositions1: {},
      imageSizes1: {},
      selectedStickers: [],
      tips1: false,
      upload1: false,
      duration1: null,
      isSlideActive1: false,
      isEditable1: true,
      slide1DataStore: [],

      // Setters
      setActiveIndex1: (index) => set({ activeIndex1: index }),
      setTitle1: (title) => set({ title1: title }),
      setActivePopup1: (popup) => set({ activePopup1: popup }),
      setSelectedImage1: (images) => set({ selectedImg1: images }),
      setShowOneTextRightSideBox1: (show) => set({ showOneTextRightSideBox1: show }),
      setOneTextValue1: (value) => set({ oneTextValue1: value }),
      setMultipleTextValue1: (value) => set({ multipleTextValue1: value }),
      setSelectedLayout1: (layout) => set({ selectedLayout1: layout }),
      setFontSize1: (size) => set({ fontSize1: size }),
      setFontWeight1: (weight) => set({ fontWeight1: weight }),
      setTextAlign1: (align) => set({ textAlign1: align }),
      setVerticalAlign1: (align) => set({ verticalAlign1: align }),
      setFontColor1: (color) => set({ fontColor1: color }),
      setFontFamily1: (family) => set({ fontFamily1: family }),
      setRotation1: (rotation) => set({ rotation1: rotation }),
      setTextElements1: (elements) => set({ textElements1: elements }),
      setSelectedTextId1: (id) => set({ selectedTextId1: id }),
      setTexts1: (texts) => set({ texts1: texts }),
      setEditingIndex1: (index) => set({ editingIndex1: index }),
      setImages1: (images) => set({ images1: images }),
      setVideo1: (video) => set({ video1: video }),
      setAudio1: (audio) => set({ audio1: audio }),
      setPoster1: (poster) => set({ poster1: poster }),
      setSelectedVideoUrl1: (url) => set({ selectedVideoUrl1: url }),
      setSelectedAudioUrl1: (url) => set({ selectedAudioUrl1: url }),
      setIsAIimage: (isAI) => set({ isAIimage: isAI }),
      setSelectedAIimageUrl1: (url) => set({ selectedAIimageUrl1: url }),
      setSelectedPreviewImage1: (image) => set({ selectedPreviewImage1: image }),
      setDraggableImages1: (images) => set({ draggableImages1: images }),
      setQrPosition1: (position) => set({ qrPosition1: position }),
      setQrAudioPosition1: (position) => set({ qrAudioPosition1: position }),
      setAIImage1: (position) => set({ aimage1: position }),
      setTextPositions1: (positions) => set({ textPositions1: positions }),
      setTextSizes1: (sizes) => set({ textSizes1: sizes }),
      setImagePositions1: (positions) => set({ imagePositions1: positions }),
      setImageSizes1: (sizes) => set({ imageSizes1: sizes }),
      setSelectedStickers: (stickers) => set({ selectedStickers: stickers }),
      setTips1: (tips) => set({ tips1: tips }),
      setUpload1: (upload) => set({ upload1: upload }),
      setDuration1: (duration) => set({ duration1: duration }),
      setIsSlideActive1: (active) => set({ isSlideActive1: active }),
      setIsEditable1: (editable) => set({ isEditable1: editable }),
      setLayout1: (layout) => set({ layout1: layout }),
      setSlide1DataStore: (payload) => set({ slide1DataStore: payload }),

      // Sticker actions
      addSticker: (sticker) => {
        const state = get();
        const newSticker: StickerItem = {
          ...sticker,
          x: 0 + state.selectedStickers.length * 10,
          y: 0 + state.selectedStickers.length * 10,
          width: 100,
          height: 100,
          zIndex: state.selectedStickers.length + 2,
          rotation: 0,
        };
        set({ selectedStickers: [...state.selectedStickers, newSticker] });
      },

      updateSticker: (index, data) => {
        const state = get();
        const updated = state.selectedStickers.map((item, i) => 
          i === index ? { ...item, ...data } : item
        );
        set({ selectedStickers: updated });
      },

      removeSticker: (index) => {
        const state = get();
        const updated = state.selectedStickers.filter((_, i) => i !== index);
        set({ selectedStickers: updated });
      },
    }),
    {
      name: 'slide1-storage',
      partialize: (state) => ({
        activeIndex1: state.activeIndex1,
        title1: state.title1,
        selectedLayout1: state.selectedLayout1,
        oneTextValue1: state.oneTextValue1,
        multipleTextValue1: state.multipleTextValue1,
        textElements1: state.textElements1,
        texts1: state.texts1,
        fontSize1: state.fontSize1,
        fontWeight1: state.fontWeight1,
        fontColor1: state.fontColor1,
        fontFamily1: state.fontFamily1,
        textAlign1: state.textAlign1,
        verticalAlign1: state.verticalAlign1,
        rotation1: state.rotation1,
        images1: state.images1,
        imagePositions1: state.imagePositions1,
        imageSizes1: state.imageSizes1,
        video1: state.video1,
        audio1: state.audio1,
        duration1: state.duration1,
        poster1: state.poster1,
        isSlideActive1: state.isSlideActive1,
        selectedPreviewImage1: state.selectedPreviewImage1,
        selectedStickers: state.selectedStickers,
        qrPosition1: state.qrPosition1,
        qrAudioPosition1: state.qrAudioPosition1,
        aimage1: state.aimage1,
        textPositions1: state.textPositions1,
        textSizes1: state.textSizes1,
        draggableImages1: state.draggableImages1,
        isAIimage: state.isAIimage,
        selectedAIimageUrl1: state.selectedAIimageUrl1,
        selectedVideoUrl1: state.selectedVideoUrl1,
        selectedAudioUrl1: state.selectedAudioUrl1,
        isEditable1: state.isEditable1,
        layout1: state.layout1,
        slide1DataStore: state.slide1DataStore,
      }),
    }
  )
);
