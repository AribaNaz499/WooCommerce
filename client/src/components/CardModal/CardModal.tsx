import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { IconButton, TextField, Button, CircularProgress } from "@mui/material";
import { useForm } from "react-hook-form";
import { Close } from "@mui/icons-material";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "8px",
  p: 2,
  height: 600,
  textAlign: "center",
  overflowY: "auto",
};

type ModalType = {
  open: boolean;
  onCloseModal: () => void;
};

const CardModal = (props: ModalType) => {
  const { open, onCloseModal } = props || {};

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm({ mode: "onChange" });

  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = () => {
    setLoading(true);
    setTimeout(() => {
      reset();
      setPreview(null);
      setLoading(false);
      onCloseModal();
    }, 3000); // 3s delay
  };

  // upload Image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCloseModal}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        {/* Close Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <IconButton onClick={onCloseModal}>
            <Close />
          </IconButton>
        </Box>

        {/* Header */}
        <Typography
          sx={{ textAlign: "center", fontWeight: "bold", fontSize: "25px" }}
        >
          Add Cards
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Fill in the details below and upload an image.
        </Typography>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handleSubmit(handleSubmitForm)}
          mt={3}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            placeholder="Function Name"
            {...register("Function", { required: true })}
            error={!!errors.Function}
            helperText={errors.Function && "Function is required"}
            fullWidth
          />
          <TextField
            placeholder="Enter FullName"
            {...register("FullName", { required: true })}
            error={!!errors.FullName}
            helperText={errors.FullName && "FullName is required"}
            fullWidth
          />
          <TextField
            placeholder="Description"
            {...register("Description", { required: true })}
            error={!!errors.Description}
            helperText={errors.Description && "Description is required"}
            fullWidth
            multiline
            rows={3}
          />

          {/* Upload File */}
          <Button variant="outlined" component="label">
            {preview ? "Upload Another image" : "Upload Image"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageUpload}
            />
          </Button>

          {/* Preview */}
          {preview && (
            <Box mt={1}>
              <img
                src={preview}
                alt="preview"
                style={{ width: "100%", borderRadius: 8,height:300,objectFit:'cover' }}
              />
            </Box>
          )}

          {/* Submit */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isValid || loading} // disable if invalid or loading
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? "Processing..." : "ADD"}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CardModal;
