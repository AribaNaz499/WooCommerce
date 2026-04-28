import { Box, IconButton, TextField } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { COLORS } from "../../../constant/color";
import { useSlide2 } from "../../../context/Slide2Context";

const FontSizePopup = () => {
  const { 
    setFontSize, 
    fontSize,
    textElements,
    setTextElements,
    selectedTextId,
  } = useSlide2();

  // Get the currently selected text element
  const selectedTextElement = textElements.find(text => text.id === selectedTextId);
  
  // Use individual text size or global default
  const currentFontSize = selectedTextElement?.fontSize || fontSize;

  // 1. State for the validated font size (the number sent to context)
  // Configuration for size control
  const INITIAL_SIZE = currentFontSize || 16;
  const MIN_SIZE = 16;
  const MAX_SIZE = 100;
  const STEP = 2;
  const [fontLocalSize, setLocalFontSize] = useState(INITIAL_SIZE);
  // 2. State for the raw input text (allows temporary non-numeric or out-of-bounds input)
  const [inputString, setInputString] = useState(String(INITIAL_SIZE));

  // Helper function to validate and clamp the size
  const validateAndClampSize = (newSize: number): number => {
    let size = Math.round(newSize);

    if (size < MIN_SIZE) {
      size = MIN_SIZE;
    } else if (size > MAX_SIZE) {
      size = MAX_SIZE;
    }
    return size;
  };

  // Function to safely update the validated size and notify the context
  const updateValidatedSize = (newSize: number) => {
    const clampedSize = validateAndClampSize(newSize);

    // Update local validated state and the input field value
    setLocalFontSize(clampedSize);
    setInputString(String(clampedSize));

    // Update individual text element or global context
    if (selectedTextElement) {
      setTextElements(prev => 
        prev.map(text => 
          text.id === selectedTextId 
            ? { ...text, fontSize: clampedSize }
            : text
        )
      );
    } else {
      // Update global context for new text elements
      setFontSize(clampedSize);
    }
  };

  // Handler for direct text input changes (updates the raw input string)
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputString(event.target.value);
  };

  // Handler for when the user clicks away from the input (applies validation/clamping)
  const handleInputBlur = () => {
    const value = parseInt(inputString);

    if (isNaN(value)) {
      // If input is empty or non-numeric (e.g., "abc"), revert to the last valid size
      setInputString(String(fontLocalSize));
    } else {
      // If it's a number, validate, clamp, and update
      updateValidatedSize(value);
    }
  };

  // Handler for the decrease button (-)
  const handleDecrease = () => {
    updateValidatedSize(fontLocalSize - STEP);
  };

  // Handler for the increase button (+)
  const handleIncrease = () => {
    updateValidatedSize(fontLocalSize + STEP);
  };

  // Handler for mouse wheel (scroll) events over the input field
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault(); // Prevent the main page from scrolling

    if (event.deltaY < 0) {
      // Scroll up (increase)
      handleIncrease();
    } else {
      // Scroll down (decrease)
      handleDecrease();
    }
  };

  // Initial update to context when the popup mounts
  useEffect(() => {
    setFontSize(INITIAL_SIZE);
  }, [setFontSize]);

  return (
    <Box
      mt={3}
      sx={{
        width: {md:300,sm:200,xs:'100%'},
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 2,
        height: {md:350,sm:350,xs:250},
        m: "auto",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          p: 1,
          borderRadius: 2,
          border: "1px solid #ccc",
        }}
      >
        {/* Decrease Button */}
        <IconButton
          onClick={handleDecrease}
          sx={{
            color: "white",
            bgcolor: COLORS.primary,
            "&:hover": { bgcolor: "#192025ff" },
          }}
          aria-label="decrease font size"
        >
          <Remove />
        </IconButton>

        {/* Text Input Field */}
        <TextField
          value={inputString}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onWheel={handleWheel}
          type="number"
          variant="standard"
          size="small"
          sx={{
            width: {md:200,sm:100,xs:200},
            "& input": {
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "20px",
            },
          }}
        />

        {/* Increase Button */}
        <IconButton
          onClick={handleIncrease}
          sx={{
            color: "white",
            bgcolor: COLORS.primary,
            "&:hover": { bgcolor: "#192025ff" },
          }}
          aria-label="increase font size"
        >
          <Add />
        </IconButton>
      </Box>
    </Box>
  );
};

export default FontSizePopup;
