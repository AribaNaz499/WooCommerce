import React, { useEffect, useState } from "react";
import { Box, Divider, Modal, TextField, MenuItem } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { supabase } from "../../../../supabase/supabase";
import LandingButton from "../../../../components/LandingButton/LandingButton";

type ActiveTab = "cards" | "templates";

type PremiumItem = {
  source: ActiveTab;
  id: number | string;
  title: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  image: string;
  access: "free" | "pro";
};

type Props = {
  open: boolean;
  onClose: () => void;
  item: PremiumItem;
  onUpdated?: (next: PremiumItem) => void;
};

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "95%", sm: 720, md: 900 },
  maxWidth: "1100px",
  maxHeight: "88vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 2,
  overflow: "hidden",
};

const PremiumCardModal: React.FC<Props> = ({ open, onClose, item, onUpdated }) => {
  const qc = useQueryClient();

  const [access, setAccess] = useState<"free" | "pro">(item.access);

  useEffect(() => setAccess(item.access), [item]);

  const updateMutation = useMutation({
    mutationKey: ["premium:update-accessplan"],
    mutationFn: async (payload: { source: ActiveTab; id: number | string; access: "free" | "pro" }) => {
      const table = payload.source === "cards" ? "cards" : "templetDesign";

      const { error } = await supabase
        .from(table)
        .update({ accessplan: payload.access }) // ✅ only free/pro
        .eq("id", payload.id);

      if (error) throw error;

      return payload;
    },
    onSuccess: async (p) => {
      toast.success("Access updated!");

      // ✅ invalidate same keys you use in PremiumCards
      await qc.invalidateQueries({ queryKey: ["cards:light"] });
      await qc.invalidateQueries({ queryKey: ["templates:light"] });

      onUpdated?.({ ...item, access: p.access });
      onClose();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Failed to update access.");
    },
  });

  const onSave = async () => {
    await updateMutation.mutateAsync({
      source: item.source,
      id: item.id,
      access,
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
            height: { xs: "auto", md: "calc(88vh - 58px)" },
          }}
        >
          <Box sx={{ bgcolor: "#000", position: "relative", minHeight: { xs: 260, md: "100%" } }}>
            <Box
              component="img"
              src={item.image}
              alt={item.title}
              sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </Box>

          <Box sx={{ p: 2, overflowY: "auto" }}>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <TextField label="Title" value={item.title} fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Category" value={item.category || "-"} fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Subcategory" value={item.subCategory || "-"} fullWidth InputProps={{ readOnly: true }} />
              <TextField label="Sub-Subcategory" value={item.subSubCategory || "-"} fullWidth InputProps={{ readOnly: true }} />

              <Divider sx={{ my: 0.5 }} />

              <TextField
                select
                label="Access Plan"
                value={access}
                onChange={(e) => setAccess((e.target.value as "free" | "pro") ?? "free")}
                fullWidth
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mt: 2 }}>
              <LandingButton title="Cancel" variant="outlined" width="160px" personal onClick={onClose} />
              <LandingButton
                title={updateMutation.isPending ? "Saving..." : "Save"}
                width="160px"
                personal
                onClick={onSave}
                loading={updateMutation.isPending}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default PremiumCardModal;
