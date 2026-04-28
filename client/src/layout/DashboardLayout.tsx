import React, { useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Sidebar from "./components/Sidebar/Sidebar";
import { COLORS } from "../constant/color";
import DNavbar from "./components/DNavbar/DNavbar";
import DHeader from "./components/DHeader/DHeader";

type LayoutType = {
  children: React.ReactNode;
  title?: string;
  exportBtn?: string;
  addBtn?: string;
  onClick?: () => void;
  onExportClick?: () => void;
};

const DashboardLayout = ({ children, title, exportBtn, addBtn, onClick, onExportClick }: LayoutType) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <Box
      sx={{
        height: "100vh",
        bgcolor: "#0f132a",
        overflow: "hidden",
      }}
    >
      <DNavbar />
      <Box display={"flex"} width={"100%"}>
        {/* Sidebar Container */}
        <Box
          component="aside"
          sx={{
            width: { md: 260, sm: 260, xs: sidebarOpen ? 240 : 0 },
            transition: "width 0.3s ease",
            background:
              "linear-gradient(180deg, rgba(18,22,46,1) 0%, rgba(12,16,38,1) 100%)",
            color: COLORS.white,
            height: "100vh",
            overflowY: "auto",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            "&::-webkit-scrollbar": {
              height: "6px",
              width: '6px',
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "rgba(255,255,255,0.06)",
              borderRadius: "20px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: COLORS.primary,
              borderRadius: "20px",
            },
            position: { xs: "fixed", sm: "relative" },
            top: 0,
            left: 0,
            zIndex: { md: 0, sm: 0, xs: 9999 }
          }}
        >
          {/* Sidebar Header */}
          <Box
            sx={{
              textAlign: "center",
              display: sidebarOpen || { md: "block" } ? "block" : "none",
            }}
          >
            <Box
              sx={{
                mt: 3,
                textAlign: "start",
                height: "calc(100vh)",
                // overflowY: "auto",
                // "&::-webkit-scrollbar": {
                //   height: "6px",
                //   width: '4px',
                // },
                // "&::-webkit-scrollbar-track": {
                //   backgroundColor: "#f1f1f1",
                //   borderRadius: "20px",
                // },
                // "&::-webkit-scrollbar-thumb": {
                //   backgroundColor: COLORS.primary,
                //   borderRadius: "20px",
                // },
                p: 2,
              }}
            >
              <Sidebar />
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            p: { md: "24px", sm: "20px", xs: "0px" },
            overflowY: "auto",
            height: "100vh",
            width: "100%",
            overflowX: "hidden",
            msOverflowY: "scroll",
          }}
        >
          {/* Mobile Toggle Button */}
          <Box
            sx={{
              display: { xs: "flex", sm: "none" },
              justifyContent: "flex-start",
              alignItems: "center",
              p: 1,
              bgcolor: "#11142d",
              color: COLORS.white,
            }}
          >
            <IconButton onClick={toggleSidebar} sx={{ color: COLORS.white }}>
              {sidebarOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
            <Typography sx={{ ml: 1, fontWeight: 700 }}>Menu</Typography>
          </Box>

          {/* Page Content */}
          <Box sx={{ flex: 1, mb: 10, p: { md: 0, xs: 1 } }}>
            <Box
              sx={{
                backgroundColor: "#ffffff",
                borderRadius: 4,
                p: { md: 3, sm: 2, xs: 2 },
                minHeight: { md: "calc(100vh - 150px)", xs: "auto" },
                boxShadow: "0 20px 60px rgba(5,10,36,0.35)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <DHeader
                title={title}
                exportBtn={exportBtn}
                addBtn={addBtn}
                onClick={onClick}
                onExportClick={onExportClick}
              />
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <Box
          onClick={toggleSidebar}
          sx={{
            display: { xs: "block", md: "none" },
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            bgcolor: "rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
        />
      )}
    </Box>
  );
};

export default DashboardLayout;
