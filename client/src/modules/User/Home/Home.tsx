
import WishCard from "../../../components/WishCard/WishCard";
import Applayout from "../../../layout/Applayout";
import { Box } from "@mui/material";

const Home = () => {

  return (
    <Applayout>
      <Box sx={{ height: "100%", minHeight: 0 }}>
        <WishCard />
      </Box>
    </Applayout>
  );
};

export default Home;