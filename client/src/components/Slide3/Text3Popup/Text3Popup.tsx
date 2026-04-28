// Text3Popup.tsx
import { Box, IconButton, Typography } from "@mui/material";
import {
  TextIncreaseOutlined,
  TextFields,
  PaletteOutlined,
  FormatAlignCenterOutlined,
  TextRotationAngleupOutlined,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Delete,
  FormatBoldOutlined,
  Title,
  TextRotateVertical,
} from "@mui/icons-material";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { COLORS } from "../../../constant/color";
import React from "react";
import { useSlide3 } from "../../../context/Slide3Context";

interface Text3PopupProps {
  onClose?: () => void;
  activeIndex?: number;
  onShowFontSizePopup: () => void;
  onShowFontColorPopup: () => void;
  onSetLineHeightPopup: () => void;
  onShowFontFamilyPopup: () => void;
  onChangeTextAlign: () => void;
  renderActiveTextSlide3Child: React.ReactNode | null;
  onAddTextToCanvas?: () => void;
}

const editingButtonStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  fontSize: "13px",
  color: "#212121",
  p: 1,
  "&:hover": {
    color: COLORS.primary, // Use a primary color for hover
  },
};

const Text3Popup = ({
  onClose,
  onShowFontSizePopup,
  onShowFontColorPopup,
  onShowFontFamilyPopup,
  onSetLineHeightPopup,
  onChangeTextAlign,
  renderActiveTextSlide3Child,
  onAddTextToCanvas,
}: Text3PopupProps) => {
  const {
    setFontWeight3,
    setTextAlign3,
    setRotation3,
    fontWeight3,
    // textAlign,
    rotation3,
    textElements3,
    setTextElements3,
    selectedTextId3,
    setSelectedTextId3,
    setFontSize3,
    setFontColor3,
    setFontFamily3,
    setVerticalAlign3,
    multipleTextValue3,
    showOneTextRightSideBox3,
  } = useSlide3();

  const selectedTextElement = textElements3.find(
    (text: any) => text.id === selectedTextId3
  );

  const isLayoutUse = multipleTextValue3 || showOneTextRightSideBox3

  // Function to update individual text element or global defaults
  const updateTextProperty = (property: string, value: any) => {
    if (selectedTextId3) {
      // ✅ Only update the selected text element
      setTextElements3((prev: any) =>
        prev.map((text: any) =>
          text.id === selectedTextId3 ? { ...text, [property]: value } : text
        )
      );
    } else {
      // ✅ If no text selected, update global defaults for new ones
      switch (property) {
        case "fontWeight":
          setFontWeight3(value);
          break;
        case "textAlign":
          setTextAlign3(value);
          break;
        case "rotation":
          setRotation3(value);
          break;
        case "fontSize":
          setFontSize3(value);
          break;
        case "fontColor":
          setFontColor3(value);
          break;
        case "fontFamily":
          setFontFamily3(value);
          break;
        case "verticalAlign":
          setVerticalAlign3(value);
          break;
        default:
          break;
      }
    }
  };

  // Function to toggle Font Weight (Bold) between 400 and 700
  const toggleFontWeight = () => {
    const currentWeight = selectedTextElement?.fontWeight || fontWeight3;
    const newWeight = currentWeight === 700 ? 400 : 700;
    updateTextProperty("fontWeight", newWeight);
  };


  // Text Rotation
  const rotateText = () => {
    const currentRotation = selectedTextElement?.rotation || rotation3;
    const nextRotation = (currentRotation + 30) % 360;
    updateTextProperty("rotation", nextRotation);
  };

  // Z-index management functions
  const bringToFront = () => {
    if (!selectedTextElement) return;
    const maxZIndex = Math.max(
      ...textElements3.map((text: any) => text.zIndex),
      0
    );
    setTextElements3((prev: any) =>
      prev.map((text: any) =>
        text.id === selectedTextId3 ? { ...text, zIndex: maxZIndex + 1 } : text
      )
    );
  };

  const sendToBack = () => {
    if (!selectedTextElement) return;

    const minZIndex = Math.min(
      ...textElements3.map((text: any) => text.zIndex),
      1
    );
    setTextElements3((prev: any) =>
      prev.map((text: any) =>
        text.id === selectedTextId3
          ? { ...text, zIndex: Math.max(minZIndex - 1, 1) }
          : text
      )
    );
  };

  const deleteSelectedText = () => {
    if (!selectedTextElement) return;

    setTextElements3((prev: any) =>
      prev.filter((text: any) => text.id !== selectedTextId3)
    );
    setSelectedTextId3(null);
  };

  return (
    <PopupWrapper
      title={"Text Editing"}
      onClose={onClose}
      sx={{
        width: { md: 500, sm: 250, xs: "95%" },
        mt: { md: 0, sm: 0, xs: 0 },
        height: { md: 600, sm: 600, xs: 500 },
        left: { md: "12.5%", sm: "0%", xs: 0 },
        overflowY: "hidden",
      }}
    >
      {/* 1. MAIN ICON BAR (Visible if no child popup is active) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "5px", // Reduced gap
          justifyContent: "space-between", // Better spacing
          p: 1,
          width: "100%",
          overflowX: "scroll",
          // Keep the scrollbar styles for overflow
          "&::-webkit-scrollbar": { height: "6px" },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
            borderRadius: "20px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: COLORS.primary,
            borderRadius: "20px",
          },
        }}
      >
        {/* Add Text */}
        <IconButton disabled={isLayoutUse} onClick={onAddTextToCanvas} sx={editingButtonStyle}>
          <Title fontSize="large" />
          <Typography variant="caption">Add</Typography>
        </IconButton>
        {/* Size */}
        <IconButton onClick={onShowFontSizePopup} sx={editingButtonStyle}>
          <TextIncreaseOutlined fontSize="large" />
          <Typography variant="caption">Size</Typography>
        </IconButton>

        {/* Font Family */}
        <IconButton onClick={onShowFontFamilyPopup} sx={editingButtonStyle}>
          <TextFields fontSize="large" />
          <Typography variant="caption">Font</Typography>
        </IconButton>

        {/* Bold/Font Weight Toggle */}
        <IconButton
          onClick={toggleFontWeight}
          sx={{
            ...editingButtonStyle,
            color:
              (selectedTextElement?.fontWeight || fontWeight3) === 700
                ? COLORS.primary
                : "#212121",
          }}
        >
          <FormatBoldOutlined fontSize="large" />
          <Typography variant="caption">Bold</Typography>
        </IconButton>

        {/* Colour */}
        <IconButton onClick={onShowFontColorPopup} sx={editingButtonStyle}>
          <PaletteOutlined fontSize="large" />
          <Typography variant="caption">Colour</Typography>
        </IconButton>

        {/* Align */}
        <IconButton onClick={onChangeTextAlign} sx={editingButtonStyle}>
          <FormatAlignCenterOutlined fontSize="large" />
          <Typography variant="caption">Align</Typography>
        </IconButton>


        {/* Line Height  */}
        <IconButton disableRipple onClick={onSetLineHeightPopup} sx={editingButtonStyle} >
          <TextRotateVertical fontSize="large" />
          <Typography variant="caption">Line Height</Typography>
        </IconButton>

        {/* Rotate */}
        <IconButton
          onClick={rotateText}
          sx={editingButtonStyle}
          disabled={!selectedTextElement}
        >
          <TextRotationAngleupOutlined fontSize="large" />
          <Typography variant="caption">Rotate</Typography>
        </IconButton>

        {/* Layering and Delete */}
        <IconButton
          onClick={() => bringToFront()}
          sx={editingButtonStyle}
          disabled={!selectedTextElement}
        >
          <KeyboardArrowUp fontSize="large" />
          <Typography variant="caption">To Front</Typography>
        </IconButton>
        <IconButton
          onClick={() => sendToBack()}
          sx={editingButtonStyle}
          disabled={!selectedTextElement}
        >
          <KeyboardArrowDown fontSize="large" />
          <Typography variant="caption">To Back</Typography>
        </IconButton>
        <IconButton
          onClick={() => deleteSelectedText()}
          sx={editingButtonStyle}
          disabled={!selectedTextElement}
        >
          <Delete fontSize="large" />
          <Typography variant="caption">Delete</Typography>
        </IconButton>
      </Box>

      {/* 2. CHILD COMPONENT CONTAINER (Renders the sub-popup content) */}
      <Box
        sx={{
          display: renderActiveTextSlide3Child ? "block" : "none",
          width: "100%",
          height: "100%",
          // The padding and margin will be managed by the child component itself (e.g., FontSizePopup)
        }}
      >
        {renderActiveTextSlide3Child}
      </Box>
    </PopupWrapper>
  );
};

export default Text3Popup;
