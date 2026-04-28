import { Box, Typography } from "@mui/material";
import { COLORS } from "../../constant/color";
import LandingButton from "../LandingButton/LandingButton";

const PersonalGift = () => {
  return (
    <Box
      sx={{
        borderRadius: 4,
        width: "100%",
        height: { md: "450px", sm: "400px", xs: "auto" },
        display: { md: "flex", sm: "flex", xs: "block" },
      }}
    >
      <Box
        sx={{
          width: {lg:'60%', md: "50%", sm: "50%", xs: "100%" },
          borderRadius: {
            md: "20px 0px 0px 20px",
            sm: "20px 0px 0px 20px",
            xs: ' "0px 0px 0px 0px"',
          },
        }}
      >
        <Box
          component={"img"}
          src="/assets/images/PersonlisedImg.jpg"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: {
              md: "20px 0px 0px 20px",
              sm: "20px 0px 0px 20px",
              xs: ' "0px 0px 0px 0px"',
            },
          }}
        />
      </Box>
      <Box
        sx={{
          width: {lg:'40%', md: "50%", sm: "50%", xs: "100%" },
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "start",
          color: COLORS.white,
          bgcolor: COLORS.seconday,
          borderRadius: {md:"0px 20px 20px 0px",sm:"0px 20px 20px 0px",xs:0},
          textAlign: "start",
          p: 5,
        }}
      >
        <Typography
          sx={{
            fontSize: { md: "35px", sm: "30px", xs: "25px" },
            fontWeight: 700,
          }}
        >
          Personalised Gifts <br /> Created by You
        </Typography>
        <Typography
          sx={{ fontSize: { md: "14px", sm: "13px", xs: 12 }, fontWeight: 300 }}
        >
          Go above and beyond to show how well you know them with personalised
          gifts, created by you just for them to make their day!
        </Typography>
        <br />
        <Box
          sx={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            width: {lg:'500px', md: "460px", sm: "100%", xs: "100%" },
            mt: 2,
          }}
        >
          <LandingButton title="For Her" width="225px" personal active />
          <LandingButton title="For Him" width="225px" personal bgblack />
          <LandingButton title="Birthday" width="225px" personal bgblack />
          <LandingButton title="Shop All Gift" width="225px" personal bgblack />
        </Box>
      </Box>
    </Box>
  );
};

export default PersonalGift;
