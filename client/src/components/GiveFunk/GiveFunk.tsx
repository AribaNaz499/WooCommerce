import { Box } from "@mui/material";
import { COLORS } from "../../constant/color";
import LandingButton from "../LandingButton/LandingButton";

const categories = [
  {
    title: "Birthday",
    href: "#",
  },
  {
    title: "Anniversary",
    href: "#",
  },
  {
    title: "New Baby",
    href: "#",
  },
  {
    title: "Sympathy",
    href: "#",
  },
  {
    title: "Wedding",
    href: "#",
  },
  {
    title: "Get Well Soon",
    href: "#",
  },
  {
    title: "Christmas",
    href: "#",
  },
  {
    title: "All Occasions",
    href: "#",
  },
];

const GiveFunk = () => {
  return (
    <Box
      sx={{
        width: "100%",
        height: { md: "400px", sm: "", xs: "auto" },
        borderRadius: 4,
        p: 4,
        bgcolor: COLORS.primary,
        color: COLORS.white,
      }}
    >
      <Box
        component={"img"}
        src="https://www.funkypigeon.com/_next/image?url=%2Fimages%2FfunkyVIPs%2Fvip-offer-text.png&w=640&q=75"
        sx={{
          width: { md: 800, sm: 400, xs: "100%" },
          height: { md: 230, sm: "", xs: "auto" },
        }}
      />
      <Box
        sx={{
          display: { md: "flex", sm: "flex", xs: "block" },
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        {categories?.map((e) => (
          <a href={e.href}>
            <LandingButton title={`${e.title}`} width="300px" personal />
          </a>
        ))}
      </Box>
    </Box>
  );
};

export default GiveFunk;
