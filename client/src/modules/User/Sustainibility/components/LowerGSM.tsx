import React from 'react'
import { COLORS } from '../../../../constant/color'
import { Box, Typography } from '@mui/material'

const LowerGSM = () => {
    return (
        <React.Fragment>
            <Typography
                sx={{
                    fontSize: { md: 35, sm: 30, xs: 20 },
                    fontWeight: 600,
                    color: COLORS.black,
                    lineHeight: 1.3,
                    textAlign: "center",
                    mb: 2
                }}
            >
                Why lower gsm makes a difference
            </Typography>

            <Box sx={{ display: "flex", flexDirection: { md: "row", xs: 'column' }, gap: 2, }}>
                {/* Left */}
                <Box sx={{ width: "100%" }}>
                    <Typography sx={{ fontSize: { md: 23, sm: 20, xs: 16 }, textAlign: "start" }}>
                        Higher gsm isn't always better. In many cases,thoughtfully chosen
                        lower materials are more efficient and just as effective.
                    </Typography>

                    <Typography sx={{ fontSize: { md: 23, sm: 20, xs: 16 }, textAlign: "start" }}>
                        Lower gsm paper and card can mean:
                    </Typography>

                    <Box component={'ul'}
                        sx={{
                            lineHeight: 1.5,
                            fontSize: { md: 23, sm: 20, xs: 'auto' },
                            pl: 6.4
                        }}
                    >
                        <li>Less raw material used per product</li>
                        <li>Reduced ink absorption</li>
                        <li>Fewer printer jams and misprints</li>
                        <li>Less waste overall</li>
                    </Box>

                    <Typography sx={{ fontSize: { md: 23, sm: 20, xs: 16 }, textAlign: "start" }}>
                        It's about printing intentionally, not excessively.
                    </Typography>
                </Box>
                {/* Right */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', m: 'auto', alignItems: 'flex-end', width: "100%" }}>

                    <Box
                        component={'img'}
                        src='/assets/images/paper.png'
                        sx={{ width: 400, height: 360 }}
                    />

                </Box>
            </Box>

            <Typography sx={{ display: 'flex', justifyContent: 'center', fontSize: { md: 23, sm: 20, xs: 16 }, color: COLORS.primary, fontWeight: 700, mt: { md: -10 } }}>Less delivery, less CO <sub>2</sub></Typography>

            <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 'auto' }, textAlign: "start", lineHeight: 0 }}>Print at home, skip the miles</Typography>


            {/* Diver Box */}
            <Box
                sx={{
                    display: "flex",
                    width: "100%",
                    gap: { xs: 2, md: 2.5 },
                    borderRadius: 3,
                    overflow: "hidden",
                    bgcolor: COLORS.primary,
                    px: { xs: 2, md: 2.5 },
                    py: { xs: 1.5, md: 1 },
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                {/* Left Side */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            m: 0,
                            color: COLORS.black,
                            fontSize: { xs: 'auto', sm: 18, md: 22 },
                            lineHeight: 1.15,
                        }}
                    >
                        Traditional personalised products often involve multiple stages:
                    </Typography>
                    <Typography
                        sx={{
                            m: 0,
                            color: COLORS.black,
                            fontSize: { xs: 13, sm: 18, md: 22 },
                            lineHeight: 1.15,
                        }}
                    >
                        Manufacturing, packaging, transportation, missed deliveries or returns. DIY Personalisation removes delivery
                        entirely by printing at home. Do away with the load, excess packaging, reprints due to delays or errors.
                    </Typography>
                    <Typography
                        sx={{
                            m: 0,
                            color: COLORS.black,
                            fontSize: { xs: 13, sm: 18, md: 22 },
                            lineHeight: 1.15,
                        }}
                    >
                        Every print at home order skips a delivery journey, and when repeated thousands of times, those avoided
                        miles add up.
                    </Typography>
                </Box>

                {/* Right Side */}
                <Box
                    sx={{
                        flex: "0 0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: { xs: "center", md: "flex-end" },
                        width: { xs: "100%", md: "auto" },
                    }}
                >
                    <Box
                        component="img"
                        src="/assets/images/van-delivery.png"
                        alt="Globe"
                        sx={{
                            width: { xs: '100%', md: 300 },
                            height: { xs: '100%', md: 200 }, // why: fixed size keeps section height stable
                            borderRadius: "999px",
                            objectFit: "cover",
                            display: "block", // why: inline image baseline gap remove
                        }}
                    />
                </Box>
            </Box>


        </React.Fragment>
    )
}

export default LowerGSM