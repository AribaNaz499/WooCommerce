import React, { useMemo } from "react";
import { Box, Button, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useNavigate } from "react-router-dom";
import { USER_ROUTES } from "../../../../../constant/route";
import { supabase } from "../../../../../supabase/supabase";
import { useQuery } from "@tanstack/react-query";


async function fetchCardsLight() {
  const { data, error } = await supabase
    .from("cards")
    .select("id,imageurl,accessplan,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

async function fetchTemplatesLight() {
  const { data, error } = await supabase
    .from("templetDesign")
    .select("id,img_url,accessplan,created_at")
    .order("created_at", { ascending: false });
  if (!error) return data ?? [];

  const message = String(error.message ?? "").toLowerCase();
  const isSchemaDrift =
    message.includes("column") ||
    message.includes("schema cache") ||
    message.includes("does not exist");

  if (!isSchemaDrift) throw error;

  const fallback = await supabase
    .from("templetDesign")
    .select("*")
    .order("created_at", { ascending: false });

  if (fallback.error) throw fallback.error;
  return fallback.data ?? [];
}

const SubscriptionModelSection: React.FC = () => {
  const navigate = useNavigate();

  const heroImage = "/assets/images/diyp-bundle-mockup.png";
  // const phoneMock = "/assets/images/phone-mock.png";

  const benefits = [
    "Lifetime access to your selected bundle.",
    "12 professionally designed, fully editable templates.",
    "New seasonal and event bundles released regularly.",
    "Instant download after purchase.",
    "One simple GBP 15 payment. No subscription. No expiry.",
  ];

  const { data: cardData = [], isLoading: cardsLoading } = useQuery({
    queryKey: ["allCards"],
    queryFn: fetchCardsLight,
    staleTime: 1000 * 60 * 10,
    refetchOnMount: "always",
  });

  const { data: templateData = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["allTemplates"],
    queryFn: fetchTemplatesLight,
    staleTime: 1000 * 60 * 10,
    refetchOnMount: "always",
  });

  // ✅ IMPORTANT: no setState here, useMemo instead
  const proItems = useMemo(() => {
    const cards = cardData
      .filter((x: any) => String(x.accessplan).toLowerCase() === "pro")
      .map((x: any) => ({
        key: `card:${x.id}`,
        type: "card",
        id: x.id,
        src: x.imageurl,
      }));

    const templates = templateData
      .filter((x: any) => String(x.accessplan).toLowerCase() === "pro")
      .map((x: any) => ({
        key: `template:${x.id}`,
        type: "template",
        id: x.id,
        src: x.img_url,
      }));

    // combine + keep only valid images
    const merged = [...cards, ...templates].filter((x) => !!x.src);

    // optional: latest first (already ordered, but mixed sources)
    return merged.slice(0, 8); // show max 8 (you can change)
  }, [cardData, templateData]);

  const isLoading = cardsLoading || templatesLoading;

  return (
    <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
      <Typography
        sx={{
          textAlign: "center",
          fontWeight: 700,
          color: "#6F4C7A",
          fontSize: { xs: 20, sm: 24, md: 26 },
          mb: { xs: 1.5, md: 2 },
        }}
      >
        Bundles Made for Life&apos;s Big Moments.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" },
          gap: { xs: 3, md: 2 },
          alignItems: "stretch",
          bgcolor: "#8B6E96",
          borderRadius: 3,
          boxShadow: "0 10px 24px rgba(54, 34, 62, 0.25)",
          border: "2px solid rgba(255,255,255,0.25)",
          overflow: "hidden",
        }}
      >
        {/* LEFT */}
        <Box
          sx={{
            p: { xs: 2.5, sm: 3.5, md: 4 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "grid", gap: 1.4, mb: 3 }}>
            {benefits.map((txt) => (
              <Box key={txt} sx={{ display: "flex", alignItems: "center", gap: 1.4 }}>
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "2px solid #111",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckIcon sx={{ color: "#111", fontSize: 18 }} />
                </Box>
                <Typography sx={{ fontSize: { xs: 15, sm: 16, md: 17 }, color: "#111" }}>
                  {txt}
                </Typography>
              </Box>
            ))}
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate(USER_ROUTES.PREMIUM_PLANS)}
            sx={{
              alignSelf: "flex-start",
              bgcolor: "#51C1D2",
              color: "#fff",
              px: 3,
              py: 1.1,
              borderRadius: 2,
              textTransform: "none",
              fontSize: { xs: 15, sm: 16 },
              fontWeight: 600,
              boxShadow: "0 8px 16px rgba(50,120,140,0.4)",
              "&:hover": { bgcolor: "#42AEC1" },
            }}
          >
            Explore all bundles
          </Button>
        </Box>

        {/* RIGHT */}
        <Box
          sx={{
            position: "relative",
            p: { xs: 2, sm: 2.5, md: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(255,255,255,0.12)",
          }}
        >
          <Box
            component="img"
            src={heroImage}
            alt="Bundle preview"
            sx={{
              width: { xs: "100%", sm: "92%", md: "88%" },
              height: { xs: 350, sm: 380, md: 410 },
              objectFit: "cover",
              borderRadius: 3,
              // boxShadow: "0 14px 24px rgba(0,0,0,0.25)",
              backgroundColor: "#00000000",
            }}
          />

          {/* overlay */}
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: 8, md: 12 },
              right: { xs: 8, md: 14 },
              display: "flex",
              alignItems: "flex-end",
              gap: { xs: 0.8, md: 1.2 },
            }}
          >
            {/* ✅ REAL PRO items (cards + templates) */}
            <Box sx={{ display: "flex", gap: { xs: 0.8, md: 1.2 } }}>
              {isLoading ? null : proItems.slice(0, 3).map((it) => (
                <Box
                  key={it.key}
                  sx={{
                    position: "relative",
                    width: { xs: 54, sm: 60, md: 70 },
                    height: { xs: 72, sm: 82, md: 96 },
                    flexShrink: 0,
                  }}
                >
                  {/* frame */}
                  <Box
                    component="img"
                    src="/assets/images/A4.svg"
                    alt="frame"
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                    }}
                  />

                  {/* thumbnail */}
                  <Box
                    component="img"
                    src={it.src}
                    alt={it.key}
                    sx={{
                      position: "absolute",
                      top: 10,
                      left: 4,
                      right: 8,
                      bottom: 8,
                      width: "calc(100% - 10px)",
                      height: "calc(100% - 18px)",
                      objectFit: "cover",
                      boxShadow: "0 6px 14px rgba(0,0,0,0.2)",
                      bgcolor: "#fff",
                    }}
                  />
                </Box>
              ))}
            </Box>


            {/* <Box
                component="img"
                src={phoneMock}
                alt="Phone mock"
                sx={{
                  width: { xs: 62, sm: 74, md: 86 },
                  height: "auto",
                  filter: "drop-shadow(0 10px 18px rgba(0,0,0,0.22))",
                }}
              /> */}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SubscriptionModelSection;
