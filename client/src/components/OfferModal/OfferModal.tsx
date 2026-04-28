import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { COLORS } from "../../constant/color";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 800,
  height: 500,
  bgcolor: "background.paper",
  border:'none',
  boxShadow: 28,
  p: 1,
  borderRadius: 4,
};

type OfferModalType = {
  open: boolean;
  onClose: () => void;
};

const OfferModal = (props: OfferModalType) => {
  const { open, onClose } = props || {};

  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <IconButton
            onClick={onClose}
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              textAlign: "end",
              width: "100%",
              mx: "auto",
            }}
          >
            <Close fontSize="large" sx={{ color: COLORS.primary }} />
          </IconButton>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: 400,
              m: "auto",
            }}
          >
            <Typography id="modal-modal-title" variant="h1" color="brown">
              OFFERS
            </Typography>
            
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default OfferModal;
