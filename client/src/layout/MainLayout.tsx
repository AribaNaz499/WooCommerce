import { Box, Fab, Zoom } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { useEffect, useState } from "react";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import { COLORS } from "../constant/color";
import StickerLine from "../components/TableList/StickerLine/StickerLine";

type Props = {
  children: React.ReactNode;
};

const MainLayout = ({ children }: Props) => {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 800) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Box sx={{ position: "relative" }}>
      <Header />
      <StickerLine />
      {children}
      <Footer />

      {/* Scroll to top button */}
      <Zoom in={showScroll}>
        <Fab
          onClick={scrollToTop}
          size="small"
          aria-label="scroll back to top"
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            backgroundColor: COLORS.white,
            border: `2px solid ${COLORS.seconday}`,
            outline: `1px solid ${COLORS.white}`,
            color: "black",
            borderRadius: "50%",
            boxShadow: 8,
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              backgroundColor: '#f1f1f1c9',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Zoom>
    </Box>
  );
};

export default MainLayout;
