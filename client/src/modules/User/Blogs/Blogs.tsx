import { Box, CircularProgress, Typography } from "@mui/material";
import MainLayout from "../../../layout/MainLayout";
import BlogCard from "./components/BlogCard/BlogCard";
import { useQuery } from "@tanstack/react-query";
import { fetchAllBlogs } from "../../../source/source";

const Blogs = () => {
  const { data: blogs = [], isLoading, isError } = useQuery({
    queryKey: ["blogs"],
    queryFn: fetchAllBlogs,
    staleTime: 60_000,
  });

  return (
    <MainLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "40px",
          width: { lg: "1340px", md: "100%", sm: "100%", xs: "100%" },
          justifyContent: "center",
          m: "auto",
          p: { lg: 3, md: 3, sm: 3, xs: 1 },
        }}
      >
        <Box sx={{ textAlign: "center", p: 2 }}>
          <Typography
            component="h1"
            sx={{
              fontSize: { md: 50, sm: 40, xs: 25 },
              fontWeight: 700,
              letterSpacing: 2,
              lineHeight: 1.15,
              display: 'flex', alignItems: 'center',
              textAlign: 'center',
              m: 'auto',
              justifyContent: 'center'
            }}
          >
            Blogs
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Typography color="error" sx={{ textAlign: "center" }}>
            Failed to load blogs.
          </Typography>
        ) : blogs.length === 0 ? (
          <Typography sx={{ textAlign: "center" }}>No blogs found.</Typography>
        ) : (
          <Box
            sx={{
              width: "100%",
              display: { md: "flex", sm: "flex", xs: "block" },
              gap: "25px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {blogs.map((blg) => (
              <Box key={blg.id} sx={{ mb: { md: 6, sm: 5, xs: 2 } }}>
                <BlogCard data={blg} />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
};

export default Blogs;