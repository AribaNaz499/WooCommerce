import { Box, Modal } from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: 1000, sm: 800, xs: "90%" },
  bgcolor: "background.paper",
  borderRadius: 3,
  //   p: 2,
};

type ProductsPopTypes = {
  open: boolean;
  onClose: () => void;
};

const SearchPopup = (props: ProductsPopTypes) => {
  const { open, onClose } = props;
  return (
    <div>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="keep-mounted-modal-title"
        aria-describedby="keep-mounted-modal-description"
        BackdropProps={{
          sx: {
            backgroundColor: "rgba(10, 10, 10, 0.34)",
            // height:{md:'auto',sm:'auto',xs:'500px'}
          },
        }}
      >
        <Box
          sx={{
            ...style,
            height: { md: 600, sm: "auto", xs: "500px" },
            overflowY: "auto",
          }}
        >
          nothing more
        </Box>
      </Modal>
    </div>
  );
};

export default SearchPopup;
