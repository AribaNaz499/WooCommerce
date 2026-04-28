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

interface Slide4State {
  // Basic state
  activeIndex4: number;
  title4: string;
  activePopup4: string | null;
  selectedImg4: number[];
  showOneTextRightSideBox4: boolean;
  oneTextValue4: string;
  multipleTextValue4: boolean;
  selectedLayout4: "blank" | "oneText" | "multipleText";
  layout4: any;
  
  // Font and text properties
  fontSize4: number;
  fontWeight4: number;
  textAlign4: "start" | "center" | "end";
  verticalAlign4: "top" | "center" | "bottom";
  fontColor4: string;
  fontFamily4: string;
  rotation4: number;
  
  // Text elements
  textElements4: TextElement[];
  selectedTextId4: string | null;
  texts4: any[];
  editingIndex4: number | null;
  
  // Media
  images4: { id: number; src: string }[];
  video4: File[] | null;
  audio4: File[] | null;
  poster4: string | null;
  selectedVideoUrl4: string | null;
  selectedAudioUrl4: string | null;
  
  // AI and preview
  isAIimage4: boolean;
  selectedAIimageUrl4: string | null;
  selectedPreviewImage4: string | null;
  
  // Draggable elements
  draggableImages4: DraggableImage[];
  qrPosition4: DraggableQR;
  qrAudioPosition4: DraggableAudioQR;
  aimage4: ImagePosition;
  
  // Positions and sizes
  textPositions4: Position[];
  textSizes4: Size[];
  imagePositions4: Record<number, Position>;
  imageSizes4: Record<number, Size>;
  
  // Stickers
  selectedStickers4: StickerItem[];
  
  // UI state
  tips4: boolean;
  upload4: boolean;
  duration4: number | null;
  isSlideActive4: boolean;
  isEditable4: boolean;
  slide4DataStore: any[];
  
  // Actions
  setActiveIndex4: (index: number) => void;
  setTitle4: (title: string) => void;
  setActivePopup4: (popup: string | null) => void;
  setSelectedImage4: (images: number[]) => void;
  setShowOneTextRightSideBox4: (show: boolean) => void;
  setOneTextValue4: (value: string) => void;
  setMultipleTextValue4: (value: boolean) => void;
  setSelectedLayout4: (layout: "blank" | "oneText" | "multipleText") => void;
  setFontSize4: (size: number) => void;
  setFontWeight4: (weight: number) => void;
  setTextAlign4: (align: "start" | "center" | "end") => void;
  setVerticalAlign4: (align: "top" | "center" | "bottom") => void;
  setFontColor4: (color: string) => void;
  setFontFamily4: (family: string) => void;
  setRotation4: (rotation: number) => void;
  setTextElements4: (elements: TextElement[]) => void;
  setSelectedTextId4: (id: string | null) => void;
  setTexts4: (texts: any[]) => void;
  setEditingIndex4: (index: number | null) => void;
  setImages4: (images: { id: number; src: string }[]) => void;
  setVideo4: (video: File[] | null) => void;
  setAudio4: (audio: File[] | null) => void;
  setPoster4: (poster: string | null) => void;
  setSelectedVideoUrl4: (url: string | null) => void;
  setSelectedAudioUrl4: (url: string | null) => void;
  setIsAIimage4: (isAI: boolean) => void;
  setSelectedAIimageUrl4: (url: string | null) => void;
  setSelectedPreviewImage4: (image: string | null) => void;
  setDraggableImages4: (images: DraggableImage[]) => void;
  setQrPosition4: (position: DraggableQR) => void;
  setQrAudioPosition4: (position: DraggableAudioQR) => void;
  setAIImage4: (position: ImagePosition) => void;
  setTextPositions4: (positions: Position[]) => void;
  setTextSizes4: (sizes: Size[]) => void;
  setImagePositions4: (positions: Record<number, Position>) => void;
  setImageSizes4: (sizes: Record<number, Size>) => void;
  setSelectedStickers4: (stickers: StickerItem[]) => void;
  setTips4: (tips: boolean) => void;
  setUpload4: (upload: boolean) => void;
  setDuration4: (duration: number | null) => void;
  setIsSlideActive4: (active: boolean) => void;
  setIsEditable4: (editable: boolean) => void;
  setLayout4: (layout: any) => void;
  setSlide4DataStore: (payload: any[]) => void;
  
  // Sticker actions
  addSticker4: (sticker: Omit<StickerItem, "x" | "y" | "width" | "height" | "zIndex" | "rotation">) => void;
  updateSticker4: (index: number, data: Partial<StickerItem>) => void;
  removeSticker4: (index: number) => void;
}

export const useSlide4Store = create<Slide4State>()(
  persist(
    (set, get) => ({
      // Initial state
      activeIndex4: 0,
      title4: "Happy Birthday",
      activePopup4: null,
      selectedImg4: [],
      showOneTextRightSideBox4: false,
      oneTextValue4: "",
      multipleTextValue4: false,
      selectedLayout4: "blank",
      layout4: null,
      fontSize4: 20,
      fontWeight4: 400,
      textAlign4: "start",
      verticalAlign4: "top",
      fontColor4: fontColors[0],
      fontFamily4: "Roboto",
      rotation4: 0,
      textElements4: [],
      selectedTextId4: null,
      texts4: [
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
      editingIndex4: null,
      images4: [],
      video4: null,
      audio4: null,
      poster4: null,
      selectedVideoUrl4: null,
      selectedAudioUrl4: null,
      isAIimage4: false,
      selectedAIimageUrl4: null,
      selectedPreviewImage4: null,
      draggableImages4: [],
      qrPosition4: {
        id: "qr4",
        url: "",
        x: 20,
        y: 40,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: 4000,
      },
      qrAudioPosition4: {
        id: "qr2",
        url: "",
        x: 20,
        y: 40,
        width: 400,
        height: 400,
        rotation: 0,
        zIndex: 4000,
      },
      aimage4: {
        x: 50,
        y: 50,
        width: 200,
        height: 200,
      },
      textPositions4: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
      textSizes4: [{ width: 400, height: 30 }, { width: 400, height: 30 }, { width: 400, height: 30 }],
      imagePositions4: {},
      imageSizes4: {},
      selectedStickers4: [],
      tips4: false,
      upload4: false,
      duration4: null,
      isSlideActive4: false,
      isEditable4: true,
      slide4DataStore: [],

      // Setters
      setActiveIndex4: (index) => set({ activeIndex4: index }),
      setTitle4: (title) => set({ title4: title }),
      setActivePopup4: (popup) => set({ activePopup4: popup }),
      setSelectedImage4: (images) => set({ selectedImg4: images }),
      setShowOneTextRightSideBox4: (show) => set({ showOneTextRightSideBox4: show }),
      setOneTextValue4: (value) => set({ oneTextValue4: value }),
      setMultipleTextValue4: (value) => set({ multipleTextValue4: value }),
      setSelectedLayout4: (layout) => set({ selectedLayout4: layout }),
      setFontSize4: (size) => set({ fontSize4: size }),
      setFontWeight4: (weight) => set({ fontWeight4: weight }),
      setTextAlign4: (align) => set({ textAlign4: align }),
      setVerticalAlign4: (align) => set({ verticalAlign4: align }),
      setFontColor4: (color) => set({ fontColor4: color }),
      setFontFamily4: (family) => set({ fontFamily4: family }),
      setRotation4: (rotation) => set({ rotation4: rotation }),
      setTextElements4: (elements) => set({ textElements4: elements }),
      setSelectedTextId4: (id) => set({ selectedTextId4: id }),
      setTexts4: (texts) => set({ texts4: texts }),
      setEditingIndex4: (index) => set({ editingIndex4: index }),
      setImages4: (images) => set({ images4: images }),
      setVideo4: (video) => set({ video4: video }),
      setAudio4: (audio) => set({ audio4: audio }),
      setPoster4: (poster) => set({ poster4: poster }),
      setSelectedVideoUrl4: (url) => set({ selectedVideoUrl4: url }),
      setSelectedAudioUrl4: (url) => set({ selectedAudioUrl4: url }),
      setIsAIimage4: (isAI) => set({ isAIimage4: isAI }),
      setSelectedAIimageUrl4: (url) => set({ selectedAIimageUrl4: url }),
      setSelectedPreviewImage4: (image) => set({ selectedPreviewImage4: image }),
      setDraggableImages4: (images) => set({ draggableImages4: images }),
      setQrPosition4: (position) => set({ qrPosition4: position }),
      setQrAudioPosition4: (position) => set({ qrAudioPosition4: position }),
      setAIImage4: (position) => set({ aimage4: position }),
      setTextPositions4: (positions) => set({ textPositions4: positions }),
      setTextSizes4: (sizes) => set({ textSizes4: sizes }),
      setImagePositions4: (positions) => set({ imagePositions4: positions }),
      setImageSizes4: (sizes) => set({ imageSizes4: sizes }),
      setSelectedStickers4: (stickers) => set({ selectedStickers4: stickers }),
      setTips4: (tips) => set({ tips4: tips }),
      setUpload4: (upload) => set({ upload4: upload }),
      setDuration4: (duration) => set({ duration4: duration }),
      setIsSlideActive4: (active) => set({ isSlideActive4: active }),
      setIsEditable4: (editable) => set({ isEditable4: editable }),
      setLayout4: (layout) => set({ layout4: layout }),
      setSlide4DataStore: (payload) => set({ slide4DataStore: payload }),

      // Sticker actions
      addSticker4: (sticker) => {
        const state = get();
        const newSticker: StickerItem = {
          ...sticker,
          x: 50 + state.selectedStickers4.length * 30,
          y: 50 + state.selectedStickers4.length * 30,
          width: 100,
          height: 100,
          zIndex: state.selectedStickers4.length + 1,
          rotation: 0,
        };
        set({ selectedStickers4: [...state.selectedStickers4, newSticker] });
      },

      updateSticker4: (index, data) => {
        const state = get();
        const updated = state.selectedStickers4.map((item, i) => 
          i === index ? { ...item, ...data } : item
        );
        set({ selectedStickers4: updated });
      },

      removeSticker4: (index) => {
        const state = get();
        const updated = state.selectedStickers4.filter((_, i) => i !== index);
        set({ selectedStickers4: updated });
      },
    }),
    {
      name: 'slide4-storage',
      partialize: (state) => ({
        activeIndex4: state.activeIndex4,
        title4: state.title4,
        selectedLayout4: state.selectedLayout4,
        oneTextValue4: state.oneTextValue4,
        multipleTextValue4: state.multipleTextValue4,
        textElements4: state.textElements4,
        texts4: state.texts4,
        fontSize4: state.fontSize4,
        fontWeight4: state.fontWeight4,
        fontColor4: state.fontColor4,
        fontFamily4: state.fontFamily4,
        textAlign4: state.textAlign4,
        verticalAlign4: state.verticalAlign4,
        rotation4: state.rotation4,
        images4: state.images4,
        imagePositions4: state.imagePositions4,
        imageSizes4: state.imageSizes4,
        video4: state.video4,
        audio4: state.audio4,
        duration4: state.duration4,
        poster4: state.poster4,
        isSlideActive4: state.isSlideActive4,
        selectedPreviewImage4: state.selectedPreviewImage4,
        selectedStickers4: state.selectedStickers4,
        qrPosition4: state.qrPosition4,
        qrAudioPosition4: state.qrAudioPosition4,
        aimage4: state.aimage4,
        textPositions4: state.textPositions4,
        textSizes4: state.textSizes4,
        draggableImages4: state.draggableImages4,
        isAIimage4: state.isAIimage4,
        selectedAIimageUrl4: state.selectedAIimageUrl4,
        selectedVideoUrl4: state.selectedVideoUrl4,
        selectedAudioUrl4: state.selectedAudioUrl4,
        isEditable4: state.isEditable4,
        layout4: state.layout4,
        slide4DataStore: state.slide4DataStore,
      }),
    }
  )
);
