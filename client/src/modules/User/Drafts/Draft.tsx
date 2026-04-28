import { Box, CircularProgress, IconButton, Typography } from "@mui/material";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowBackIosNew } from "@mui/icons-material";

import MainLayout from "../../../layout/MainLayout";
import { useAuth } from "../../../context/AuthContext";
import { USER_ROUTES } from "../../../constant/route";
import DraftSlider from "../../../components/SaveDraftCardSlider/SaveDraftCardSlider";

const Draft = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sp] = useSearchParams();

  // ✅ you can pass auto-open draft id via state OR query
  const autoOpenDraftId = useMemo(() => {
    const st: any = location.state;
    return st?.openDraftId || sp.get("openDraftId") || null;
  }, [location.state, sp]);

  // ✅ Only authenticated user can see drafts
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(USER_ROUTES.SIGNIN); // change if your login route differs
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <Typography sx={{ p: 2 }}>Please login to see your drafts.</Typography>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          p: 3,
          width: { lg: "1340px", md: "100%", sm: "100%", xs: "100%" },
          display: "flex",
          flexDirection: "column",
          gap: 3,
          minHeight: "80vh",
          m: "auto",
        }}
      >
        {/* ✅ Header + Back Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ border: "1px solid #eee" }}>
            <ArrowBackIosNew fontSize="small" />
          </IconButton>

          <Typography fontSize={26} fontWeight={800}>
            My Drafts
          </Typography>
        </Box>
        <DraftSlider autoOpenCardId={autoOpenDraftId ?? undefined} />
      </Box>
    </MainLayout>
  );
};

export default Draft;
