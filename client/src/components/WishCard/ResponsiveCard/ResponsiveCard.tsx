// ============================================
import React, { useLayoutEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
/**
 * Keeps a fixed aspect (baseWidth:baseHeight) and scales to fit parent.
 * Why: avoids distortion and prevents width/height loss across viewports.
 */
type ResponsiveCardProps = {
    baseWidth: number;   // e.g., 500
    baseHeight: number;  // e.g., 700
    children: React.ReactNode;
    sx?: any;
};

const ResponsiveCard: React.FC<ResponsiveCardProps> = ({
    baseWidth,
    baseHeight,
    children,
    sx,
}) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState<{ w: number; h: number }>({
        w: baseWidth,
        h: baseHeight,
    });

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const compute = () => {
            const { clientWidth, clientHeight } = el;
            const scale = Math.min(clientWidth / baseWidth, clientHeight / baseHeight);
            const w = Math.max(1, Math.floor(baseWidth * scale));
            const h = Math.max(1, Math.floor(baseHeight * scale));
            setSize({ w, h });
        };

        compute();

        const ro = new ResizeObserver(() => compute());
        ro.observe(el);
        return () => ro.disconnect();
    }, [baseWidth, baseHeight]);

    return (
        <Box
            ref={containerRef}
            sx={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                // fills the space given by parent; parent should control padding/margins
                width: "100%",
                height: "100%",
                minHeight: 0,
                minWidth: 0,
            }}
        >
            <Box
                sx={{
                    width: `${size.w}px`,
                    height: `${size.h}px`,
                    aspectRatio: `${baseWidth} / ${baseHeight}`,
                    overflow: "hidden",
                    borderRadius: 2,
                    boxShadow: 5,
                    position: "relative",
                    display: "flex",
                    flexDirection: "row",
                    transition: "width 0.2s ease, height 0.2s ease",
                    ...sx,
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

export default ResponsiveCard;