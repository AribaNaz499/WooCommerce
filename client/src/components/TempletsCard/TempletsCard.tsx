import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import {
  ArrowBackIos,
  ArrowDropDown,
  ArrowForwardIos,
} from "@mui/icons-material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import ProductCard from "../ProductCard/ProductCard";
import { COLORS } from "../../constant/color";
import { useQuery } from "@tanstack/react-query";
import useModal from "../../hooks/useModal";
import ProductPopup, { type CategoryType } from "../ProductPopup/ProductPopup";
import { fetchAllTempletDesigns } from "../../source/source";
import { shouldSmartCropCategory } from "../../lib/thumbnail";
import { useLocation, useNavigate } from "react-router-dom";
import { USER_ROUTES } from "../../constant/route";
import { useAuth } from "../../context/AuthContext";
import {
  buildSignInRedirectUrl,
  getAuthReturnPath,
  savePendingAuthRedirect,
} from "../../lib/authRedirect";

type BirthdayTypes = {
  title?: string;
  description?: string;
  brandSlider?: boolean;
};

// ✅ Fixed categories (no DB category list needed)
const TEMPLATE_TABS: string[] = [
  "Invites",
  "Apparel",
  "Mugs",
  "Coasters",
  "Stickers",
  "Notebooks",
  "Wall Art",
  "Photo Art",
  "Tote Bags",
  "Business Cards",
  "Business Leaflets",
];

// Normalize helper for flexible matching
const normalize = (v: any) =>
  String(v ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");

const TempletsCardSlider = ({ title, description }: BirthdayTypes) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedCate, setSelectedCate] = useState<CategoryType | undefined>();
  const [activeTab, setActiveTab] = useState(0);

  // Others menu state
  const [othersEl, setOthersEl] = useState<null | HTMLElement>(null);
  const [othersLabel, setOthersLabel] = useState<string>("Others");

  const { data: templetsCard, isLoading } = useQuery({
    queryKey: ["templetsCard"],
    queryFn: fetchAllTempletDesigns,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { open: isOpenDetailModal, openModal, closeModal } = useModal();

  const openDetailModal = (cate: CategoryType) => {
    if (!user) {
      const returnPath = getAuthReturnPath(location);
      savePendingAuthRedirect({
        path: returnPath,
        autoResume: true,
        state: {
          ...((location.state as any) ?? {}),
          focusProductId: cate?.id ?? null,
          focusProductType: "templet",
        },
      });
      navigate(buildSignInRedirectUrl(returnPath), {
        state: {
          redirectTo: returnPath,
          redirectState: {
            ...((location.state as any) ?? {}),
            focusProductId: cate?.id ?? null,
            focusProductType: "templet",
          },
        },
      });
      return;
    }
    setSelectedCate(cate);
    openModal();
  };

  // ✅ show only first 6 as tabs
  const firstTabs = TEMPLATE_TABS.slice(0, 6);
  const othersList = TEMPLATE_TABS.slice(6);
  const currentTab = TEMPLATE_TABS[activeTab];

  const openOthers = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (othersList.length === 0) return;
    setOthersEl(e.currentTarget);
  };
  const closeOthers = () => setOthersEl(null);

  const selectOther = (cat: string) => {
    const idx = TEMPLATE_TABS.findIndex((c) => c === cat);
    if (idx >= 0) {
      setActiveTab(idx);
      setOthersLabel(cat || "Others");
    }
    closeOthers();
  };

  // ✅ Filter by active tab ONLY
  const filteredCards = useMemo(() => {
    const list = templetsCard ?? [];
    if (!currentTab) return list;

    const tabNorm = normalize(currentTab);

    return list.filter((item: any) => {
      // ⭐ Replace these with your real category key if needed
      const rawCategory =
        item?.category ??
        item?.categoryName ??
        item?.templetCategory ??
        item?.cardcategory ??
        item?.cardCategory ??
        item?.cardCategory?.name ??
        item?.templetCategory?.name ??
        "";

      const catNorm = normalize(rawCategory);

      return (
        catNorm === tabNorm ||
        catNorm.includes(tabNorm) ||
        tabNorm.includes(catNorm)
      );
    });
  }, [templetsCard, currentTab]);

  return (
    <Box
      sx={{
        width: "100%",
        m: "auto",
        position: "relative",
        mt: { md: 8, sm: 8, xs: 0 },
        p: { md: 0, sm: 0, xs: 2 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: { md: "25px", sm: "20px", xs: "16px" },
            fontWeight: 700,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* ✅ Tabs (first 6) + Others button */}
      <Box
        sx={{
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          mt: 2,
        }}
      >
        {firstTabs.map((tab, index) => (
          <Box
            key={`${tab}-${index}`}
            onClick={() => {
              setActiveTab(index);
              setOthersLabel("Others"); // reset when clicking first tabs
            }}
            sx={{
              px: { md: 3, sm: 1, xs: 1 },
              py: { md: 1, sm: 0.5, xs: 0.5 },
              border: "2px solid black",
              borderRadius: "15px",
              cursor: "pointer",
              transition: "all 0.3s ease-in-out",
              backgroundColor: activeTab === index ? COLORS.primary : "transparent",
              "&:hover": {
                backgroundColor:
                  activeTab === index ? COLORS.seconday : "#f0f0f0",
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 600,
                color: activeTab === index ? COLORS.white : COLORS.black,
              }}
            >
              {tab}
            </Typography>
          </Box>
        ))}

        <Button
          variant="outlined"
          endIcon={<ArrowDropDown />}
          disabled={othersList.length === 0}
          onClick={openOthers}
          sx={{
            textTransform: "none",
            borderRadius: "15px",
            border: "2px solid black",
            color: COLORS.black,
            px: { md: 3, sm: 1, xs: 1 },
            py: { md: 0.5, sm: 0.25, xs: 0.25 },
            bgcolor: "transparent",
            "&.Mui-disabled": {
              opacity: 0.5,
              color: COLORS.black,
              borderColor: "black",
            },
          }}
        >
          {othersLabel}
        </Button>

        <Menu
          anchorEl={othersEl}
          open={Boolean(othersEl)}
          onClose={closeOthers}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          {othersList.map((cat, i) => (
            <MenuItem key={`${cat}-${i}`} onClick={() => selectOther(cat)}>
              {cat}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      {/* Slider */}
      <Box sx={{ mt: 3, position: "relative" }}>
        {isLoading ? (
          <Box
            sx={{
              width: "100%",
              height: "300px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CircularProgress sx={{ color: COLORS.seconday }} />
          </Box>
        ) : (
          <Swiper
            modules={[Navigation]}
            spaceBetween={10}
            navigation={{ prevEl: ".swiper-button-prev", nextEl: ".swiper-button-next" }}
            breakpoints={{
              0: { slidesPerView: 1 },
              600: { slidesPerView: 3 },
              760: { slidesPerView: 4 },
              1030: { slidesPerView: 5 },
              1440: { slidesPerView: 7 },
              1920: { slidesPerView: 7 },
            }}
          >
            {filteredCards.map((cate: any, idx: number) => (
              <SwiperSlide key={cate?.id ?? idx}>
                <Box px={{ lg: 1, md: "2px", sm: 1, xs: 1 }}>
                  <ProductCard
                    poster={cate?.img_url}
                    category={cate?.category ?? cate?.categoryName ?? cate?.templetCategory ?? cate?.cardcategory ?? ""}
                    data={cate}
                    tabsSlider
                    layoutCard={cate?.polygonLayout}
                    smartCrop={shouldSmartCropCategory(
                      cate?.category ?? cate?.categoryName ?? cate?.templetCategory ?? cate?.cardcategory ?? ""
                    )}
                    openModal={() => openDetailModal(cate)}
                  />
                </Box>
              </SwiperSlide>
            ))}
          </Swiper>
        )}

        {isOpenDetailModal && selectedCate && (
          <ProductPopup
            open={isOpenDetailModal}
            onClose={closeModal}
            cate={selectedCate}
            isTempletDesign={true}
          />
        )}

        {/* Navigation Buttons */}
        <IconButton
          className="swiper-button-prev"
          sx={{
            position: "absolute",
            top: "40%",
            left: { lg: -20, md: -15, sm: -15, xs: -10 },
            border: `3px solid ${COLORS.primary}`,
            color: COLORS.primary,
            bgcolor: COLORS.white,
            zIndex: 10,
            "&:hover": { backgroundColor: "lightgray" },
          }}
        >
          <ArrowBackIos />
        </IconButton>

        <IconButton
          className="swiper-button-next"
          sx={{
            position: "absolute",
            top: "40%",
            right: { lg: -20, md: -15, sm: -15, xs: -10 },
            border: `3px solid ${COLORS.primary}`,
            color: COLORS.primary,
            bgcolor: COLORS.white,
            zIndex: 10,
            "&:hover": { backgroundColor: "lightgray" },
          }}
        >
          <ArrowForwardIos />
        </IconButton>
      </Box>

      <Typography
        sx={{
          mt: { md: 3, sm: 3, xs: 2 },
          fontSize: "16px",
          fontWeight: 300,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};

export default TempletsCardSlider;
