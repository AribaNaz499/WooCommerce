import { Box } from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import PurposeChart from "./components/PurposeChart/PurposeChart";
import UsersChart from "./components/UsersChart/UsersChart";

const Reports = () => {
  return <DashboardLayout title="Analytics & Reports">
    <Box sx={{display:'flex',gap:2,flexWrap:'wrap'}}>
    <UsersChart />
    <PurposeChart />
    </Box>
  </DashboardLayout>;
};

export default Reports;
