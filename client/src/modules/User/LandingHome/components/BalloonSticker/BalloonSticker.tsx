import { Box, Typography } from '@mui/material'
import { COLORS } from '../../../../../constant/color'
import LandingButton from '../../../../../components/LandingButton/LandingButton'
import { useNavigate } from 'react-router-dom'
import { USER_ROUTES } from '../../../../../constant/route'

const BalloonSticker = () => {

    const navigate = useNavigate()
    return (
        <Box sx={{ bgcolor: COLORS.seconday, display: { md: 'flex', sm: 'flex', xs: 'block' }, height: { md: 500, sm: 400, xs: 'auto' }, borderRadius: 4, color: COLORS.white, p: 2 }}>
            {/* Left Side */}
            <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                textAlign: 'center'
            }}>

                <Typography sx={{ fontSize: { md: 50, sm: 25, xs: 20 }, fontWeight: 700, p: 2 }}>
                    Celebrate Moments Your Way Today
                </Typography>
                {/* <Typography fontSize={15} >
                    something truly unforgettable.
                    Perfectly Personalised Creations
                </Typography> */}
                <br />
                <LandingButton title='Personalise Balloons Card' personal bgblack width={'330px'} onClick={() => navigate(`${USER_ROUTES.VIEW_ALL}/Stickers`)} />

            </Box>
            {/* Right Side */}
            <Box sx={{
                width: '100%',
                height: 'auto',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column'
            }}>
                <Box
                    component='img'
                    src='/assets/images/Balloons.png'
                    sx={{ objectFit: 'contain', height: '100%', width: '100%' }}
                />
            </Box>

        </Box>
    )
}

export default BalloonSticker