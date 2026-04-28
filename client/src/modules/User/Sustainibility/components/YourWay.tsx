import { Box, Typography } from '@mui/material'
import React from 'react'
import { COLORS } from '../../../../constant/color'


const YourWay = () => {
    return (
        <React.Fragment>
            <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 }, textAlign: "start", lineHeight: { md: 0, xs: 'auto' } }}>
                Sustainability isn't about doing everything. It's about doing something better.
            </Typography>

            <Box
                sx={{ p: 4, bgcolor: COLORS.black, borderRadius: 2, color: COLORS.white, display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', m: 'auto', textAlign: 'center' }}>
                <Typography
                    sx={{
                        fontSize: { md: 35, sm: 30, xs: 20 },
                        fontWeight: 600,
                        lineHeight: 1.3,
                        textAlign: "center",
                        mb: 2
                    }}
                >
                    Sustainability, your way
                </Typography>

                <Typography sx={{ fontSize: { md: 25, sm: 20, xs: 16 } }}>
                    Whether it's choosing a lower gsm card, printing locally, or avoiding delivery altogether DIY Personalisation gives  you the freedom to create with intention. <br />Small choices, thoughtful design, Personalistion with purpose.
                </Typography>
            </Box>

            
            <Box sx={{ width: '100%', height: 200, display: { md: 'flex', xs: 'none' } }} />

        </React.Fragment>
    )
}

export default YourWay