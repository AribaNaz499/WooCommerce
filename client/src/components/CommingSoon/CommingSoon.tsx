import { Box, Typography } from "@mui/material";
import LandingButton from "../LandingButton/LandingButton";
import { COLORS } from "../../constant/color";

const CommingSoonOffers = () => {
  return (
    <Box
      sx={{
        borderRadius: 4,
        width: "100%",
        height: { md: "450px", sm: "100%", xs: "auto" },
        display: { md: "flex", sm: "flex", xs: "block" },
        // mt: 8,
        bgcolor: COLORS.seconday,
        justifyContent: "center",
        color: COLORS.white,
        m: "auto",
        p:{md:0,sm:0,xs:2}
      }}
    >
      <Box
        sx={{
          width: { md: "40%", sm: "50%", xs: "100%" },
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          alignItems: "start",
          borderRadius: "20px 0px 0px 20px",
          textAlign: "start",
          p: { md: 3, sm: 2, xs: 1 },
        }}
      >
        <Typography
          sx={{
            fontSize: {
              md: "35px",
              sm: "25px",
              xs: "23px",
              textAlign: { md: "start", sm: "start", xs: "center" },
              fontWeight: 800,
            },
          }}
        >
          Show You Give a DIY <br /> This Christmas!
        </Typography>
        <Typography
          sx={{
            py: 1,
            fontSize: { md: "auto", sm: "auto", xs: "12px" },
            width: { md: "90%", sm: "100%", xs: "100%" },
            fontWeight: 300,
          }}
        >
          The festive countdown is on! From Christmas classics to new
          personalised stockings and more coming soon, get Christmas sorted now
          and avoid the stress.
        </Typography>
        <Box sx={{ mt: 1 }}>
          <LandingButton
            title="Shop Christmas Card & Gift"
            width="20vw"
            personal
            bgblack
          />
        </Box>
      </Box>

      <Box sx={{ width: { md: "60%", sm: "50%", xs: "100%" } }}>
        <Box
          component={"img"}
          src="/assets/images/DIYChristmas.jpg"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: {
              md: "0px 15px 15px 0px",
              sm: "0px 15px 15px 0px",
              xs: "6px",
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default CommingSoonOffers;
