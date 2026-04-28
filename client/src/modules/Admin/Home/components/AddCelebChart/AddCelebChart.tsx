import { Box, Card, Typography, Stack } from "@mui/material";
import PiChart from "./PiChart";
import { useEffect, useState } from "react";
import { fetchOrderCount } from "../../../../../source/source";

type Props = {
  orderCount?: number;
};

const AddCelebChart = ({ orderCount: orderCountProp }: Props) => {

  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (typeof orderCountProp === "number") {
      setOrderCount(orderCountProp);
      return;
    }
    const loadOrders = async () => {
      const count: any = await fetchOrderCount();
      setOrderCount(count);
    };
    loadOrders();
  }, [orderCountProp]);

  return (
    <Card
      sx={{
        p: 2,
        width: { md: '49%', sm: '100%', xs: '100%' },
        borderRadius: 4,
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 14px 30px rgba(5,10,36,0.08)",
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ color: "#000000" }}>
          Orders
        </Typography>
        <Typography variant="h6" fontWeight="bold" sx={{ color: "#000000" }}>
          {orderCount.toLocaleString()}
        </Typography>
      </Stack>

      {/* Legend */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          bgcolor: "#fff",
          borderRadius: 2,
          p: 1.5,
          boxShadow: "0 10px 24px rgba(5,10,36,0.08)",
          mb: 3,
        }}
      >
        {[
          { color: "#56BECC", label: "Active" },
          { color: "#8D6DA1", label: "Completed" },
          { color: "#6EBA9E", label: "Pending" },
        ].map((item) => (
          <Stack direction="row" alignItems="center" gap={1} key={item.label}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: item.color,
              }}
            />
            <Typography variant="caption" sx={{ color: "#000000", opacity: 0.7 }}>
              {item.label}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {/* Chart Area */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box sx={{ width: "100%", display: "flex", justifyContent: "center", alignItems: 'center', m: 'auto' }}>
          <PiChart totalOrder={orderCount.toLocaleString()} />
        </Box>
      </Stack>
    </Card>
  );
};

export default AddCelebChart;
