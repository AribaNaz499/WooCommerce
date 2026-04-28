import { Box, Typography } from "@mui/material";
import { COLORS } from "../../constant/color";
import LandingButton from "../LandingButton/LandingButton";

type AdvertiseTypes = {
  title: string;
  price?: string;
  poster?: string;
  bgcolorSide?: string | any;
};
const AdvertisementCard = (props: AdvertiseTypes) => {
  const { title, price, poster, bgcolorSide } = props;

  return (
    <Box
      sx={{
        borderRadius: 4,
        width: { md: "560px", sm: "350px", xs: "100%" },
        height: { md: "170px", sm: "150px", xs: "auto" },
        display: { md: "flex", sm: "flex", xs: "block" },
      }}
    >
      <Box
        sx={{
          width: { md: "45%", sm: "50%", xs: "100%" },
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "start",
          color: COLORS.white,
          bgcolor: bgcolorSide,
          borderRadius: {
            md: "20px 0px 0px 20px",
            sm: "20px 0px 0px 20px",
            xs: 0,
          },
          p: 3,
        }}
      >
        <Typography sx={{ fontSize: { md: "19px", sm: "13px", xs: "20px" } }}>
          {title}
        </Typography>
        {price && (
          <Typography sx={{ fontSize: { md: "14px", sm: '13px', xs: 'auto' }, fontWeight: 200 }}>
            {price}
          </Typography>
        )}
        <br />
        <LandingButton title="Shop Now" width="120px" advertisement />
      </Box>
      <Box
        sx={{
          width: { md: "55%", sm: "50%", xs: "100%" },
          borderRadius: "0px 20px 20px 0px",
        }}
      >
        <Box
          component={"img"}
          src={poster}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: {
              md: "0px 20px 20px 0px",
              sm: "0px 20px 20px 0px",
              xs: 0,
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default AdvertisementCard;
