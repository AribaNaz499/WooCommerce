import { Box, Typography } from '@mui/material'
import { COLORS } from '../../../../constant/color'

const PrintSmarter = () => {
    return (
        <div>
            <Typography
                sx={{
                    fontSize: { md: 35, sm: 30, xs: 20 },
                    fontWeight: 600,
                    color: COLORS.black,
                    lineHeight: 1.3,
                    textAlign: "center",
                    mb: 1,
                }}
            >
                Print smarter at home
            </Typography>

            <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start", lineHeight: 0 }}>
                Your paper and card choices matter.
            </Typography>

            <Box sx={{ p: 1, bgcolor: COLORS.black, borderRadius: 3, mt: 2 }}>

                <Typography
                    sx={{
                        mt: 1,
                        color: 'rgba(255,255,255,0.9)',
                        fontSize: { xs: 13, sm: 18, md: 20 },
                        lineHeight: 1.55,
                    }}
                >
                    One of the biggest sustainability wins with DIY Personalisation is that you choose the materials.
                    Selecting the right paper or card not only improves print quality, it also helps reduce waste.
                </Typography>

                <Typography
                    sx={{
                        mt: 1.5,
                        fontWeight: 800,
                        color: COLORS.white,
                        fontSize: { xs: 13.5, sm: 16, md: 22.5 },
                    }}
                >
                    Our recommended guidelines
                </Typography>

                {/* Using real lists to match screenshot structure */}
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' }, mt: 1.5 }}>
                    <Box
                        component="ul"
                        sx={{
                            mt: 1,
                            pl: 2.2,
                            color: 'rgba(255,255,255,0.9)',
                            fontSize: { xs: 13, sm: 18, md: 20 },
                            lineHeight: 1.55,
                            width: { md: '60%', xs: '100%' },
                        }}
                    >
                        <li>
                            <Typography>For everyday printables</Typography>
                            <Box component="ul" sx={{ pl: 2.2, mt: 0.5 }}>
                                <li><b>100–120gsm</b> paper</li>
                                <li>Responsibly sourced FSC certified</li>
                                <li>Uses less ink and feeds smoothly through home printers</li>
                            </Box>
                        </li>
                        <li style={{ marginTop: 5 }}>
                            <Typography>For greetings cards & invitations</Typography>
                            <Box component="ul" sx={{ pl: 2.2, mt: 0.5 }}>
                                <li><b>200–250gsm</b> card</li>
                                <li>Premium feel without excessive thickness</li>
                                <li>Ideal balance between quality and material use</li>
                            </Box>
                        </li>
                        <li style={{ marginTop: 5 }}>
                            <Typography>For keepsakes & display prints</Typography>
                            <Box component="ul" sx={{ pl: 2.2, mt: 0.5 }}>
                                <li><b>250–300gsm</b> card</li>
                                <li>Strong and long lasting</li>
                                <li>Designed to be kept, not discarded</li>
                            </Box>
                        </li>

                        <Typography
                            sx={{
                                mt: 1.25,
                                color: 'rgba(255,255,255,0.85)',
                                fontSize: { xs: 12.5, sm: 13.5, md: 18.5 },
                            }}
                        >
                            Choosing a slightly lower gsm card can still feel premium, while using less paper per print.
                        </Typography>

                    </Box>

                    <Box
                        sx={{
                            width: { md: '40%', xs: '100%' },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center', m: 'auto'
                        }}>
                        <Box
                            component={'img'}
                            src='/assets/images/Leaves.png'
                            sx={{ width: { xs: '100%', md: 500 }, height: 'auto' }} alt="Globe"
                        />
                    </Box>

                </Box>

            </Box>

        </div>
    )
}

export default PrintSmarter