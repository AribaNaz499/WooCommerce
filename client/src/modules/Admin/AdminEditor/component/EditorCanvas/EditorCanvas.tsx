import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box, IconButton, TextField, Typography } from "@mui/material";
import { Close, Edit, ImageRounded } from "@mui/icons-material";
import { Rnd } from "react-rnd";
import type {
  ElementType,
  StickerType,
  TextElementType,
} from "../../../../../context/AdminEditorContext";

export type TextPatch = Partial<TextElementType>;
export type EditorCanvasHandle = {
  addImage: () => void;
  addText: () => void;
  updateSelectedText: (patch: TextPatch) => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  setFontSize: (n: number) => void;
  setFontFamily: (name: string) => void;
  setColor: (hex: string) => void;
  addSticker: (path: string) => void;
  clearSelection: () => void;
  getSelectedText: () => TextElementType | null;
};

type Props = {
  elements: ElementType[];
  setElements: React.Dispatch<React.SetStateAction<ElementType[]>>;
  textElements: TextElementType[];
  setTextElements: React.Dispatch<React.SetStateAction<TextElementType[]>>;
  stickerElements: StickerType[];
  setStickerElements: React.Dispatch<React.SetStateAction<StickerType[]>>;
  onFocus?: () => void;
  disabled?: boolean;
  canvasScale?: number;
};

const EditorCanvas = forwardRef<EditorCanvasHandle, Props>(
  (
    {
      elements,
      setElements,
      textElements,
      setTextElements,
      stickerElements,
      setStickerElements,
      onFocus,
      disabled = false,
      canvasScale,
    },
    ref
  ) => {
    const [selectedElementId, setSelectedElementId] = useState<string | null>(
      null
    );
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [selectedStickerId, setSelectedStickerId] =
      useState<string | null>(null);

    const draggingRef = useRef(false);
    const activeElementRef = useRef<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const selectedText = useMemo(
      () => textElements.find((t) => t.id === selectedTextId) || null,
      [textElements, selectedTextId]
    );

    const updateTextElement = (id: string, patch: TextPatch) =>
      setTextElements((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );

    useImperativeHandle(
      ref,
      () => ({
        addImage: () => {
          if (disabled) return; // why: prevent edits when frozen
          const id = `el_${Date.now()}`;
          setElements((prev) => [
            ...prev,
            { id, x: 60, y: 60, width: 200, height: 120, src: null },
          ]);
          setSelectedElementId(id);
          setSelectedTextId(null);
          setSelectedStickerId(null);
          activeElementRef.current = id;
          fileRef.current?.click();
        },
        addText: () => {
          if (disabled) return;
          const id = `txt_${Date.now()}`;
          setTextElements((prev) => [
            ...prev,
            {
              id,
              x: 60,
              y: 60,
              width: 220,
              height: 64,
              text: "",
              bold: false,
              italic: false,
              fontSize: 20,
              fontFamily: "Arial",
              color: "#000000",
            },
          ]);
          setSelectedTextId(id);
          setSelectedElementId(null);
          setSelectedStickerId(null);
        },
        updateSelectedText: (patch) =>
          selectedTextId && updateTextElement(selectedTextId, patch),
        toggleBold: () =>
          selectedText &&
          updateTextElement(selectedText.id, { bold: !selectedText.bold }),
        toggleItalic: () =>
          selectedText &&
          updateTextElement(selectedText.id, { italic: !selectedText.italic }),
        setFontSize: (n) =>
          selectedText && updateTextElement(selectedText.id, { fontSize: n }),
        setFontFamily: (name) =>
          selectedText &&
          updateTextElement(selectedText.id, { fontFamily: name }),
        setColor: (hex) =>
          selectedText && updateTextElement(selectedText.id, { color: hex }),
        addSticker: (path) => {
          if (disabled) return;
          const id = `sticker_${Date.now()}`;
          setStickerElements((prev) => [
            ...prev,
            {
              id,
              x: 80,
              y: 80,
              width: 100,
              height: 100,
              sticker: path,
              zIndex: 2 + prev.length,
            },
          ]);
          setSelectedStickerId(id);
          setSelectedTextId(null);
          setSelectedElementId(null);
        },
        clearSelection: () => {
          setSelectedTextId(null);
          setSelectedElementId(null);
          setSelectedStickerId(null);
        },
        getSelectedText: () => selectedText,
      }),
      [
        disabled,
        selectedText,
        selectedTextId,
        setElements,
        setTextElements,
        setStickerElements,
      ]
    );

    const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeElementRef.current) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        if (!src) return;
        setElements((prev) =>
          prev.map((el) =>
            el.id === activeElementRef.current ? { ...el, src } : el
          )
        );
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    };

    const scale = Math.max(1, canvasScale ?? 1);
    const baseSize = {
      mdW: 500,
      mdH: 700,
      smW: 400,
      smH: 600,
      xsW: 320,
      xsH: 400,
    };

    return (
      <Box
        onMouseDown={onFocus}
        sx={{
          width: {
            md: `${baseSize.mdW * scale}px`,
            sm: `${baseSize.smW * scale}px`,
            xs: `${baseSize.xsW * scale}px`,
          },
          height: {
            md: `${baseSize.mdH * scale}px`,
            sm: `${baseSize.smH * scale}px`,
            xs: `${baseSize.xsH * scale}px`,
          },
          borderRadius: "12px",
          boxShadow: "3px 5px 8px gray",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "visible",
          border: `1px solid lightGray`,
          cursor: disabled ? "not-allowed" : "pointer",
          pointerEvents: disabled ? "none" : "auto", // why: freeze when inactive
          backgroundColor: "#fff",
        }}
      >
        <Box
          sx={{
            width: { md: "500px", sm: "400px", xs: "320px" },
            height: { md: "700px", sm: "600px", xs: 400 },
            borderRadius: "12px",
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#fff",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          style={{ display: "none" }}
          onChange={onFile}
        />

        {elements.map((el) => (
          <Rnd
            key={el.id}
            default={{ x: el.x, y: el.y, width: el.width, height: el.height }}
            bounds="parent"
            scale={scale}
            onDragStart={() => {
              draggingRef.current = true;
            }}
            onDragStop={(_, d) => {
              setElements((prev) =>
                prev.map((p) => (p.id === el.id ? { ...p, x: d.x, y: d.y } : p))
              );
              setTimeout(() => {
                draggingRef.current = false;
              }, 50);
            }}
            onResizeStart={() => {
              draggingRef.current = true;
            }}
            onResizeStop={(_, __, ref, ___, pos) => {
              setElements((prev) =>
                prev.map((p) =>
                  p.id === el.id
                    ? {
                        ...p,
                        width: parseInt(ref.style.width, 10),
                        height: parseInt(ref.style.height, 10),
                        x: pos.x,
                        y: pos.y,
                      }
                    : p
                )
              );
              setTimeout(() => {
                draggingRef.current = false;
              }, 50);
            }}
            style={{
              borderRadius: 8,
              position: "absolute",
              overflow: "visible",
              border: "1px solid #1976d2",
            }}
            resizeHandleStyles={{
              bottomRight: {
                width: "18px",
                height: "18px",
                background: "white",
                border: "1px solid #1976d2",
                borderRadius: "4px",
                right: "-7px",
                bottom: "-7px",
                cursor: "nwse-resize",
              },
            }}
            enableResizing={{
              top: false,
              right: false,
              left: false,
              bottom: false,
              bottomRight: true,
            }}
            onClick={(e: any) => {
              e.stopPropagation();
              if (draggingRef.current) return;
              setSelectedElementId(el.id);
              setSelectedTextId(null);
              setSelectedStickerId(null);
              activeElementRef.current = el.id;
              fileRef.current?.click(); // why: replace on click
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 22,
                height: 22,
                borderRadius: "50%",
                bgcolor: "rgba(0,0,0,0.6)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 99,
                "&:hover": { bgcolor: "rgba(0,0,0,0.8)" },
              }}
              onClick={(e) => {
                e.stopPropagation();
                setElements((prev) => prev.filter((p) => p.id !== el.id));
                if (selectedElementId === el.id) setSelectedElementId(null);
              }}
            >
              ✕
            </Box>

            {el.src ? (
              <Box
                component="img"
                src={el.src}
                alt="uploaded"
                sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 1 }}
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ImageRounded sx={{ color: "lightGray", fontSize: 40 }} />
              </Box>
            )}
          </Rnd>
        ))}

        {textElements.map((t) => (
          <Rnd
            key={t.id}
            default={{ x: t.x, y: t.y, width: t.width, height: t.height }}
            bounds="parent"
            scale={scale}
            onDragStart={() => {
              draggingRef.current = true;
            }}
            onDragStop={(_, d) => {
              updateTextElement(t.id, { x: d.x, y: d.y });
              setTimeout(() => {
                draggingRef.current = false;
              }, 50);
            }}
            onResizeStart={() => {
              draggingRef.current = true;
            }}
            onResizeStop={(_, __, ref, ___, pos) => {
              updateTextElement(t.id, {
                width: parseInt(ref.style.width, 10),
                height: parseInt(ref.style.height, 10),
                x: pos.x,
                y: pos.y,
              });
              setTimeout(() => {
                draggingRef.current = false;
              }, 50);
            }}
            style={{
              borderRadius: 8,
              position: "absolute",
              overflow: "visible",
              zIndex: selectedTextId === t.id ? 50 : 30,
              border:
                selectedTextId === t.id
                  ? "2px solid #1976d2"
                  : "1px solid rgba(0,0,0,0.06)",
            }}
            resizeHandleStyles={{
              bottomRight: {
                width: "18px",
                height: "18px",
                background: "white",
                border: "1px solid #1976d2",
                borderRadius: "4px",
                right: "-7px",
                bottom: "-7px",
                cursor: "nwse-resize",
              },
            }}
            enableResizing={{
              top: false,
              right: false,
              left: false,
              bottom: false,
              bottomRight: true,
            }}
            onClick={() => {
              if (draggingRef.current) return;
              setSelectedTextId(t.id);
              setSelectedElementId(null);
              setSelectedStickerId(null);
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 1,
              }}
            >
              {selectedTextId === t.id ? (
                <>
                  <TextField
                    multiline
                    value={t.text}
                    onChange={(e) =>
                      updateTextElement(t.id, { text: e.target.value })
                    }
                    variant="standard"
                    autoFocus
                    sx={{
                      width: "100%",
                      fontWeight: t.bold ? 700 : 400,
                      fontStyle: t.italic ? "italic" : "normal",
                      fontSize: t.fontSize,
                      fontFamily: t.fontFamily,
                      color: t.color,
                    }}
                    InputProps={{
                      disableUnderline: true,
                      style: {
                        fontWeight: t.bold ? 700 : 400,
                        fontStyle: t.italic ? "italic" : "normal",
                        fontSize: t.fontSize,
                        fontFamily: t.fontFamily,
                        color: t.color,
                      },
                    }}
                  />
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setTextElements((prev) =>
                        prev.filter((el) => el.id !== t.id)
                      );
                      setSelectedTextId(null);
                    }}
                    sx={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bgcolor: "black",
                      color: "white",
                      width: 25,
                      height: 25,
                      zIndex: 2,
                      "&:hover": { bgcolor: "red" },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </>
              ) : (
                <Typography
                  sx={{
                    fontWeight: t.bold ? 700 : 400,
                    fontStyle: t.italic ? "italic" : "normal",
                    fontSize: t.fontSize,
                    fontFamily: t.fontFamily,
                    color: t.color,
                    textAlign: "center",
                    width: "100%",
                    position: "relative",
                    height: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    display: "flex",
                  }}
                >
                  {t.text}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTextId(t.id);
                      setSelectedElementId(null);
                      setSelectedStickerId(null);
                    }}
                    sx={{ position: "absolute", top: -15, right: -8 }}
                  >
                    <Edit color="info" />
                  </IconButton>
                </Typography>
              )}
            </Box>
          </Rnd>
        ))}

        {stickerElements.map((st) => (
          <Rnd
            key={st.id}
            default={{ x: st.x, y: st.y, width: st.width, height: st.height }}
            bounds="parent"
            scale={scale}
            onDragStop={(_, d) => {
              setStickerElements((prev) =>
                prev.map((s) => (s.id === st.id ? { ...s, x: d.x, y: d.y } : s))
              );
              setTimeout(() => {
                draggingRef.current = false;
              }, 50);
            }}
            onResizeStart={() => {
              draggingRef.current = true;
            }}
            onResizeStop={(_, __, ref, ___, pos) => {
              setStickerElements((prev) =>
                prev.map((s) =>
                  s.id === st.id
                    ? {
                        ...s,
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height),
                        x: pos.x,
                        y: pos.y,
                      }
                    : s
                )
              );
              setTimeout(() => {
                draggingRef.current = false;
              }, 50);
            }}
            onClick={(e: any) => {
              e.stopPropagation();
              if (draggingRef.current) return;
              setSelectedStickerId(st.id);
              setSelectedTextId(null);
              setSelectedElementId(null);
              setStickerElements((prev) =>
                prev.map((s) =>
                  s.id === st.id ? { ...s, zIndex: prev.length + 50 } : s
                )
              );
            }}
            style={{
              borderRadius: 8,
              border:
                selectedStickerId === st.id
                  ? "2px solid #1976d2"
                  : "1px solid rgba(0,0,0,0.1)",
              position: "absolute",
              overflow: "visible",
              zIndex: st.zIndex,
            }}
            resizeHandleStyles={{
              bottomRight: {
                width: "18px",
                height: "18px",
                background: "white",
                border: "2px solid #1976d2",
                borderRadius: "4px",
                right: "-7px",
                bottom: "-7px",
                cursor: "nwse-resize",
              },
            }}
            enableResizing={{ top: false, right: false, left: false, bottom: false, bottomRight: true }}
          >
            <Box sx={{ width: "100%", height: "100%", position: "relative" }}>
              <Box
                component="img"
                src={st.sticker}
                alt="sticker"
                sx={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
              />
              {/* why: only show delete for the active sticker */}
              {selectedStickerId === st.id && (
                <IconButton
                  onClick={() =>
                    setStickerElements((prev) => prev.filter((s) => s.id !== st.id))
                  }
                  sx={{
                    position: "absolute",
                    top: -12,
                    right: -12,
                    bgcolor: "black",
                    color: "white",
                    width: 28,
                    height: 28,
                    zIndex: 99,
                    "&:hover": { bgcolor: "red" },
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Rnd>
        ))}
      </Box>
      </Box>
    );
  }
);

export default EditorCanvas;
