import { useEffect, useMemo, useRef, useState } from "react";
import { Box, CircularProgress, IconButton, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ArrowBackIos, ArrowForwardIos } from "@mui/icons-material";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { COLORS } from "../../constant/color";
import BasketCard from "../BasketCard/BasketCard";
import "swiper/css";
import { supabase } from "../../supabase/supabase";

type Props = { title?: string; description?: string };

const lc = (v: unknown) => String(v ?? "").trim().toLowerCase();

const normalizePoster = (v?: string) => {
  if (!v) return "";
  const s = String(v).trim();
  if (s.startsWith("data:image/")) return s;

  // raw base64 -> make DataURL
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 200) {
    return `data:image/png;base64,${s.replace(/\s/g, "")}`;
  }

  return s;
};

type CategoryTile = { name: string; poster?: string };

async function fetchCategoriesLight(): Promise<any[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,image_base64")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
};

const BasketSliderNoTabs = ({ title, description }: Props) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [swiper, setSwiper] = useState<SwiperType | null>(null);
  const [isBeginning, setIsBeginning] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navItemRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // ✅ Categories (includes image_base64 because select("*"))
  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ["allCategories"],
    queryFn: fetchCategoriesLight,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  const categoryTiles = useMemo<CategoryTile[]>(() => {
    // Prefer categories table image_base64
    const map = new Map<string, CategoryTile>();

    for (const c of categories as any[]) {
      const name = String(c?.name ?? "").trim();
      if (!name) continue;

      const key = lc(name);
      const poster =
        normalizePoster(c?.image_base64) ||
        normalizePoster(c?.image) ||
        normalizePoster(c?.img_url);

      map.set(key, { name, poster: poster || undefined });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  const isLoading = loadingCats;

  const updateEdges = (s: SwiperType) => {
    setIsBeginning(s.isBeginning);
    setIsEnd(s.isEnd);
    setActiveIndex(s.realIndex ?? 0);
  };

  useEffect(() => {
    if (!isMobile) return;
    const node = navItemRefs.current[activeIndex];
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [activeIndex, isMobile]);

  const goToCategory = (name: string) => {
    const n = String(name ?? "").trim();
    if (!n) return;
    navigate(`/view-all/${encodeURIComponent(n)}`, { state: { categoryName: n } });
  };

  return (
    <Box sx={{ width: "100%", mt: { md: 6, xs: 3 } }}>
      {title && (
        <Typography sx={{ fontWeight: 700, fontSize: { md: 30, xs: 20 }, textAlign: "center" }}>
          {title}
        </Typography>
      )}
      {description && (
        <Typography
          sx={{
            mt: 1,
            fontSize: { md: 24, xs: 16 },
            textAlign: { xs: "center", md: "start" },
            opacity: 0.9,
          }}
        >
          {description}
        </Typography>
      )}

      <Box
        sx={{
          mt: 2,
          bgcolor: COLORS.black,
          borderRadius: 3,
          py: { xs: 2, md: 3 },
          px: { xs: 1.5, md: 2 },
          position: "relative",
          overflow: "hidden",
        }}
      >
        {isLoading ? (
          <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress sx={{ color: COLORS.seconday }} />
          </Box>
        ) : (
          <>
            <Swiper
              modules={[FreeMode, Mousewheel]}
              freeMode={{ enabled: true, momentum: true }}
              grabCursor
              mousewheel={{ forceToAxis: true }}
              spaceBetween={16}
              breakpoints={{
                0: { slidesPerView: 1, spaceBetween: 12 },
                600: { slidesPerView: 3, spaceBetween: 16 },
                900: { slidesPerView: 5, spaceBetween: 24 },
                1200: { slidesPerView: 6, spaceBetween: 28 },
                1536: { slidesPerView: 7, spaceBetween: 32 },
              }}
              onSwiper={(s) => {
                setSwiper(s);
                updateEdges(s);
              }}
              onSlideChange={updateEdges}
              onReachBeginning={updateEdges}
              onReachEnd={updateEdges}
              onFromEdge={updateEdges}
              style={{ paddingBottom: isMobile ? 10 : 6 }}
            >
              {categoryTiles.map((cat) => (
                <SwiperSlide
                  key={`cat-${cat.name}`}
                  style={{
                    height: "auto",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <BasketCard
                    variant="category"
                    title={cat.name}
                    category={cat.name}
                    poster={cat.poster} // ✅ image for category
                    onClickCategory={goToCategory}
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            {categoryTiles.length > 0 && (
              <Box
                sx={{
                  mt: 2,
                  display: { xs: "flex", md: "none" },
                  gap: 1,
                  overflowX: "auto",
                  pb: 0.5,
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {categoryTiles.map((cat, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <Box
                      ref={(el) => {
                        navItemRefs.current[idx] = el as HTMLDivElement | null;
                      }}
                      key={`cat-nav-${cat.name}`}
                      onClick={() => goToCategory(cat.name)}
                      sx={{
                        flex: "0 0 auto",
                        px: 1.5,
                        py: 0.75,
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        bgcolor: active ? COLORS.white : "rgba(255,255,255,0.12)",
                        color: active ? COLORS.primary : "#fff",
                        border: `1px solid ${active ? COLORS.primary : "rgba(255,255,255,0.3)"}`,
                      }}
                    >
                      {cat.name}
                    </Box>
                  );
                })}
              </Box>
            )}

            <IconButton
              onClick={() => swiper?.slidePrev()}
              disabled={isBeginning}
              sx={{
                position: "absolute",
                top: "50%",
                left: { xs: 6, md: 12 },
                transform: "translateY(-50%)",
                zIndex: 10,
                bgcolor: COLORS.white,
                border: `2px solid ${COLORS.primary}`,
                color: COLORS.primary,
                width: { xs: 34, md: 40 },
                height: { xs: 34, md: 40 },
                "&:hover": { bgcolor: "#f2f2f2" },
                "&.Mui-disabled": {
                  opacity: 0.4,
                  bgcolor: "rgba(255,255,255,0.6)",
                  borderColor: "rgba(0,0,0,0.2)",
                  color: "rgba(0,0,0,0.35)",
                },
              }}
            >
              <ArrowBackIos fontSize="small" />
            </IconButton>

            <IconButton
              onClick={() => swiper?.slideNext()}
              disabled={isEnd}
              sx={{
                position: "absolute",
                top: "50%",
                right: { xs: 6, md: 12 },
                transform: "translateY(-50%)",
                zIndex: 10,
                bgcolor: COLORS.white,
                border: `2px solid ${COLORS.primary}`,
                color: COLORS.primary,
                width: { xs: 34, md: 40 },
                height: { xs: 34, md: 40 },
                "&:hover": { bgcolor: "#f2f2f2" },
                "&.Mui-disabled": {
                  opacity: 0.4,
                  bgcolor: "rgba(255,255,255,0.6)",
                  borderColor: "rgba(0,0,0,0.2)",
                  color: "rgba(0,0,0,0.35)",
                },
              }}
            >
              <ArrowForwardIos fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    </Box>
  );
};

export default BasketSliderNoTabs;
