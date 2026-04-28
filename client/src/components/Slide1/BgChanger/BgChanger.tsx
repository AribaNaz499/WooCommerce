import { Box, IconButton, Typography } from "@mui/material";
import { Delete, WallpaperOutlined } from "@mui/icons-material";
import PopupWrapper from "../../PopupWrapper/PopupWrapper";
import { useSlide1 } from "../../../context/Slide1Context";
import { useRef, useState } from "react";
import { ChromePicker, type ColorResult } from "react-color";

interface BgChangerProps {
    onClose: () => void;
    activeIndex?: number;
}

const BgChanger = ({ onClose, activeIndex }: BgChangerProps) => {
    const { setBgColor1, setBgImage1 } = useSlide1();

    const bgImgInputRef = useRef<HTMLInputElement>(null);

    // local color for the picker UI
    const [pickerColor, setPickerColor] = useState<string>("#ffffff");

    const handlePickerChangeComplete = (color: ColorResult) => {
        const hex = color.hex;
        setPickerColor(hex);
        setBgImage1(null);   // color overrides image
        setBgColor1(hex);
    };

    const handlePickBgImage = () => {
        bgImgInputRef.current?.click();
    };

    const handleBgImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Please select an image.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const url = reader.result as string;
            setBgColor1(null); // image overrides color
            setBgImage1(url);
        };
        reader.readAsDataURL(file);
        e.target.value = ""; // allow re-pick of the same file
    };

    const handleClear = () => {
        setBgColor1(null);
        setBgImage1(null);
    };

    return (
        <PopupWrapper
            title="Background"
            onClose={onClose}
            sx={{
                width: { md: 320, sm: 300, xs: "95%" },
                left: { md: "22%", sm: "14%", xs: 0 },
                top: 0,
                mt: { md: 0, sm: 0, xs: 4 },
            }}
            activeIndex={activeIndex}
        >
            {/* COLOR PICKER (visible by default) */}
            <Box sx={{ mt: 1 }}>
                <ChromePicker
                    color={pickerColor}
                    onChangeComplete={handlePickerChangeComplete}
                    disableAlpha={true}
                    styles={{
                        default: {
                            picker: { boxShadow: "none", width: "95%", height: "100%" },
                        },
                    }}
                />
            </Box>

            {/* Spacing */}
            <Box sx={{ height: 12 }} />

            {/* IMAGE UPLOAD BOX */}
            <Box position={'relative'}>
                <Box
                    onClick={handlePickBgImage}
                    sx={{
                        border: "2px dashed rgba(0,0,0,0.2)",
                        borderRadius: 2,
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        height: 150,
                        cursor: "pointer",

                        "&:hover": { borderColor: "primary.main" },
                    }}
                >
                    <WallpaperOutlined />
                    <Typography sx={{ fontSize: 14, fontWeight: 'bold' }}>
                        choose image for background
                    </Typography>
                </Box>
                {/* Clear */}
                <IconButton onClick={handleClear} size="small" color="inherit" sx={{ position: 'absolute', top: -30, right: -10, zIndex: 99 }}>
                    <Delete color="error" />
                </IconButton>

                {/* Hidden file input */}
                <input
                    ref={bgImgInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleBgImageChange}
                />

            </Box>


        </PopupWrapper>
    );
};

export default BgChanger;
