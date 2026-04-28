import MainLayout from '../../../layout/MainLayout'
import { Box, Typography } from '@mui/material'
import { COLORS } from '../../../constant/color'
import PrintSmarter from './components/PrintSmarter'
import LowerGSM from './components/LowerGSM'
import MorePeople from './components/MorePeople'
import ResponsibleMaterial from './components/ResponsibleMaterial'
import HonestDesign from './components/HonestDesign'
import YourWay from './components/YourWay'


const Sustainibility = () => {
    return (
        <MainLayout>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "30px",
                    width: { lg: "1340px", md: "100%", sm: "100%", xs: "100%" },
                    justifyContent: "center",
                    m: "auto",
                    p: { lg: 2, md: 2, sm: 2, xs: 1 },
                }}
            >

                <Typography
                    sx={{
                        fontSize: { md: 35, sm: 30, xs: 20 },
                        fontWeight: 600,
                        color: COLORS.green,
                        lineHeight: 1.3,
                        textAlign: "center",
                        mb: 1,
                    }}
                >
                    Sustainability at DIY Personalisation
                </Typography>

                <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start", lineHeight: 0 }}>
                    Personalisation with a lighter footprint.
                </Typography>


                <Box
                    sx={{
                        display: "flex",
                        width: "100%",
                        gap: { xs: 2, md: 2.5 },
                        borderRadius: 3,
                        overflow: "hidden",
                        bgcolor: COLORS.green,
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 1.5, md: 1 }, // why: screenshot me padding tight hai
                        flexDirection: { xs: "column", md: "row" },
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    {/* Left Side */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            sx={{
                                m: 0, // why: default/top margins height badhate hain
                                color: COLORS.black,
                                fontSize: { xs: 'auto', sm: 18, md: 22 }, // why: 24px md height ko bohat push karta hai
                                lineHeight: 1.25, // why: compact like screenshot
                            }}
                        >
                            At DIY Personalisation, sustainability starts with something simple choice.
                            By helping you personalise and print at home, you reduce unnecessary delivery,
                            packaging and waste, while giving full control over how and what you create.
                            We believe thoughtful personalisation doesn’t need to come at the planet’s expense.
                            Small decisions, made at scale, make a meaningful difference.
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
                            src="/assets/images/globe.png"
                            alt="Globe"
                            sx={{
                                width: { xs: '100%', md: 300 },
                                height: { xs: '100%', md: 220 }, // why: fixed size keeps section height stable
                                borderRadius: "999px",
                                objectFit: "cover",
                                display: "block", // why: inline image baseline gap remove
                            }}
                        />
                    </Box>
                </Box>

                <PrintSmarter />
                <LowerGSM />
                <MorePeople />
                <ResponsibleMaterial />
                <HonestDesign />
                <br />
                <YourWay />

            </Box>
        </MainLayout>
    )
}

export default Sustainibility