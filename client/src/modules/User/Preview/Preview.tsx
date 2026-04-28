import { Box } from "@mui/material";
import Applayout from "../../../layout/Applayout";
import PreviewBookCard from "./component/PreviewCards/PreviewCards";

const Preview = () => {
  return (
    <Applayout>
      <Box sx={{ height: "80vh" }}>
        <PreviewBookCard />
      </Box>
    </Applayout>
  );
};

export default Preview;