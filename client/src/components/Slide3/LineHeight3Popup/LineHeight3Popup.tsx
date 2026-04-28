import { Box, Divider, Typography, Slider } from "@mui/material";
import { useSlide3 } from "../../../context/Slide3Context";

const LineHeight3Popup = () => {
  const {
    texts3,
    setTexts3,
    editingIndex3,
    multipleTextValue3,   // ✅ Add this from context
    lineHeight3,
    setLineHeight3,
    letterSpacing3,
    setLetterSpacing3,
    selectedTextId3,
    textElements3,
    setTextElements3,
  } = useSlide3();

  // ✅ If multipleText layout is active, use per-index logic
  const updateTextProperty = (property: "lineHeight" | "letterSpacing", value: number) => {
    if (multipleTextValue3) {
      if (editingIndex3 === null) return;
      setTexts3((prev) =>
        prev.map((t, i) =>
          i === editingIndex3 ? { ...t, [property]: value } : t
        )
      );
    } else {
      // ✅ For oneText layout (textElements)
      if (selectedTextId3) {
        setTextElements3((prev) =>
          prev.map((t) =>
            t.id === selectedTextId3 ? { ...t, [property]: value } : t
          )
        );
      } else {
        // ✅ Global default for oneText
        if (property === "lineHeight") setLineHeight3(value);
        if (property === "letterSpacing") setLetterSpacing3(value);
      }
    }
  };

  // ✅ Active text only used when multipleTextValue is true
  const activeText = multipleTextValue3 && editingIndex3 !== null ? texts3[editingIndex3] : null;
  const selectedText3 = !multipleTextValue3 && selectedTextId3
    ? textElements3.find((t) => t.id === selectedTextId3)
    : null;

  return (
    <Box  sx={{
      width: "100%", p: 2, textAlign: 'start', overflowY: 'auto',
      height: { md: 400, sm: 400, xs: 200 },
    }}>
      {/* Line Height */}
      <Typography fontWeight="bold" mb={1}>
        Line Height
      </Typography>
     <Slider
        value={multipleTextValue3
          ? activeText?.lineHeight ?? 1.5
          : selectedText3?.lineHeight?? lineHeight3}
        min={0.8}
        max={3}
        step={0.1}
        onChange={(_, val) => updateTextProperty("lineHeight", Number(val))}
        sx={{ color: "#1976d2" }}
      />
      <Typography fontSize={14} mb={3}>
        {multipleTextValue3
          ? activeText?.lineHeight?.toFixed(1) ?? 1.5
          : lineHeight3.toFixed(1)}
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* Letter Spacing */ }
      <Typography fontWeight="bold" mb={1}>
        Letter Spacing
      </Typography>
     <Slider
        value={multipleTextValue3
          ? activeText?.letterSpacing ?? 0
          : selectedText3?.letterSpacing ?? letterSpacing3}
        min={-2}
        max={10}
        step={0.5}
        onChange={(_, val) => updateTextProperty("letterSpacing", Number(val))}
        sx={{ color: "#1976d2" }}
      />
      <Typography fontSize={14}>
        {multipleTextValue3
          ? `${activeText?.letterSpacing ?? 0}px`
          : `${letterSpacing3}px`}
      </Typography>
    </Box >
  );
};

export default LineHeight3Popup;
