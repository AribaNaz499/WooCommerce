import { useEffect, useRef, useState } from "react";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import "./card.css";
import GlobalWatermark from "../../../../../components/GlobalWatermark/GlobalWatermark";
import Slide1 from "../Slide1/Slide1";
import Slide2 from "../Slide2/Slide2";
import Slide3 from "../Slide3/Slide3";
import Slide4 from "../Slide4/Slide4";
import { useNavigate } from "react-router-dom";
import { USER_ROUTES } from "../../../../../constant/route";
import LandingButton from "../../../../../components/LandingButton/LandingButton";
import { clearSlidesFromIdb, clearSlidesFromIdbByPrefix } from "../../../../../lib/idbSlides";
import { useSlide1 } from "../../../../../context/Slide1Context";
import { useSlide2 } from "../../../../../context/Slide2Context";
import { useSlide3 } from "../../../../../context/Slide3Context";
import { useSlide4 } from "../../../../../context/Slide4Context";
import { saveCardSnapshot } from "../../../../../lib/cardSnapshotStore";
import toast from "react-hot-toast";

const PreviewBookCard = () => {
  const [currentLocation, setCurrentLocation] = useState(1);
  const [mobileIndex, setMobileIndex] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  const navigate = useNavigate();

  const slide1State = useSlide1();
  const slide2State = useSlide2();
  const slide3State = useSlide3();
  const slide4State = useSlide4();

  const isMobile = useMediaQuery("(max-width:500px)");
  const previewAreaRef = useRef<HTMLDivElement | null>(null);
  const captureRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [previewArea, setPreviewArea] = useState({ w: 0, h: 0 });
  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const onResize = () => {
      if (typeof window === "undefined") return;
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };

    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!previewAreaRef.current || typeof ResizeObserver === "undefined") return;

    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const cr = entry.contentRect;
      setPreviewArea({ w: cr.width, h: cr.height });
    });

    obs.observe(previewAreaRef.current);
    return () => obs.disconnect();
  }, []);

  const numOfPapers = 2;
  const maxLocation = numOfPapers + 1;
  const TOTAL_SLIDES = 4;

  const goNextPage = () => {
    if (isMobile) {
      setMobileIndex((i) => Math.min(i + 1, TOTAL_SLIDES));
      return;
    }

    if (currentLocation < maxLocation) {
      setCurrentLocation((prev) => prev + 1);
    }
  };

  const goPrevPage = () => {
    if (isMobile) {
      setMobileIndex((i) => Math.max(i - 1, 1));
      return;
    }

    if (currentLocation > 1) {
      setCurrentLocation((prev) => prev - 1);
    }
  };

  const getBookTransform = () => {
    if (currentLocation === 1) return "translateX(0%)";
    if (currentLocation === maxLocation) return "translateX(100%)";
    return "translateX(50%)";
  };

  const isPrevDisabled = isMobile ? mobileIndex === 1 : currentLocation === 1;
  const isNextDisabled = isMobile ? mobileIndex === TOTAL_SLIDES : currentLocation === maxLocation;

  useEffect(() => {
    try {
      sessionStorage.setItem("card_preview_downloaded", "0");
    } catch {}
  }, []);

  const clearAllStorageKeys = () => {
    const sessionKeys = [
      "slides",
      "slides_preview_only",
      "rawSlidesCount",
      "capturedSlides",
      "capturedSlidesKey",
      "templ_preview_slides",
      "templ_preview_key",
      "templ_preview_category",
      "templ_preview_config",
      "slides_mirrored",
      "slides_mirrored_category",
      "card_runtime_snapshot",
      "card_preview_downloaded",
      "snapshot_timestamp",
    ];

    sessionKeys.forEach((k) => {
      try {
        sessionStorage.removeItem(k);
      } catch {}
    });

    const localKeys = [
      "slides_backup",
      "card_runtime_snapshot_backup",
      "snapshot_timestamp_backup",
    ];

    localKeys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {}
    });

    try {
      delete (globalThis as any).__slidesCache;
      delete (globalThis as any).__preparedSlidesCache;
      delete (globalThis as any).__rawSlidesCache;
      delete (globalThis as any).__previewConfigCache;
    } catch {}
  };

  const stripLargeFields = (slide: any) => {
    if (!slide) return slide;

    const stripped = { ...slide };

    if (Array.isArray(stripped.draggableImages)) {
      stripped.draggableImages = stripped.draggableImages.map((img: any) => {
        if (!img) return img;
        const isBig = typeof img?.src === "string" && img.src.startsWith("data:");
        return isBig ? { ...img, src: null } : img;
      });
    }

    if (typeof stripped.aimage === "string" && stripped.aimage.startsWith("data:")) {
      stripped.aimage = null;
    }

    if (typeof stripped.selectedImg === "string" && stripped.selectedImg.startsWith("data:")) {
      stripped.selectedImg = null;
    }

    if (
      typeof stripped.selectedAIimageUrl === "string" &&
      stripped.selectedAIimageUrl.startsWith("data:")
    ) {
      stripped.selectedAIimageUrl = null;
    }

    if (Array.isArray(stripped.selectedStickers)) {
      stripped.selectedStickers = stripped.selectedStickers.map((s: any) => {
        if (!s) return s;
        const isBig = typeof s?.src === "string" && s.src.startsWith("data:");
        return isBig ? { ...s, src: null } : s;
      });
    }

    if (Array.isArray(stripped.textElements)) {
      stripped.textElements = stripped.textElements.map((el: any) => {
        if (!el) return el;
        const isBig =
          typeof el?.backgroundImage === "string" &&
          el.backgroundImage.startsWith("data:");

        return isBig ? { ...el, backgroundImage: null } : el;
      });
    }

    return stripped;
  };

  const handleDownload = async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      const runtimeCardSnapshot = {
        capturedAt: Date.now(),
        version: "2.0",

        slide1: {
          bgColor: slide1State.bgColor1,
          layout: slide1State.layout1,
          draggableImages: slide1State.draggableImages1,
          selectedImg: slide1State.selectedImg1,
          multipleTextValue: slide1State.multipleTextValue1,
          texts: slide1State.texts1,
          selectedLayout: slide1State.selectedLayout1,
          oneTextValue: slide1State.oneTextValue1,
          fontColor: slide1State.fontColor1,
          fontFamily: slide1State.fontFamily1,
          fontSize: slide1State.fontSize1,
          fontWeight: slide1State.fontWeight1,
          textAlign: slide1State.textAlign1,
          verticalAlign: slide1State.verticalAlign1,
          textElements: slide1State.textElements1,
          isAIimage: slide1State.isAIimage1,
          selectedAIimageUrl: slide1State.selectedAIimageUrl1,
          aimage: slide1State.aimage1,
          selectedStickers: slide1State.selectedStickers1,
          lineHeight: slide1State.lineHeight1,
          letterSpacing: slide1State.letterSpacing1,
          selectedVideoUrl: null,
          qrPosition: null,
          selectedAudioUrl: null,
          qrAudioPosition: null,
        },

        slide2: {
          bgColor: slide2State.bgColor2,
          layout: slide2State.layout2,
          draggableImages: slide2State.draggableImages,
          selectedImg: slide2State.selectedImg,
          multipleTextValue: slide2State.multipleTextValue,
          texts: slide2State.texts,
          selectedLayout: slide2State.selectedLayout,
          oneTextValue: slide2State.oneTextValue,
          fontColor: slide2State.fontColor,
          fontFamily: slide2State.fontFamily,
          fontSize: slide2State.fontSize,
          fontWeight: slide2State.fontWeight,
          textAlign: slide2State.textAlign,
          verticalAlign: slide2State.verticalAlign,
          textElements: slide2State.textElements,
          isAIimage: slide2State.isAIimage2,
          selectedAIimageUrl: slide2State.selectedAIimageUrl2,
          aimage: slide2State.aimage2,
          selectedStickers: slide2State.selectedStickers2,
          selectedVideoUrl: slide2State.selectedVideoUrl,
          qrPosition: slide2State.qrPosition,
          selectedAudioUrl: slide2State.selectedAudioUrl,
          qrAudioPosition: slide2State.qrAudioPosition,
          lineHeight: slide2State.lineHeight2,
          letterSpacing: slide2State.letterSpacing2,
        },

        slide3: {
          bgColor: slide3State.bgColor3,
          layout: slide3State.layout3,
          draggableImages: slide3State.draggableImages3,
          selectedImg: slide3State.selectedImg3,
          multipleTextValue: slide3State.multipleTextValue3,
          texts: slide3State.texts3,
          selectedLayout: slide3State.selectedLayout3,
          oneTextValue: slide3State.oneTextValue3,
          fontColor: slide3State.fontColor3,
          fontFamily: slide3State.fontFamily3,
          fontSize: slide3State.fontSize3,
          fontWeight: slide3State.fontWeight3,
          textAlign: slide3State.textAlign3,
          verticalAlign: slide3State.verticalAlign3,
          textElements: slide3State.textElements3,
          isAIimage: slide3State.isAIimage3,
          selectedAIimageUrl: slide3State.selectedAIimageUrl3,
          aimage: slide3State.aimage3,
          selectedStickers: slide3State.selectedStickers3,
          selectedVideoUrl: slide3State.selectedVideoUrl3,
          qrPosition: slide3State.qrPosition3,
          selectedAudioUrl: slide3State.selectedAudioUrl3,
          qrAudioPosition: slide3State.qrAudioPosition3,
          lineHeight: slide3State.lineHeight3,
          letterSpacing: slide3State.letterSpacing3,
        },

        slide4: {
          bgColor: slide4State.bgColor4,
          layout: slide4State.layout4,
          draggableImages: slide4State.draggableImages4,
          selectedImg: slide4State.selectedImg4,
          multipleTextValue: slide4State.multipleTextValue4,
          texts: slide4State.texts4,
          selectedLayout: slide4State.selectedLayout4,
          oneTextValue: slide4State.oneTextValue4,
          fontColor: slide4State.fontColor4,
          fontFamily: slide4State.fontFamily4,
          fontSize: slide4State.fontSize4,
          fontWeight: slide4State.fontWeight4,
          textAlign: slide4State.textAlign4,
          verticalAlign: slide4State.verticalAlign4,
          textElements: slide4State.textElements4,
          isAIimage: slide4State.isAIimage4,
          selectedAIimageUrl: slide4State.selectedAIimageUrl4,
          aimage: slide4State.aimage4,
          selectedStickers: slide4State.selectedStickers4,
          selectedVideoUrl: slide4State.selectedVideoUrl4,
          qrPosition: slide4State.qrPosition4,
          selectedAudioUrl: slide4State.selectedAudioUrl4,
          qrAudioPosition: slide4State.qrAudioPosition4,
          lineHeight: slide4State.lineHeight4,
          letterSpacing: slide4State.letterSpacing4,
        },
      };

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      clearAllStorageKeys();

      const snapshotForStorage = {
        ...runtimeCardSnapshot,
        slide1: stripLargeFields(runtimeCardSnapshot.slide1),
        slide2: stripLargeFields(runtimeCardSnapshot.slide2),
        slide3: stripLargeFields(runtimeCardSnapshot.slide3),
        slide4: stripLargeFields(runtimeCardSnapshot.slide4),
      };

      try {
        sessionStorage.setItem("slides_preview_only", "1");
        sessionStorage.setItem("rawSlidesCount", "4");
        sessionStorage.setItem("card_preview_downloaded", "1");
        sessionStorage.setItem("card_runtime_snapshot", JSON.stringify(snapshotForStorage));
        sessionStorage.setItem("snapshot_timestamp", String(runtimeCardSnapshot.capturedAt));

        localStorage.setItem(
          "card_runtime_snapshot_backup",
          JSON.stringify(snapshotForStorage)
        );
        localStorage.setItem(
          "snapshot_timestamp_backup",
          String(runtimeCardSnapshot.capturedAt)
        );
      } catch (storageError) {
        console.warn("Storage quota exceeded. Using IndexedDB snapshot.", storageError);

        try {
          sessionStorage.setItem("slides_preview_only", "1");
          sessionStorage.setItem("rawSlidesCount", "4");
          sessionStorage.setItem("card_preview_downloaded", "1");
          sessionStorage.setItem("snapshot_timestamp", String(runtimeCardSnapshot.capturedAt));
        } catch {}
      }

      try {
        await Promise.allSettled([
          clearSlidesFromIdb(),
          clearSlidesFromIdbByPrefix("prepared:"),
        ]);
      } catch {}

      const snapshotKey = `card_runtime_snapshot_${runtimeCardSnapshot.capturedAt}`;

      await saveCardSnapshot(snapshotKey, runtimeCardSnapshot);

      navigate(USER_ROUTES.SUBSCRIPTION, {
        replace: true,
        state: {
          previewOnly: true,
          snapshotKey,
          timestamp: runtimeCardSnapshot.capturedAt,
          source: "preview_book_card",
        },
      });

      return;
    } catch (e) {
      console.error("Download/navigation error:", e);
      toast.error("Something went wrong. Please try again.");
      setIsNavigating(false);
    }
  };

  const BASE_PAGE = { w: 500, h: 700 };
  const BASE_BOOK = { w: 1000, h: 700 };

  const areaW = Math.max(260, (previewArea.w || viewport.w || 0) - 8);
  const areaH = Math.max(320, (previewArea.h || viewport.h || 0) - 8);

  const mobileScale = Math.min(1, areaW / BASE_PAGE.w, areaH / BASE_PAGE.h);
  const bookScale = Math.min(1, areaW / BASE_BOOK.w, areaH / BASE_BOOK.h);

  const renderSlideByIndex = (index: number) => {
    switch (index) {
      case 1:
        return <Slide1 />;
      case 2:
        return <Slide2 />;
      case 3:
        return <Slide3 />;
      case 4:
        return <Slide4 />;
      default:
        return null;
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 3,
          justifyContent: "flex-end",
          alignItems: "flex-end",
          m: "auto",
          p: 2,
          mt: -9,
        }}
      >
        <div
          style={{
            opacity: isNavigating ? 0.6 : 1,
            pointerEvents: isNavigating ? "none" : "auto",
          }}
        >
          <LandingButton
            title={isNavigating ? "Loading..." : "Download"}
            onClick={handleDownload}
          />
        </div>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          m: "auto",
          flexDirection: "column",
          mt: 4,
        }}
      >
        <Box
          ref={previewAreaRef}
          sx={{
            width: "100%",
            maxWidth: "92vw",
            height: isMobile ? "70vh" : "72vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isMobile ? (
            <div
              style={{
                width: `${BASE_PAGE.w * mobileScale}px`,
                height: `${BASE_PAGE.h * mobileScale}px`,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${BASE_PAGE.w}px`,
                  height: `${BASE_PAGE.h}px`,
                  transform: `scale(${mobileScale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  inset: 0,
                }}
              >
                <div
                  className="book-container mobile-only"
                  style={{ width: `${BASE_PAGE.w}px`, height: `${BASE_PAGE.h}px` }}
                >
                  <div
                    className="mobile-slide"
                    aria-live="polite"
                    style={{ width: `${BASE_PAGE.w}px`, height: `${BASE_PAGE.h}px` }}
                  >
                    {renderSlideByIndex(mobileIndex)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                width: `${BASE_BOOK.w * bookScale}px`,
                height: `${BASE_BOOK.h * bookScale}px`,
                position: "relative",
              }}
            >
              <div
                style={{
                  width: `${BASE_BOOK.w}px`,
                  height: `${BASE_BOOK.h}px`,
                  transform: `scale(${bookScale})`,
                  transformOrigin: "top left",
                  position: "absolute",
                  inset: 0,
                }}
              >
                <div
                  className="book-container"
                  style={{ width: `${BASE_BOOK.w}px`, height: `${BASE_BOOK.h}px` }}
                >
                  <div
                    id="book"
                    className="book"
                    style={{
                      transform: getBookTransform(),
                      transition: "transform 0.5s ease",
                    }}
                  >
                    <div
                      id="p1"
                      className={`paper ${currentLocation > 1 ? "flipped" : ""}`}
                      style={{ zIndex: currentLocation > 1 ? 1 : 2 }}
                    >
                      <div className="front">
                        <div className="front-content capture-slide" id="sf1">
                          <Slide1 />
                        </div>
                      </div>

                      <div className="back">
                        <div className="back-content capture-slide" id="b1">
                          <Slide2 />
                        </div>
                      </div>
                    </div>

                    <div
                      id="p2"
                      className={`paper ${currentLocation > 2 ? "flipped" : ""}`}
                      style={{ zIndex: currentLocation > 2 ? 2 : 1 }}
                    >
                      <div className="front">
                        <div className="front-content capture-slide" id="f2">
                          <Slide3 />
                        </div>
                      </div>

                      <div className="back">
                        <div className="back-content capture-slide" id="b2">
                          <Slide4 />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Box>

        <Box
          sx={{
            position: "fixed",
            left: -10000,
            top: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <div
            ref={(n) => {
              captureRefs.current[1] = n;
            }}
            style={{ width: 500, height: 700, overflow: "hidden" }}
          >
            <Slide1 />
          </div>

          <div
            ref={(n) => {
              captureRefs.current[2] = n;
            }}
            style={{ width: 500, height: 700, overflow: "hidden" }}
          >
            <Slide2 />
          </div>

          <div
            ref={(n) => {
              captureRefs.current[3] = n;
            }}
            style={{ width: 500, height: 700, overflow: "hidden" }}
          >
            <Slide3 />
          </div>

          <div
            ref={(n) => {
              captureRefs.current[4] = n;
            }}
            style={{ width: 500, height: 700, overflow: "hidden" }}
          >
            <Slide4 />
          </div>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: "10px",
            alignItems: "center",
            mt: 3,
            position: "relative",
            zIndex: 100001,
            pointerEvents: "auto",
          }}
        >
          <IconButton
            id="prev-btn"
            onClick={goPrevPage}
            disabled={isPrevDisabled}
            sx={{
              ...changeModuleBtn,
              border: `${isPrevDisabled ? "1px solid gray" : "1px solid #8D6DA1"}`,
            }}
            aria-label="Previous page"
          >
            <KeyboardArrowLeft fontSize="large" />
          </IconButton>

          <IconButton
            id="next-btn"
            onClick={goNextPage}
            disabled={isNextDisabled}
            sx={{
              ...changeModuleBtn,
              border: `${isNextDisabled ? "1px solid gray" : "1px solid #8D6DA1"}`,
            }}
            aria-label="Next page"
          >
            <KeyboardArrowRight fontSize="large" />
          </IconButton>
        </Box>

        <GlobalWatermark />
      </Box>
    </>
  );
};

export default PreviewBookCard;

const changeModuleBtn = {
  border: "1px solid #3a7bd5",
  p: 1,
  position: "relative",
  zIndex: 100001,
  pointerEvents: "auto",
  display: "flex",
  justifyContent: "center",
  color: "#212121",
  alignItems: "center",
  "&.Mui-disabled": {
    color: "gray",
    cursor: "default",
    pointerEvents: "none",
  },
};