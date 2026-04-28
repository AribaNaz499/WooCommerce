import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { Backdrop, CircularProgress, IconButton } from "@mui/material";
import { Close, LogoutOutlined } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import LandingButton from "../LandingButton/LandingButton";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: 500, sm: 500, xs: '95%' },
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "8px",
  p: 3,
  //   height: 600,
  textAlign: "center",
  overflowY: "auto",
};

type ModalType = {
  open: boolean;
  onCloseModal: () => void;
  title?: string;
  btnText?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isDraftOpen?: boolean
  onCancel?: () => void;
};

const ConfirmModal = (props: ModalType) => {
  const { open, onCloseModal, title, btnText, icon, onClick, isDraftOpen, onCancel } = props || {};

  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      toast.success("Logout Successfully");
      navigate("/");
    } catch (err) {
      toast.error("NOT logout");
    } finally {
      setLoading(false);
      onCloseModal();
    }
  };

  return (
    <>
      {/* Fullscreen loader */}
      <Backdrop open={loading} sx={{ zIndex: 2000, color: "#fff" }}>
        <CircularProgress color="inherit" />
      </Backdrop>
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
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 50,
              border: "1px solid red",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              m: "auto",
              color: "red",
            }}
          >
            {icon ? icon : <LogoutOutlined sx={{ fontSize: 30 }} />}
          </Box>
          <Typography variant="body1" mt={2} mb={2}>
            {title || "Are you sure you want to logout?"}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: { md: "20px", sm: "20px", xs: '10px' },
              alignItems: "center",
              justifyContent: "center",
              m: "auto",
              width: "100%",
            }}
          >
            <LandingButton
              title="Cancel"
              personal
              variant="outlined"
              width="200px"
              onClick={() => {
                onCancel?.();
                if (isDraftOpen) {
                  navigate(-1);
                  return;
                }
                onCloseModal();
              }}
            />
            <LandingButton
              title={btnText || "Logout"}
              personal
              width="200px"
              onClick={onClick ? onClick : handleLogout}
            />
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default ConfirmModal;
