import { Box } from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import TotalProductChart from "./components/TotalProductChart/TotalProductChart";
import OrderChart from "./components/OrderChart/OrderChart";
import VisitorMiniChart from "./components/VisitorBarChart/VisitorBarChart";
import UsersChart from "../Reports/components/UsersChart/UsersChart";
import AddCelebChart from "./components/AddCelebChart/AddCelebChart";
import { useEffect, useState } from "react";
import { fetchAllOrders } from "../../../source/source";
import TableList from "../../../components/TableList/TableList";


const DashboardHome = () => {

  const [orders, setOrders] = useState([]);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const result = await fetchAllOrders();
        setOrderCount(Array.isArray(result) ? result.length : 0);

        const formatted: any = result.map((item) => ({
          id: item.id,
          sessionId: item.session_id.slice(0, 20),
          name: item.user_name,
          email: item.user_email,
          date: new Date(item.created_at).toLocaleString(),
          cardSize: item.card_size,
          paymentStatus: item.status === "paid" ? "Paid" : "Pending",
          orderStatus: "Completed",
          total: "£" + item.amount,
        }));

        setOrders(formatted);
      } catch (err) {
        console.error(err);
      }
    };

    loadOrders();
  }, []);


  return (
    <DashboardLayout title="Dashboard Overview">
      <Box
        sx={{
          display: { md: "flex", sm: "flex", xs: "block" },
          flexWrap: "wrap",
          gap: 3,
          mt: 3,
          width: "100%",
        }}
      >
        <TotalProductChart />
        <OrderChart orderCount={orderCount} />
        <VisitorMiniChart />
        <Box sx={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <UsersChart />
          <AddCelebChart orderCount={orderCount} />
        </Box>
        {/* <SimpleAreaChart /> */}
      </Box>
      <br />
      <TableList
        data={orders}
        heading={[
          "OrdersId",
          "Name",
          'Email',
          "Payment_Status",
          "Date/Time",
          "Order_Status",
          "Total",
        ]}
      />

    </DashboardLayout>
  );
};

export default DashboardHome;
