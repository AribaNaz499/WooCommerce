import { Box, Typography } from '@mui/material'
import { COLORS } from '../../../../../constant/color'
import { useNavigate } from 'react-router-dom'
import { USER_ROUTES } from '../../../../../constant/route'


const data = [
    'Birthday',
    'Wedding',
    'New Baby',
    'Christmas',
    'Mother Day',
    'Engagement',
    'Anniversary',
    'New Job',
    'Valentine',
    'Father Day',
]

const MakeMoments = () => {

     const navigate = useNavigate()

    return (
        <Box>
            <Typography sx={{ fontSize: { md: 35, sm: 30, xs: 20 }, fontWeight: 600, color: COLORS.primary, lineHeight: 1.3, textAlign: 'center' }}>Make moments your way.</Typography>
            <Typography sx={{ fontSize: { md: 24, sm: 25, xs: 16 }, textAlign: { xs: 'center', md: 'start' } }}>Shop by Occasion and create something truly meaningful.</Typography>

            <Box
                sx={{
                    width: '100%',
                    p: { xs: 2, md: 3 },
                    bgcolor: COLORS.primary,
                    textAlign: 'center',
                    mt: 3,
                    borderRadius: 3,
                    display: 'grid',
                    gap: { xs: 1, sm: 2 },
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(5, 1fr)' },
                }}
            >
                {data.map((e, i) => (
                    <Typography
                        onClick={() => navigate(`${USER_ROUTES.VIEW_ALL}/${e}`)}
                        key={i}
                        sx={{
                            fontSize: { md: 22, sm: 18, xs: 16 },
                            cursor: 'pointer',
                            color: COLORS.white,
                            fontWeight: 600,
                            py: 1,
                            borderRadius: 2,
                            backgroundColor: 'rgba(255,255,255,0.12)',
                        }}
                    >
                        {e}
                    </Typography>
                ))}
            </Box>
        </Box>
    )
}

export default MakeMoments
