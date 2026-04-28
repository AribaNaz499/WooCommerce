// File: src/components/BasketCard/BasketCard.tsx
import { Box, Typography } from "@mui/material";
import type { CategoryType } from "../ProductPopup/ProductPopup";
import { COLORS } from "../../constant/color";

type BasketType = {
  id?: string | number;
  title?: string;
  poster?: string;
  category?: string;
  openModal?: (item: CategoryType) => void;

  variant?: "product" | "category";
  onClickCategory?: (categoryName: string) => void;
};

const bgByCategory = (category?: string) => {
  const c = (category ?? "").toLowerCase().trim();
  if (c.includes("business card")) return COLORS.green;
  if (c.includes("candle")) return COLORS.seconday;
  if (c.includes("bag")) return COLORS.primary;
  if (c.includes("coaster")) return "#7FBF9B";
  if (c.includes("card")) return "#66B6BE";
  if (c.includes("leaflet")) return "#7FBF9B";
  if (c.includes("invite")) return "#8E68A6";
  return "#8E68A6";
};

const BasketCard = ({
  id,
  title,
  poster,
  category,
  openModal,
  variant = "product",
  onClickCategory,
}: BasketType) => {
  const label = (title || category || "Category").trim();
  const initials = label ? label.slice(0, 1).toUpperCase() : "C";

  const handleOpen = () => {
    if (variant === "category") {
      onClickCategory?.(label);
      return;
    }
    openModal?.({ id, title, img_url: poster, cardcategory: category } as any);
  };

  const hasPoster = Boolean(poster && String(poster).trim());

  return (
    <Box
      onClick={handleOpen}
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: { xs: 320, sm: 300, md: 280 },
        height: { xs: 315, sm: 210, md: 230 },
        mx: "auto",
        borderRadius: 2,
        bgcolor: bgByCategory(label),
        overflow: "hidden",
        cursor: "pointer",
        border: "4px solid gray",
        boxShadow: "0 10px 18px rgba(0,0,0,0.35)",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 12,
          borderRadius: 1.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1.2,
        }}
      >
        <Box
          sx={{
            flex: 1,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            mt: 0.5,
          }}
        >
          {/* ✅ NOW: category mode can also show image */}
          {(hasPoster && (variant === "product" || variant === "category")) ? (
            <Box
              component="img"
              src={poster}
              alt={label}
              sx={{
                width: "100%",
                height: "95%",
                objectFit: "cover",
                backgroundColor: variant === "category" ? "#fff" : "transparent",
                display: "block",
                borderRadius: 2,
                userSelect: "none",
                pointerEvents: "none",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "78%",
                height: "88%",
                display: "grid",
                placeItems: "center",
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.25)",
                backdropFilter: "blur(2px)",
              }}
            >
              <Typography sx={{ color: "#fff", fontWeight: 900, fontSize: 72, lineHeight: 1 }}>
                {initials}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography
          sx={{
            color: "#fff",
            fontWeight: 700,
            fontSize: { xs: 14, sm: 16, md: 18 },
            textAlign: "center",
            textTransform: "capitalize",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            width: "100%",
            overflow: "hidden",
          }}
          title={label}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
};

export default BasketCard;
