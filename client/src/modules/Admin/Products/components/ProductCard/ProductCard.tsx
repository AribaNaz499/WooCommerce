// ===============================================
// File: src/pages/dashboard/products/components/ProductCard/ProductCard.tsx
// ===============================================
import { Delete, Edit } from "@mui/icons-material";
import { Box, IconButton } from "@mui/material";
import TemplateSvgThumbnail from "../../../../../components/TemplateSvgThumbnail/TemplateSvgThumbnail";

// Keep in sync with callers
type Card = {
  id: number;
  card_name: string;
  card_category: string;
  sku: string;
  actual_price: number;
  sale_price: number;
  description: string;
  imageUrl?: string;
  created_at: string;
  polygon_shape?: string;
  lastpageImageUrl?: string;
  img_url?: string;
  subCategory?:string;
  subSubCategory?:string;
  __type?: "card" | "templet";
  slides?: any;
  raw_stores?: any;
};

type Props = {
  data: Card;
  openDeleteModal?: (id: number) => void;
  onEdit?: (id: number) => void;
};

const ProductCard = (props: Props) => {
  const { data, openDeleteModal, onEdit } = props || {};
  const isTemplate = data?.__type === "templet";
  const useContainThumb = /(mug|candle|business\s*card|business\s*leaflet|tote\s*bag|bag|sticker)/i.test(
    String(data?.card_category ?? ""),
  );

  return (
    <Box
      component={"div"}
      sx={{
        width: "100%",
        height: "auto",
        aspectRatio: "3 / 4",
        minHeight: 260,
        border: "1px solid #e9e9e9",
        borderRadius: 3,
        overflow: "hidden",
        backgroundColor: "#fff",
        boxShadow: "0 6px 18px rgba(20, 23, 31, 0.08)",
        position: "relative",
        cursor: "pointer",
        "&:hover": { boxShadow: "0 10px 28px rgba(20, 23, 31, 0.12)" },
        "&:hover .overlay": { opacity: 1 },
      }}
    >
      {/* Product Image */}
      {isTemplate ? (
        <TemplateSvgThumbnail
          template={{
            id: data?.id,
            category: data?.card_category,
            img_url: data?.img_url,
            slides: data?.slides,
            raw_stores: data?.raw_stores,
          }}
          fallbackSrc={data?.img_url || data?.imageUrl || data?.lastpageImageUrl}
          alt="Product"
          sx={{
            width: "100%",
            height: "100%",
            display: "block",
            backgroundColor: "#ffffff",
          }}
        />
      ) : (
        <Box
          component={"img"}
          src={data?.imageUrl || data?.lastpageImageUrl || data?.img_url}
          alt="Product"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: useContainThumb ? "contain" : "cover",
            objectPosition: "center",
            backgroundColor: "#ffffff",
            clipPath: data?.polygon_shape || "none",
          }}
        />
      )}

      {/* Overlay with Buttons */}
      <Box
        className="overlay"
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          opacity: 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <IconButton
          sx={{ bgcolor: "white", color: "black", "&:hover": { bgcolor: "#f0f0f0" } }}
          onClick={() => onEdit && onEdit(data.id)}
        >
          <Edit fontSize="small" />
        </IconButton>
        <IconButton
          sx={{ bgcolor: "white", color: "red", "&:hover": { bgcolor: "#f0f0f0" } }}
          onClick={() => openDeleteModal && openDeleteModal(data.id)}
        >
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ProductCard;
