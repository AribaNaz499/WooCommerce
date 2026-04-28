import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { GOOGLE_FONTS } from "../../../constant/data";
import { useSlide3 } from "../../../context/Slide3Context";

const FontFamily3Popup = () => {
  // Assuming useWishCard provides 'fontFamily' state and 'setFontFamily' setter
  const {
    fontFamily3,
    setFontFamily3,
    textElements3,
    setTextElements3,
    selectedTextId3,
  } = useSlide3();

  // Get the currently selected text element
  const selectedTextElement = textElements3.find(
    (text) => text.id === selectedTextId3
  );

  // Use individual text font family or global default
  const currentFontFamily = selectedTextElement?.fontFamily || fontFamily3;

  // Use local state to manage the selected font, initialized from context
  const [selectedFont, setSelectedFont] = useState<string>(
    currentFontFamily || GOOGLE_FONTS[0]
  );

  const handleSelectFont = (fontName: string) => {
    // Update individual text element or global context
    if (selectedTextElement) {
      setTextElements3((prev) =>
        prev.map((text) =>
          text.id === selectedTextId3 ? { ...text, fontFamily: fontName } : text
        )
      );
    } else {
      // Update global context for new text elements
      if (typeof setFontFamily3 === "function") {
        setFontFamily3(fontName);
      }
    }

    // Update local state for visual feedback (checkmark)
    setSelectedFont(fontName);
  };

  // Update local state when current font family changes
  useEffect(() => {
    setSelectedFont(currentFontFamily || GOOGLE_FONTS[0]);
  }, [currentFontFamily]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        mt: 2,
        overflowY: "auto",
        width: {md:480,sm:230,xs:'100%'},
        height: "430px",
      }}
    >
      {GOOGLE_FONTS.map((fontName) => {
        const isSelected = selectedFont === fontName;

        return (
          <Box
            key={fontName}
            onClick={() => handleSelectFont(fontName)}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              px: 2,
              py: 1,
              borderRadius: 1,
              border: isSelected
                ? "2px solid #3a7bd5"
                : "1px solid transparent",
              backgroundColor: isSelected ? "#f0f8ff" : "white",
              "&:hover": {
                backgroundColor: isSelected ? "#f0f8ff" : "#f0f0f0",
              },
            }}
          >
            {/* Font Name / Preview */}
            <Typography
              variant="body1"
              sx={{
                fontFamily: fontName, // ❗ Apply the font here for preview
                fontSize: 18,
              }}
            >
              {fontName}
            </Typography>

            {/* Checkmark */}
            {isSelected && (
              <CheckIcon sx={{ fontSize: 20, color: "#3a7bd5" }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
};

export default FontFamily3Popup;
