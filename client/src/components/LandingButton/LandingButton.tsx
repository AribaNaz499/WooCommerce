import { Box, Button, CircularProgress } from "@mui/material";
import { COLORS } from "../../constant/color";

type ButtonTypes = {
  title: string;
  onClick?: () => void;
  width?: string;
  variant?: "text" | "outlined" | "contained";
  loading?: boolean;
  personal?: boolean;
  bgblack?: boolean;
  type?: 'button' | 'submit' | 'reset';
  active?: boolean,
  advertisement?: boolean
};

const LandingButton = (props: ButtonTypes) => {
  const { title, personal, onClick, width, variant, loading, bgblack, type, active, advertisement } =
    props || {};

  return (
    <Box>
      <Button
        variant={variant ? variant : "contained"}
        onClick={onClick}
        disabled={loading}
        type={type}
        sx={{
          p: 1.3,
          bgcolor: variant
            ? "transparent"
            : bgblack
              ? COLORS.white : advertisement ? COLORS.white : active ? COLORS.primary
                : COLORS.black,
          borderRadius: personal ? 1 : "3px",
          fontWeight: 600,
          mb: { md: 0, sm: 0, xs: 1 },
          color: variant || bgblack || advertisement ? COLORS.black : COLORS.white,
          textTransform: "none",
          px: 2,
          opacity: 0.8,
          height: { md: personal ? "50px" : "40px", sm: "40px", xs: "40px" },
          width: { md: width ? width : "auto", sm: "auto", xs: "100%" },
          border: variant ? `1px solid ${COLORS.primary}` : 0,
          "&:hover": {
            bgcolor: bgblack ? COLORS.primary : variant || advertisement ? "transparent" : COLORS.primary,
          },
        }}
      >
        {loading ? (
          <CircularProgress
            size={20}
            sx={{ color: variant ? COLORS.primary : "#212121" }}
          />
        ) : (
          title
        )}
      </Button>
    </Box>
  );
};

export default LandingButton;
