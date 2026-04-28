import { useState, useRef, useEffect, type Dispatch, type SetStateAction, type ChangeEvent } from "react";
import { Box, IconButton, useMediaQuery, useTheme } from "@mui/material";
import {
  ArrowBackIos,
  ArrowForwardIos,
  AudiotrackOutlined,
  AutoAwesomeMosaicOutlined,
  CollectionsOutlined,
  EmojiEmotionsOutlined,
  FilterFramesOutlined,
  PictureAsPdfOutlined,
  SlideshowOutlined,
  TitleOutlined,
  WallpaperOutlined,
} from "@mui/icons-material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import SlideCover from "../SlideCover/SlideCover";
import SlideLogo from "../SlideLogo/SlideLogo";
import SlideSpread from "../SpreadSheet/SpreadSheat";
import LayoutPopup from "../Slide2/LayoutPopup/LayoutPopup";
import VideoPopup from "../Slide2/VideoPopup/VideoPopup";
import MediaPopup from "../Slide2/MediaPopup/MediaPopup";
import StickerPopup from "../Slide2/StickerPopup/StickerPopup";
import FontSizePopup from "../Slide2/FontSizePopup/FontSizePopup";
import PhotoPopup from "../Slide2/PhotoPopup/PhotoPopup";
import TextPopup from "../Slide2/TextPopup/TextPopup";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "./../../../node_modules/react-dnd-html5-backend/dist/index";
import FontColorPopup from "../Slide2/FontColorsPopup/FontColorsPopup";
import FontFamilyPopup from "../Slide2/FontFamilyPopup/FontFamilyPopup";
import SpreadRightSide from "../SpreadRightSide/SpreadRightSide";
import Layout3Popup from "../Slide3/Layout3Popup/Layout3Popup";
import Text3Popup from "../Slide3/Text3Popup/Text3Popup";
import Photo3Popup from "../Slide3/Photo3Popup/Photo3Popup";
import Sticker3Popup from "../Slide3/Sticker3Popup/Sticker3Popup";
import Video3Popup from "../Slide3/Video3Popup/Video3Popup";
import Media3Popup from "../Slide3/Media3Popup/Media3Popup";
import FontSize3Popup from "../Slide3/FontSize3Popup/FontSize3Popup";
import FontColor3Popup from "../Slide3/FontColors3Popup/FontColors3Popup";
import FontFamily3Popup from "../Slide3/FontFamily3Popup/FontFamily3Popup";
import GlobalWatermark from "../GlobalWatermark/GlobalWatermark";
import Layout1Popup from "../Slide1/Layout1Popup/Layout1Popup";
import Text1Popup from "../Slide1/Text1Popup/Text1Popup";
import Photo1Popup from "../Slide1/Photo1Popup/Photo1Popup";
import Sticker1Popup from "../Slide1/Sticker1Popup/Sticker1Popup";
import Video1Popup from "../Slide1/Video1Popup/Video1Popup";
import Media1Popup from "../Slide1/Media1Popup/Media1Popup";
import FontSize1Popup from "../Slide1/FontSize1Popup/FontSize1Popup";
import FontFamily1Popup from "../Slide1/FontFamily1Popup/FontFamily1Popup";
import Layout4Popup from "../Slide4/Layout4Popup/Layout4Popup";
import Text4Popup from "../Slide4/Text4Popup/Text4Popup";
import Photo4Popup from "../Slide4/Photo4Popup/Photo4Popup";
import Sticker4Popup from "../Slide4/Sticker4Popup/Sticker4Popup";
import Video4Popup from "../Slide4/Video4Popup/Video4Popup";
import Media4Popup from "../Slide4/Media4Popup/Media4Popup";
import FontSize4Popup from "../Slide4/FontSize4Popup/FontSize4Popup";
import FontColor4Popup from "../Slide4/FontColors4Popup/FontColors4Popup";
import FontFamily4Popup from "../Slide4/FontFamily4Popup/FontFamily4Popup";
import GeneAIPopup from "../Slide1/GeneAIPopup/GeneAI";
import GeneAI2Popup from "../Slide2/GeneAI2Popup/GeneAI2";
import GeneAI3Popup from "../Slide3/GeneAI3Popup/GeneAI3";
import GeneAI4Popup from "../Slide4/GeneAI4Popup/GeneAI4";
import { useSlide1 } from "../../context/Slide1Context";
import { useSlide2 } from "../../context/Slide2Context";
import { useSlide3 } from "../../context/Slide3Context";
import { useSlide4 } from "../../context/Slide4Context";
import FontColor1Popup from "../Slide1/FontColors1Popup/FontColors1Popup";
import TextAlign1Popup from "../Slide1/TextAlign1Popup/TextAlign1Popup";
import TextAlignPopup from "../Slide2/TextAlignPopup/TextAlignPopup";
import TextAlign3Popup from "../Slide3/TextAlign3Popup/TextAlign3Popup";
import TextAlign4Popup from "../Slide4/TextAlign4Popup/TextAlign4Popup";
import LineHeight1Popup from "../Slide1/LineHeight1Popup/LineHeight1Popup";
import LineHeight2Popup from "../Slide2/LineHeight2Popup/LineHeight2Popup";
import LineHeight4Popup from "../Slide4/LineHeight4Popup/LineHeight4Popup";
import LineHeight3Popup from "../Slide3/LineHeight3Popup/LineHeight3Popup";
import { COLORS } from "../../constant/color";
import ImageAdjustment from "../Slide2/ImageAdjustment/ImageAdjustment";
import ImageAdjustment3Popup from "../Slide3/ImageAdjustment3Popup/ImageAdjustment3Poup";
import BgChanger from "../Slide1/BgChanger/BgChanger";
import ShapeFrames from "../Slide1/ShapeFrames/ShapeFrames";
import ImageAdjustment1 from "../Slide1/ImageAdjustment1/ImageAdjustment1";
import ImageAdjustment4Popup from "../Slide4/ImageAdjustment4Popup/ImageAdjustment4Popup";
import BgChanger2 from "../Slide2/BgChanger2/BgChanger2";
import ShapeFrames2 from "../Slide2/ShapeFrames2/ShapeFrames2";
import BgChanger3 from "../Slide3/BgChanger3/BgChanger3";
import ShapeFrames3 from "../Slide3/ShapeFrames3/ShapeFrames3";
import BgChanger4 from "../Slide4/BgChanger4/BgChanger4";
import ShapeFrames4 from "../Slide4/ShapeFrames4/ShapeFrames4";
import { pdfFileToPngDataUrls } from "../../lib/pdfToPng";

const slides = [
  { id: 1, label: "Slide1" },
  { id: 2, label: "Slide2" },
  { id: 3, label: "Slide3" },
  { id: 4, label: "Slide4" },
];

type SlideKey = "slide1" | "slide2" | "slide3" | "slide4";
type SlideImageController = {
  setImages: Dispatch<SetStateAction<any[]>>;
  setSelected: Dispatch<SetStateAction<number[]>>;
};

const SLIDE_CANVAS_WIDTH = 500;
const SLIDE_CANVAS_HEIGHT = 700;
const BASE_SLIDE_W = 500;
const BASE_SLIDE_H = 700;
const TOOLBAR_SIDE_W = 64;
const TOOLBAR_GAP = 14;
const TOOLBAR_BOTTOM_H = 84;
const PDF_IMAGE_MAX_WIDTH = 360;
const PDF_IMAGE_MAX_HEIGHT = 520;

type wishCardType = {
  adminEditor?: any
  initialLayout?: any;
  product?: any
}

const WishCard = (props: wishCardType) => {

  const { adminEditor } = props
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  const [activeIndex, setActiveIndex] = useState(0);
  const [activePopup, setActivePopup] = useState(null);

  // const [addTextRightSide, setAddTextRightSide] = useState(false);
  const [addTextCount, setAddTextCount] = useState(0);
  const [addTextCountRight, setAddTextCountRight] = useState(0);
  const [addTextCountFirst, setAddTextCountFirst] = useState(0);
  const [addTextCountLast, setAddTextCountLast] = useState(0);

  // For slide 1
  const [activeTextSlide1Child, setActiveTextSlide1Child] = useState<
    "size" | "color" | "family" | "textAlign" | "lineHeight" | null
  >(null);

  // For Slide 2
  const [activeTextChild, setActiveTextChild] = useState<
    "size" | "color" | "family" | "textAlign" | "lineHeight" | null
  >(null);

  // For slide 3
  const [activeTextSlide3Child, setActiveTextSlide3Child] = useState<
    "size" | "color" | "family" | "textAlign" | "lineHeight" | null
  >(null);

  // For slide 4
  const [activeTextSlideLastChild, setActiveTextSlideLastChild] = useState<
    "size" | "color" | "family" | "textAlign" | "lineHeight" | null
  >(null);

  const [canvasScale, setCanvasScale] = useState(1);

  const {
    setIsSlideActive1,
    setTips1,
    setDraggableImages1,
    draggableImages1,
    setSelectedImage1,
  } = useSlide1();
  const {
    setTips,
    setIsSlideActive,
    setDraggableImages: setDraggableImages2,
    draggableImages: draggableImages2,
    setSelectedImage: setSelectedImage2,
  } = useSlide2();
  const {
    setTips3,
    setIsSlideActive3,
    setDraggableImages3,
    draggableImages3,
    setSelectedImage3,
  } = useSlide3();
  const {
    setIsSlideActive4,
    setTips4,
    setDraggableImages4,
    draggableImages4,
    setSelectedImage4,
  } = useSlide4();

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [pdfImageIds, setPdfImageIds] = useState<Record<SlideKey, string | null>>({
    slide1: null,
    slide2: null,
    slide3: null,
    slide4: null,
  });
  const slideImageControllers: Record<SlideKey, SlideImageController> = {
    slide1: { setImages: setDraggableImages1, setSelected: setSelectedImage1 },
    slide2: { setImages: setDraggableImages2, setSelected: setSelectedImage2 },
    slide3: { setImages: setDraggableImages3, setSelected: setSelectedImage3 },
    slide4: { setImages: setDraggableImages4, setSelected: setSelectedImage4 },
  };

  // ==============SLIDE STATE MANAGEMENT=======================
  // Function to handle slide changes and manage state
  useEffect(() => {
    setIsSlideActive1(true);
    setIsSlideActive(false);
    setIsSlideActive3(false);
    setIsSlideActive4(false);
  }, []);

  // Handle slide navigation
  const handleSlideChange = (direction: "left" | "right") => {
    let newIndex = activeIndex;

    if (direction === "left") {
      newIndex = activeIndex > 0 ? activeIndex - 1 : slides.length - 1;
    } else {
      newIndex = activeIndex < slides.length - 1 ? activeIndex + 1 : 0;
    }

    // ✅ Deactivate all slides first
    setIsSlideActive1(false);
    setIsSlideActive(false);
    setIsSlideActive3(false);
    setIsSlideActive4(false);

    // ✅ Activate only the current slide
    if (newIndex === 0) setIsSlideActive1(true);
    if (newIndex === 1) setIsSlideActive(true);
    if (newIndex === 2) setIsSlideActive3(true);
    if (newIndex === 3) setIsSlideActive4(true);

    setActiveIndex(newIndex);
    scrollToSlide(newIndex);
  };

  // ==============VIDEO UPLOADING=======================
  // Toggle popup on icon click
  const togglePopup = (name: any) => {
    setActivePopup((prev) => (prev === name ? null : name));
  };

  const triggerTipsForSlide = (index: number) => {
    if (index === 0) setTips1(true);
    if (index === 1) setTips(true);
    if (index === 2) setTips3(true);
    if (index === 3) setTips4(true);
  };

  // For Slide 1
  const renderActiveTextFirstChild = () => {
    switch (activeTextSlide1Child) {
      case "size":
        // FontSizePopup now receives the handleCloseChild function
        return <FontSize1Popup />;
      case "color":
        // FontColorPopup now receives the handleCloseChild function
        return <FontColor1Popup />;
      case "family":
        // FontFamilyPopup now receives the handleCloseChild function
        return <FontFamily1Popup />;
      case "textAlign":
        return <TextAlign1Popup />;
      case "lineHeight":
        return <LineHeight1Popup />;
      default:
        return null;
    }
  };

  // For Slide 2
  const renderActiveTextChild = () => {
    switch (activeTextChild) {
      case "size":
        // FontSizePopup now receives the handleCloseChild function
        return <FontSizePopup />;
      case "color":
        // FontColorPopup now receives the handleCloseChild function
        return <FontColorPopup />;
      case "family":
        // FontFamilyPopup now receives the handleCloseChild function
        return <FontFamilyPopup />;
      case "textAlign":
        return <TextAlignPopup />;
      case "lineHeight":
        return <LineHeight2Popup />;
      default:
        return null;
    }
  };

  // For Slide 3
  const renderActiveTextSlide3Child = () => {
    switch (activeTextSlide3Child) {
      case "size":
        // FontSizePopup now receives the handleCloseChild function
        return <FontSize3Popup />;
      case "color":
        // FontColorPopup now receives the handleCloseChild function
        return <FontColor3Popup />;
      case "family":
        // FontFamilyPopup now receives the handleCloseChild function
        return <FontFamily3Popup />;
      case "textAlign":
        return <TextAlign3Popup />;
      case "lineHeight":
        return <LineHeight3Popup />;
      default:
        return null;
    }
  };

  // For Slide 4
  const renderActiveTextSlideLastChild = () => {
    switch (activeTextSlideLastChild) {
      case "size":
        // FontSizePopup now receives the handleCloseChild function
        return <FontSize4Popup />;
      case "color":
        // FontColorPopup now receives the handleCloseChild function
        return <FontColor4Popup />;
      case "family":
        // FontFamilyPopup now receives the handleCloseChild function
        return <FontFamily4Popup />;
      case "textAlign":
        return <TextAlign4Popup />;
      case "lineHeight":
        return <LineHeight4Popup />;
      default:
        return null;
    }
  };

  // Main box scroll refs and drag state
  const mainRef: any = useRef(null);
  const isMainDragging: any = useRef(false);
  const mainStartX: any = useRef(0);
  const mainScrollLeft: any = useRef(0);
  const slideCanvasRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [sidePadPx, setSidePadPx] = useState(0);
  const thumbBarRef = useRef<HTMLDivElement | null>(null);

  // Thumbnail scroll refs and drag state
  const thumbRef: any = useRef(null);
  const isThumbDragging: any = useRef(false);
  const thumbStartX: any = useRef(0);
  const thumbScrollLeft: any = useRef(0);
  // Main drag handlers
  const onMainMouseDown = (e: any) => {
    isMainDragging.current = true;
    mainStartX.current = e.pageX - mainRef.current.offsetLeft;
    mainScrollLeft.current = mainRef.current.scrollLeft;
  };
  const onMainMouseLeave = () => {
    isMainDragging.current = false;
  };
  const onMainMouseUp = () => {
    isMainDragging.current = false;
  };
  // Thumbnail drag handlers
  const onThumbMouseDown = (e: any) => {
    isThumbDragging.current = true;
    thumbStartX.current = e.pageX - thumbRef.current.offsetLeft;
    thumbScrollLeft.current = thumbRef.current.scrollLeft;
  };
  const onThumbMouseLeave = () => {
    isThumbDragging.current = false;
  };
  const onThumbMouseUp = () => {
    isThumbDragging.current = false;
  };
  const onThumbMouseMove = (e: any) => {
    if (!isThumbDragging.current) return;
    e.preventDefault();
    const x = e.pageX - thumbRef.current.offsetLeft;
    const walk = (x - thumbStartX.current) * 2;
    thumbRef.current.scrollLeft = thumbScrollLeft.current - walk;
  };

  const centerSlide = (index: number, behavior: ScrollBehavior = "smooth") => {
    const container = mainRef.current as HTMLDivElement | null;
    const slide = slideCanvasRefs.current[index];
    if (!container || !slide) return;
    const containerRect = container.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const currentScroll = container.scrollLeft;
    const deltaLeft = slideRect.left - containerRect.left;
    const targetLeft =
      currentScroll + deltaLeft - (containerRect.width - slideRect.width) / 2;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior });
  };

  // Scroll to selected slide
  const scrollToSlide = (index: number) => {
    // ✅ Deactivate all slides first
    setIsSlideActive1(false);
    setIsSlideActive(false);
    setIsSlideActive3(false);
    setIsSlideActive4(false);

    // ✅ Activate only the clicked/target slide
    if (index === 0) setIsSlideActive1(true);
    if (index === 1) setIsSlideActive(true);
    if (index === 2) setIsSlideActive3(true);
    if (index === 3) setIsSlideActive4(true);

    setActiveIndex(index);
    centerSlide(index);
  };

  useEffect(() => {
    const container = mainRef.current as HTMLDivElement | null;
    if (!container || typeof window === "undefined") return;

    const computePad = () => {
      const slide = slideCanvasRefs.current[activeIndex] || slideCanvasRefs.current.find(Boolean);
      const containerWidth = container.clientWidth || 0;
      const slideWidth = slide?.clientWidth || 0;
      const extraPad = isCompact ? 0 : TOOLBAR_SIDE_W + TOOLBAR_GAP;
      const pad = Math.max(0, Math.floor((containerWidth - slideWidth) / 2)) + extraPad;
      setSidePadPx(pad);
    };

    computePad();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => computePad());
      ro.observe(container);
      const activeSlide = slideCanvasRefs.current[activeIndex];
      if (activeSlide) ro.observe(activeSlide);
    } else {
      const onResize = () => computePad();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    return () => {
      ro?.disconnect();
    };
  }, [activeIndex, isCompact]);

  useEffect(() => {
    // ensure centered after layout changes
    requestAnimationFrame(() => centerSlide(activeIndex, "auto"));
  }, [activeIndex, sidePadPx]);

  useEffect(() => {
    const container = mainRef.current as HTMLDivElement | null;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      const thumbsH = thumbBarRef.current?.getBoundingClientRect().height ?? 0;
      const maxW = Math.max(0, rect.width - 16);
      const bottomReserve = isCompact ? TOOLBAR_BOTTOM_H : 0;
      const maxH = Math.max(0, window.innerHeight - rect.top - thumbsH - bottomReserve - 24);
      const scaleW = maxW / BASE_SLIDE_W;
      const scaleH = maxH / BASE_SLIDE_H;
      const next = Math.min(1, scaleW, scaleH);
      setCanvasScale((prev) => {
        const rounded = Number(next.toFixed(3));
        return Math.abs(prev - rounded) > 0.002 ? rounded : prev;
      });
    };

    updateScale();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateScale);
      ro.observe(container);
    }
    window.addEventListener("resize", updateScale);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, [isCompact]);

  const measureImageDimensions = (src: string) =>
    new Promise<{ width: number; height: number; aspect: number }>((resolve) => {
      if (typeof window === "undefined") {
        resolve({
          width: PDF_IMAGE_MAX_WIDTH,
          height: PDF_IMAGE_MAX_HEIGHT,
          aspect: PDF_IMAGE_MAX_WIDTH / PDF_IMAGE_MAX_HEIGHT,
        });
        return;
      }
      const image = new Image();
      image.onload = () => {
        const width = image.naturalWidth || PDF_IMAGE_MAX_WIDTH;
        const height = image.naturalHeight || PDF_IMAGE_MAX_HEIGHT;
        resolve({ width, height, aspect: width / Math.max(height, 1) });
      };
      image.onerror = () =>
        resolve({
          width: PDF_IMAGE_MAX_WIDTH,
          height: PDF_IMAGE_MAX_HEIGHT,
          aspect: PDF_IMAGE_MAX_WIDTH / PDF_IMAGE_MAX_HEIGHT,
        });
      image.src = src;
    });

  const clampSizeToBounds = (width: number, height: number) => {
    if (!width || !height) {
      return { width: PDF_IMAGE_MAX_WIDTH, height: PDF_IMAGE_MAX_HEIGHT };
    }
    const widthScale = PDF_IMAGE_MAX_WIDTH / width;
    const heightScale = PDF_IMAGE_MAX_HEIGHT / height;
    const scale = Math.min(widthScale, heightScale, 1);
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  };

  const computeInitialPosition = (width: number, height: number) => ({
    x: Math.max(10, Math.round((SLIDE_CANVAS_WIDTH - width) / 2)),
    y: Math.max(10, Math.round((SLIDE_CANVAS_HEIGHT - height) / 2)),
  });

  const removePdfImageFromSlide = (slideKey: SlideKey, targetId: string | null) => {
    if (!targetId) return;
    const controller = slideImageControllers[slideKey];
    controller.setImages((prev) => prev.filter((img: any) => img.id !== targetId));
    controller.setSelected((prev) => prev.filter((id: any) => id !== targetId));
  };

  const addPdfImageToSlide = async (slideKey: SlideKey, dataUrl: string, imageId: string) => {
    const controller = slideImageControllers[slideKey];
    const { width: naturalWidth, height: naturalHeight } = await measureImageDimensions(dataUrl);
    const { width, height } = clampSizeToBounds(naturalWidth, naturalHeight);
    const position = computeInitialPosition(width, height);

    controller.setImages((prev) => {
      const filtered = prev.filter((img: any) => img.id !== imageId);
      const maxZIndex = filtered.reduce(
        (max: number, img: any) => Math.max(max, Number(img.zIndex ?? 1)),
        0,
      );
      return [
        ...filtered,
        {
          id: imageId,
          src: dataUrl,
          x: position.x,
          y: position.y,
          width,
          height,
          rotation: 0,
          zIndex: maxZIndex + 1,
          locked: false,
          source: "pdf",
        },
      ];
    });

    controller.setSelected((prev: any) => {
      const filtered = prev.filter((id: any) => id !== imageId);
      return [...filtered, imageId];
    });
  };

  const distributePdfImages = async (pageImages: string[]) => {
    const slideOrder: SlideKey[] = ["slide1", "slide2", "slide3", "slide4"];
    const baseId = Date.now();
    const updatedIds: Record<SlideKey, string | null> = {
      slide1: null,
      slide2: null,
      slide3: null,
      slide4: null,
    };

    for (let idx = 0; idx < slideOrder.length; idx += 1) {
      const slideKey = slideOrder[idx];
      const existingId = pdfImageIds[slideKey];
      if (existingId) {
        removePdfImageFromSlide(slideKey, existingId);
      }

      const pageSrc = pageImages[idx];
      if (pageSrc) {
        const newId = `pdf-${baseId + idx + 1}`;
        await addPdfImageToSlide(slideKey, pageSrc, newId);
        updatedIds[slideKey] = newId;
      } else {
        updatedIds[slideKey] = null;
      }
    }

    setPdfImageIds(updatedIds);
  };

  const handlePdfIconClick = () => {
    if (isPdfProcessing) return;
    pdfInputRef.current?.click();
  };

  const handlePdfSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    // ✅ user cancelled -> don't show alert
    if (!file) {
      input.value = "";
      return;
    }

    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    // console.log("type", file.type, "name", file.name);


    if (!isPdf) {
      alert("Please select a PDF file.");
      input.value = "";
      return;
    }

    setIsPdfProcessing(true);
    try {
      const pages = await pdfFileToPngDataUrls(file, { pages: "all", scale: 2 });

      if (!pages.length) {
        alert("No pages were found in the selected PDF.");
        return;
      }

      await distributePdfImages(pages.slice(0, 4));
    } catch (error) {
      console.error("Failed to process PDF file", error);
      alert("Unable to process the selected PDF. Please try again.");
    } finally {
      setIsPdfProcessing(false);
      input.value = "";
    }
  };


  useEffect(() => {
    setPdfImageIds((prev) => {
      const mapping: Record<SlideKey, any[]> = {
        slide1: draggableImages1 ?? [],
        slide2: draggableImages2 ?? [],
        slide3: draggableImages3 ?? [],
        slide4: draggableImages4 ?? [],
      };
      let changed = false;
      const next = { ...prev };

      (Object.keys(mapping) as SlideKey[]).forEach((key) => {
        const storedId = prev[key];
        if (storedId && !mapping[key]?.some((img: any) => img.id === storedId)) {
          next[key] = null;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [draggableImages1, draggableImages2, draggableImages3, draggableImages4]);


  const scaledW = Math.round(BASE_SLIDE_W * canvasScale);
  const scaledH = Math.round(BASE_SLIDE_H * canvasScale);
  const isScaled = canvasScale < 1;
  const canvasW = isScaled ? scaledW : BASE_SLIDE_W;
  const canvasH = isScaled ? scaledH : BASE_SLIDE_H;
  const slideItemWidth = `${canvasW}px`;
  const slideItemHeight = isCompact
    ? `${canvasH + TOOLBAR_BOTTOM_H}px`
    : `${canvasH}px`;
  const toolbarSideWidth = `${TOOLBAR_SIDE_W}px`;
  const toolbarBottomWidth = `${canvasW}px`;

  return (
    <DndProvider backend={HTML5Backend}>
      <input
        ref={pdfInputRef}
        type="file"
        accept="application/pdf"
        style={{ display: "none" }}
        onChange={handlePdfSelected}
      />
      {/* One Box for Tools */}
      <Box
        sx={{
          maxWidth: "100%",
          margin: "auto",
          textAlign: "center",
          userSelect: "none",
          position: "relative",
          height: '100%',
          "--card-slide-w": `${BASE_SLIDE_W}px`,
          "--card-slide-h": `${BASE_SLIDE_H}px`,
          "--card-slide-display-h": `${canvasH}px`,
          "--card-toolbar-w": toolbarSideWidth,
          "--card-toolbar-gap": `${TOOLBAR_GAP}px`,
          // p: 1
        }}
      >
        {/* Main box */}
        {/* Inside this Box the card and toolbar */}
        <Box
          sx={{
            display: "flex",
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            gap: { xs: 3, sm: 5, md: 7 },
            px: { md: 1, sm: 1, xs: 0.5 },
            py: { md: 4, sm: 4, xs: 1.5 },
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            width: '100%',
            scrollPaddingLeft: `${sidePadPx}px`,
            scrollPaddingRight: `${sidePadPx}px`,
          }}
          ref={mainRef}
          onMouseDown={onMainMouseDown}
          onMouseLeave={onMainMouseLeave}
          onMouseUp={onMainMouseUp}
        // onMouseMove={onMainMouseMove}
        >
          <Box
            sx={{
              flex: "0 0 auto",
              width: `${sidePadPx}px`,
              height: 1,
            }}
          />
          {slides.map((e, index) => {
            const isActive = index === activeIndex;
            const showToolbar = adminEditor
              ? isActive
              : isActive && (index === 1 || index === 2);
            const toolbarSx = isCompact
              ? {
                position: "absolute",
                left: "50%",
                bottom: 0,
                transform: "translateX(-50%)",
                width: toolbarBottomWidth,
                height: `${TOOLBAR_BOTTOM_H}px`,
                maxHeight: `${TOOLBAR_BOTTOM_H}px`,
                bgcolor: "white",
                borderRadius: "8px",
                p: 1,
                display: "flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "center",
                gap: "12px",
                boxShadow: 3,
                overflowX: "auto",
                overflowY: "hidden",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
                zIndex: 20,
                "&::-webkit-scrollbar": { height: "6px" },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f1f1f1ff",
                  borderRadius: "20px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: COLORS.primary,
                  borderRadius: "20px",
                },
              }
              : toolbarContainerStyle;
            return (
              <Box
                key={e.id}
                sx={{
                  flex: "0 0 auto",
                  width: slideItemWidth,
                  height: slideItemHeight,
                  display: "flex",
                  alignItems: isCompact ? "flex-start" : "center",
                  justifyContent: isCompact ? "center" : "flex-end",
                  pb: isCompact ? `${TOOLBAR_BOTTOM_H}px` : 0,
                  transition: "all 0.3s ease",
                  position: "relative",
                  scrollSnapAlign: "center",
                  scrollSnapStop: "always",
                }}
              >
                {showToolbar && (
                  <Box sx={toolbarSx}>
                    <IconButton
                      sx={editingButtonStyle}
                      onClick={() => togglePopup("layout")}
                      aria-label="Layout"
                    >
                      <AutoAwesomeMosaicOutlined fontSize="large" />
                      Layout
                    </IconButton>
                    <IconButton
                      sx={editingButtonStyle}
                      onClick={() => togglePopup("text")}
                      aria-label="Text"
                    >
                      <TitleOutlined fontSize="large" />
                      Text
                    </IconButton>
                    {adminEditor && (
                      <IconButton
                        sx={editingButtonStyle}
                        onClick={() => togglePopup("frames")}
                        aria-label="Frames"
                      >
                        <FilterFramesOutlined fontSize="large" />
                        Frames
                      </IconButton>
                    )}
                    <IconButton
                      sx={editingButtonStyle}
                      onClick={() => togglePopup("photo")}
                      aria-label="Photo"
                    >
                      <CollectionsOutlined fontSize="large" />
                      Photo
                    </IconButton>
                    {adminEditor && index === 0 && (
                      <IconButton
                        sx={editingButtonStyle}
                        onClick={handlePdfIconClick}
                        aria-label="PDF"
                        disabled={isPdfProcessing}
                      >
                        <PictureAsPdfOutlined fontSize="large" />
                        {isPdfProcessing ? "Loading" : "PDF"}
                      </IconButton>
                    )}
                    {adminEditor && (
                      <IconButton
                        sx={editingButtonStyle}
                        onClick={() => togglePopup("BgChanger")}
                        aria-label="BgChanger"
                      >
                        <WallpaperOutlined fontSize="large" />
                        BGImg
                      </IconButton>
                    )}
                    <IconButton
                      sx={editingButtonStyle}
                      onClick={() => togglePopup("sticker")}
                      aria-label="Sticker"
                    >
                      <EmojiEmotionsOutlined fontSize="large" />
                      Sticker
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        togglePopup("video");
                        triggerTipsForSlide(index);
                      }}
                      sx={editingButtonStyle}
                    >
                      <SlideshowOutlined fontSize="large" />
                      Video
                    </IconButton>
                    <IconButton
                      onClick={() => {
                        togglePopup("audio");
                        triggerTipsForSlide(index);
                      }}
                      sx={editingButtonStyle}
                    >
                      <AudiotrackOutlined fontSize="large" />
                      Audio
                    </IconButton>
                  </Box>
                )}

                <Box
                  sx={{
                    width: `${canvasW}px`,
                    height: `${canvasH}px`,
                    borderRadius: 2,
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "row",
                    boxShadow: 5,
                    backgroundColor: "#fff",
                    position: "relative",
                  }}
                  ref={(node: HTMLDivElement | null) => {
                    slideCanvasRefs.current[index] = node;
                  }}
                >
                  <Box
                    sx={{
                      width: `${BASE_SLIDE_W}px`,
                      height: `${BASE_SLIDE_H}px`,
                      transform: isScaled ? `scale(${canvasScale})` : "none",
                      transformOrigin: "top left",
                    }}
                  >
                  {e.id === 1 ? (
                    <SlideCover
                      togglePopup={togglePopup}
                      activeIndex={index}
                      addTextRight={addTextCountFirst}
                      rightBox={true}
                      isCaptureMode={true}
                      isAdminEditor={adminEditor}
                      canvasScale={canvasScale}
                    // coverPng={coverPng}
                    />
                  ) : e.id === 2 ? (
                    <SlideSpread
                      togglePopup={togglePopup}
                      activeIndex={index}
                      addTextRight={addTextCount}
                      rightBox={true}
                      isAdminEditor={adminEditor}
                      canvasScale={canvasScale}
                    />
                  ) : e.id === 3 ? (
                    <SpreadRightSide
                      togglePopup={togglePopup}
                      activeIndex={index}
                      addTextRight={addTextCountRight}
                      rightBox={true}
                      isAdminEditor={adminEditor}
                      canvasScale={canvasScale}
                    />
                  ) : (
                    <SlideLogo
                      togglePopup={togglePopup}
                      activeIndex={index}
                      addTextRight={addTextCountLast}
                      rightBox={true}
                      isAdminEditor={adminEditor}
                      canvasScale={canvasScale}
                    />
                  )}
                  </Box>
                </Box>
              </Box>
            );
          })}
          <Box
            sx={{
              flex: "0 0 auto",
              width: `${sidePadPx}px`,
              height: 1,
            }}
          />

          {activeIndex === 0 && (
            <>
              {activePopup === "layout" && (
                <Layout1Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "text" && (
                <Text1Popup
                  onClose={() => setActivePopup(null)}
                  onShowFontSizePopup={() => setActiveTextSlide1Child("size")}
                  onShowFontColorPopup={() => setActiveTextSlide1Child("color")}
                  onShowFontFamilyPopup={() =>
                    setActiveTextSlide1Child("family")
                  }
                  activeChildComponent={renderActiveTextFirstChild()}
                  onChangeTextAlign={() =>
                    setActiveTextSlide1Child("textAlign")
                  }
                  onAddTextToCanvas={() =>
                    setAddTextCountFirst((prev) => prev + 1)
                  }
                  onSetLineHeightPopup={() => setActiveTextSlide1Child("lineHeight")}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "photo" && (
                <Photo1Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  isAdminEditor={adminEditor}
                />
              )}

              {activePopup === "photo" && (
                <ImageAdjustment1
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                // togglePopup={togglePopup("photo")}
                />
              )}
              {activePopup === "frames" && (
                <ShapeFrames
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "photo" && (
                <ImageAdjustment1
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  isAdminEditor={!!adminEditor}
                />
              )}
              {
                activePopup === "BgChanger" && (
                  <BgChanger
                    onClose={() => setActivePopup(null)}
                    activeIndex={activeIndex}
                  />
                )
              }

              {activePopup === "sticker" && (
                <Sticker1Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "video" && (
                <Video1Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "audio" && (
                <Media1Popup
                  onClose={() => setActivePopup(null)}
                  mediaType="audio"
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "geneAi" && (
                <GeneAIPopup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}
            </>
          )}

          {activeIndex === 1 && (
            <>
              {activePopup === "layout" && (
                <LayoutPopup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "text" && (
                <TextPopup
                  onClose={() => setActivePopup(null)}
                  onShowFontSizePopup={() => setActiveTextChild("size")}
                  onShowFontColorPopup={() => setActiveTextChild("color")}
                  onShowFontFamilyPopup={() => setActiveTextChild("family")}
                  activeChildComponent={renderActiveTextChild()}
                  onChangeTextAlign={() => setActiveTextChild("textAlign")}
                  onAddTextToCanvas={() => setAddTextCount((prev) => prev + 1)}
                  onSetLineHeightPopup={() => setActiveTextChild("lineHeight")}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "photo" && (
                <PhotoPopup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  isAdminEditor={adminEditor}
                />
              )}
              {activePopup === "sticker" && (
                <StickerPopup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}
              {activePopup === "photo" && (
                <ImageAdjustment
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  isAdminEditor={!!adminEditor}
                // togglePopup={togglePopup("photo")}
                />
              )}
              {
                activePopup === "BgChanger" && (
                  <BgChanger2
                    onClose={() => setActivePopup(null)}
                    activeIndex={activeIndex}
                  />
                )
              }
              {
                activePopup === "frames" && (
                  <ShapeFrames2
                    onClose={() => setActivePopup(null)}
                    activeIndex={activeIndex}
                  />
                )
              }
              {activePopup === "video" && (
                <VideoPopup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "audio" && (
                <MediaPopup
                  onClose={() => setActivePopup(null)}
                  mediaType="audio"
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "art" && (
                <GeneAI2Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  photoArt={true}
                />
              )}
              {activePopup === "geneAi" && (
                <GeneAI2Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}
            </>
          )}

          {activeIndex === 2 && (
            <>
              {activePopup === "layout" && (
                <Layout3Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "text" && (
                <Text3Popup
                  onClose={() => setActivePopup(null)}
                  onShowFontSizePopup={() => setActiveTextSlide3Child("size")}
                  onShowFontColorPopup={() => setActiveTextSlide3Child("color")}
                  onShowFontFamilyPopup={() =>
                    setActiveTextSlide3Child("family")
                  }
                  onSetLineHeightPopup={() => setActiveTextSlide3Child("lineHeight")}
                  onChangeTextAlign={() =>
                    setActiveTextSlide3Child("textAlign")
                  }
                  renderActiveTextSlide3Child={renderActiveTextSlide3Child()}
                  onAddTextToCanvas={() =>
                    setAddTextCountRight((prev) => prev + 1)
                  }
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "photo" && (
                <Photo3Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  isAdminEditor={adminEditor}
                />
              )}

              {activePopup === "photo" && (
                <ImageAdjustment3Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  isAdminEditor={!!adminEditor}
                // togglePopup={togglePopup("photo")}
                />
              )}

              {
                activePopup === "BgChanger" && (
                  <BgChanger3
                    onClose={() => setActivePopup(null)}
                    activeIndex={activeIndex}
                  />
                )
              }
              {
                activePopup === "frames" && (
                  <ShapeFrames3
                    onClose={() => setActivePopup(null)}
                    activeIndex={activeIndex}
                  />
                )
              }

              {activePopup === "sticker" && (
                <Sticker3Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "video" && (
                <Video3Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "audio" && (
                <Media3Popup
                  onClose={() => {
                    setActivePopup(null);
                  }}
                  mediaType="audio"
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "geneAi" && (
                <GeneAI3Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}
            </>
          )}

          {activeIndex === 3 && (
            <>
              {activePopup === "layout" && (
                <Layout4Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "text" && (
                <Text4Popup
                  onClose={() => setActivePopup(null)}
                  onShowFontSizePopup={() => setActiveTextSlideLastChild("size")}
                  onShowFontColorPopup={() => setActiveTextSlideLastChild("color")}
                  onShowFontFamilyPopup={() =>
                    setActiveTextSlideLastChild("family")
                  }
                  onSetLineHeightPopup={() => setActiveTextSlideLastChild("lineHeight")}
                  onChangeTextAlign={() =>
                    setActiveTextSlideLastChild("textAlign")
                  }
                  activeChildComponent={renderActiveTextSlideLastChild()}
                  onAddTextToCanvas={() =>
                    setAddTextCountLast((prev) => prev + 1)
                  }
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "photo" && (
                <Photo4Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  isAdminEditor={adminEditor}
                />
              )}

              {activePopup === "photo" && (
                <ImageAdjustment4Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                  isAdminEditor={!!adminEditor}
                // togglePopup={togglePopup("photo")}
                />
              )}

              {activePopup === "sticker" && (
                <Sticker4Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}
              {
                activePopup === "BgChanger" && (
                  <BgChanger4
                    onClose={() => setActivePopup(null)}
                    activeIndex={activeIndex}
                  />
                )
              }
              {
                activePopup === "frames" && (
                  <ShapeFrames4
                    onClose={() => setActivePopup(null)}
                    activeIndex={activeIndex}
                  />
                )
              }

              {activePopup === "video" && (
                <Video4Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "audio" && (
                <Media4Popup
                  onClose={() => {
                    setActivePopup(null);
                  }}
                  mediaType="audio"
                  activeIndex={activeIndex}
                />
              )}

              {activePopup === "geneAi" && (
                <GeneAI4Popup
                  onClose={() => setActivePopup(null)}
                  activeIndex={activeIndex}
                />
              )}
            </>
          )}

        </Box>

        {/* Thumbnail gallery */}
        <Box
          ref={thumbBarRef}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
            position: "relative",
            bottom: { md: 20, sm: 20, xs: -10 },
            width: '100%',
            userSelect: "none",
            background: "transparent",
            zIndex: 22,
          }}
        >
          {/* Prev button */}
          <IconButton
            onClick={() => handleSlideChange("left")}
            sx={{
              zIndex: 100,
            }}
            aria-label="scroll thumbnails left"
          >
            <ArrowBackIos sx={{ color: "#212121" }} />
          </IconButton>

          {/* Thumbnails container */}
          <Box
            ref={thumbRef}
            sx={{
              display: "flex",
              overflowX: "auto",
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              gap: 1,
              px: { md: 0.5, sm: 0.5, xs: 0 },
              cursor: isThumbDragging.current ? "grabbing" : "grab",
              userSelect: "none",
              width: "auto",
            }}
            onMouseDown={onThumbMouseDown}
            onMouseLeave={onThumbMouseLeave}
            onMouseUp={onThumbMouseUp}
            onMouseMove={onThumbMouseMove}
          >
            {slides.map((e, index) => (
              <Box
                key={index}
                onClick={() => scrollToSlide(index)}
                sx={{
                  width: { md: 70, sm: 70, xs: 60 },
                  height: { md: 80, sm: 80, xs: 60 },
                  bgcolor: "#ccc",
                  color: "#212121",
                  // color: index === activeIndex ? "white" : "black",
                  // borderRadius: 1,
                  cursor: "pointer",
                  border:
                    index === activeIndex
                      ? "2px solid #1976d2"
                      : "2px solid transparent",
                  opacity: index === activeIndex ? 1 : 0.6,
                  transition: "all 0.3s ease",
                  flexShrink: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  userSelect: "none",
                  fontSize: "15px",
                  borderRadius: 2
                }}
              >
                {e.label}
              </Box>
            ))}
          </Box>

          {/* Next button */}
          <IconButton
            onClick={() => handleSlideChange("right")}
            sx={{
              zIndex: 10,
            }}
            aria-label="scroll thumbnails right"
          >
            <ArrowForwardIos sx={{ color: "#212121" }} />
          </IconButton>
        </Box>

      </Box>
      <GlobalWatermark />
    </DndProvider>
  );
};

export default WishCard;

const editingButtonStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontSize: "13px",
  minWidth: "56px",
  minHeight: "40px",
  px: 0.5,
  py: 0.5,
  flexShrink: 0,
  color: "#212121",
  "& .MuiSvgIcon-root": {
    fontSize: "26px",
  },
  "&:hover": {
    color: "#3a7bd5",
  },
  "@media (max-height: 760px)": {
    fontSize: "11px",
    minHeight: "34px",
    py: 0.25,
    "& .MuiSvgIcon-root": {
      fontSize: "22px",
    },
  },
};

const toolbarContainerStyle = {
  position: "absolute" as const,
  left: "calc(-1 * (var(--card-toolbar-w, 60px) + var(--card-toolbar-gap, 12px)))",
  top: "50%",
  transform: "translateY(-50%)",
  width: "var(--card-toolbar-w, 60px)",
  height: "calc(var(--card-slide-display-h, 700px) - 16px)",
  maxHeight: "calc(var(--card-slide-display-h, 700px) - 16px)",
  bgcolor: "white",
  borderRadius: "6px",
  p: 0.75,
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  boxShadow: 3,
  overflowY: "auto",
  zIndex: 20,
  "@media (max-height: 760px)": {
    p: 0.5,
    gap: "6px",
  },
  "&::-webkit-scrollbar": {
    width: "5px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "#f1f1f1ff",
    borderRadius: "20px",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: COLORS.primary,
    borderRadius: "20px",
  },
};
