import { useSlide4 } from "../../../../../context/Slide4Context";
import { Box, Typography } from "@mui/material";
import QrGenerator from "../../../../../components/QR-code/Qrcode";
type AnyEl = Record<string, any>;
const SLIDE4_QR_SIZE = 68;

const safeClip = (cp?: string | null) => (cp && typeof cp === "string" ? cp : "none");
const safeFilter = (f?: string | null) => (f && typeof f === "string" ? f : "none");
const val = <T,>(v: T | undefined, d: T) => (v === undefined || v === null ? d : v);

type Slide4Props = {
  ref?: any
}

const Slide4 = (props: Slide4Props) => {
  const {
    texts4,
    oneTextValue4,
    multipleTextValue4,
    draggableImages4,
    fontColor4,
    fontFamily4,
    fontSize4,
    fontWeight4,
    selectedImg4,
    verticalAlign4,
    selectedVideoUrl4,
    qrPosition4,
    textAlign4,
    selectedLayout4,
    selectedAudioUrl4,
    qrAudioPosition4,
    textElements4,
    selectedAIimageUrl4,
    selectedStickers4,
    isAIimage4,
    aimage4,

    lineHeight4,
    letterSpacing4,
    layout4,
    bgColor4,
  } = useSlide4();
  const { ref } = props
  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: bgColor4 ?? "transparent",
        // backgroundImage: bgImage4 ? `url(${bgImage4})` : "none",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {layout4 && (
        <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
          {/* IMAGES / BG ELEMENTS */}
          {layout4?.elements
            ?.slice()
            .sort((a: AnyEl, b: AnyEl) => (val(a.zIndex, 1) - val(b.zIndex, 1)))
            .map((el: AnyEl) => (
              <Box
                key={el.id}
                sx={{
                  position: "absolute",
                  left: val(el.x, 0),
                  top: val(el.y, 0),
                  width: val(el.width, 0),
                  height: val(el.height, 0),
                  borderRadius: 1,
                  // must be visible so clipPath can show outside rectangular bounds if needed
                  overflow: "visible",
                  zIndex: val(el.zIndex, 1),
                }}
              >
                <Box
                  component="img"
                  src={el.src || undefined}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: el.id === "bg-image" ? "cover" : (el.objectFit || "fill"),
                    borderRadius: 1,
                    display: "block",
                    pointerEvents: "none",
                    // visual treatments
                    filter: safeFilter(el.filter || el.cssFilter),
                    transform: `rotate(${val(el.rotation, 0)}deg)`,
                    transformOrigin: "center center",
                    // shape support
                    clipPath: safeClip(el.clipPath || el.shapePath),
                    WebkitClipPath: safeClip(el.clipPath || el.shapePath),
                    // optional blend mode / opacity
                    mixBlendMode: el.blendMode || "normal",
                    opacity: el.opacity !== undefined ? el.opacity : 1,
                  }}
                />
              </Box>
            ))}

          {/* TEXTS */}
          {layout4.textElements
            ?.slice()
            .sort((a: AnyEl, b: AnyEl) => (val(a.zIndex, 2) - val(b.zIndex, 2)))
            .map((te: AnyEl) => {
              const hAlign =
                te.textAlign === "left" ? "flex-start" : te.textAlign === "right" ? "flex-end" : "center";
              const vAlign =
                te.verticalAlign === "top" ? "flex-start" : te.verticalAlign === "bottom" ? "flex-end" : "center";

              return (
                <Box
                  key={te.id}
                  sx={{
                    position: "absolute",
                    left: val(te.x, 0),
                    top: val(te.y, 0),
                    width: val(te.width, 0),
                    height: val(te.height, 0),
                    display: "flex",
                    justifyContent: hAlign,
                    alignItems: vAlign,
                    // typography
                    color: te.color || "#000",
                    fontSize: val(te.fontSize, 16),
                    fontFamily: te.fontFamily || "Roboto, sans-serif",
                    fontWeight: te.bold ? 700 : val(te.fontWeight, 400),
                    fontStyle: te.italic ? "italic" : "normal",
                    letterSpacing: te.letterSpacing !== undefined ? te.letterSpacing : 0,
                    lineHeight: te.lineHeight !== undefined ? te.lineHeight : 1.2,
                    textTransform: te.uppercase ? "uppercase" : "none",
                    textAlign: te.textAlign || "center",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    // transforms
                    transform: `rotate(${val(te.rotation, 0)}deg)`,
                    transformOrigin: "center center",
                    zIndex: val(te.zIndex, 2),
                    pointerEvents: "none",
                  }}
                >
                  {te.text || ""}
                </Box>
              );
            })}

          {/* STICKERS */}
          {layout4.stickers
            ?.slice()
            .sort((a: AnyEl, b: AnyEl) => (val(a.zIndex, 50) - val(b.zIndex, 50)))
            .map((st: AnyEl) => (
              <Box
                key={st.id}
                sx={{
                  position: "absolute",
                  left: val(st.x, 0),
                  top: val(st.y, 0),
                  width: val(st.width, 0),
                  height: val(st.height, 0),
                  borderRadius: 1,
                  zIndex: val(st.zIndex, 50),
                  pointerEvents: "none",
                }}
              >
                <Box
                  component="img"
                  src={st.sticker}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: 1,
                    // visual treatments
                    filter: safeFilter(st.filter || st.cssFilter),
                    transform: `rotate(${val(st.rotation, 0)}deg)`,
                    transformOrigin: "center center",
                    // shapes for sticker if provided
                    clipPath: safeClip(st.clipPath || st.shapePath),
                    WebkitClipPath: safeClip(st.clipPath || st.shapePath),
                    mixBlendMode: st.blendMode || "normal",
                    opacity: st.opacity !== undefined ? st.opacity : 1,
                  }}
                />
              </Box>
            ))}
        </Box>
      )}

      {selectedVideoUrl4 && (
        <Box
          sx={{
            position: "absolute",
            top: qrPosition4.y,
            left: qrPosition4.x,
            width: "100%",
            height: 180,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            textAlign: "center",
            zIndex: qrPosition4.zIndex || 1,
          }}
        >
          {/* Background Image */}
          <Box
            component="img"
            src="/assets/images/video-qr-tips.png"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "6px",
            }}
          />

          {/* QR Code */}
          <Box
            sx={{
              position: "absolute",
              top: 49,
              width: SLIDE4_QR_SIZE,
              height: SLIDE4_QR_SIZE,
              left: 58,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <QrGenerator
              url={qrPosition4.url || selectedVideoUrl4}
              size={SLIDE4_QR_SIZE}
              style={{ borderRadius: 8, overflow: "hidden" }}
            />
          </Box>

          {/* Clickable Link */}
          <a
            href={`${selectedVideoUrl4}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Typography
              sx={{
                position: "absolute",
                top: 71,
                right: 25,
                zIndex: 99,
                color: "black",
                fontSize: "10px",
                width: "105px",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {`${selectedVideoUrl4.slice(0, 20)}.....`}
            </Typography>
          </a>
        </Box>
      )}

      {selectedAudioUrl4 && (
        <Box
          sx={{
            position: "absolute", // use absolute like Rnd
            top: qrAudioPosition4.y,
            left: qrAudioPosition4.x,
            width: "100%",
            height: 190,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            textAlign: "center",
            zIndex: qrAudioPosition4.zIndex || 1,
          }}
        >
          {/* Background Image */}
          <Box
            component="img"
            src="/assets/images/audio-qr-tips.png"
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "6px",
            }}
          />

          {/* QR Code */}
          <Box
            sx={{
              position: "absolute",
              top: 57,
              width: SLIDE4_QR_SIZE,
              height: SLIDE4_QR_SIZE,
              left: 65,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <QrGenerator
              url={qrAudioPosition4.url || selectedAudioUrl4}
              size={SLIDE4_QR_SIZE}
              style={{ borderRadius: 8, overflow: "hidden" }}
            />
          </Box>

          {/* Clickable Link */}
          <a
            href={`${selectedAudioUrl4}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Typography
              sx={{
                position: "absolute",
                top: 71,
                right: 25,
                zIndex: 99,
                color: "black",
                fontSize: "10px",
                width: "105px",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {`${selectedAudioUrl4.slice(0, 20)}.....`}
            </Typography>
          </a>
        </Box>
      )}

      {/* 🖼️ Only selected images */}
      {draggableImages4
        .filter((img: any) => selectedImg4?.includes(img.id))
        .sort((a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((img: any) => (
          <Box
            key={img.id}
            component="img"
            src={img.src}
            sx={{
              position: "absolute", // ✅ critical for proper placement
              width: img.width,
              height: img.height,
              left: img.x,
              top: img.y,
              transform: `rotate(${img.rotation || 0}deg)`, // ✅ rotation applied
              transformOrigin: "center center", // ✅ rotate around middle
              borderRadius: 2,
              objectFit: "cover",
              zIndex: img.zIndex || 1,
            }}
          />
        ))}

      {multipleTextValue4 &&
        texts4.map((e, index) => (
          <Box
            key={index}
            sx={{
              position: "relative",
              height: "175px",
              width: "100%",
              mb: 2,
              display: "flex",
              justifyContent:
                e.verticalAlign === "top"
                  ? "flex-start"
                  : e.verticalAlign === "center"
                    ? "center"
                    : "flex-end",
              alignItems: "center",
              border: "3px dashed transparent",
              borderRadius: "6px",
              p: 1,
            }}
          >
            <Typography
              sx={{
                textAlign: e.textAlign,
                fontSize: e.fontSize4,
                fontWeight: e.fontWeight4,
                color: e.fontColor4,
                fontFamily: e.fontFamily4,
                lineHeight: e.lineHeight,
                letterSpacing: e.letterSpacing,
                wordBreak: "break-word",
                whiteSpace: "pre-line",
                width: "100%",
                height: "80%",
                display: "flex",
                alignItems:
                  e.verticalAlign === "top"
                    ? "flex-start"
                    : e.verticalAlign === "bottom"
                      ? "flex-end"
                      : "center",
                justifyContent:
                  e.textAlign === "left"
                    ? "flex-start"
                    : e.textAlign === "right"
                      ? "flex-end"
                      : "center",
                m: "auto",
              }}
            >
              {e.value}
            </Typography>
          </Box>
        ))}

      {/* 📝 Single Text Layout */}
      {selectedLayout4 === "oneText" && (
        <Box
          sx={{
            // position: "absolute",
            display: "flex",
            alignItems:
              verticalAlign4 === "top"
                ? "flex-start"
                : verticalAlign4 === "center"
                  ? "center"
                  : "flex-end",
            justifyContent:
              verticalAlign4 === "top"
                ? "flex-start"
                : verticalAlign4 === "center"
                  ? "center"
                  : "flex-end",
            height: "100%",
            color: fontColor4,
            fontFamily: fontFamily4,
            fontSize: fontSize4,
            fontWeight: fontWeight4,
            textAlign: textAlign4,
            lineHeight: lineHeight4,
            letterSpacing: letterSpacing4,
            whiteSpace: "pre-wrap",
            width: "100%",
            p: 1
          }}
        >
          {oneTextValue4}
        </Box>
      )}

      {
        multipleTextValue4 || selectedLayout4 === "oneText" ? null : (
          <>
            {textElements4 &&
              textElements4.map((e) => (
                <Typography
                  key={e.id}
                  sx={{
                    fontSize: e.fontSize,
                    color: e.fontColor,
                    fontFamily: e.fontFamily,
                    fontWeight: e.fontWeight,
                    textAlign: e.textAlign || "center",
                    position: "absolute", // Use absolute positioning
                    left: e.position.x, // X position
                    top: e.position.y, // Y position
                    width: e.size.width, // Width from size object
                    height: e.size.height, // Height from size object
                    zIndex: e.zIndex, // Apply zIndex
                    transform: `rotate(${e.rotation}deg)`, // Apply rotation
                    padding: "5px",
                    boxSizing: "border-box",
                  }}
                >
                  {e.value} {/* Display the text value */}
                </Typography>
              ))}</>
        )
      }

      {isAIimage4 && (
        <img
          src={`${selectedAIimageUrl4}`}
          alt="AIimage"
          style={{
            position: "absolute",
            left: aimage4.x,
            top: aimage4.y,
            width: `${aimage4.width}px`,
            height: `${aimage4.height}px`,
            objectFit: "fill",
            zIndex: 10,
            pointerEvents: "none", // 👈
          }}
        />
      )}

      {/* 🧷 Preview Stickers */}
      {selectedStickers4.map((sticker) => (
        <Box
          key={sticker.id}
          component="img"
          src={sticker.sticker}
          sx={{
            position: "absolute",
            left: sticker.x, // 👈 position
            top: sticker.y, // 👈 position
            width: `${sticker.width}px`, // 👈 width
            height: `${sticker.height}px`, // 👈 height
            objectFit: "contain",
            zIndex: sticker.zIndex,
            transform: `rotate(${sticker.rotation || 0}deg)`, // rotaion for sticker
            pointerEvents: "none", // so it can’t be clicked
          }}
        />
      ))}
    </Box>
  );
};

export default Slide4;
