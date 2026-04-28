// File: src/pages/dashboard/categories/components/CategoriesCard/CategoriesCard.tsx
import { Delete, Edit } from "@mui/icons-material";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { COLORS } from "../../../../../constant/color";

type Category = {
    id: number;
    name: string;
    image_base64?: string;
    subcategories?: string[];
};

type Props = {
    data: Category;
    onEdit?: (cat: Category) => void;       // open edit modal
    onDelete?: (id: number) => void;        // open confirm modal
};

const CategoriesCard = ({ data, onEdit, onDelete }: Props) => {
    return (
        <Box p={1} sx={{ width: { md: 330, sm: 330, xs: '95%' } }}>
            <Box
                sx={{
                    position: "relative",
                    width: "100%",
                    height: 230,
                    borderRadius: 1,
                    overflow: "hidden",
                    cursor: "pointer",
                    "&:hover .overlay": { opacity: 1, transform: "translateY(0)" },
                    "&:hover .image": { transform: "scale(1.05)" },
                }}
            >
                {/* Image */}
                <Box
                    component="img"
                    className="image"
                    src={data?.image_base64 || "/assets/images/placeholder.jpg"}
                    alt={data?.name || "Category"}
                    sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        borderRadius: 1,
                        transition: "transform 0.4s ease",
                    }}
                />

                {/* Overlay (Edit/Delete) */}
                <Box
                    className="overlay"
                    sx={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0, 0, 0, 0.6)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 2,
                        opacity: 0,
                        transform: "translateY(40px)",
                        transition: "all 0.4s ease",
                    }}
                >
                    <Tooltip title="Edit" placement="top">
                        <IconButton
                            onClick={() => onEdit?.(data)}
                            sx={{
                                bgcolor: "#fff",
                                color: COLORS.primary,
                                "&:hover": { bgcolor: COLORS.black, color: "#fff" },
                            }}
                        >
                            <Edit />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete" placement="top">
                        <IconButton
                            onClick={() => data?.id != null && onDelete?.(data.id)}
                            sx={{
                                bgcolor: "#fff",
                                color: "red",
                                "&:hover": { bgcolor: COLORS.black, color: "#fff" },
                            }}
                        >
                            <Delete />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box mt={1}>
                <Typography sx={{ fontWeight: 600, fontSize: 18 }}>
                    {data?.name}
                </Typography>
            </Box>
        </Box>
    );
};

export default CategoriesCard;
