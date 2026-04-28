import { Adjust, Check, Delete, DrawOutlined, Flare, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { COLORS } from "../../../constant/color";
import { convertToRealisticSketch } from "../../../source/SketchEffect";
import { useSlide1 } from "../../../context/Slide1Context";

interface ImageAdjustment1Props {
    togglePopup?: any,
    onClose: () => void;
    activeIndex?: number;
    isAdminEditor?: boolean
}

const ImageAdjustment1 = (props: ImageAdjustment1Props) => {
    const { onClose, isAdminEditor } = props
    const isMobile = useMediaQuery("(max-width:600px)");

    const { setImageFilter1, imageFilter1, setDraggableImages1, selectedImg1, setImages1, setSelectedImage1, setActiveFilterImageId1, draggableImages1 } = useSlide1()

    const deleteSelectedImages = () => {
        if (selectedImg1.length === 0) return;

        // 1. Delete from draggableImages (canvas)
        setDraggableImages1(prev =>
            prev.filter(img => !selectedImg1.includes(img.id))
        );

        // 2. Delete from PhotoPopup images list
        setImages1(prev =>
            prev.filter(img => !selectedImg1.includes(img.id))
        );

        // 3. REMOVE ALL CHECKS
        setSelectedImage1([]); // ← THIS removes the blue check icons
    };


    const bringToFront = () => {
        setDraggableImages1(prev => {
            const maxZ = Math.max(...prev.map(i => i.zIndex || 0));
            console.log(maxZ)

            return prev.map(img =>
                selectedImg1.includes(img.id)
                    ? { ...img, zIndex: (img.zIndex || 0) + 1 }
                    : img
            );
        });
    };

    const sendToBack = () => {
        setDraggableImages1(prev => {
            return prev.map(img =>
                selectedImg1.includes(img.id)
                    ? { ...img, zIndex: Math.max((img.zIndex || 0) - 1, 0) }
                    : img
            );
        });
    };


    const applySketch = async () => {
        if (selectedImg1.length === 0) return;

        const id = selectedImg1[selectedImg1.length - 1];
        const target = draggableImages1.find(img => img.id === id);
        if (!target) return;

        const sketchUrl = await convertToRealisticSketch(target?.src);

        setDraggableImages1(prev =>
            prev.map(img =>
                img.id === id ? { ...img, src: sketchUrl } : img
            )
        );
    };

    return (
        <Box
            sx={{
                position: isMobile ? "fixed" : "absolute",
                left: isMobile ? 0 : isAdminEditor ? "29.5%" : "30%",
                right: isMobile ? 0 : "auto",
                bottom: isMobile ? "calc(45vh + 12px)" : "auto",
                top: isMobile ? "auto" : "auto",
                transform: "none",
                zIndex: isMobile ? 1401 : 1299,
                height: isMobile ? "auto" : 600,
                width: isMobile ? "100%" : "auto",
                bgcolor: "white",
                mt: isMobile ? 0 : 1,
                borderRadius: 1,
                boxShadow: isMobile ? 3 : 1,
                p: isMobile ? 1 : 0,
                boxSizing: "border-box",
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    flexDirection: isMobile ? "row" : "column",
                    height: isMobile ? "auto" : "600px",
                    width: "100%",
                    alignItems: isMobile ? "center" : "stretch",
                    justifyContent: isMobile ? "flex-start" : "center",
                    gap: isMobile ? 1 : 0,
                }}
            >
                {/* Scrollable Icon Section */}
                <Box
                    sx={{
                        flex: isMobile ? "1 1 auto" : 1,
                        overflowY: isMobile ? "hidden" : "auto",
                        overflowX: isMobile ? "auto" : "hidden",
                        display: "flex",
                        flexDirection: isMobile ? "row" : "column",
                        gap: "10px",
                        alignItems: isMobile ? "center" : "stretch",
                        WebkitOverflowScrolling: "touch",

                        "&::-webkit-scrollbar": {
                            width: isMobile ? "0px" : "6px",
                            height: isMobile ? "6px" : "0px",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            backgroundColor: "#ccc",
                            borderRadius: "20px",
                        },
                    }}
                >

                    {/* <IconButton sx={editingButtonStyle}><Crop fontSize="large" /> Crop</IconButton> */}

                    <IconButton sx={editingButtonStyle}><Adjust fontSize="large" /> Adjust</IconButton>

                    <IconButton
                        sx={editingButtonStyle}
                        onClick={() => {
                            const lastSelected = selectedImg1[selectedImg1.length - 1];
                            setActiveFilterImageId1(lastSelected);
                            setImageFilter1(!imageFilter1);
                        }}
                    >
                        <Flare fontSize="large" />
                        Effect
                    </IconButton>

                    {!isAdminEditor && (
                        <IconButton sx={editingButtonStyle} onClick={bringToFront}>
                            <KeyboardArrowUp fontSize="large" /> Front
                        </IconButton>
                    )}

                    {!isAdminEditor && (
                        <IconButton sx={editingButtonStyle} onClick={sendToBack}>
                            <KeyboardArrowDown fontSize="large" /> Back
                        </IconButton>
                    )}


                    <IconButton
                        sx={editingButtonStyle}
                        onClick={applySketch}
                    >
                        <DrawOutlined fontSize="large" />
                        Sketch
                    </IconButton>

                    <IconButton
                        sx={editingButtonStyle}
                        onClick={deleteSelectedImages}
                    >
                        <Delete />
                        Delete
                    </IconButton>

                </Box>

                {/* Fixed Check Button at Bottom */}
                <Box
                    sx={{
                        p: isMobile ? 0 : 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    <IconButton
                        sx={{
                            ...editingButtonStyle,
                            bgcolor: COLORS.green,
                            color: "white",
                            width: 45,
                            height: 45,
                        }}
                        onClick={onClose}
                    >
                        <Check fontSize="large" />
                    </IconButton>
                </Box>
            </Box>

        </Box>
    );
};

export default ImageAdjustment1;

const editingButtonStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontSize: "13px",
    minWidth: "56px",
    flexShrink: 0,
    color: "#212121",
    "&:hover": {
        color: "#3a7bd5",
    },
};
