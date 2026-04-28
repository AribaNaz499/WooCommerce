import { Box } from "@mui/material";
import AdminSigninForm from "./AdminSigninForm/AdminSigninForm";

const AdminSignIn = () => {
  return (
    <Box
      sx={{
        height: "100vh",
        width: "100%",
        display: 'flex',
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "#999999ff",
      }}
    >
      <Box
        component={"img"}
        src="/assets/images/animated-banner.jpg"
        sx={{
          width: "100%",
          height: "100vh",
          objectFit: "cover",
          filter: 'brightness(50%)'
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: { md: "100vh", sm: "100vh", xs: "auto" },
          width: { md: "50%", sm: "50%", xs: "95%" },
        }}
      >
        <AdminSigninForm />
      </Box>
    </Box>
  );
};

export default AdminSignIn;
