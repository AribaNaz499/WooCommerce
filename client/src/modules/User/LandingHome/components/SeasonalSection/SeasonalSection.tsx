import { Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query';
import { fetchAllCategoriesFromDB } from '../../../../../source/source';
import CategoryCard from '../../../../../components/CategoryCard/CategoryCard';
import { COLORS } from '../../../../../constant/color';

const SeasonalSection = () => {

    const { data: categories, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: fetchAllCategoriesFromDB,
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,
    });


    return (
        <Box>
            Seasonal

            {/* Categories */}
            <Box
                sx={{
                    display: "flex",
                    gap: { xs: 1, sm: 2, md: 3 },
                    alignItems: "center",
                    overflowX: "auto",
                    width: "100%",
                    p: { xs: 1, sm: 2, md: 3 },
                    justifyContent: { xs: "flex-start", md: "center" },
                    m: "auto",
                    "&::-webkit-scrollbar": {
                        height: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                        backgroundColor: "#f1f1f1",
                        borderRadius: "20px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: COLORS.primary,
                        borderRadius: "20px",
                    },
                }}
            >
                {
                    isLoading && (
                        <Box>Loading...</Box>
                    )
                }
                {categories?.map((cate) => (
                    <CategoryCard
                        key={cate.id}
                        id={cate.id}
                        poster={cate.image_base64}
                        title={cate.name}
                        borderColor={`${cate.borderColor}`}
                    />
                ))}
            </Box>
        </Box>
    )
}

export default SeasonalSection