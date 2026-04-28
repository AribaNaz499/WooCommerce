// Layout1Popup.tsx
import { Box, IconButton, Typography } from "@mui/material";
import { BorderColorOutlined, TitleOutlined, Check } from "@mui/icons-material";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { useSlide1 } from "../../../context/Slide1Context";

interface Layout1PopupProps {
  onClose: () => void;
  activeIndex?: number;
}

const Layout1Popup = ({ onClose, activeIndex }: Layout1PopupProps) => {
  const {
    setShowOneTextRightSideBox1,
    setMultipleTextValue1,
    setTextAlign1,
    setVerticalAlign1,
    selectedLayout1,
    setSelectedLayout1,
  } = useSlide1();

  // Helper functions to ensure only one layout is active
  const handleBlankLayout = () => {
    setSelectedLayout1("blank");
    setShowOneTextRightSideBox1(false);
    setMultipleTextValue1(false);
  };

  const handleOneTextLayout = () => {
    setSelectedLayout1("oneText");
    setTextAlign1("start");
    setVerticalAlign1("top");
    setShowOneTextRightSideBox1(true);
    setMultipleTextValue1(false); // hide others
  };

  const handleMultipleTextLayout = () => {
    setTextAlign1("start");
    setVerticalAlign1("top");
    setSelectedLayout1((prev) => {
      if (prev === "multipleText") {
        // 🔁 Force reactivation if user clicks again after removing all texts
        setMultipleTextValue1(false);
        setTimeout(() => setMultipleTextValue1(true), 0);
        return "multipleText";
      } else {
        setMultipleTextValue1(true);
        setShowOneTextRightSideBox1(false);
        return "multipleText";
      }
    });
  };

  return (
    <PopupWrapper
      title="Layout"
      onClose={onClose}
      sx={{
        width: { md: 320, sm: 300, xs: "95%" },
        left: { md: "12%", sm: "14%", xs: 0 },
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
              selectedLayout1 === "blank"
                ? "2px solid #3a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            flexDirection: "column",
            gap: 1,
            color: selectedLayout1 === "blank" ? "#3a7bd5" : "gray",
            position: "relative",
            cursor: "pointer",
            backgroundColor: selectedLayout1 === "blank" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout1 === "blank" ? "#f0f8ff" : "#f0f0f0",
            },
          }}
        >
          <BorderColorOutlined />
          Blank
          {selectedLayout1 === "blank" && (
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
              selectedLayout1 === "oneText"
                ? "2px solid #3a7bd5"
                : "1px solid #555555ff",
            borderRadius: "6px",
            p: 1.5,
            cursor: "pointer",
            position: "relative",
            backgroundColor:
              selectedLayout1 === "oneText" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout1 === "oneText" ? "#f0f8ff" : "#f0f0f0",
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
              color: selectedLayout1 === "oneText" ? "#3a7bd5" : "gray",
              border: "3px dashed #3a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>

          {selectedLayout1 === "oneText" && (
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
              selectedLayout1 === "multipleText"
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
              selectedLayout1 === "multipleText" ? "#f0f8ff" : "white",
            "&:hover": {
              backgroundColor:
                selectedLayout1 === "multipleText" ? "#f0f8ff" : "#f0f0f0",
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
              color: selectedLayout1 === "multipleText" ? "#3a7bd5" : "gray",
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
              color: selectedLayout1 === "multipleText" ? "#3a7bd5" : "gray",
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
              color: selectedLayout1 === "multipleText" ? "#3a7bd5" : "gray",
              border: "2px dashed #3a7bd5",
            }}
          >
            <TitleOutlined />
          </Typography>

          {selectedLayout1 === "multipleText" && (
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

export default Layout1Popup;
