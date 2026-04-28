import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";

type RulerOverlayProps = {
  hide?: boolean;
  thickness?: number;
  tickEvery?: number;
  labelEvery?: number;
  showCenter?: boolean;
};

const RulerOverlay = ({
  hide = false,
  thickness = 22,
  tickEvery = 10,
  labelEvery = 50,
  showCenter = true,
}: RulerOverlayProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const parent = hostRef.current?.parentElement;
    if (!parent) return;

    const update = () => {
      setSize({ w: parent.clientWidth, h: parent.clientHeight });
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  const width = Math.max(0, size.w);
  const height = Math.max(0, size.h);

  const ticksX = useMemo(() => {
    const out: { x: number; major: boolean }[] = [];
    if (!width) return out;
    for (let x = 0; x <= width; x += tickEvery) {
      out.push({ x, major: x % labelEvery === 0 });
    }
    return out;
  }, [width, tickEvery, labelEvery]);

  const ticksY = useMemo(() => {
    const out: { y: number; major: boolean }[] = [];
    if (!height) return out;
    for (let y = 0; y <= height; y += tickEvery) {
      out.push({ y, major: y % labelEvery === 0 });
    }
    return out;
  }, [height, tickEvery, labelEvery]);

  if (hide) return null;

  return (
    <Box
      ref={hostRef}
      className="ruler-overlay"
      data-export="false"
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3000,
      }}
    >
      {/* Top ruler */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: thickness,
          backgroundColor: "rgba(255,255,255,0.8)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {ticksX.map(({ x, major }) => (
          <Box
            key={`tx-${x}`}
            sx={{
              position: "absolute",
              left: x,
              top: 0,
              width: 1,
              height: major ? thickness : Math.round(thickness * 0.45),
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />
        ))}
        {ticksX
          .filter((t) => t.major)
          .map(({ x }) => (
            <Box
              key={`tl-${x}`}
              sx={{
                position: "absolute",
                left: x + 2,
                top: 2,
                fontSize: 9,
                color: "rgba(0,0,0,0.6)",
              }}
            >
              {x}
            </Box>
          ))}
      </Box>

      {/* Left ruler */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: thickness,
          backgroundColor: "rgba(255,255,255,0.8)",
          borderRight: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        {ticksY.map(({ y, major }) => (
          <Box
            key={`ty-${y}`}
            sx={{
              position: "absolute",
              top: y,
              left: 0,
              height: 1,
              width: major ? thickness : Math.round(thickness * 0.45),
              backgroundColor: "rgba(0,0,0,0.25)",
            }}
          />
        ))}
        {ticksY
          .filter((t) => t.major)
          .map(({ y }) => (
            <Box
              key={`ll-${y}`}
              sx={{
                position: "absolute",
                top: y + 2,
                left: 2,
                fontSize: 9,
                color: "rgba(0,0,0,0.6)",
              }}
            >
              {y}
            </Box>
          ))}
      </Box>

      {/* Corner */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: thickness,
          height: thickness,
          backgroundColor: "rgba(255,255,255,0.9)",
          borderRight: "1px solid rgba(0,0,0,0.08)",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      />

      {/* Center guides */}
      {showCenter && width > 0 && height > 0 && (
        <>
          <Box
            sx={{
              position: "absolute",
              top: thickness,
              bottom: 0,
              left: Math.round(width / 2),
              width: 1,
              borderLeft: "1px dashed rgba(0,0,0,0.25)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              left: thickness,
              right: 0,
              top: Math.round(height / 2),
              height: 1,
              borderTop: "1px dashed rgba(0,0,0,0.25)",
            }}
          />
        </>
      )}
    </Box>
  );
};

export default RulerOverlay;
