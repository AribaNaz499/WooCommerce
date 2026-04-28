import React from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { YouTube } from "@mui/icons-material";

type VideoSectionsProps = {
    videoId: string;
    title?: string;
    width?: number | string;
    thumbnail?: string
};

const VideoSections: React.FC<VideoSectionsProps> = ({
    videoId,
    title = "Watch on YouTube",
    width = { md: 300, sm: 250, xs: "100%" },
    thumbnail
}) => {
    const href = `${videoId}`;
    return (
        <Box sx={{ width }}>
            <Box
                component="a"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${title} (opens on YouTube)`}
                sx={{
                    position: "relative",
                    display: "block",
                    borderRadius: 2,
                    overflow: "hidden",
                    textDecoration: "none",
                    border: "1px solid rgba(39, 39, 39, 0.2)",
                    boxShadow: 1,
                    // 16:9 aspect
                    aspectRatio: "16 / 9",
                    bgcolor: "#000",
                }}
            >
                {/* Thumbnail */}
                <Box
                    component="img"
                    src={thumbnail}
                    alt={title}
                    onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                    }}
                    sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />

                {/* Centered Play Button */}
                <IconButton
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 44,
                        height: 44,
                        zIndex: 99,
                        borderRadius: '50%',
                        transition: 'transform .15s ease, background .2s',
                        '&:hover': {
                            transform: 'translate(-50%, -50%)',
                        },
                    }}
                >
                    <YouTube sx={{ fontSize: 42, color: 'red' }} />
                </IconButton>

                {/* Optional caption overlay */}
                {title && (
                    <Typography
                        variant="subtitle2"
                        sx={{
                            position: "absolute",
                            left: 8,
                            bottom: 8,
                            px: 1,
                            py: 0.25,
                            bgcolor: "rgba(0,0,0,0.55)",
                            color: "#fff",
                            borderRadius: 1,
                            maxWidth: "90%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                        title={title}
                    >
                        {title}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default VideoSections;
