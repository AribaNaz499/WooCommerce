import { Box } from "@mui/material";
import type { AlignGuides } from "../../hooks/useAlignGuides";

type AlignmentGuidesProps = AlignGuides & {
  hide?: boolean;
  color?: string;
};

const AlignmentGuides = ({
  showV,
  showH,
  x,
  y,
  hide = false,
  color = "#c200ff",
}: AlignmentGuidesProps) => {
  if (hide || (!showV && !showH)) return null;

  return (
    <Box
      className="alignment-guides"
      data-export="false"
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2600,
      }}
    >
      {showV && (
        <Box
          sx={{
            position: "absolute",
            left: x,
            top: 0,
            bottom: 0,
            width: "1px",
            backgroundColor: color,
            opacity: 0.9,
            transform: "translateX(-0.5px)",
          }}
        />
      )}
      {showH && (
        <Box
          sx={{
            position: "absolute",
            top: y,
            left: 0,
            right: 0,
            height: "1px",
            backgroundColor: color,
            opacity: 0.9,
            transform: "translateY(-0.5px)",
          }}
        />
      )}
    </Box>
  );
};

export default AlignmentGuides;
