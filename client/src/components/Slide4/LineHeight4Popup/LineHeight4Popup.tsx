import { Box, Divider, Typography, Slider } from "@mui/material";
import { useSlide4 } from "../../../context/Slide4Context";

const LineHeight4Popup = () => {
    const {
        texts4,
        setTexts4,
        editingIndex4,
        multipleTextValue4,   // ✅ Add this from context
        lineHeight4,
        setLineHeight4,
        letterSpacing4,
        setLetterSpacing4,
        selectedTextId4,
        setTextElements4,
    } = useSlide4();

    // ✅ If multipleText layout is active, use per-index logic
    const updateTextProperty = (property: "lineHeight" | "letterSpacing", value: number) => {
        if (multipleTextValue4) {
            if (editingIndex4 === null) return;
            setTexts4((prev) =>
                prev.map((t, i) =>
                    i === editingIndex4 ? { ...t, [property]: value } : t
                )
            );
        } else {
            // ✅ For oneText layout (textElements)
            if (selectedTextId4) {
                setTextElements4((prev) =>
                    prev.map((t) =>
                        t.id === selectedTextId4 ? { ...t, [property]: value } : t
                    )
                );
            } else {
                // ✅ Global default for oneText
                if (property === "lineHeight") setLineHeight4(value);
                if (property === "letterSpacing") setLetterSpacing4(value);
            }
        }
    };

    // ✅ Active text only used when multipleTextValue is true
    const activeText = multipleTextValue4 && editingIndex4 !== null ? texts4[editingIndex4] : null;

    return (
        <Box sx={{ width: "100%", p: 2, textAlign: 'start' }}>
            {/* Line Height */}
            <Typography fontWeight="bold" mb={1}>
                Line Height
            </Typography>
            <Slider
                value={multipleTextValue4 ? activeText?.lineHeight ?? 1.5 : lineHeight4}
                min={0.8}
                max={3}
                step={0.1}
                onChange={(_, val) => updateTextProperty("lineHeight", Number(val))}
                sx={{ color: "#1976d2" }}
            />
            <Typography fontSize={14} mb={2}>
                {multipleTextValue4
                    ? activeText?.lineHeight?.toFixed(1) ?? 1.5
                    : lineHeight4.toFixed(1)}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Letter Spacing */}
            <Typography fontWeight="bold" mb={1}>
                Letter Spacing
            </Typography>
            <Slider
                value={multipleTextValue4 ? activeText?.letterSpacing ?? 0 : letterSpacing4}
                min={-2}
                max={10}
                step={0.5}
                onChange={(_, val) => updateTextProperty("letterSpacing", Number(val))}
                sx={{ color: "#1976d2" }}
            />
            <Typography fontSize={14}>
                {multipleTextValue4
                    ? `${activeText?.letterSpacing ?? 0}px`
                    : `${letterSpacing4}px`}
            </Typography>
        </Box>
    );
};

export default LineHeight4Popup;
