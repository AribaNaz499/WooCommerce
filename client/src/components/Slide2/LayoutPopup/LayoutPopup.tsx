// LayoutPopup.tsx
import { Box, IconButton, Typography } from "@mui/material";
import { BorderColorOutlined, TitleOutlined, Check } from "@mui/icons-material";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { useSlide2 } from "../../../context/Slide2Context";

interface LayoutPopupProps {
  onClose: () => void;
  activeIndex?: number;
}

const LayoutPopup = ({ onClose, activeIndex }: LayoutPopupProps) => {
  const {
    setShowOneTextRightSideBox,
    setMultipleTextValue,
    setTextAlign,
    setVerticalAlign,
    selectedLayout,
    setSelectedLayout,
  } = useSlide2();

  // Helper functions to ensure only one layout is active
  const handleBlankLayout = () => {
    setSelectedLayout("blank");
    setShowOneTextRightSideBox(false);
    setMultipleTextValue(false);
  };

  const handleOneTextLayout = () => {
    setSelectedLayout("oneText");
    setTextAlign("start");
    setVerticalAlign("top");
    setShowOneTextRightSideBox(true);
    setMultipleTextValue(false); // hide others
  };

  const handleMultipleTextLayout = () => {
    setTextAlign("start");
    setVerticalAlign("top");
    setSelectedLayout((prev) => {
      if (prev === "multipleText") {
        // 🔁 Force reactivation if user clicks again after removing all texts
        setMultipleTextValue(false);
        setTimeout(() => setMultipleTextValue(true), 0);
        return "multipleText";
      } else {
        setMultipleTextValue(true);
        setShowOneTextRightSideBox(false);
        return "multipleText";
      }
    });
  };

  return (
    <PopupWrapper
      title="Layout"
      onClose={onClose}
      sx={{
        width: { md: 350, sm: 300, xs: "95%" },
        left: { md: "14.5%", sm: "0%", xs: 0 },
        mt: { md: 0, sm: 0, xs: 4 },
      }}
      activeIndex={activeIndex}
    >
      {/* Layout Box */}
      <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {/* Blank layout */}
        <Box
          onClick={handleBlankLayout}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            width: "130px",
            border:
              selectedLayout === "blank"
                ? "2px solid #3a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            flexDirection: "column",
            gap: 1,
            color: selectedLayout === "blank" ? "#3a7bd5" : "gray",
            position: "relative",
            cursor: "pointer",
            backgroundColor: selectedLayout === "blank" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout === "blank" ? "#f0f8ff" : "#f0f0f0",
            },
          }}
        >
          <BorderColorOutlined />
          Blank
          {selectedLayout === "blank" && (
            <IconButton
              sx={{
                position: "absolute",
                bottom: 3,
                right: 3,
                bgcolor: "#3a7bd5",
                zIndex: 99,
                border: "2px solid white",
                width: "20px",
                height: "20px",
              }}
              size="small"
              aria-label="Selected layout"
            >
              <Check
                fontSize="small"
                sx={{
                  color: "white",
                  fontSize: "16px",
                }}
              />
            </IconButton>
          )}
        </Box>

        {/* OneText Layout */}
        <Box
          component={"div"}
          sx={{
            height: "200px",
            width: "130px",
            border:
              selectedLayout === "oneText"
                ? "2px solid #3a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            p: 1.5,
            cursor: "pointer",
            position: "relative",
            backgroundColor: selectedLayout === "oneText" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout === "oneText" ? "#f0f8ff" : "#f0f0f0",
            },
          }}
          onClick={handleOneTextLayout}
        >
          <Typography
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              m: "auto",
              color: selectedLayout === "oneText" ? "#3a7bd5" : "gray",
              border: "3px dashed #3a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>

          {selectedLayout === "oneText" && (
            <IconButton
              sx={{
                position: "absolute",
                bottom: 3,
                right: 0,
                bgcolor: "#3a7bd5",
                zIndex: 99,
                border: "2px solid white",
                width: "20px",
                height: "20px",
              }}
              size="small"
              aria-label="Selected layout"
            >
              <Check
                fontSize="small"
                sx={{
                  color: "white",
                  fontSize: "16px",
                }}
              />
            </IconButton>
          )}
        </Box>

        {/* Multiple Text Layout */}
        <Box
          sx={{
            height: "200px",
            width: "140px",
            border:
              selectedLayout === "multipleText"
                ? "2px solid #3a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            p: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: "relative",
            cursor: "pointer",
            backgroundColor:
              selectedLayout === "multipleText" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout === "multipleText" ? "#f0f8ff" : "#f0f0f0",
            },
          }}
          onClick={handleMultipleTextLayout}
        >
          <Typography
            sx={{
              width: "100%",
              height: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              m: "auto",
              color: selectedLayout === "multipleText" ? "#3a7bd5" : "gray",
              border: "2px dashed #3a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>
          <Typography
            sx={{
              width: "100%",
              height: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              m: "auto",
              color: selectedLayout === "multipleText" ? "#3a7bd5" : "gray",
              border: "2px dashed #3a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>
          <Typography
            sx={{
              width: "100%",
              height: "50px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              m: "auto",
              color: selectedLayout === "multipleText" ? "#3a7bd5" : "gray",
              border: "2px dashed #3a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>

          {selectedLayout === "multipleText" && (
            <IconButton
              sx={{
                position: "absolute",
                bottom: 3,
                right: 0,
                bgcolor: "#3a7bd5",
                zIndex: 99,
                border: "2px solid white",
                width: "20px",
                height: "20px",
              }}
              size="small"
              aria-label="Selected layout"
            >
              <Check
                fontSize="small"
                sx={{
                  color: "white",
                  fontSize: "16px",
                }}
              />
            </IconButton>
          )}
        </Box>
      </Box>
    </PopupWrapper>
  );
};

export default LayoutPopup;
