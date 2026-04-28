import MainLayout from '../../../layout/MainLayout'
import { Box, Typography } from '@mui/material'
import CommunityChat from './components/CommunityChat/CommunityChat'
import VideoSections from './components/VideoSections/VideoSections'
import LandingButton from '../../../components/LandingButton/LandingButton'
import { useQuery } from '@tanstack/react-query'
import { fetchAllTutorials } from '../../../source/source'

const CommunityHub = () => {

    const {
        data: tutorials = [],
        // isLoading,
        // isError,
    } = useQuery({
        queryKey: ['tutorials'],
        queryFn: fetchAllTutorials,
        staleTime: 60_000,
    });

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
                    p: { lg: 3, md: 3, sm: 3, xs: 1 },
                    mb: { md: 9, sm: 6, xs: 4 }
                }}
            >
                <Box sx={{ textAlign: "center", p: 2 }}>
                    <Typography
                        component="h1"
                        sx={{
                            fontSize: { md: 50, sm: 40, xs: 25 },
                            fontWeight: 700,
                            letterSpacing: 2,
                            lineHeight: 1.15,
                            display: 'flex', alignItems: 'center',
                            textAlign: 'center',
                            m: 'auto',
                            justifyContent: 'center'
                        }}
                    >
                        Welcome to the{" "}
                        {/* CSS outline version */}
                        <Box sx={{ mt: 2, display: "inline-block" }}>
                            <svg height="60" viewBox="0 0 170 60" role="img" aria-label="DIY P (outlined)">
                                <text
                                    x="50%"
                                    y="50%"
                                    dominantBaseline="middle"
                                    textAnchor="middle"
                                    fontFamily="inherit"
                                    fontSize="50"
                                    fontWeight="700"
                                    fill="none"
                                    stroke="#000"
                                    strokeWidth="3"
                                    letterSpacing="3"
                                >
                                    <tspan>D</tspan>
                                    <tspan fill="#000">i</tspan>
                                    <tspan>Y</tspan>
                                    <tspan fill="#000">
                                        .
                                    </tspan>
                                    <tspan>P</tspan>

                                </text>
                            </svg>
                        </Box>

                        Community
                    </Typography>
                </Box>


                {/* Chatting Hub */}
                <CommunityChat />

                {/* Video section */}
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mt: 4 }}>
                    {tutorials.slice(0, 12).map((e: any) => (
                        <VideoSections title={e.title} width={300} videoId={e.youtube_url} thumbnail={e.thumbnail_base64} />
                    ))}
                    {
                        tutorials.length >= 12 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', m: 'auto', width: '100%' }}>
                                <LandingButton title='Load more..' personal width='200px' />
                            </Box>
                        )
                    }

                </Box>
            </Box>
        </MainLayout>
    )
}

export default CommunityHub