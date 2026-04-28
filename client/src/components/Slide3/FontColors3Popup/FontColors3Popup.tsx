import React, { useState } from "react";
import { Box } from "@mui/material";
import { ChromePicker } from "react-color";
import { useSlide3 } from "../../../context/Slide3Context";

const FontColor3Popup = () => {
  const {
    setFontColor3,
    fontColor3,
    textElements3,
    setTextElements3,
    selectedTextId3,
  } = useSlide3();
  // Initialize state with a default color
  const initialColor = "#000000";
  // const [selected, setSelected] = useState<string>(initialColor);
  // Get the currently selected text element
  const selectedTextElement = textElements3.find(
    (text) => text.id === selectedTextId3
  );

  // Use individual text color or global default
  const currentFontColor = selectedTextElement?.fontColor || fontColor3;

  // 2. State for the custom color picker value
  const [pickerColor, setPickerColor] = useState<string>(initialColor);

  const handlePickerChangeComplete = (color: any) => {
    const hex = color.hex;

    // Update individual text element or global context
    if (selectedTextElement) {
      setTextElements3((prev) =>
        prev.map((text) =>
          text.id === selectedTextId3 ? { ...text, fontColor: hex } : text
        )
      );
    } else {
      setFontColor3(hex);
    }

    setPickerColor(hex);
  };

  React.useEffect(() => {
    setPickerColor(currentFontColor);
  }, [currentFontColor]);

  return (
    <Box
      sx={{
        py: 2,
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
        width: {md:460,sm:230,xs:'100%'},
        height: {md:420,sm:420,xs:200},
        mt: {md:4,sm:4,xs:0},
        overflowY:'auto'
      }}
    >
      <ChromePicker
        color={pickerColor} // Use the pickerColor state
        onChangeComplete={handlePickerChangeComplete}
        disableAlpha={true}
        styles={{
          default: {
            picker: { boxShadow: "none", width: "95%", height: "100%" },
          },
        }}
      />
    </Box>
  );
};

export default FontColor3Popup;
