import { Adjust, Check, Crop, Delete, DrawOutlined, Flare, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { COLORS } from "../../../constant/color";
import { useSlide3 } from "../../../context/Slide3Context";
import { convertToRealisticSketch } from "../../../source/SketchEffect";
import ImageCropModal from "../../../components/ImageCropModal/ImageCropModal";

interface ImageAdjustment3PopupProps {
    togglePopup?: any,
    onClose: () => void;
    activeIndex?: number;
    isAdminEditor?:boolean
}

const ImageAdjustment3Popup = (props: ImageAdjustment3PopupProps) => {
    const { onClose, isAdminEditor } = props
    const isMobile = useMediaQuery("(max-width:600px)");
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);

    const { setImageFilter3, imageFilter3, setDraggableImages3, selectedImg3, setImages3, setSelectedImage3, setActiveFilterImageId3, draggableImages3 } = useSlide3()

    const deleteSelectedImages = () => {
        if (selectedImg3.length === 0) return;

        // 1. Delete from draggableImages (canvas)
        setDraggableImages3(prev =>
            prev.filter(img => !selectedImg3.includes(img.id))
        );

        // 2. Delete from PhotoPopup images list
        setImages3(prev =>
            prev.filter(img => !selectedImg3.includes(img.id))
        );

        // 3. REMOVE ALL CHECKS
        setSelectedImage3([]); // ← THIS removes the blue check icons
    };

    const bringToFront = () => {
        setDraggableImages3(prev => {
            const maxZ = Math.max(...prev.map(i => i.zIndex || 0), 0);
            return prev.map(img =>
                selectedImg3.includes(img.id)
                    ? { ...img, zIndex: maxZ + 1 }
                    : img
            );
        });
    };

    const sendToBack = () => {
        setDraggableImages3(prev => {
            const minZ = Math.min(...prev.map(i => i.zIndex || 0), 0);
            return prev.map(img =>
                selectedImg3.includes(img.id)
                    ? { ...img, zIndex: minZ - 1 }
                    : img
            );
        });
    };


    const applySketch = async () => {
        if (selectedImg3.length === 0) return;

        const id = selectedImg3[selectedImg3.length - 1];
        const target = draggableImages3.find(img => img.id === id);
        if (!target) return;

        const sketchUrl = await convertToRealisticSketch(target?.src);

        setDraggableImages3(prev =>
            prev.map(img =>
                img.id === id ? { ...img, src: sketchUrl } : img
            )
        );
    };

    const openCropModal = () => {
        if (selectedImg3.length === 0) return;
        const id = selectedImg3[selectedImg3.length - 1];
        const target = draggableImages3.find(img => img.id === id);
        if (target?.src) {
            setSelectedImageForCrop(target.src);
            setShowCropModal(true);
        }
    };

    const handleCropComplete = (croppedImageUrl: string) => {
        if (selectedImg3.length === 0) return;
        const id = selectedImg3[selectedImg3.length - 1];

        setDraggableImages3(prev =>
            prev.map(img =>
                img.id === id
                    ? {
                        ...img,
                        src: croppedImageUrl,
                        cropHistory: {
                            originalSrc: img.src,
                            croppedSrc: croppedImageUrl,
                            timestamp: Date.now()
                        }
                    }
                    : img
            )
        );

        setImages3(prev =>
            prev.map(img =>
                img.id === id
                    ? { ...img, src: croppedImageUrl }
                    : img
            )
        );
    };



    return (
        <>
            <Box
                sx={{
                    position: isMobile ? "fixed" : "absolute",
                    left: isMobile ? 0 : "39%",
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
                        <IconButton
                            sx={editingButtonStyle}
                            onClick={openCropModal}
                            disabled={selectedImg3.length === 0}
                            title={selectedImg3.length === 0 ? "Select an image to crop" : "Crop Image"}
                        >
                            <Crop fontSize="large" />
                            Crop
                        </IconButton>

                        <IconButton sx={editingButtonStyle}>
                            <Adjust fontSize="large" />
                            Adjust
                        </IconButton>

                        <IconButton
                            sx={editingButtonStyle}
                            onClick={() => {
                                const lastSelected = selectedImg3[selectedImg3.length - 1];
                                if (lastSelected) {
                                    setActiveFilterImageId3(lastSelected);
                                    setImageFilter3(!imageFilter3);
                                }
                            }}
                            disabled={selectedImg3.length === 0}
                        >
                            <Flare fontSize="large" />
                            Effect
                        </IconButton>

                        {!isAdminEditor && (
                            <IconButton sx={editingButtonStyle} onClick={bringToFront} disabled={selectedImg3.length === 0}>
                                <KeyboardArrowUp fontSize="large" /> Front
                            </IconButton>
                        )}

                        {!isAdminEditor && (
                            <IconButton sx={editingButtonStyle} onClick={sendToBack} disabled={selectedImg3.length === 0}>
                                <KeyboardArrowDown fontSize="large" /> Back
                            </IconButton>
                        )}

                        <IconButton
                            sx={editingButtonStyle}
                            onClick={applySketch}
                            disabled={selectedImg3.length === 0}
                        >
                            <DrawOutlined fontSize="large" />
                            Sketch
                        </IconButton>

                        <IconButton
                            sx={editingButtonStyle}
                            onClick={deleteSelectedImages}
                            disabled={selectedImg3.length === 0}
                        >
                            <Delete />
                            Delete
                        </IconButton>
                    </Box>

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
                                "&:hover": {
                                    bgcolor: COLORS.green,
                                    opacity: 0.9,
                                },
                            }}
                            onClick={onClose}
                        >
                            <Check fontSize="large" />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {showCropModal && selectedImageForCrop && (
                <ImageCropModal
                    open={showCropModal}
                    imageSrc={selectedImageForCrop}
                    onClose={() => {
                        setShowCropModal(false);
                        setSelectedImageForCrop(null);
                    }}
                    onApply={(croppedImageSrc) => {
                        handleCropComplete(croppedImageSrc);
                        setShowCropModal(false);
                        setSelectedImageForCrop(null);
                    }}
                />
            )}
        </>
    );
};

export default ImageAdjustment3Popup;

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
