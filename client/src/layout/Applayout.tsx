import { Box } from "@mui/material";
import Navbar from "./components/Navbar/Navbar";
import { useLocation } from "react-router-dom";
import { USER_ROUTES } from "../constant/route";

type Props = {
  children: React.ReactNode;
};

const Applayout = ({ children }: Props) => {

  const location = useLocation()

  return (
    <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      {location.pathname === USER_ROUTES.SUBSCRIPTION ? null : <Navbar />}
      <Box component="main" sx={{ flex: 1, minHeight: 0 }}>
        {children}
      </Box>
    </Box>
  );
};

export default Applayout;