// src/components/VideoSection.tsx
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { PauseRounded, PlayArrowRounded } from '@mui/icons-material';

const pad = (n: number) => n.toString().padStart(2, '0');
const fmt = (sec: number) => {
    if (!isFinite(sec)) return '00:00';
    const s = Math.floor(sec % 60);
    const m = Math.floor((sec / 60) % 60);
    const h = Math.floor(sec / 3600);
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const VideoSection = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const rafRef = useRef<number | null>(null);

    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [progress, setProgress] = useState(0); // driven by rAF
    const [seeking, setSeeking] = useState(false);
    const [tempSeek, setTempSeek] = useState(0);
    const [loadErr, setLoadErr] = useState<string | null>(null);

    const tick = () => {
        const v = videoRef.current;
        if (!v) return;
        if (!seeking) setProgress(v.currentTime);
        if (!v.paused && !v.ended) rafRef.current = requestAnimationFrame(tick);
    };

    const startRAF = () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tick);
    };

    const stopRAF = () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
    };

    useEffect(() => () => stopRAF(), []);

    const togglePlay = async () => {
        const v = videoRef.current;
        if (!v) return;
        try {
            if (v.paused) {
                await v.play();
                setPlaying(true);
                startRAF(); // smooth updates
            } else {
                v.pause();
                setPlaying(false);
                stopRAF();
            }
        } catch (e) {
            console.error(e);
            setLoadErr('Playback failed (codec/MIME/policy).');
        }
    };

    const onVideoClick = () => {
        const v = videoRef.current;
        if (!v) return;
        if (!v.paused) {
            v.pause();
            setPlaying(false);
            stopRAF();
        }
    };

    const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            void togglePlay();
        }
    };

    return (
        <Box sx={{ width: '100%', height: { md: 650, sm: 450, xs: 300 }, position: 'relative', overflow: 'hidden', borderRadius: 6, bgcolor: 'black' }}>
            <Box
                component="video"
                ref={videoRef}
                src="/assets/images/diy-tips.mp4"
                poster="/assets/images/animated-banner.jpg"
                preload="metadata"
                playsInline
                onClick={onVideoClick}
                onLoadedMetadata={(e) => {
                    setDuration(e.currentTarget.duration || 0);
                    setLoadErr(null);
                }}
                onPause={() => {
                    setPlaying(false);
                    stopRAF();
                }}
                onEnded={() => {
                    setPlaying(false);
                    stopRAF();
                    const v = videoRef.current;
                    if (v) v.currentTime = 0;
                    setProgress(0);
                }}
                onError={() => setLoadErr('Video failed to load (check path/MIME).')}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000', cursor: playing ? 'pointer' : 'default' }}
            />

            {!playing && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 1 }}>
                    <IconButton
                        aria-label="Play video"
                        onClick={(e) => {
                            e.stopPropagation();
                            void togglePlay();
                        }}
                        onKeyDown={onKey}
                        sx={{ pointerEvents: 'auto', width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.85)', borderRadius: '50%', boxShadow: 3, '&:hover': { bgcolor: '#fff' } }}
                    >
                        <PlayArrowRounded fontSize="large" />
                    </IconButton>
                </Box>
            )}

            {/* {
                !playing && <Typography sx={{ position: 'absolute', top: 10, left: 10, color: COLORS.seconday }}>
                    Let us show you how with our Video tutorials
                </Typography>
            } */}


            {/* Bottom bar with smooth slider */}
            <Box
                sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    px: { xs: 1.5, sm: 2 },
                    py: 1,
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr auto',
                    alignItems: 'center',
                    gap: 1,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.35) 60%, rgba(0,0,0,0))',
                    color: '#fff',
                    zIndex: 2,
                }}
            >
                <IconButton aria-label={playing ? 'Pause' : 'Play'} onClick={() => void togglePlay()} sx={{ color: 'inherit' }}>
                    {playing ? <PauseRounded /> : <PlayArrowRounded />}
                </IconButton>

                <Slider
                    aria-label="Seek"
                    min={0}
                    max={Math.max(duration, 0.01)}
                    step={0.01}                 // fine-grained
                    value={seeking ? tempSeek : progress}
                    onChange={(_, val) => {
                        const next = Array.isArray(val) ? val[0] : val;
                        setSeeking(true);
                        setTempSeek(next);
                    }}
                    onChangeCommitted={(_, val) => {
                        const v = videoRef.current;
                        const next = Array.isArray(val) ? val[0] : val;
                        if (v) v.currentTime = next;
                        setProgress(next);
                        setSeeking(false);
                        if (playing) startRAF(); // resume rAF after seek
                    }}
                    disableSwap
                    sx={{
                        mx: 1,
                        '& .MuiSlider-rail': { opacity: 0.3, transition: 'none' },   // no CSS tweening
                        '& .MuiSlider-track': { border: 'none', transition: 'none', color: 'red' }, // avoid lerp lag
                        '& .MuiSlider-thumb': { display: 'none' },
                    }}
                />

                <Typography variant="body2" sx={{ minWidth: 92, textAlign: 'right', fontFeatureSettings: '"tnum"' }}>
                    {fmt(seeking ? tempSeek : progress)} / {fmt(duration)}
                </Typography>
            </Box>

            {loadErr && (
                <Box sx={{ position: 'absolute', bottom: 8, left: 8, px: 1, py: 0.5, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, borderRadius: 1, zIndex: 3 }}>
                    {loadErr}
                </Box>
            )}
        </Box>
    );
};

export default VideoSection;
