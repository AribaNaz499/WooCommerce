// PopupWrapper.tsx
import { Box, Typography, IconButton, useMediaQuery } from "@mui/material";
import { Close } from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";

interface PopupWrapperProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  sx?: object;
  activeIndex?: number;
  open?: boolean;
}

const PopupWrapper = ({
  title,
  onClose,
  children,
  sx = {},
  activeIndex,
  open = true,
}: PopupWrapperProps) => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="popup"
          initial={{
            y: isMobile ? "100%" : 0,
            opacity: 0,
          }}
          animate={{
            y: isMobile ? 0 : 0,
            opacity: 1,
          }}
          exit={{
            y: isMobile ? "100%" : 0,
            opacity: 0,
          }}
          transition={{
            duration: 0.4,
            ease: "easeInOut",
          }}
          style={{
            position: "fixed",
            left: 0,
            bottom: isMobile ? 0 : "auto",
            top: isMobile ? "auto" : 0,
            width: "100%",
            display: "flex",
            justifyContent: isMobile ? "center" : "flex-start",
            zIndex: 1200,
          }}
        >
          <Box
            sx={{
              bgcolor: "white",
              textAlign: "center",
              borderRadius: { xs: "16px 16px 0 0", md: "10px" },
              height: { md: "600px", sm: "600px", xs: "45vh" },
              position: { md: "absolute", xs: "relative" },
              top: { md: 0, sm: 0, xs: "auto" },
              left: {
                md: activeIndex === 2 ? "29%" : "16%",
                sm: activeIndex === 2 ? "29%" : "16%",
                xs: "auto",
              },
              transform: {
                md: "none",
                xs: "none",
              },
              p: 2,
              width: { md: "390px", sm: "300px", xs: "100%" },
              boxShadow: {
                xs: "0px -4px 10px rgba(0,0,0,0.2)",
                md: "3px 4px 13px #8b8b8bff",
              },
              overflowY: "auto",
              zIndex: 1300,
              mb: { xs: 0, sm: 2, md: 20 },
              ...sx,
            }}
          >
            <Typography
              sx={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#4d4d4dff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1,
              }}
            >
              {title}
              {onClose && (
                <IconButton onClick={onClose}>
                  <Close fontSize="large" />
                </IconButton>
              )}
            </Typography>

            {children}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PopupWrapper;
