import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { supabase } from "../../../../supabase/supabase";
import useModal from "../../../../hooks/useModal";
import BundleModal from "./BundleModal";
import ConfirmModal from "../../../../components/ConfirmModal/ConfirmModal";
import { Delete, MoreVert } from "@mui/icons-material";

type BundleRow = {
  id: string;
  name: string;
  image_base64: string | null;
  main_categories: string[],
  sub_categories: string[];
  sub_sub_categories: string[];
  created_at: string;
};

const fetchBundles = async (): Promise<BundleRow[]> => {
  const { data, error } = await supabase
    .from("bundles")
    .select("id,name,image_base64,main_categories,sub_categories,sub_sub_categories,created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    image_base64: r.image_base64 ?? null,
    main_categories: Array.isArray(r.main_categories) ? r.main_categories : [],
    sub_categories: Array.isArray(r.sub_categories) ? r.sub_categories : [],
    sub_sub_categories: Array.isArray(r.sub_sub_categories) ? r.sub_sub_categories : [],
    created_at: r.created_at,
  })) as BundleRow[];
};

const OurBundles: React.FC = () => {
  const qc = useQueryClient();

  const { open: isEditOpen, openModal: openEditModal, closeModal: closeEditModal } = useModal();
  const { open: isDeleteOpen, openModal: openDeleteModal, closeModal: closeDeleteModal } = useModal();

  const [selectedBundle, setSelectedBundle] = useState<BundleRow | null>(null);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const { data: bundles = [], isLoading, isError } = useQuery({
    queryKey: ["bundles:list"],
    queryFn: fetchBundles,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const deleteMutation = useMutation({
    mutationKey: ["bundles:delete"],
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bundles").delete().eq("id", id);
      if (error) throw error;
    },
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: ["bundles:list"] });
      const previous = qc.getQueryData<BundleRow[]>(["bundles:list"]) ?? [];
      qc.setQueryData<BundleRow[]>(["bundles:list"], (old = []) => old.filter((b) => b.id !== id));
      return { previous };
    },
    onError: (err, _id, ctx) => {
      console.error(err);
      toast.error("Failed to delete bundle.");
      if (ctx?.previous) qc.setQueryData(["bundles:list"], ctx.previous);
    },
    onSuccess: () => {
      toast.success("Bundle deleted!");
      closeDeleteModal();
      setSelectedBundle(null);
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ["bundles:list"] });
    },
  });

  const openMenu = (e: React.MouseEvent<HTMLElement>, b: BundleRow) => {
    setSelectedBundle(b);
    setAnchorEl(e.currentTarget);
  };

  const closeMenu = () => setAnchorEl(null);

  const onClickEdit = () => {
    closeMenu();
    openEditModal();
  };

  const onClickDelete = () => {
    closeMenu();
    openDeleteModal();
  };

  const confirmDelete = async () => {
    if (!selectedBundle?.id) return;
    await deleteMutation.mutateAsync(selectedBundle.id);
  };

  const editInitial = useMemo(() => {
    if (!selectedBundle) return null;
    return {
      id: selectedBundle.id,
      name: selectedBundle.name,
      image_base64: selectedBundle.image_base64,
      main_categories: selectedBundle.main_categories,
      sub_categories: selectedBundle.sub_categories,
      sub_sub_categories: selectedBundle.sub_sub_categories,
    };
  }, [selectedBundle]);

  if (!isLoading && !isError && bundles.length === 0) {
    return (
      <Box sx={{ minHeight: "45vh", display: "grid", placeItems: "center" }}>
        <Typography sx={{ fontWeight: 800, color: "text.secondary" }}>Bundle not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {isLoading && <Typography>Loading bundles...</Typography>}
      {isError && <Typography color="error">Failed to load bundles.</Typography>}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
          gap: 2,
        }}
      >
        {bundles.map((b) => (
          <Card
            key={b.id}
            sx={{ borderRadius: 2, overflow: "hidden", position: "relative", boxShadow: 4 }}
          >
            <CardMedia
              component="img"
              height="200"
              image={b.image_base64 || "/assets/images/winter.avif"}
              sx={{ objectFit: 'fill' }}
              alt={b.name}
            />

            <IconButton
              onClick={(e) => openMenu(e, b)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: "rgba(255,255,255,0.85)",
                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
              }}
            >
              <MoreVert />
            </IconButton>

            <Divider />

            <CardContent sx={{ pt: 1.5 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 20 }} noWrap>
                {b.name}
              </Typography>

              {/* Subcategories */}
              {/* <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                <Chip size="small" label={`Main: ${b.main_category || "-"}`} />
                {b.sub_categories?.slice(0, 3).map((s) => (
                  <Chip key={s} size="small" variant="outlined" label={s} />
                ))}
                {b.sub_categories.length > 3 && (
                  <Chip size="small" variant="outlined" label={`+${b.sub_categories.length - 3}`} />
                )}
              </Box> */}

              {/* Sub sub categories */}
              {/* <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {b.sub_sub_categories?.slice(0, 3).map((s) => (
                  <Chip key={s} size="small" color="primary" variant="outlined" label={s} />
                ))}
                {b.sub_sub_categories.length > 3 && (
                  <Chip
                    size="small"
                    color="primary"
                    variant="outlined"
                    label={`+${b.sub_sub_categories.length - 3}`}
                  />
                )}
              </Box> */}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Menu anchorEl={anchorEl} open={isMenuOpen} onClose={closeMenu}>
        <MenuItem onClick={onClickEdit}>Edit</MenuItem>
        <MenuItem onClick={onClickDelete} sx={{ color: "error.main" }}>
          Delete
        </MenuItem>
      </Menu>

      {isEditOpen && (
        <BundleModal
          key={editInitial?.id ?? "new"}
          open={isEditOpen}
          onCloseModal={() => {
            closeEditModal();
            setSelectedBundle(null);
          }}
          mode="edit"
          initial={editInitial}
          onSaved={async () => {
            await qc.invalidateQueries({ queryKey: ["bundles:list"] });
          }}
        />
      )}

      {isDeleteOpen && (
        <ConfirmModal
          open={isDeleteOpen}
          onCloseModal={closeDeleteModal}
          title={`Are you sure you want to delete "${selectedBundle?.name ?? ""}"?`}
          btnText={deleteMutation.isPending ? "Deleting..." : "Delete"}
          onClick={confirmDelete}
          icon={<Delete />}
        />
      )}
    </Box>
  );
};

export default OurBundles;
