import { Box } from "@mui/material";
import SmartImage from "../SmartImage/SmartImage";
import TemplateSvgThumbnail from "../TemplateSvgThumbnail/TemplateSvgThumbnail";
// import { COLORS } from "../../constant/color";

type ProductTypes = {
  poster: string;
  tabsSlider?: boolean;
  openModal?: () => void;
  data?: any;
  layoutCard?: any;
  borderColor?: string;
  smartCrop?: boolean;
  category?: string;
};

const ProductCard = (props: ProductTypes) => {
  const { poster, tabsSlider, openModal, borderColor, smartCrop, category, data } = props;
  const useContainThumb = /(mug|candle|business\s*card|tote\s*bag|bag|sticker)/i.test(
    String(category ?? ""),
  );
  const templateLike = data && typeof data === "object"
    ? {
        id: data?.id,
        category:
          category ??
          data?.category ??
          data?.categoryName ??
          data?.templetCategory ??
          data?.cardcategory ??
          data?.cardCategory,
        img_url: poster || data?.img_url || data?.imageurl || data?.imageUrl || data?.poster,
        slides: data?.slides,
        raw_stores: data?.raw_stores ?? data?.rawStores,
      }
    : null;
  const shouldUseLiveTemplate = Boolean(templateLike?.id || templateLike?.slides || templateLike?.raw_stores);
  return (
    <Box
      component={"div"}
      onClick={openModal}
      sx={{
        width: tabsSlider
          ? { md: "100%", sm: "100%", xs: "100%" }
          : { md: "182px", sm: "125px", xs: "157px" },
        height: tabsSlider
          ? { lg: '250px', md: "250px", sm: "240px", xs: "370px" }
          : { md: "270px", sm: "180px", xs: "225px" },
        borderRadius: 3,
        // bgcolor: COLORS.white,
        border: tabsSlider ? `1px solid lightGray` : `4px solid ${borderColor}`,
        cursor: "pointer",
        justifyContent: 'center',
        display: 'flex',
        mx: "auto",
      }}
    >
      {shouldUseLiveTemplate ? (
        <TemplateSvgThumbnail
          template={templateLike}
          fallbackSrc={poster}
          alt="productImg"
          sx={{
            width: tabsSlider
              ? { md: "100%", sm: "100%", xs: "100%" }
              : { md: "175px", sm: "120px", xs: "150px" },
            height: "100%",
            display: "block",
            backgroundColor: useContainThumb ? "#fff" : "transparent",
            borderRadius: 2,
          }}
        />
      ) : (
        <SmartImage
          src={poster}
          alt="productImg"
          enable={!!smartCrop}
          sx={{
            width: tabsSlider
              ? { md: "100%", sm: "100%", xs: "100%" }
              : { md: "175px", sm: "120px", xs: "150px" },
            height: "100%",
            objectFit: useContainThumb ? "contain" : "cover",
            objectPosition: "center",
            backgroundColor: useContainThumb ? "#fff" : "transparent",
            borderRadius: 2,
          }}
        />
      )}
    </Box>
  );
};

export default ProductCard;
