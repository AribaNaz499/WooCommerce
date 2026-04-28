import { Box, Typography } from '@mui/material'
import React from 'react'
import { COLORS } from '../../../../constant/color'

const ResponsibleMaterial = () => {
    return (
        <React.Fragment>
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
                Responsible materials, thoughtfully sourced
            </Typography>


            <Box sx={{ p: 2, display: { md: 'flex', xs: 'block' }, justifyContent: 'space-between', alignItems: 'center', bgcolor: COLORS.green,borderRadius:2, }}>
                {/* Left */}
                <Box sx={{ width: "100%" }}>
                    <Typography sx={{ fontSize: { md: 23, sm: 20, xs: 16 }, textAlign: "start" }}>
                        Paper can be sustainable  material when sourced responsibly. We encourage printing on paper and card made from well managed forest and renewable growth cycle, where trees are replanted and harvested thoughtfully.
                    </Typography>

                    <Typography sx={{ fontSize: { md: 23, sm: 20, xs: 16 }, textAlign: "start" }}>
                        By chosen quality over excess, paper remains:
                    </Typography>
                    <br />
                    <Box component={'ul'}
                        sx={{
                            lineHeight: 1.5,
                            fontSize: { md: 23, sm: 20, xs: 'auto' },
                            pl: 6.4
                        }}
                    >
                        <li>Renewable</li>
                        <li>Recyclable</li>
                        <li>Long-lasting when use intentionally.</li>
                    </Box>

                    <Typography sx={{ fontSize: { md: 24, sm: 20, xs: 16 }, textAlign: "start", mt: 3 }}>
                        As DIY Personalisation grows, we'll continue exploring responsible material partnership always with transparency and care.
                    </Typography>



                </Box>


                {/* Right*/}
                <Box sx={{ display: 'flex', justifyContent: 'center', m: 'auto', alignItems: 'center', width: "100%" }}>

                    <Box
                        component={'img'}
                        src='/assets/icons/tree.png'
                        sx={{ width: '100%', height: 550 }}
                    />

                </Box>
            </Box>

        </React.Fragment>
    )
}

export default ResponsibleMaterial