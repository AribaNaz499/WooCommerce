import { Box, Typography } from "@mui/material";
import { COLORS } from "../../../../../constant/color";

const SpecialDIY = () => {
    return (
        <Box
            sx={{
                width: "100%",
                maxWidth: 1250,
                mx: "auto",
                bgcolor: "#000",
                borderRadius: 2,
                // border: "2px solid rgba(255,255,255,0.55)", 
                px: { md: 3, sm: 4, xs: 2 },
                py: { md: 3.5, sm: 3, xs: 2.5 },
                textAlign: "center",
                // boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
            }}
        >
            {/* Title */}
            <Typography
                sx={{
                    fontSize: { md: 28, sm: 24, xs: 18 }, // screenshot title is not huge
                    fontWeight: 600,
                    color: COLORS.white,
                    lineHeight: 1.2,
                    mb: { md: 2.2, xs: 1.6 },
                }}
            >
                Make It Special with DIY Personalisation
            </Typography>

            {/* Body */}
            <Typography
                sx={{
                    color: COLORS.white,
                    fontSize: { md: 24, sm: 22, xs: 16 },
                    fontWeight: 400,
                    lineHeight: { md: 1.35, xs: 1.4 },
                    maxWidth: 1100,
                    mx: "auto",
                }}
            >
                Here at DIY Personalisation, you’ll find plenty of unique designs ready to personalise using our easy online
                editor.
                <br />
                From inside jokes and heartfelt messages to photos and names, you can create something truly personal in just a
                few clicks.
                <br />
                <br />
                Whether it’s a birthday, anniversary, wedding, housewarming or a simple thank you, DIY Personalisation helps
                you turn everyday moments into keepsakes worth holding on to.
            </Typography>
        </Box>
    );
};

export default SpecialDIY;
