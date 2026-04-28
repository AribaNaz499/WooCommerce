 // src/components/preview/Slide1.tsx
import { Box, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useSlide1 } from "../../../../../context/Slide1Context";

type AnyEl = Record<string, any>;

const safeClip = (cp?: string | null) => (cp && typeof cp === "string" ? cp : "none");
const safeFilter = (f?: string | null) => (f && typeof f === "string" ? f : "none");
const val = <T,>(v: T | undefined, d: T) => (v === undefined || v === null ? d : v);

const focusTextInputNode = (
  input: HTMLTextAreaElement | HTMLInputElement | null,
) => {
  if (!input) return;

  const focusNow = () => {
    try {
      input.focus({ preventScroll: true });
    } catch {
      input.focus();
    }
    const end = input.value?.length ?? 0;
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(end, end);
    } else if (typeof input.select === "function") {
      input.select();
    }
  };

  focusNow();
  requestAnimationFrame(focusNow);
  window.setTimeout(focusNow, 0);
  window.setTimeout(focusNow, 80);
};

type Slide1Props = {
  ref?: any
}

const Slide1 = (props: Slide1Props) => {
  const {
    layout1,
    bgColor1,
    draggableImages1,
    selectedImg1,
    multipleTextValue1,
    texts1,
    selectedLayout1,
    oneTextValue1,
    fontColor1,
    fontFamily1,
    fontSize1,
    fontWeight1,
    verticalAlign1,
    textAlign1,
    textElements1,
    selectedAIimageUrl1,
    selectedStickers1,
    isAIimage1,
    aimage1,
    lineHeight1,
    letterSpacing1,
    setLayout1,
  } = useSlide1();

  const { ref } = props;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const staticTextInputRefs = useRef<
    Record<number, HTMLTextAreaElement | HTMLInputElement | null>
  >({});

  const handleLayoutTextChange = (index: number, nextText: string) => {
    setLayout1?.((prev: any) => {
      if (!prev?.textElements) return prev;
      const updated = [...prev.textElements];
      const current = updated[index];
      if (!current?.isEditable) return prev;
      updated[index] = { ...current, text: nextText };
      return { ...prev, textElements: updated };
    });
  };

  const openStaticTextEditor = (index: number) => {
    setEditingIndex(index);
    focusTextInputNode(staticTextInputRefs.current[index] ?? null);
  };

  useEffect(() => {
    if (editingIndex === null) return;
    focusTextInputNode(staticTextInputRefs.current[editingIndex] ?? null);
  }, [editingIndex, layout1?.textElements]);

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        width: '100%',
        height: "100%",
        overflow: "hidden",
        backgroundColor: bgColor1 ?? "transparent",
        // backgroundImage: bgImage1 ? `url(${bgImage1})` : "none",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        borderRadius: 2,
      }}
    >
      {layout1 && (
        <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
          {/* IMAGES / BG ELEMENTS */}
          {layout1?.elements
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
          {layout1.textElements
            ?.slice()
            .sort((a: AnyEl, b: AnyEl) => (val(a.zIndex, 2) - val(b.zIndex, 2)))
            .map((te: AnyEl, index: number) => {
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
                    pointerEvents: te.isEditable ? "auto" : "none",
                    cursor: te.isEditable ? "text" : "default",
                  }}
                  onMouseDown={te.isEditable ? (e) => {
                    e.preventDefault();
                    openStaticTextEditor(index);
                  } : undefined}
                  onClick={te.isEditable ? () => {
                    openStaticTextEditor(index);
                  } : undefined}
                  onTouchStart={te.isEditable ? (e) => {
                    e.preventDefault();
                    openStaticTextEditor(index);
                  } : undefined}
                >
                  {te.isEditable ? (
                    <TextField
                      variant="standard"
                      fullWidth
                      multiline
                      value={te.text || ""}
                      inputRef={(node) => {
                        staticTextInputRefs.current[index] = node;
                      }}
                      onChange={(e) => handleLayoutTextChange(index, e.target.value)}
                      onBlur={() => setEditingIndex(null)}
                      InputProps={{
                        readOnly: editingIndex !== index,
                        disableUnderline: true,
                        sx: {
                          p: 0,
                          pointerEvents: "auto",
                          "& textarea, & input": {
                            p: 0,
                            m: 0,
                            textAlign: te.textAlign || "center",
                            fontSize: val(te.fontSize, 16),
                            fontFamily: te.fontFamily || "Roboto, sans-serif",
                            fontWeight: te.bold ? 700 : val(te.fontWeight, 400),
                            fontStyle: te.italic ? "italic" : "normal",
                            color: te.color || "#000",
                            lineHeight: te.lineHeight !== undefined ? te.lineHeight : 1.2,
                            letterSpacing: te.letterSpacing !== undefined ? te.letterSpacing : 0,
                            WebkitTextFillColor: te.color || "#000",
                            opacity: 1,
                          },
                        },
                      }}
                      sx={{
                        width: "100%",
                        "& .MuiInputBase-root": {
                          cursor: "text",
                        },
                      }}
                    />
                  ) : (
                    te.text || ""
                  )}
                </Box>
              );
            })}

          {/* STICKERS */}
          {layout1.stickers
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

      {draggableImages1
        .filter((img: any) => selectedImg1?.includes(img.id))
        .sort((a: any, b: any) => (a.zIndex || 0) - (b.zIndex || 0))
        .map((img: any) => (
          <Box
            key={img.id}
            component="img"
            src={img.src}
            sx={{
              position: "absolute",
              width: img.width,
              height: img.height,
              left: img.x,
              top: img.y,
              transform: `rotate(${img.rotation || 0}deg)`,
              transformOrigin: "center center",
              borderRadius: 2,
              objectFit: "cover",
              zIndex: img.zIndex || 1,
            }}
          />
        ))}

      {multipleTextValue1 &&
        texts1.map((e: any, index: number) => (
          <Box
            key={index}
            sx={{
              position: "relative",
              height: "210px",
              width: "100%",
              mb: 1,
              display: "flex",
              justifyContent:
                e.verticalAlign === "top"
                  ? "flex-start"
                  : e.verticalAlign === "center"
                    ? "center"
                    : "flex-end",
              alignItems: "center",
              borderRadius: "6px",
              p: 1,
            }}
          >
            <Typography
              sx={{
                textAlign: e.textAlign,
                fontSize: e.fontSize1 ?? e.fontSize,
                fontWeight: e.fontWeight1 ?? e.fontWeight,
                color: e.fontColor1 ?? e.fontColor,
                fontFamily: e.fontFamily1 ?? e.fontFamily,
                lineHeight: e.lineHeight ?? lineHeight1,
                letterSpacing: e.letterSpacing ?? letterSpacing1,
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

      {selectedLayout1 === "oneText" && (
        <Box
          sx={{
            display: "flex",
            alignItems:
              verticalAlign1 === "top"
                ? "flex-start"
                : verticalAlign1 === "center"
                  ? "center"
                  : "flex-end",
            justifyContent:
              textAlign1 === "start"
                ? "flex-start"
                : textAlign1 === "center"
                  ? "center"
                  : "flex-end",
            height: "100%",
            color: fontColor1,
            fontFamily: fontFamily1,
            fontSize: fontSize1,
            fontWeight: fontWeight1,
            textAlign: textAlign1 === "start" ? "left" : textAlign1 === "end" ? "right" : "center",
            lineHeight: lineHeight1,
            letterSpacing: letterSpacing1,
            whiteSpace: "pre-wrap",
            width: "100%",
            p: 1,
            position: "absolute",
            inset: 0,
            zIndex: 3,
          }}
        >
          {oneTextValue1}
        </Box>
      )}

      {!multipleTextValue1 && selectedLayout1 !== "oneText" &&
        textElements1?.map((e: any) => (
          <Typography
            key={e.id}
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
              zIndex: e.zIndex,
              transform: `rotate(${e.rotation}deg)`,
              padding: "5px",
              boxSizing: "border-box",
              lineHeight: e.lineHeight ?? lineHeight1,
              letterSpacing: e.letterSpacing ?? letterSpacing1,
              whiteSpace: "pre-wrap",
            }}
          >
            {e.value}
          </Typography>
        ))}

      {isAIimage1 && selectedAIimageUrl1 && (
        <img
          src={selectedAIimageUrl1}
          alt="AIimage"
          style={{
            position: "absolute",
            left: aimage1.x,
            top: aimage1.y,
            width: `${aimage1.width}px`,
            height: `${aimage1.height}px`,
            objectFit: "fill",
            zIndex: 10,
            pointerEvents: "none",
          }}
        />
      )}

      {selectedStickers1.map((sticker: any) => (
        <Box
          key={sticker.id}
          component="img"
          src={sticker.sticker}
          sx={{
            position: "absolute",
            left: sticker.x,
            top: sticker.y,
            width: `${sticker.width}px`,
            height: `${sticker.height}px`,
            objectFit: "contain",
            zIndex: sticker.zIndex,
            transform: `rotate(${sticker.rotation || 0}deg)`,
            pointerEvents: "none",
          }}
        />
      ))}
    </Box>
  );
};

export default Slide1;
