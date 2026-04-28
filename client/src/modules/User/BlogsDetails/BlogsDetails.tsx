import { useParams } from "react-router-dom";
import MainLayout from "../../../layout/MainLayout";
import { Box, CircularProgress, Typography } from "@mui/material";
import { COLORS } from "../../../constant/color";
import { useQuery } from "@tanstack/react-query";
import { fetchBlogByParam } from "../../../source/source";

const BlogsDetails = () => {
  const params = useParams<Record<string, string | undefined>>();
  const id = params.id || ""; // route: /blogs/:id

  const { data: blog, isLoading, isError } = useQuery({
    queryKey: ["blog", id],
    queryFn: () => fetchBlogByParam(id),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  if (!id) return <div>Invalid blog id</div>;

  if (isLoading)
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );

  if (isError || !blog)
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <Typography>Blog not found</Typography>
        </Box>
      </MainLayout>
    );

  return (
    <MainLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: { lg: "1340px", md: "100%", sm: "100%", xs: "100%" },
          justifyContent: "center",
          m: "auto",
          p: { lg: 3, md: 3, sm: 3, xs: 1 },
          mb: { md: 9, sm: 7, xs: 3 },
        }}
      >
        <Box sx={{ boxShadow: 4, bgcolor: COLORS.white, p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Typography
            sx={{
              fontSize: { md: "48px", sm: "38px", xs: "28px" },
              textAlign: "center",
              fontWeight: 700,
              color: COLORS.seconday,
              letterSpacing: 1,
            }}
          >
            {blog.title}
          </Typography>

          {/* Render the saved HTML from editor */}
          <Box
            sx={{
              fontSize: 18,
              lineHeight: 1.8,
              "& img": { maxWidth: "100%", height: "auto" },
              "& table": { width: "100%", borderCollapse: "collapse" },
            }}
            // WARNING: ensure you trust/sanitize HTML on save if needed
            dangerouslySetInnerHTML={{ __html: blog.content_html || "" }}
          />
        </Box>
      </Box>
    </MainLayout>
  );
};

export default BlogsDetails;