import { Box, Typography, CircularProgress, IconButton } from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import useModal from "../../../hooks/useModal";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { Delete, Edit } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { ADMINS_DASHBOARD } from "../../../constant/route";
import { deleteBlog, fetchAllBlogs } from "../../../source/source";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

const OurBlogs = () => {
  const {
    open: isDeleteModal,
    openModal: openDeleteModal,
    closeModal: closeDeleteModal
  } = useModal();

  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // -------- React Query Fetch Blogs --------
  const {
    data: blogs = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["blogs"],
    queryFn: fetchAllBlogs,
    staleTime: 1000 * 60 * 2,
  });

  // log to console whenever data changes
  useEffect(() => {
    if (blogs?.length) {
      console.log("All blogs:", blogs);
    }
  }, [blogs]);

  const handleDelete = async () => {
    if (!selectedBlog) return;
    try {
      await deleteBlog(selectedBlog.id);
      toast.success("Blog deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      closeDeleteModal();
      setSelectedBlog(null);
    } catch (error: any) {
      toast.error(error?.message || "Delete failed");
    }
  };

  return (
    <DashboardLayout
      title="Our Blogs"
      addBtn="Add Blog"
      onClick={() => {
        // navigate to blank editor (create mode)
        navigate(ADMINS_DASHBOARD.ADMIN_BLOGS_EDITOR);
      }}
    >
      {isLoading && (
        <Box sx={{ width: "100%", textAlign: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Typography color="error" sx={{ textAlign: "center", mt: 5 }}>
          Failed to load blogs. Please try again.
        </Typography>
      )}

      {!isLoading && !isError && (
        <Box
          sx={{
            width: "100%",
            display: { md: "flex", sm: "flex", xs: "block" },
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          {blogs.map((blg: any) => (
            <Box
              key={blg.id}
              sx={{
                position: "relative",
                mb: { md: 6, sm: 5, xs: 2 },
                width: { md: 300, sm: 300, xs: '95%' },
                height: 250,
                cursor: "pointer",
                boxShadow: 2,
                borderRadius: 1,
                overflow: "hidden",
                "&:hover .actions": {
                  opacity: 1,
                  visibility: "visible",
                  transform: "translateY(0)",
                  bgcolor: "rgba(0,0,0,0.4)",
                  width: "100%",
                  height: "100%",
                },
              }}
            >
              <Box
                sx={{
                  width: "100%", height: "100%", bgcolor: "#f5f5f5",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 600
                }}
              >
                {blg.title}
              </Box>

              {/* Hover Actions */}
              <Box
                className="actions"
                sx={{
                  position: "absolute",
                  top: 0, right: 0,
                  display: "flex", flexDirection: "column",
                  gap: 1, p: 1, opacity: 0, visibility: "hidden",
                  transform: "translateY(-10px)", transition: "0.3s ease",
                }}
              >
                {/* Edit -> navigate to editor with id (EDIT MODE) */}
                <IconButton
                  sx={{ bgcolor: "#fff", borderRadius: "50%", p: 1, width: 30, height: 30 }}
                  onClick={() => {
                    navigate(`${ADMINS_DASHBOARD.ADMIN_BLOGS_EDITOR}?id=${blg.id}`);
                  }}
                >
                  <Edit />
                </IconButton>

                {/* Delete */}
                <IconButton
                  sx={{ bgcolor: "red", color: "white", borderRadius: "50%", p: 1, width: 30, height: 30 }}
                  onClick={() => {
                    setSelectedBlog(blg);
                    openDeleteModal();
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Confirm Delete */}
      {isDeleteModal && (
        <ConfirmModal
          open={isDeleteModal}
          onCloseModal={() => {
            closeDeleteModal();
            setSelectedBlog(null);
          }}
          title={`Are you sure you want to delete "${selectedBlog?.title}"?`}
          btnText="Delete"
          icon={<Delete />}
          onClick={handleDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default OurBlogs;