import { Box, Button, CircularProgress } from "@mui/material";

type ButtonTypes = {
  title: string;
  onClick?: () => void;
  width?: string;
  variant?: "text" | "outlined" | "contained";
  loading?: boolean;
};

const CustomButton = (props: ButtonTypes) => {
  const { title, onClick, width, variant, loading } = props || {};
  
  return (
    <Box>
      <Button
        variant={variant ? variant : "contained"}
        onClick={onClick}
        disabled={loading}
        sx={{
          p: 1.3,
          bgcolor: variant ? "transparent" : "#004099",
          borderRadius: 3,
          fontWeight: 600,
          color: variant ? "#004099" : "white",
          textTransform: "none",
          px: 2,
          opacity: 0.8,
          width: width ? width : "auto",
        }}
      >
        {loading ? (
          <CircularProgress
            size={20}
            sx={{ color: variant ? "#004099" : "#212121" }}
          />
        ) : (
          title
        )}
      </Button>
    </Box>
  );
};

export default CustomButton;
