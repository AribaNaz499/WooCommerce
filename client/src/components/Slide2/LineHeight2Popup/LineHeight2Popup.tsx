import { Box, Divider, Typography, Slider } from "@mui/material";
import { useSlide2 } from "../../../context/Slide2Context";

const LineHeight2Popup = () => {
  const {
    texts,
    setTexts,
    editingIndex,
    multipleTextValue,
    lineHeight2,
    setLineHeight2,
    letterSpacing2,
    setLetterSpacing2,
    selectedTextId,
    setTextElements,
    textElements,
  } = useSlide2();

  // ✅ If multipleText layout is active, use per-index logic
  const updateTextProperty = (property: "lineHeight" | "letterSpacing", value: number) => {
    if (multipleTextValue) {
      if (editingIndex === null) return;
      setTexts((prev) =>
        prev.map((t, i) =>
          i === editingIndex ? { ...t, [property]: value } : t
        )
      );
    } else {
      // ✅ For oneText layout (textElements)
      if (selectedTextId) {
        setTextElements((prev) =>
          prev.map((t) =>
            t.id === selectedTextId ? { ...t, [property]: value } : t
          )
        );
      } else {
        // ✅ Global default for oneText
        if (property === "lineHeight") setLineHeight2(value);
        if (property === "letterSpacing") setLetterSpacing2(value);
      }
    }
  };

  // ✅ Active text only used when multipleTextValue is true
  const activeText = multipleTextValue && editingIndex !== null ? texts[editingIndex] : null;
  const selectedText = !multipleTextValue && selectedTextId
    ? textElements.find((t) => t.id === selectedTextId)
    : null;

  return (
    <Box sx={{
      width: "100%", p: 2, textAlign: 'start', overflowY: 'auto',
      height: { md: 400, sm: 400, xs: 200 },
    }}>
      {/* Line Height */}
      <Typography fontWeight="bold" mb={1}>
        Line Height
      </Typography>
      <Slider
        value={multipleTextValue
          ? activeText?.lineHeight ?? 1.5
          : selectedText?.lineHeight ?? lineHeight2}
        min={0.8}
        max={3}
        step={0.1}
        onChange={(_, val) => updateTextProperty("lineHeight", Number(val))}
        sx={{ color: "#1976d2" }}
      />
      <Typography fontSize={14} mb={2}>
        {multipleTextValue
          ? activeText?.lineHeight?.toFixed(1) ?? 1.5
          : lineHeight2.toFixed(1)}
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Letter Spacing */}
      <Typography fontWeight="bold" mb={1}>
        Letter Spacing
      </Typography>
      <Slider
        value={multipleTextValue
          ? activeText?.letterSpacing ?? 0
          : selectedText?.letterSpacing ?? letterSpacing2}
        min={-2}
        max={10}
        step={0.5}
        onChange={(_, val) => updateTextProperty("letterSpacing", Number(val))}
        sx={{ color: "#1976d2" }}
      />

      <Typography fontSize={14}>
        {multipleTextValue
          ? `${activeText?.letterSpacing ?? 0}px`
          : `${letterSpacing2}px`}
      </Typography>
    </Box>
  );
};

export default LineHeight2Popup;
