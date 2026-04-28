// src/pages/EditorSlides/components/editor/SharedToolbar/SharedToolbar.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, MenuItem, Select, TextField, Portal } from "@mui/material";
import {
    CollectionsOutlined,
    TextFieldsOutlined,
    MoodOutlined,
    FormatBold,
    FormatItalic,
    Check,
} from "@mui/icons-material";
import type { EditorCanvasHandle } from "../EditorCanvas/EditorCanvas";
import { ADMINS_GOOGLE_FONTS, STICKERS_DATA } from "../../../../../constant/data";
import PopupWrapper from "../../../../../components/PopupWrapper/PopupWrapper";
import { COLORS } from "../../../../../constant/color";

type Props = { activeRef: React.RefObject<EditorCanvasHandle | null> };

const SharedToolbar: React.FC<Props> = ({ activeRef }) => {
    const [showEmojiPopup, setShowEmojiPopup] = useState(false);
    const [fontSize, setFontSize] = useState<number>(20);
    const [fontFamily, setFontFamily] = useState<string>("Arial");
    const [color, setColor] = useState<string>("#000000");

    // --- Fix 1: use a ref for the color input, no global id ---
    const colorInputRef = useRef<HTMLInputElement | null>(null);
    const openColor = () => colorInputRef.current?.click();

    // Stable memo of selected text (avoids weird effect deps on ref)
    const selectedText = useMemo(() => activeRef.current?.getSelectedText() ?? null, [
        activeRef.current?.getSelectedText?.(),
    ]);

    useEffect(() => {
        if (!selectedText) return;
        setFontSize(selectedText.fontSize ?? 20);
        setFontFamily(selectedText.fontFamily ?? "Arial");
        setColor(selectedText.color ?? "#000000");
    }, [selectedText?.id]); // re-sync when selection changes

    const canFormat = !!selectedText;

    return (
        <>
            <Box
                sx={{
                    position: "sticky",
                    top: 0,
                    width: 70,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 2,
                    bgcolor: "rgba(255,255,255,0.9)",
                    borderRadius: 2,
                    boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
                    backdropFilter: "blur(6px)",
                    zIndex: 2,
                }}
            >
                {/* Adders */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center" }}>
                    <IconButton onClick={() => activeRef.current?.addImage()}>
                        <CollectionsOutlined fontSize="large" />
                    </IconButton>
                    <IconButton onClick={() => activeRef.current?.addText()}>
                        <TextFieldsOutlined fontSize="large" />
                    </IconButton>
                    <IconButton onClick={() => setShowEmojiPopup(!showEmojiPopup)}>
                        <MoodOutlined fontSize="large" />
                    </IconButton>
                </Box>

                {/* Formatters */}
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        alignItems: "center",
                        width: "100%",
                        py: 1,
                        px: 1,
                        opacity: canFormat ? 1 : 0.4,
                        pointerEvents: canFormat ? "auto" : "none",
                    }}
                >
                    <IconButton onClick={() => activeRef.current?.toggleBold()}>
                        <FormatBold />
                    </IconButton>
                    <IconButton onClick={() => activeRef.current?.toggleItalic()}>
                        <FormatItalic />
                    </IconButton>

                    <TextField
                        type="number"
                        variant="standard"
                        value={fontSize}
                        onChange={(e) => {
                            const n = Number(e.target.value || 20);
                            setFontSize(n);
                            activeRef.current?.setFontSize(n);
                        }}
                        InputProps={{ disableUnderline: true }}
                        sx={{ width: 60, "& input": { textAlign: "center", fontSize: 14, fontWeight: 500 } }}
                    />

                    <Select
                        value={fontFamily}
                        onChange={(e) => {
                            const name = String(e.target.value);
                            setFontFamily(name);
                            activeRef.current?.setFontFamily(name);
                        }}
                        variant="standard"
                        inputProps={{ disableUnderline: true }}
                        sx={{
                            width: 60,
                            textAlign: "center",
                            fontSize: 12,
                            fontFamily,
                            "& .MuiInput-underline:before": { borderBottom: "none" },
                            "& .MuiInput-underline:after": { borderBottom: "none" },
                        }}
                    >
                        <MenuItem value="Arial" sx={{ fontFamily: "Arial" }}>
                            Arial
                        </MenuItem>
                        {ADMINS_GOOGLE_FONTS.map((font: string) => (
                            <MenuItem key={font} value={font} sx={{ fontFamily: font }}>
                                {font}
                            </MenuItem>
                        ))}
                    </Select>

                    {/* Color bubble */}
                    <Box
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: "50%",
                            bgcolor: color,
                            cursor: "pointer",
                            border: "2px solid #ccc",
                            position: "relative",
                        }}
                        onClick={openColor}
                    >
                        <input
                            ref={colorInputRef}
                            type="color"
                            value={color}
                            onChange={(e) => {
                                setColor(e.target.value);
                                activeRef.current?.setColor(e.target.value);
                            }}
                            // keep it truly hidden but clickable via ref
                            style={{ opacity: 0, position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
                            aria-hidden
                        />
                    </Box>
                </Box>

                <IconButton
                    sx={{ bgcolor: "green", color: "#fff", width: 50, height: 50, "&:hover": { bgcolor: "darkgreen" }, mb: 1 }}
                    onClick={() => activeRef.current?.clearSelection()}
                >
                    <Check />
                </IconButton>
            </Box>

            {/* Fix 2: render the popup in a Portal to avoid clipping by slick/overflow */}
            {showEmojiPopup && (
                <Portal container={document.body}>
                    <Box
                        sx={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 999,
                            pointerEvents: "none",
                        }}
                    >
                        <Box
                            sx={{
                                position: "fixed",
                                top: { md: 200 },
                                pointerEvents: "auto",
                            }}
                        >
                            <PopupWrapper
                                title="Choose Emoji"
                                open={showEmojiPopup}
                                onClose={() => setShowEmojiPopup(false)}
                                sx={{ height: "auto", width: 300, left: '20%' }}
                            >
                                <Box
                                    sx={{
                                        mt: 2,
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 1,
                                        overflowY: "auto",
                                        "&::-webkit-scrollbar": { height: "6px", width: "5px" },
                                        "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1", borderRadius: "20px" },
                                        "&::-webkit-scrollbar-thumb": { backgroundColor: COLORS.primary, borderRadius: "20px" },
                                        height: 500,
                                    }}
                                >
                                    {STICKERS_DATA.map((stick: any) => (
                                        <Box
                                            key={stick.id}
                                            onClick={() => {
                                                activeRef.current?.addSticker(stick.sticker);
                                            }}
                                            sx={{
                                                width: { md: "80px", sm: "70px", xs: "70px" },
                                                height: "70px",
                                                borderRadius: 2,
                                                bgcolor: "rgba(233, 232, 232, 1)",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                userSelect: "none",
                                                cursor: "pointer",
                                                "&:hover": { boxShadow: 3 },
                                            }}
                                        >
                                            <Box component={"img"} src={stick.sticker} sx={{ width: "100%", height: "auto" }} />
                                        </Box>
                                    ))}
                                </Box>
                            </PopupWrapper>
                        </Box>
                    </Box>
                </Portal>
            )}
        </>
    );
};

export default SharedToolbar;
