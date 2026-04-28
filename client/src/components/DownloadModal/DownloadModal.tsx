import { Box, Button, Modal, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";

type ModalType = {
  open: boolean;
  onCloseModal: () => void;
};
const DownloadModal = (props: ModalType) => {
  const { open, onCloseModal } = props;

  const {register,handleSubmit} = useForm()

  const handleSendToFileEmail= (data:any)=>{
       console.log(data,'--')

       setTimeout(() => {
           onCloseModal()
       }, 1000);
  }

  return (
    <Modal
      open={open}
      onClose={onCloseModal}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Typography sx={{ fontSize: "35px", fontWeight: "bold" }}>
          Download Card
        </Typography>
        <Typography color="red" textAlign={'start'}>Please Verify your Email</Typography>
        <Box component={"form"} onSubmit={handleSubmit(handleSendToFileEmail)}>
          <TextField
            placeholder="Enter your Email"
            type="email"
            fullWidth
            required
            {...register('userEmail')}
          />

          <Box
            sx={{
              display: "flex",
              gap: "20px",
              justifyContent: "center",
              m: "auto",
              mt: 3,
            }}
          >
            <Button variant="outlined" onClick={onCloseModal}>Cancel</Button>
            <Button variant="contained" type="submit" >Send File to Email</Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default DownloadModal;

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
  textAlign: "center",
  overflowY: "auto",
};
