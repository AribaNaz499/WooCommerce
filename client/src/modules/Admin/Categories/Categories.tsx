import { useState } from "react";
import { Box, Pagination, CircularProgress } from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import CategoriesCard from "./components/CategoriesCard/CategoriesCard";
import useModal from "../../../hooks/useModal";
import CategoryModal from "./components/CategoryModal/CategoryModal";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAllCategoriesFromDB } from "../../../source/source";
import { useAdmin } from "../../../context/AdminContext";
import { supabase } from "../../../supabase/supabase";
import { Delete } from "@mui/icons-material";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 12;

export default function Categories() {
  const [page, setPage] = useState(1);

  // Add modal
  const { open: isAddOpen, openModal: openAdd, closeModal: closeAdd } = useModal();

  // Edit modal
  const { open: isEditOpen, openModal: openEdit, closeModal: closeEdit } = useModal();
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

  // Delete confirm
  const { open: isConfirmOpen, openModal: openConfirm, closeModal: closeConfirm } = useModal();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const {
    data: categories = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => fetchAllCategoriesFromDB(),
    enabled: isAdmin && !adminLoading,
    staleTime: 60_000,
  });

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedData = categories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(categories.length / ITEMS_PER_PAGE));

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setConfirmDeleteId(null);
      closeConfirm();
    },
    onError: () => toast.error("Failed to delete category"),
  });

  const handleEdit = (cat: any) => {
    setEditingCategory(cat);
    openEdit();
  };

  const handleDelete = (id: number) => {
    setConfirmDeleteId(id);
    openConfirm();
  };

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["categories"] });
    setPage(1);
  };

  if (adminLoading || isLoading) {
    return (
      <DashboardLayout title="Categories" addBtn="Add Category">
        <Box sx={{ width: "100%", py: 10, display: "flex", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (!isAdmin) {
    return (
      <DashboardLayout title="Categories">
        <p style={{ color: "red" }}>Unauthorized: admin access required.</p>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout title="Categories">
        <p style={{ color: "red" }}>Failed to load categories.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Categories" addBtn="Add Category" onClick={openAdd}>
      <Box sx={{ width: "100%", display: "flex", flexWrap: "wrap", gap: '6px' , m: 'auto',justifyContent: 'center' }}>
        {paginatedData.map((cate: any) => (
          <CategoriesCard
            key={cate.id}
            data={cate}
            onEdit={() => handleEdit(cate)}
            onDelete={() => handleDelete(cate.id)}
          />
        ))}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="secondary"
          size="large"
          sx={{ "& .MuiPaginationItem-root": { fontWeight: 600 } }}
        />
      </Box>

      {/* Add Modal */}
      {isAddOpen && (
        <CategoryModal
          open={isAddOpen}
          onCloseModal={() => {
            closeAdd();
          }}
          mode="add"
          onSaved={handleSaved}
        />
      )}

      {/* Edit Modal */}
      {isEditOpen && editingCategory && (
        <CategoryModal
          open={isEditOpen}
          onCloseModal={() => {
            closeEdit();
            setEditingCategory(null);
          }}
          mode="edit"
          initial={editingCategory}
          onSaved={handleSaved}
        />
      )}

      {/* Delete Confirm */}
      {isConfirmOpen && confirmDeleteId != null && (
        <ConfirmModal
          open={isConfirmOpen}
          onCloseModal={() => {
            closeConfirm();
            setConfirmDeleteId(null);
          }}
          title="Are you sure you want to delete this category?"
          icon={<Delete fontSize="large" />}
          btnText={deleteMutation.isPending ? "Deleting..." : "Delete"}
          onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
        />
      )}
    </DashboardLayout>
  );
}