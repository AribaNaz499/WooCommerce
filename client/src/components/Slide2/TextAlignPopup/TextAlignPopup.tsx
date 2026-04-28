import {
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  VerticalAlignTop,
  VerticalAlignCenter,
  VerticalAlignBottom,
} from "@mui/icons-material";
import { Box, Divider, Typography } from "@mui/material";
import { useSlide2 } from "../../../context/Slide2Context";

const verticalAlignOptions = [
  { key: "top", icon: <VerticalAlignTop />, label: "Top" },
  { key: "center", icon: <VerticalAlignCenter />, label: "Center" },
  { key: "bottom", icon: <VerticalAlignBottom />, label: "Bottom" },
];

const horizontalAlignOptions = [
  { key: "left", icon: <FormatAlignLeft />, label: "Left" },
  { key: "center", icon: <FormatAlignCenter />, label: "Center" },
  { key: "right", icon: <FormatAlignRight />, label: "Right" },
];

const TextAlignPopup = () => {
  const {
    verticalAlign,
    textAlign,
    textElements,
    selectedTextId,
    setTextElements,
    setVerticalAlign,
    setTextAlign,
  } = useSlide2();

  const selectedTextElement = textElements.find(
    (text) => text.id === selectedTextId
  );

  const updateTextProperty = (property: string, value: any) => {
    if (selectedTextId) {
      setTextElements((prev) =>
        prev.map((text) =>
          text.id === selectedTextId ? { ...text, [property]: value } : text
        )
      );
    } else {
      if (property === "verticalAlign") setVerticalAlign(value);
      if (property === "textAlign") setTextAlign(value);
    }
  };

  return (
    <Box
      sx={{
        p: 2,
        width: { md: 460, sm: 230, xs: "100%" },
        height: { md: 400, sm: 400, xs: 200 },
        mt: { md: 4, sm: 4, xs: 0 },
        textAlign: "start",
        overflowY: "auto",
      }}
    >
      {/* Vertical Alignment */}
      <Box>
        <Typography fontSize={{ md: 20, sm: 20, xs: 15 }} fontWeight={"bold"}>
          Vertical Alignment
        </Typography>
        <Divider />
        <Box sx={{ display: "flex", gap: 2, py: 2 }}>
          {verticalAlignOptions.map((opt) => (
            <Box
              key={opt.key}
              onClick={() => updateTextProperty("verticalAlign", opt.key)}
              sx={{
                p: 2,
                border: `2px solid ${(selectedTextElement?.verticalAlign || verticalAlign) ===
                  opt.key
                  ? "#3a7bd5"
                  : "lightgray"
                  }`,
                borderRadius: 3,
                cursor: "pointer",
                color:
                  (selectedTextElement?.verticalAlign || verticalAlign) ===
                    opt.key
                    ? "#3a7bd5"
                    : "inherit",
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "#3a7bd5" },
              }}
            >
              {opt.icon}
            </Box>
          ))}
        </Box>
      </Box>

      <br />

      {/* Horizontal Alignment */}
      <Box>
        <Typography fontSize={{ md: 20, sm: 20, xs: 15 }} fontWeight={"bold"}>
          Horizontal Alignment
        </Typography>
        <Divider />
        <Box sx={{ display: "flex", gap: 2, py: 2 }}>
          {horizontalAlignOptions.map((opt) => (
            <Box
              key={opt.key}
              onClick={() => updateTextProperty("textAlign", opt.key)}
              sx={{
                p: 2,
                border: `2px solid ${(selectedTextElement?.textAlign || textAlign) === opt.key
                  ? "#3a7bd5"
                  : "lightgray"
                  }`,
                borderRadius: 3,
                cursor: "pointer",
                color:
                  (selectedTextElement?.textAlign || textAlign) === opt.key
                    ? "#3a7bd5"
                    : "inherit",
                transition: "all 0.2s ease",
                "&:hover": { borderColor: "#3a7bd5" },
              }}
            >
              {opt.icon}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default TextAlignPopup;
