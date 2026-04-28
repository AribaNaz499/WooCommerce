import { Box, Typography } from '@mui/material'
import React from 'react'
import { COLORS } from '../../../../constant/color'


const Customers = [
    {
        id: 1,
        title: "Fewer unnecessary deliveries",
        icons: '/assets/icons/truck.png',
        border: COLORS.primary
    },
    {
        id: 2,
        title: "More control in your hands",
        icons: '/assets/icons/love.png',
        border: COLORS.seconday
    },
    {
        id: 3,
        title: "Clear guidance to help you print more responsibly",
        icons: '/assets/icons/greenTree.png',
        border: COLORS.green
    },
]
const HonestDesign = () => {
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
                Honest by design
            </Typography>

            <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start", lineHeight: { md: 0.4, xs: 'auto' } }}>
                We're not perfect, and  we're not claiming to be.
            </Typography>
            <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start", lineHeight: { md: 0.4, xs: 'auto' } }}>
                DIY Personalisation doesn't promise carbon neutrality or zero  impact.
            </Typography>

            <Box sx={{ display: { md: 'flex', xs: 'block' }, gap: 1 }}>
                <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start", lineHeight: { md: 0.4, xs: 'auto' } }}>
                    What we do promise is:
                </Typography>

                <Box sx={{ display: { md: 'flex' }, gap: 1, width: { md: '60%', xs: '100%' }, flexWrap: 'wrap' }}>
                    {
                        Customers.map((e) => (
                            <Box sx={{ p: 1.5, color: COLORS.black, border: `3px solid ${e.border}`, width: { md: 220, xs: '100%' }, height: { md: 200, xs: 'auto' }, display: 'flex', flexDirection: 'column', m: 'auto', alignItems: 'center', justifyContent: 'center', borderRadius: 2, textAlign: 'center', mb: { md: 0, xs: 1 } }}>
                                <Typography sx={{ fontSize: { md: 18, xs: 'auto' }, fontWeight: 700, mt: 2 }}>{e.title}</Typography>
                                <Box
                                    component={'img'}
                                    src={`${e.icons}`}
                                    sx={{ width: 60, height: 'auto' }}
                                />
                            </Box>
                        ))
                    }
                </Box>
            </Box>

        </React.Fragment>
    )
}

export default HonestDesign