import { useMemo, useState } from "react";
import { Box, CircularProgress, Pagination, Typography } from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import useModal from "../../../hooks/useModal";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import CustomerModal from "./components/CustomerModal/CustomerModal";
import CustomerCard from "./components/CustomerCard/CustomerCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    deleteUserById,
    fetchAllUsersFromDB
} from "../../../source/source";
import { Delete } from "@mui/icons-material";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 12;

const Customers = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    const {
        open: isViewOpen,
        openModal: openViewModal,
        closeModal: closeViewModal,
    } = useModal();
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    const {
        open: isDeleteOpen,
        openModal: openDeleteModal,
        closeModal: closeDeleteModal,
    } = useModal();

    const { data: users = [], isLoading, isError } = useQuery<any[]>({
        queryKey: ["users", "authenticated"],
        queryFn: fetchAllUsersFromDB,
        staleTime: 60_000,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number | string) => deleteUserById(id),
        onSuccess: (id) => {
            toast.success("User deleted");
            queryClient.setQueryData<any[]>(["users", "authenticated"], (old) =>
                old ? old.filter((u) => u.id !== id) : []
            );
            closeDeleteModal();
            setSelectedUser(null);
        },
        onError: (e: any) => toast.error(e?.message ?? "Failed to delete user"),
    });

    const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const paginated = useMemo(
        () => users.slice(startIndex, startIndex + ITEMS_PER_PAGE),
        [users, startIndex]
    );

    const handleView = (u: any) => {
        setSelectedUser(u);
        openViewModal();
    };

    const handleDeleteAsk = (u: any) => {
        setSelectedUser(u);
        openDeleteModal();
    };

    return (
        <DashboardLayout title="Customers">
            {isLoading && (
                <Box sx={{ width: "100%", py: 8, display: "flex", justifyContent: "center" }}>
                    <CircularProgress />
                </Box>
            )}
            {isError && (
                <Typography color="error" sx={{ textAlign: "center", mt: 5 }}>
                    Failed to load users.
                </Typography>
            )}

            {!isLoading && !isError && (
                <>
                    <Box sx={{ width: "100%", display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {paginated.map((u) => (
                            <CustomerCard
                                key={String(u.id)}
                                user={u}
                                onView={() => handleView(u)}
                                onDelete={() => handleDeleteAsk(u)}
                            />
                        ))}
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_, v) => setPage(v)}
                            color="secondary"
                            size="large"
                            sx={{ "& .MuiPaginationItem-root": { fontWeight: 600 } }}
                        />
                    </Box>
                </>
            )}

            {isViewOpen && selectedUser && (
                <CustomerModal open={isViewOpen} onClose={closeViewModal} user={selectedUser} />
            )}

            {isDeleteOpen && selectedUser && (
                <ConfirmModal
                    open={isDeleteOpen}
                    onCloseModal={() => {
                        closeDeleteModal();
                        setSelectedUser(null);
                    }}
                    title={`Delete user "${selectedUser?.name || selectedUser?.full_name || selectedUser?.display_name || selectedUser?.email || "User"}"?`}
                    icon={<Delete />}
                    btnText={deleteMutation.isPending ? "Deleting..." : "Delete"}
                    onClick={() => deleteMutation.mutate(selectedUser.id)}
                />
            )}
        </DashboardLayout>
    );
};

export default Customers;
