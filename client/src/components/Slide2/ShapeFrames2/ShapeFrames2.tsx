import { Box, Button, Typography } from "@mui/material";
import { Delete } from "@mui/icons-material";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { SHAPES } from "../../../constant/data";
import { useSlide2 } from "../../../context/Slide2Context";

interface ShapeFrames2Props {
    onClose: () => void;
    activeIndex?: number;
}

const ShapeFrames2 = ({ onClose, activeIndex }: ShapeFrames2Props) => {
    const {
        setDraggableImages,
        selectedShapeImageId2,
    } = useSlide2();

    const applyShapeToTarget = (path: string | null) => {
        if (selectedShapeImageId2 == null) return; // no target selected
        setDraggableImages(prev =>
            prev.map(img =>
                img.id === selectedShapeImageId2 ? { ...img, shapePath: path } : img
            )
        );
    };

    return (
        <PopupWrapper
            title="Frames"
            onClose={onClose}
            sx={{
                width: { md: 360, sm: 320, xs: "95%" },
                left: { md: "18%", sm: "14%", xs: 0 },
                top: 0,
                mt: { md: 0, sm: 0, xs: 4 },
            }}
            activeIndex={activeIndex}
        >
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 1,
                }}
            >
                {SHAPES.map(s => (
                    <Box
                        key={s.id}
                        onClick={() => applyShapeToTarget(s.path)}
                        sx={{
                            p: 1,
                            border: "1px solid rgba(0,0,0,0.12)",
                            borderRadius: 1.5,
                            cursor: selectedShapeImageId2 == null ? "not-allowed" : "pointer",
                            opacity: selectedShapeImageId2 == null ? 0.5 : 1,
                            "&:hover": {
                                borderColor: selectedShapeImageId2 == null ? "inherit" : "primary.main",
                            },
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1,
                        }}
                    >
                        <Box sx={{ width: 64, height: 48, bgcolor: "#e0e0e0", clipPath: s.path }} />
                        <Typography sx={{ fontSize: 12, textAlign: "center" }}>{s.label}</Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                <Button
                    startIcon={<Delete />}
                    onClick={() => applyShapeToTarget(null)}
                    size="small"
                    color="inherit"
                    disabled={selectedShapeImageId2 == null}
                    variant="contained"
                >
                    Clear
                </Button>
            </Box>
        </PopupWrapper>
    );
};

export default ShapeFrames2;
