import { Box, Typography } from "@mui/material";

const Description = () => {
  return (
    <Box>
      <Box
        component={"img"}
        src="/assets/images/simple-blackLOGO.png"
        sx={{
          width: { md: 400, sm: 150, xs: 120 },
          height: "auto",
          mb: 4,
          display: "flex",
          m: "auto",
          justifyContent: "center",
        }}
      />

      <Typography sx={{ fontSize: { md: 22, sm: 18, xs: 16 }, mt: 2, textAlign: "start" }}>
        DIY Personalisation is a UK based platform that lets you personalise and instantly download printable cards, invites and gifts,
        so you can create and print them anywhere in the world.
      </Typography>

      <Typography sx={{ fontSize: { md: 22, sm: 18, xs: 16 }, mt: 2, textAlign: "start" }}>
        Designs are downloaded as print ready files, making them accessible globally with no shipping, delays or borders.
      </Typography>

      <Box sx={{ textAlign: "center", py: { xs: 2, md: 3 } }}>
        <Typography
          sx={{
            fontSize: { xs: 22, sm: 28, md: 22 },
            fontWeight: 500,
            color: "#111",
            lineHeight: 1.15,
            mb: 0.5,
          }}
        >
          Personalised designs. Printed your way.
        </Typography>

        <Typography
          sx={{
            fontSize: { xs: 18, sm: 22, md: 22 },
            fontWeight: 500,
            color: "#111",
            lineHeight: 1.2,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <span>Instant downloads</span>
          <span style={{ fontSize: "1.2em" }}>•</span>
          <span>No delivery No Waiting</span>
          <span style={{ fontSize: "1.2em" }}>•</span>
          <span>Made by you</span>
        </Typography>
      </Box>
    </Box>
  );
};

export default Description;
