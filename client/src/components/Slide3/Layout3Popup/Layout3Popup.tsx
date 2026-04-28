// Layout3Popup.tsx
import { Box, IconButton, Typography } from "@mui/material";
import { BorderColorOutlined, TitleOutlined, Check } from "@mui/icons-material";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { useSlide3 } from "../../../context/Slide3Context";

interface Layout3PopupProps {
  onClose: () => void;
  activeIndex?: number;
}

const Layout3Popup = ({ onClose, activeIndex }: Layout3PopupProps) => {
  const {
    setShowOneTextRightSideBox3,
    setMultipleTextValue3,
    setTextAlign3,
    setVerticalAlign3,
    selectedLayout3,
    setSelectedLayout3,
  } = useSlide3();

  // Helper functions to ensure only one layout is active
  const handleBlankLayout = () => {
    setSelectedLayout3("blank");
    setShowOneTextRightSideBox3(false);
    setMultipleTextValue3(false);
  };

  const handleOneTextLayout = () => {
    setSelectedLayout3("oneText");
    setTextAlign3("start");
    setVerticalAlign3("top");
    setShowOneTextRightSideBox3(true);
    setMultipleTextValue3(false);
  };

  const handleMultipleTextLayout = () => {
    setSelectedLayout3("multipleText");
    setTextAlign3("start");
    setVerticalAlign3("top");
    setShowOneTextRightSideBox3(false);
    setMultipleTextValue3(true);
  };

  return (
    <PopupWrapper
      title="Layout"
      onClose={onClose}
      sx={{
        width: { md: 350, sm: 300, xs: "95%" },
        left: { md: "20.5%", sm: "0%", xs: 0 },
        mt: { md: 0, sm: 0, xs: 4 },
      }}
      activeIndex={activeIndex}
    >
      {/* Layout Box */}
      <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap",bgcolor:'white' }}>
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
              selectedLayout3 === "blank"
                ? "2px solid #3a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            flexDirection: "column",
            gap: 1,
            color: selectedLayout3 === "blank" ? "#3a7bd5" : "gray",
            position: "relative",
            cursor: "pointer",
            backgroundColor: selectedLayout3 === "blank" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout3 === "blank" ? "#f0f8ff" : "#f0f0f0",
            },
          }}
        >
          <BorderColorOutlined />
          Blank
          {selectedLayout3 === "blank" && (
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
              selectedLayout3 === "oneText"
                ? "2px solid #3a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            p: 1.5,
            cursor: "pointer",
            position: "relative",
            backgroundColor:
              selectedLayout3 === "oneText" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout3 === "oneText" ? "#f0f8ff" : "#f0f0f0",
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
              color: selectedLayout3 === "oneText" ? "#3a7bd5" : "gray",
              border: "3px dashed #3a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>

          {selectedLayout3 === "oneText" && (
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
              selectedLayout3 === "multipleText"
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
              selectedLayout3 === "multipleText" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout3 === "multipleText" ? "#f0f8ff" : "#f0f0f0",
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
              color: selectedLayout3 === "multipleText" ? "#3a7bd5" : "gray",
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
              color: selectedLayout3 === "multipleText" ? "#3a7bd5" : "gray",
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
              color: selectedLayout3 === "multipleText" ? "#3a7bd5" : "gray",
              border: "2px dashed #3a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>

          {selectedLayout3 === "multipleText" && (
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

export default Layout3Popup;
