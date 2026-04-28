import { Box, Divider, Typography, Slider } from "@mui/material";
import { useSlide1 } from "../../../context/Slide1Context";

const LineHeight1Popup = () => {
    const {
        texts1,
        setTexts1,
        editingIndex1,
        multipleTextValue1,   // ✅ Add this from context
        lineHeight1,
        setLineHeight1,
        letterSpacing1,
        setLetterSpacing1,
        selectedTextId1,
        setTextElements1,
    } = useSlide1();

    // ✅ If multipleText layout is active, use per-index logic
    const updateTextProperty = (property: "lineHeight" | "letterSpacing", value: number) => {
        if (multipleTextValue1) {
            if (editingIndex1 === null) return;
            setTexts1((prev) =>
                prev.map((t, i) =>
                    i === editingIndex1 ? { ...t, [property]: value } : t
                )
            );
        } else {
            // ✅ For oneText layout (textElements)
            if (selectedTextId1) {
                setTextElements1((prev) =>
                    prev.map((t) =>
                        t.id === selectedTextId1 ? { ...t, [property]: value } : t
                    )
                );
            } else {
                // ✅ Global default for oneText
                if (property === "lineHeight") setLineHeight1(value);
                if (property === "letterSpacing") setLetterSpacing1(value);
            }
        }
    };

    // ✅ Active text only used when multipleTextValue is true
    const activeText = multipleTextValue1 && editingIndex1 !== null ? texts1[editingIndex1] : null;

    return (
        <Box sx={{ width: "100%", p: 2, textAlign: 'start' }}>
            {/* Line Height */}
            <Typography fontWeight="bold" mb={1}>
                Line Height
            </Typography>
            <Slider
                value={multipleTextValue1 ? activeText?.lineHeight ?? 1.5 : lineHeight1}
                min={0.8}
                max={3}
                step={0.1}
                onChange={(_, val) => updateTextProperty("lineHeight", Number(val))}
                sx={{ color: "#1976d2" }}
            />
            <Typography fontSize={14} mb={2}>
                {multipleTextValue1
                    ? activeText?.lineHeight?.toFixed(1) ?? 1.5
                    : lineHeight1.toFixed(1)}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Letter Spacing */}
            <Typography fontWeight="bold" mb={1}>
                Letter Spacing
            </Typography>
            <Slider
                value={multipleTextValue1 ? activeText?.letterSpacing ?? 0 : letterSpacing1}
                min={-2}
                max={10}
                step={0.5}
                onChange={(_, val) => updateTextProperty("letterSpacing", Number(val))}
                sx={{ color: "#1976d2" }}
            />
            <Typography fontSize={14}>
                {multipleTextValue1
                    ? `${activeText?.letterSpacing ?? 0}px`
                    : `${letterSpacing1}px`}
            </Typography>
        </Box>
    );
};

export default LineHeight1Popup;
