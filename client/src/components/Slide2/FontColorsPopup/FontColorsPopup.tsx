import React, { useState } from "react";
import { Box } from "@mui/material";
import { ChromePicker } from "react-color";
import { useSlide2 } from "../../../context/Slide2Context";


const FontColorPopup = () => {
  const { 
    setFontColor,
    fontColor,
    textElements,
    setTextElements,
    selectedTextId,
  } = useSlide2();
  
  // Get the currently selected text element
  const selectedTextElement = textElements.find(text => text.id === selectedTextId);
  
  // Use individual text color or global default
  const currentFontColor = selectedTextElement?.fontColor || fontColor;
  
  // Initialize state with current color
  const initialColor = currentFontColor || "#000000";
  // const [selected, setSelected] = useState<string>(initialColor);

  // 2. State for the custom color picker value
  const [pickerColor, setPickerColor] = useState<string>(initialColor);

  const handlePickerChangeComplete = (color: any) => {
    const hex = color.hex;
    
    // Update individual text element or global context
    if (selectedTextElement) {
      setTextElements(prev => 
        prev.map(text => 
          text.id === selectedTextId 
            ? { ...text, fontColor: hex }
            : text
        )
      );
    } else {
      // Update global context for new text elements
      setFontColor(hex);
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

export default FontColorPopup;
