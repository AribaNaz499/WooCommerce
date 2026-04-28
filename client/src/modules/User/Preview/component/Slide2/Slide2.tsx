import { Box, Typography } from "@mui/material";
import { useSlide2 } from "../../../../../context/Slide2Context";
import QrGenerator from "../../../../../components/QR-code/Qrcode";

type AnyEl = Record<string, any>;

const safeClip = (cp?: string | null) => (cp && typeof cp === "string" ? cp : "none");
const safeFilter = (f?: string | null) => (f && typeof f === "string" ? f : "none");
const val = <T,>(v: T | undefined, d: T) => (v === undefined || v === null ? d : v);

type Slide2Props = {
  ref?: any
}

const Slide2 = (props: Slide2Props) => {
  const {
    texts,
    oneTextValue,
    multipleTextValue,
    draggableImages,
    fontColor,
    fontFamily,
    fontSize,
    fontWeight,
    selectedImg,
    verticalAlign,
    selectedVideoUrl,
    selectedAudioUrl,
    qrPosition,
    textAlign,
    selectedLayout,
    textElements,
    qrAudioPosition,
    selectedAIimageUrl2,
    selectedStickers2,
    isAIimage2,
    aimage2,
    lineHeight2,
    letterSpacing2,
    layout2,
    bgColor2,
  } = useSlide2();
  const { ref } = props

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        width: 485,
        height: "100%",
        overflow: "hidden",
        borderRadius: 2,
        // background fill
        backgroundColor: bgColor2 ?? "transparent",
        // backgroundImage: bgImage2 ? `url(${bgImage2})` : "none",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {layout2 && (
        <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
          {/* IMAGES / BG ELEMENTS */}
          {layout2?.elements
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
          {layout2.textElements
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
          {layout2.stickers
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

      {selectedVideoUrl && (
        <Box
          sx={{
            position: "absolute",
            top: qrPosition.y,
            left: qrPosition.x,
            width: 400,
            height: 180,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            textAlign: "center",
            zIndex: qrPosition.zIndex || 1,
          }}
        >
          {/* Background Image */}
          <Box
            component="img"
            src="/assets/images/video-qr-tips.png"
            sx={{
              width: 350,
              height: 200,
              objectFit: "fill",
              borderRadius: "6px",
            }}
          />

          {/* QR Code */}
          <Box
            sx={{
              position: "absolute",
              top: 33,
              left: 28,
              width: qrPosition.width || 70,
              height: qrPosition.height || 70,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <QrGenerator
              url={qrPosition.url || selectedVideoUrl}
              size={Math.min(qrPosition.width || 70, qrPosition.height || 70)}
              style={{ borderRadius: 8, overflow: "hidden" }}
            />
          </Box>

          {/* Clickable Link */}
          <a
            href={`${selectedVideoUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Typography
              sx={{
                position: "absolute",
                top: 60,
                right: { md: 40, sm: 40, xs: 30 },
                zIndex: 99,
                color: "black",
                fontSize: "10px",
                width: "105px",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {`${selectedVideoUrl.slice(0, 20)}.....`}
            </Typography>
          </a>
        </Box>
      )}

      {selectedAudioUrl && (
        <Box
          sx={{
            position: "absolute",
            top: qrAudioPosition.y,
            left: qrAudioPosition.x,
            width: 400,
            height: 180,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            textAlign: "center",
            zIndex: qrAudioPosition.zIndex || 1,
          }}
        >
          {/* Background Image */}
          <Box
            component="img"
            src="/assets/images/audio-qr-tips.png"
            sx={{
              width: 350,
              height: 200,
              objectFit: "fill",
              borderRadius: "6px",
            }}
          />

          {/* QR Code */}
          <Box
            sx={{
              position: "absolute",
              top: 33,
              left: 28,
              width: qrAudioPosition.width || 70,
              height: qrAudioPosition.height || 70,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <QrGenerator
              url={qrAudioPosition.url || selectedAudioUrl}
              size={Math.min(qrAudioPosition.width || 70, qrAudioPosition.height || 70)}
              style={{ borderRadius: 8, overflow: "hidden" }}
            />
          </Box>

          {/* Clickable Link */}
          <a
            href={`${selectedAudioUrl}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Typography
              sx={{
                position: "absolute",
                top: 60,
                right: { md: 40, sm: 40, xs: 30 },
                zIndex: 99,
                color: "black",
                fontSize: "10px",
                width: "105px",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {`${selectedAudioUrl.slice(0, 20)}.....`}
            </Typography>
          </a>
        </Box>
      )}

      {/* 🖼️ Only selected images */}
      {draggableImages
        .filter((img: any) => selectedImg?.includes(img.id))
        // .sort((a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((img: any) => (
          <Box
            key={img.id}
            sx={{
              position: "absolute",
              width: img.width,
              height: img.height,
              left: img.x,
              top: img.y,
              transform: `rotate(${img.rotation || 0}deg)`,
              transformOrigin: "center center",
              borderRadius: 2,
              zIndex: img.zIndex || 1,
              overflow: "hidden",
              clipPath: safeClip(img.clipPath || img.shapePath),
              WebkitClipPath: safeClip(img.clipPath || img.shapePath),
            }}
          >
            <Box
              component="img"
              src={img.src}
              sx={{
                width: "100%",
                height: "100%",
                display: "block",
                objectFit: img.shapePath || img.clipPath ? "fill" : "cover",
                filter: safeFilter(img.filter),
                pointerEvents: "none",
              }}
            />
          </Box>
        ))}

      {multipleTextValue &&
        texts.map((e: any, index: number) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              left: 8,
              right: 8,
              top: 8 + index * 220, // stack blocks like editor; adjust spacing
              height: 210,
              borderRadius: "6px",
              display: "flex",
              alignItems:
                e.verticalAlign === "top"
                  ? "flex-start"
                  : e.verticalAlign === "center"
                    ? "center"
                    : "flex-end",
              justifyContent:
                e.textAlign === "left"
                  ? "flex-start"
                  : e.textAlign === "right"
                    ? "flex-end"
                    : "center",
              p: 1,
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <Typography
              sx={{
                fontSize: e.fontSize ?? 16,
                fontWeight: e.fontWeight ?? 400,
                color: e.fontColor ?? "#000",
                fontFamily: e.fontFamily ?? "Roboto, sans-serif",
                textAlign: e.textAlign ?? "center",
                lineHeight: e.lineHeight ?? 1.2,
                letterSpacing: e.letterSpacing ?? 0,
                width: "100%",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {e.value}
            </Typography>
          </Box>
        ))}


      {/* 📝 Single Text Layout */}
      {selectedLayout === "oneText" && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent:
              verticalAlign === "top"
                ? "flex-start"
                : verticalAlign === "center"
                  ? "center"
                  : "flex-end", // ✅ controls vertical alignment
            alignItems:
              textAlign === "start"
                ? "flex-start"
                : textAlign === "center"
                  ? "center"
                  : "flex-end", // ✅ controls horizontal alignment
            height: "100%",
            width: "100%",
            color: fontColor,
            lineHeight: lineHeight2,
            letterSpacing: letterSpacing2,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fontWeight: fontWeight,
            textAlign: textAlign, // ✅ still needed for multiline/inline text
            whiteSpace: "pre-wrap",
            p: 1,
          }}
        >
          {oneTextValue}
        </Box>
      )}

      {
        multipleTextValue || selectedLayout === "oneText" ? null : (
          <>
            {textElements &&
              textElements.map((e) => (
                <Typography
                  key={e.id}
                  // onClick={() => updateTextElement(e.id, { isEditing: true })}
                  sx={{
                    fontSize: e.fontSize,
                    color: e.fontColor,
                    fontFamily: e.fontFamily,
                    fontWeight: e.fontWeight,
                    textAlign: e.textAlign || "center",
                    position: "absolute",
                    left: e.position.x,
                    top: e.position.y,
                    width: e.size.width,
                    height: e.size.height,
                    display: "flex",
                    zIndex: e.zIndex,
                    lineHeight: e.lineHeight ?? 1.5,
                    letterSpacing: `${e.letterSpacing ?? 0}px`,
                    transform: `rotate(${e.rotation}deg)`,
                    justifyContent: e.textAlign ?? "center",
                    alignItems: e.verticalAlign ?? "top",
                    padding: "5px",
                    whiteSpace: "pre-line", // ⭐ FIX: Show line breaks
                    cursor: "text",
                  }}
                >
                  {e.value}
                </Typography>
              ))}</>
        )
      }

      {isAIimage2 && (
        <img
          src={`${selectedAIimageUrl2}`}
          alt="AIimage"
          style={{
            position: "absolute", // 👈 so it can use top/left
            left: aimage2.x, // 👈 saved x position
            top: aimage2.y, // 👈 saved y position
            width: `${aimage2.width}px`, // 👈 saved width
            height: `${aimage2.height}px`, // 👈 saved height
            objectFit: "fill",
            // zIndex: 10,
            pointerEvents: "none", // 👈 prevents accidental clicking
          }}
        />
      )}
      {/* 🧷 Preview Stickers */}
      {selectedStickers2.map((sticker) => (
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
            transform: `rotate(${sticker.rotation || 0}deg)`,
            pointerEvents: "none", // so it can’t be clicked
          }}
        />
      ))}

    </Box>
  );
};

export default Slide2;
