// src/layout/Footer/Footer.tsx
import { useState, useEffect } from "react";
import { Box, List, ListItem, Menu, MenuItem, Typography } from "@mui/material";
import { COLORS } from "../../../constant/color";
import { FooterLinks, PAYMENT_CARD } from "../../../constant/data";
import { useAuth } from "../../../context/AuthContext";
import { USER_ROUTES } from "./../../../constant/route";

type Region = "UK" | "US";

const FLAGS: Record<Region, string> = {
  UK: "https://www.funkypigeon.com/_next/image?url=%2Fimages%2Fflags%2Fuk-icon.jpg&w=32&q=30",
  US: "https://static.vecteezy.com/system/resources/thumbnails/015/698/734/small/official-flag-of-united-stated-in-circle-shape-nation-flag-illustration-png.png",
};

const Footer = () => {
  const { user } = useAuth();

  // region selection (default UK)
  const [region, setRegion] = useState<Region>("UK");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    // why: optionally restore selection (comment out if not needed)
    // const saved = localStorage.getItem("region") as Region | null;
    // if (saved === "UK" || saved === "US") setRegion(saved);
  }, []);

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleCloseMenu = () => setAnchorEl(null);
  const selectRegion = (r: Region) => {
    setRegion(r);
    // localStorage.setItem("region", r); // why: persist choice
    handleCloseMenu();
    // TODO: trigger currency/locale switch if needed
  };

  return (
    <Box
      sx={{
        display: { md: "flex", sm: "", xs: "block" },
        width: { lg: "1340px", md: "100%", sm: "100%", xs: "100%" },
        m: "auto",
        flexDirection: "column",
        p: { lg: 2, md: 1, sm: 1, xs: 2 },
        position: "relative",
      }}
    >
      <Box
        sx={{
          display: { md: "flex", sm: "flex", xs: "block" },
          width: "100%",
          justifyContent: "space-between",
          borderBottom: "2px solid black",
          pb: 5,
        }}
      >
        {FooterLinks.map((e) => (
          <Box key={e.title} p={{ md: 0, sm: 0, xs: 1 }}>
            <Typography
              sx={{
                fontSize: { lg: "20px", md: "20px", sm: "15px", xs: "auto" },
                fontWeight: 600,
                color: COLORS.seconday,
              }}
            >
              {e.title}
            </Typography>
            <List>
              {e.links.map((link) => (
                <ListItem
                  key={link.name}
                  sx={{
                    fontSize: { md: "18px", sm: "14px", xs: "14px" },
                    mb: { md: 1.5, sm: 1.5, xs: "auto" },
                    textAlign: "start",
                    px: 0,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  <a
                    href={!user && link.path === USER_ROUTES.COMMUNITY_HUB ? USER_ROUTES.SIGNIN : link.path}
                    style={{ textDecoration: "none", color: COLORS.black }}
                  >
                    {link.name}
                  </a>
                </ListItem>
              ))}
            </List>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          display: { md: "flex", sm: "flex", xs: "block" },
          width: "100%",
          mt: 5,
        }}
      >
        <Box sx={{ width: { lg: "50%", md: "100%", sm: "100%", xs: "100%" } }}>
          <Typography
            sx={{
              fontSize: { lg: "20px", md: "20px", sm: "17px", xs: "auto" },
              fontWeight: 600,
            }}
          >
            Let's get Social
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
              mt: 3,
              mb: 3,
            }}
          >
            <a href="#"><Box component={"img"} src="/assets/icons/facebook.svg" sx={{ width: 40, height: 40, borderRadius: 50 }} /></a>
            <a href="#"><Box component={"img"} src="/assets/icons/tiktok.svg" sx={{ width: 40, height: 40, borderRadius: 50 }} /></a>
            <a href="#"><Box component={"img"} src="/assets/icons/instagram.svg" sx={{ width: 40, height: 40, borderRadius: 50 }} /></a>
            <a href="#"><Box component={"img"} src="/assets/icons/youtube.svg" sx={{ width: 40, height: 40, borderRadius: 50 }} /></a>
            <a href="#"><Box component={"img"} src="/assets/icons/DIYP.svg" sx={{ width: 35, height: 35, borderRadius: 50 }} /></a>
            <a href="#"><Box component={"img"} src="/assets/icons/pinterest.png" sx={{ width: 35, height: 35, borderRadius: 50 }} /></a>
          </Box>
        </Box>

        <Box sx={{ width: { lg: "50%", md: "100%", sm: "100%", xs: "100%" } }}>
          <Typography
            sx={{
              fontSize: { lg: "20px", md: "20px", sm: "17px", xs: "auto" },
              fontWeight: 600,
            }}
          >
            Download the App
          </Typography>

          <Box
            sx={{
              display: { md: "flex", sm: "block", xs: "block" },
              mt: 3,
              width: { lg: "70%", md: "100%", sm: "90%", xs: "100%" },
            }}
          >
            <Box
              sx={{
                height: "50px",
                borderRadius: 4,
                bgcolor: COLORS.black,
                color: COLORS.white,
                px: 3,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                m: "auto",
                gap: 2,
                mb: { md: 0, sm: 1, xs: 2 },
              }}
            >
              <Box component={"img"} src="/assets/icons/Apple.svg" sx={{ width: 30 }} />
              <Box>
                <Typography fontSize={"10px"}>Download on the</Typography>
                <Typography variant="h6">App Store</Typography>
              </Box>
            </Box>
            <Box
              sx={{
                height: "50px",
                borderRadius: 4,
                bgcolor: COLORS.black,
                color: COLORS.white,
                px: 3,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                m: "auto",
                gap: 2,
              }}
            >
              <Box component={"img"} src="/assets/icons/Playstore.svg" sx={{ width: 30 }} />
              <Box>
                <Typography fontSize={"10px"}>ANDROID APP ON</Typography>
                <Typography variant="h6">Google Play</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Shop by Region */}
      <Box
        sx={{
          display: { md: "flex", sm: "flex", xs: "block" },
          width: "100%",
          mt: 5,
          mb: 5,
          borderTop: "1px solid lightGray",
          borderBottom: "1px solid lightGray",
          height: 100,
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: { md: "50%", sm: "100%", xs: "100%" },
            display: { md: "flex", sm: "flex", xs: "block" },
            gap: 2,
            alignItems: "center",
          }}
        >
          <Typography
            sx={{
              fontSize: { lg: "20px", md: "20px", sm: "17px", xs: "auto" },
              fontWeight: 600,
            }}
          >
            Shop by Region
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: "20px",
              alignItems: "center",
              mt: 3,
              mb: 3,
            }}
          >
            {/* Clickable current flag + label */}
            <Box
              component="button"
              onClick={handleOpenMenu}
              aria-label={`Select country, current ${region}`}
              style={{ all: "unset", cursor: "pointer" }}
              sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
            >
              <Box
                component={"img"}
                src={FLAGS[region]}
                alt={region}
                sx={{ width: 35, height: 35, borderRadius: 1 }}
              />
              {/* <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{region}</Typography> */}
            </Box>

            {/* Upward-opening menu */}
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleCloseMenu}
              anchorOrigin={{ vertical: "top", horizontal: "left" }}
              transformOrigin={{ vertical: "bottom", horizontal: "left" }}
              MenuListProps={{ dense: true }}
              PaperProps={{ elevation: 3, sx: { mt: -1 } }}
            >
              <MenuItem onClick={() => selectRegion("UK")} selected={region === "UK"}>
                <Box component="img" src={FLAGS.UK} alt="UK" sx={{ width: 20, height: 20, mr: 1 }} />
                UK
              </MenuItem>
              <MenuItem onClick={() => selectRegion("US")} selected={region === "US"}>
                <Box component="img" src={FLAGS.US} alt="US" sx={{ width: 20, height: 20, mr: 1 }} />
                US
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        <Box
          sx={{
            width: { md: "50%", sm: "100%", xs: "100%" },
            display: "flex",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          {PAYMENT_CARD.map((e, i) => (
            <a key={i} href={e.href}>
              <Box component={"img"} src={e.icon} sx={{ cursor: "pointer", width: 45, height: 45 }} />
            </a>
          ))}
        </Box>
      </Box>

      <Typography sx={{ display: 'flex', justifyContent: 'center', p: 2, alignItems: 'center', fontSize: 13, color: 'gray' }}>diypersonalisation@gmail.com</Typography>
    </Box>
  );
};

export default Footer;
