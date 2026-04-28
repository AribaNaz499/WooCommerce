import { Box, Typography } from "@mui/material";
import { COLORS } from "../../../../../constant/color";
import LandingButton from "../../../../../components/LandingButton/LandingButton";
import { useNavigate } from "react-router-dom";
import { USER_ROUTES } from "../../../../../constant/route";

const bullets = [
    {
        id: 1,
        title: "Instant print ready files,  no waiting, no shipping delays",
        borderColor: COLORS.primary
    },
    {
        id: 2,
        title: "Print at home and save money on personalised designs",
        borderColor: COLORS.seconday
    },
    {
        id: 3,
        title: "Perfect for cards, invites, clothing, mugs and more",
        borderColor: COLORS.green
    },
    {
        id: 4,
        title: "Beautiful templates designed for every life moment",
        borderColor: COLORS.black
    },
];

export default function WhyChoose() {

    const navigate = useNavigate()

    return (
        <Box sx={{ width: "100%",mt:1 }}>
            <Typography
                sx={{
                    fontSize: { md: 35, sm: 30, xs: 20 },
                    fontWeight: 700,
                    color: COLORS.black,
                    lineHeight: 1.2,
                    textAlign: "center",
                    // mb: 2,
                }}
            >
              Unlimited personalisation, one simple subscription.
            </Typography>
             <Typography sx={{ fontSize: { md: 24, sm: 25, xs: 'auto'},textAlign:'start' }}>Create more, spend less with the DIY Personalisation Creator subscription.</Typography>

            {/* Purple panel */}
            <Box
                sx={{
                    bgcolor: COLORS.white,
                    borderWidth: 4,
                    borderStyle: "solid",
                    borderColor: COLORS.seconday,
                    borderRadius: 3,
                    p: { md: 2, sm: 2, xs: 2 },
                    display: "flex",
                    alignItems: "stretch",
                    gap: { md: 3, xs: 2 },
                    flexDirection: { xs: "column", md: "row" },
                    height: { md: 400, xs: 'auto' }
                }}
            >
                {/* Left list */}
                <Box
                    sx={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: { md: 2, xs: 1.5 },
                        justifyContent: "center",
                    }}
                >
                    {bullets.map((text) => (
                        <Box
                            key={text.id}
                            sx={{
                                bgcolor: "#fff",
                                borderRadius: 3,
                                borderWidth: 3,
                                borderStyle: 'solid',
                                borderColor: text.borderColor,
                                px: { md: 2.5, xs: 2 },
                                py: { md: 1.2, xs: 1 },
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                            }}
                        >
                            {/* bullet dot */}
                            <Box
                                sx={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    bgcolor: "#111",
                                    flexShrink: 0,
                                    // mt: "2px",
                                }}
                            />
                            <Typography
                                sx={{
                                    fontSize: { md: 22, sm: 20, xs: 16 },
                                    fontWeight: 500,
                                    color: "#111",
                                    lineHeight: 1.1,
                                }}
                            >
                                {text.title}
                            </Typography>
                        </Box>
                    ))}

                    <Box sx={{ bgcolor: COLORS.black, color: COLORS.white, p: 2, display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', borderRadius: 3 }}>
                        <Typography sx={{ fontSize: { md: 22, sm: 25, xs: 'auto' } }}>DIY P Creator subscription <br /> £25 a month Cancel anytime</Typography>
                        <LandingButton title="Start my subscription" active personal bgblack width="250px" onClick={() => navigate(USER_ROUTES.PREMIUM_PLANS)} />
                    </Box>

                </Box>

                {/* Right image */}
                <Box
                    sx={{
                        width: { xs: "100%", md: 500 },
                        height: '100%',
                        overflow: "hidden",
                        flexShrink: 0,
                    }}
                >
                    <Box
                        component="img"
                        src="/assets/images/lifestyle.png"
                        alt="DIY Personalisation"
                        sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 2, }}
                    />
                </Box>
            </Box>
        </Box>
    );
}