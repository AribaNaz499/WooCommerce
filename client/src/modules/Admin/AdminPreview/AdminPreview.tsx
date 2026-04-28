import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Stack, Typography, ToggleButton, ToggleButtonGroup, Chip, Divider } from "@mui/material";

// Simple mockup image sets (replace with your assets)
const MUG_MODELS = [
    { key: "tea-cup", label: "Tea Cup", img: "/assets/images/bear.png" },
    { key: "bottle", label: "Bottle", img: "/mockups/mugs/bottle.png" },
];

const APPAREL_MODELS = [
    { key: "hoodie", label: "Hoodie", img: "/assets/images/bear.png" },
    { key: "tshirt", label: "T-Shirt", img: "/mockups/apparel/tshirt.png" },
    { key: "coat", label: "Coat", img: "/mockups/apparel/coat.png" },
];

type AnyEl = {
    id: string; x: number; y: number; width: number; height: number;
    type: "text" | "image";
    text?: string;
    bold?: boolean; italic?: boolean; color?: string; fontSize?: number; fontFamily?: string;
    src?: string;
};
type Slide = { id: number; label: string; elements: AnyEl[] };

type DesignPayload = {
    title: string;
    category: string;
    config: { mmWidth: number; mmHeight: number };
    slides: Slide[];
};

// Simple 3D tilt container
function TiltCard({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [style, setStyle] = useState<any>({});
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const onMove = (e: MouseEvent) => {
            const r = el.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            const rx = (py - 0.5) * 10; // tilt X
            const ry = (0.5 - px) * 12; // tilt Y
            setStyle({ transform: `rotateX(${rx}deg) rotateY(${ry}deg)` });
        };
        const onLeave = () => setStyle({ transform: "rotateX(0deg) rotateY(0deg)", transition: "transform .2s" });
        el.addEventListener("mousemove", onMove);
        el.addEventListener("mouseleave", onLeave);
        return () => {
            el.removeEventListener("mousemove", onMove);
            el.removeEventListener("mouseleave", onLeave);
        };
    }, []);
    return (
        <Box sx={{ perspective: 1200, width: "100%", display: "flex", justifyContent: "center" }}>
            <Box ref={ref} sx={{ transformStyle: "preserve-3d", transition: "transform .06s linear" }} style={style}>
                {children}
            </Box>
        </Box>
    );
}

// Projects a flat design plane on top of a product mock
function DesignProjection({
    slide,
    planeWidth,
    planeHeight,
}: {
    slide: Slide;
    planeWidth: number;
    planeHeight: number;
}) {
    return (
        <Box
            sx={{
                width: planeWidth,
                height: planeHeight,
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                overflow: "hidden",
                borderRadius: 1,
                // make design blend a bit with product
                mixBlendMode: "multiply",
            }}
        >
            {slide.elements.map((el) => {
                const common = {
                    key: el.id,
                    style: {
                        position: "absolute" as const,
                        left: el.x,
                        top: el.y,
                        width: el.width,
                        height: el.height,
                    },
                };
                if (el.type === "image" && el.src) {
                    return (
                        <Box {...common}>
                            <img src={el.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        </Box>
                    );
                }
                // text
                return (
                    <Box {...common}>
                        <Typography
                            sx={{
                                fontWeight: el.bold ? 700 : 400,
                                fontStyle: el.italic ? "italic" : "normal",
                                fontSize: el.fontSize ?? 18,
                                fontFamily: el.fontFamily ?? "Arial",
                                color: el.color ?? "#111",
                                textAlign: "center",
                                width: "100%",
                                height: "100%",
                                alignItems: "center",
                                justifyContent: "center",
                                display: "flex",
                            }}
                        >
                            {el.text}
                        </Typography>
                    </Box>
                );
            })}
        </Box>
    );
}

const AdminPreview = () => {
    const [data, setData] = useState<DesignPayload | null>(null);
    const [model, setModel] = useState<string>("");

    useEffect(() => {
        try {
            const raw = localStorage.getItem("designPreview");
            if (raw) setData(JSON.parse(raw));
        } catch (e) {
            console.error("Failed to read designPreview:", e);
        }
    }, []);

    const isMugs = useMemo(() => data?.category?.toLowerCase().includes("mug"), [data]);
    const isApparel = useMemo(() => {
        const c = data?.category?.toLowerCase() || "";
        return c.includes("apparel") || c.includes("hoodie") || c.includes("t-shirt") || c.includes("shirt") || c.includes("coat");
    }, [data]);

    useEffect(() => {
        if (!data) return;
        if (isMugs) setModel(MUG_MODELS[0].key);
        else if (isApparel) setModel(APPAREL_MODELS[0].key);
        else setModel("flat");
    }, [data, isMugs, isApparel]);

    if (!data) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography variant="h6">No preview found.</Typography>
                <Typography variant="body2">Click <b>Save</b> in the editor first.</Typography>
            </Box>
        );
    }

    const planeByModel = (key: string) => {
        // rough design areas (pixels) per mock image. Tune after you plug real assets.
        switch (key) {
            case "tea-cup": return { w: 420, h: 240 };
            case "bottle": return { w: 360, h: 520 };
            case "hoodie": return { w: 520, h: 520 };
            case "tshirt": return { w: 520, h: 520 };
            case "coat": return { w: 520, h: 560 };
            default: return { w: 640, h: 800 }; // flat
        }
    };

    const models = isMugs ? MUG_MODELS : isApparel ? APPAREL_MODELS : [];
    const activeModel = models.find((m) => m.key === model);

    return (
        <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">Admin Preview</Typography>
                <Chip label={data.category} />
            </Stack>

            {(isMugs || isApparel) ? (
                <>
                    <ToggleButtonGroup exclusive value={model} onChange={(_, v) => v && setModel(v)} size="small">
                        {models.map((m) => (
                            <ToggleButton key={m.key} value={m.key}>{m.label}</ToggleButton>
                        ))}
                    </ToggleButtonGroup>

                    <Divider sx={{ my: 1 }} />

                    {/* 3D card */}
                    <TiltCard>
                        <Box
                            sx={{
                                width: 720,
                                height: 540,
                                position: "relative",
                                borderRadius: 2,
                                boxShadow: 6,
                                background: "#f8f9fb",
                                overflow: "hidden",
                            }}
                        >
                            {activeModel?.img && (
                                <img
                                    src={activeModel.img}
                                    alt={activeModel.label}
                                    style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                                />
                            )}

                            {/* Project current slide onto product */}
                            <DesignProjection
                                slide={data.slides[0] /* admin first slide focus; optionally add slide switcher */}
                                planeWidth={planeByModel(model).w}
                                planeHeight={planeByModel(model).h}
                            />
                        </Box>
                    </TiltCard>
                </>
            ) : (
                // Flat preview for other categories
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 2 }}>
                    {data.slides.map((s) => (
                        <Box key={s.id} sx={{ p: 2, bgcolor: "white", borderRadius: 2, boxShadow: 3, position: "relative" }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>{s.label}</Typography>
                            <Box sx={{ position: "relative", width: 640, maxWidth: "100%", height: 800, bgcolor: "#fafafa", borderRadius: 1, mx: "auto" }}>
                                <DesignProjection slide={s} planeWidth={640} planeHeight={800} />
                            </Box>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
}


export default AdminPreview