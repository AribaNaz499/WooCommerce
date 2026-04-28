// Layout4Popup.tsx
import { Box, IconButton, Typography } from "@mui/material";
import { BorderColorOutlined, TitleOutlined, Check } from "@mui/icons-material";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { useSlide4 } from "../../../context/Slide4Context";

interface Layout4PopupProps {
  onClose: () => void;
  activeIndex?: number;
}

const Layout4Popup = ({ onClose, activeIndex }: Layout4PopupProps) => {
  const {
    setShowOneTextRightSideBox4,
    setMultipleTextValue4,
    setTextAlign4,
    setVerticalAlign4,
    selectedLayout4,
    setSelectedLayout4,
  } = useSlide4();

  // Helper functions to ensure only one layout is active
  const handleBlankLayout = () => {
    setSelectedLayout4("blank");
    setShowOneTextRightSideBox4(false);
    setMultipleTextValue4(false);
  };

  const handleOneTextLayout = () => {
    setSelectedLayout4("oneText");
    setTextAlign4("start");
    setVerticalAlign4("top");
    setShowOneTextRightSideBox4(true);
    setMultipleTextValue4(false);
  };

  const handleMultipleTextLayout = () => {
    setSelectedLayout4("multipleText");
    setTextAlign4("start");
    setVerticalAlign4("top");
    setShowOneTextRightSideBox4(false);
    setMultipleTextValue4(true);
  };

  return (
    <PopupWrapper
      title="Layout"
      onClose={onClose}
      sx={{
        width: { md: 350, sm: 350, xs: "95%" },
        left: { md: "55.5%", sm: "0%", xs: 0 },
        mt: { md: 0, sm: 0, xs: 4 },
      }}
      activeIndex={activeIndex}
    >
      {/* Layout Box */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          gap: 1,
          flexWrap: "wrap",
          bgcolor: "white",
        }}
      >
        {/* Blank layout */}
        <Box
          onClick={handleBlankLayout}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "200px",
            width: "140px",
            border:
              selectedLayout4 === "blank"
                ? "2px solid #4a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            flexDirection: "column",
            gap: 1,
            color: selectedLayout4 === "blank" ? "#4a7bd5" : "gray",
            position: "relative",
            cursor: "pointer",
            backgroundColor: selectedLayout4 === "blank" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout4 === "blank" ? "#f0f8ff" : "#f0f0f0",
            },
          }}
        >
          <BorderColorOutlined />
          Blank
          {selectedLayout4 === "blank" && (
            <IconButton
              sx={{
                position: "absolute",
                bottom: 4,
                right: 4,
                bgcolor: "#4a7bd5",
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
            width: "140px",
            border:
              selectedLayout4 === "oneText"
                ? "2px solid #4a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            p: 1.5,
            cursor: "pointer",
            position: "relative",
            backgroundColor:
              selectedLayout4 === "oneText" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout4 === "oneText" ? "#f0f8ff" : "#f0f0f0",
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
              color: selectedLayout4 === "oneText" ? "#4a7bd5" : "gray",
              border: "2px dashed #4a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>

          {selectedLayout4 === "oneText" && (
            <IconButton
              sx={{
                position: "absolute",
                bottom: 4,
                right: 0,
                bgcolor: "#4a7bd5",
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
              selectedLayout4 === "multipleText"
                ? "2px solid #4a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            p: 1,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            position: "relative",
            cursor: "pointer",
            backgroundColor:
              selectedLayout4 === "multipleText" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout4 === "multipleText" ? "#f0f8ff" : "#f0f0f0",
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
              color: selectedLayout4 === "multipleText" ? "#4a7bd5" : "gray",
              border: "2px dashed #4a7bd5",
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
              color: selectedLayout4 === "multipleText" ? "#4a7bd5" : "gray",
              border: "2px dashed #4a7bd5",
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
              color: selectedLayout4 === "multipleText" ? "#4a7bd5" : "gray",
              border: "2px dashed #4a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>

          {selectedLayout4 === "multipleText" && (
            <IconButton
              sx={{
                position: "absolute",
                bottom: 4,
                right: 0,
                bgcolor: "#4a7bd5",
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

export default Layout4Popup;
