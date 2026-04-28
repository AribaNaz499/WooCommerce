import React from 'react'
import { COLORS } from '../../../../constant/color'
import { Box, Typography } from '@mui/material'

const imagineIf = [
    {
        id: 1,
        percentage: 10,
        title: "of personalised product were printed at home",
        icons: '/assets/icons/printer.png',
        border: COLORS.green
    },
    {
        id: 2,
        percentage: 25,
        title: "Chose DIY instead of delivery",
        icons: '/assets/icons/love.png',
        border: COLORS.primary
    },
    {
        id: 3,
        percentage: 50,
        title: "avoided shipping altogether",
        icons: '/assets/icons/truck.png',
        border: COLORS.black
    },
]
const Customers = [
    {
        id: 1,
        title: "Fewer delivery emission",
        icons: '/assets/icons/truck.png',
        border: COLORS.primary
    },
    {
        id: 2,
        title: "Less packaging waste",
        icons: '/assets/icons/recycle.png',
        border: COLORS.black
    },
    {
        id: 3,
        title: "More mindfull gifting habits",
        icons: '/assets/icons/love.png',
        border: COLORS.green
    },
]

const MorePeople = () => {
    return (
        <React.Fragment>
            <Typography
                sx={{
                    fontSize: { md: 35, sm: 30, xs: 20 },
                    fontWeight: 600,
                    color: COLORS.seconday,
                    lineHeight: 1.3,
                    textAlign: "center",
                    mb: 1,
                }}
            >
                What If more people choose DIY Personalisation?
            </Typography>

            <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start", lineHeight: { md: 0, xs: 'auto' } }}>
                This is where small changes can create big impact.
            </Typography>

            <Box sx={{ p: 2, bgcolor: COLORS.seconday, borderRadius: 2 }}>
                <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start" }}>
                    Imagine If:
                </Typography>

                <Box sx={{ display: { md: 'flex' }, gap: 1, width: { md: '60%', xs: '100%' }, m: 'auto', flexWrap: 'wrap' }}>
                    {
                        imagineIf.map((e) => (
                            <Box sx={{ p: 2, color: COLORS.white, border: `3px solid ${e.border}`, width: { md: 220, xs: '100%' }, height: { md: 220, xs: 'auto' }, display: 'flex', flexDirection: 'column', m: 'auto', alignItems: 'center', justifyContent: 'center', borderRadius: 2, textAlign: 'center', mb: { md: 0, xs: 2 } }}>
                                <Typography sx={{ fontSize: { md: 20, xs: 'auto' }, mt: 4 }}>{e.percentage}%</Typography>
                                <Typography sx={{ fontSize: { md: 20, xs: 'auto' }, }}>{e.title}</Typography>
                                <Box
                                    component={'img'}
                                    src={`${e.icons}`}
                                    sx={{ width: 70, height: 'auto' }}
                                />
                            </Box>
                        ))
                    }
                </Box>

                <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start" }}>
                    That could mean:
                </Typography>

                <Box sx={{ display: { md: 'flex' }, gap: 1, width: { md: '60%', xs: '100%' }, m: 'auto', flexWrap: 'wrap' }}>
                    {
                        Customers.map((e) => (
                            <Box sx={{ p: 2, color: COLORS.white, border: `3px solid ${e.border}`, width: { md: 220, xs: '100%' }, height: { md: 170, xs: 'auto' }, display: 'flex', flexDirection: 'column', m: 'auto', alignItems: 'center', justifyContent: 'center', borderRadius: 2, textAlign: 'center', mb: { md: 0, xs: 2 } }}>
                                <Typography sx={{ fontSize: { md: 20, xs: 'auto' }, mt: 2 }}>{e.title}</Typography>
                                <Box
                                    component={'img'}
                                    src={`${e.icons}`}
                                    sx={{ width: 60, height: 'auto' }}
                                />
                            </Box>
                        ))
                    }
                </Box>

                <Typography sx={{ fontSize: { md: 28, sm: 20, xs: 16 }, textAlign: "start", mt: 4 }}>
                    DIY Personalisation empowers people to make choices, one card, one print, one moment at a time.
                </Typography>


            </Box>
        </React.Fragment>
    )
}

export default MorePeople