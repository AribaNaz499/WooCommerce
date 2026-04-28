import { Adjust, Check, Crop, Delete, DrawOutlined, Flare, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { Box, IconButton, useMediaQuery } from "@mui/material";
import { useState } from "react";
import { COLORS } from "../../../constant/color";
import { useSlide2 } from "../../../context/Slide2Context";
import { convertToRealisticSketch } from "../../../source/SketchEffect";
import ImageCropModal from "../../../components/ImageCropModal/ImageCropModal";

interface ImageAdjustmentProps {
    togglePopup?: any,
    onClose: () => void;
    activeIndex?: number;
    isAdminEditor?: boolean
}

const ImageAdjustment = (props: ImageAdjustmentProps) => {
    const { onClose, isAdminEditor } = props;
    const isMobile = useMediaQuery("(max-width:600px)");
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImageForCrop, setSelectedImageForCrop] = useState<string | null>(null);

    const { 
        setImageFilter, 
        imageFilter, 
        setDraggableImages, 
        selectedImg, 
        setImages, 
        setSelectedImage, 
        setActiveFilterImageId, 
        draggableImages 
    } = useSlide2();

    const deleteSelectedImages = () => {
        if (selectedImg.length === 0) return;

        setDraggableImages(prev =>
            prev.filter(img => !selectedImg.includes(img.id))
        );

        setImages(prev =>
            prev.filter(img => !selectedImg.includes(img.id))
        );

        setSelectedImage([]);
    };

    const bringToFront = () => {
        setDraggableImages(prev => {
            const maxZ = Math.max(...prev.map(i => i.zIndex || 0), 0);
            return prev.map(img =>
                selectedImg.includes(img.id)
                    ? { ...img, zIndex: maxZ + 1 }
                    : img
            );
        });
    };

    const sendToBack = () => {
        setDraggableImages(prev => {
            const minZ = Math.min(...prev.map(i => i.zIndex || 0), 0);
            return prev.map(img =>
                selectedImg.includes(img.id)
                    ? { ...img, zIndex: minZ - 1 }
                    : img
            );
        });
    };

    const applySketch = async () => {
        if (selectedImg.length === 0) return;
        const id = selectedImg[selectedImg.length - 1];
        const target = draggableImages.find(img => img.id === id);
        if (!target) return;
        const sketchUrl = await convertToRealisticSketch(target?.src);
        setDraggableImages(prev =>
            prev.map(img =>
                img.id === id ? { ...img, src: sketchUrl } : img
            )
        );
    };

    const openCropModal = () => {
        if (selectedImg.length === 0) {
            return;
        }
        const id = selectedImg[selectedImg.length - 1];
        const target = draggableImages.find(img => img.id === id);
        if (target?.src) {
            setSelectedImageForCrop(target.src);
            setShowCropModal(true);
        }
    };

    const handleCropComplete = (croppedImageUrl: string) => {
        if (selectedImg.length === 0) return;
        const id = selectedImg[selectedImg.length - 1];
        
        setDraggableImages(prev =>
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

        setImages(prev =>
            prev.map(img =>
                img.id === id 
                    ? { ...img, src: croppedImageUrl }
                    : img
            )
        );
    };

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

    return (
        <>
            <Box
                sx={{
                    position: isMobile ? "fixed" : "absolute",
                    left: isMobile ? 0 : "33%",
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
                            disabled={selectedImg.length === 0}
                            title={selectedImg.length === 0 ? "Select an image to crop" : "Crop Image"}
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
                                const lastSelected = selectedImg[selectedImg.length - 1];
                                if (lastSelected) {
                                    setActiveFilterImageId(lastSelected);
                                    setImageFilter(!imageFilter);
                                }
                            }}
                            disabled={selectedImg.length === 0}
                        >
                            <Flare fontSize="large" />
                            Effect
                        </IconButton>

                        {!isAdminEditor && (
                            <IconButton sx={editingButtonStyle} onClick={bringToFront} disabled={selectedImg.length === 0}>
                                <KeyboardArrowUp fontSize="large" /> Front
                            </IconButton>
                        )}

                        {!isAdminEditor && (
                            <IconButton sx={editingButtonStyle} onClick={sendToBack} disabled={selectedImg.length === 0}>
                                <KeyboardArrowDown fontSize="large" /> Back
                            </IconButton>
                        )}

                        <IconButton 
                            sx={editingButtonStyle} 
                            onClick={applySketch}
                            disabled={selectedImg.length === 0}
                        >
                            <DrawOutlined fontSize="large" />
                            Sketch
                        </IconButton>

                        <IconButton 
                            sx={editingButtonStyle} 
                            onClick={deleteSelectedImages}
                            disabled={selectedImg.length === 0}
                        >
                            <Delete />
                            Delete
                        </IconButton>
                    </Box>

                    <Box sx={{ p: isMobile ? 0 : 1, display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
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
                    // aspect is optional now, so we can remove it or keep it
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

export default ImageAdjustment;