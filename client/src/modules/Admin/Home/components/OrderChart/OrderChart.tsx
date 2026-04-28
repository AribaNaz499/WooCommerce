import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";
import { Box, Typography } from "@mui/material";
import { COLORS } from "../../../../../constant/color";
import { useEffect, useState } from "react";
import { fetchOrderCount } from "../../../../../source/source";

const orderData = [
  { name: "M", value: 200 },
  { name: "T", value: 800 },
  { name: "W", value: 1000 },
  { name: "Th", value: 2500 },
  { name: "F", value: 2000 },
  { name: "S", value: 3000 },
  { name: "Su", value: 3300 },
];

// --- Chart Helper Component (Recharts logic remains the same) ---
const MinimalGradientAreaChart = ({
  data,
  colorId,
  colorStart,
  colorEnd,
  strokeColor,
}: any) => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
      <defs>
        <linearGradient id={colorId} x1="0" y1="0" x2="0" y2="1">
          {/* Defines the gradient fill for the area below the line */}
          <stop offset="0%" stopColor={colorStart} stopOpacity={0.6} />
          <stop offset="100%" stopColor={colorEnd} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <XAxis
        dataKey="name"
        tickLine={false}
        axisLine={false}
        tick={{ stroke: "rgba(0,0,0,0.3)", fontSize: 10 }}
        // Hide actual text labels as per the original design (only showing subtle vertical ticks)
        tickFormatter={() => ""}
      />
      <Area
        type="monotone" // Creates the smooth curve
        dataKey="value"
        stroke={strokeColor} // The color of the line itself
        strokeWidth={3}
        fill={`url(#${colorId})`} // Apply the gradient fill
        dot={false}
      />
    </AreaChart>
  </ResponsiveContainer>
);

// --- Order Chart (Purple/Violet Gradient Card) ---
type Props = {
  orderCount?: number;
};

const OrderChart = ({ orderCount: orderCountProp }: Props) => {

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
    <Box sx={{ flex: "1 1 300px", width: '100%' }}>
      <Box
        sx={{
          position: "relative",
          p: 3,
          color: COLORS.black,
          height: { md: 200, sm: 200, xs: 180 },
          boxShadow: "0 14px 30px rgba(5,10,36,0.08)",
          borderRadius: 4,
          mb: { md: 0, sm: 0, xs: 2 },
          border: "1px solid rgba(0,0,0,0.06)",
          background: "#ffffff",
          overflow: "hidden",
        }}
      >
        {/* The minimal chart positioned absolutely behind the text/data */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            minWidth: 1,
            minHeight: 1,
            opacity: 0.7,
          }}
        >
          <MinimalGradientAreaChart
            data={orderData}
            colorId="colorOrder"
            colorStart="rgba(141,109,161,0.4)"
            colorEnd="rgba(141,109,161,0.05)"
            strokeColor={COLORS.seconday}
          />
        </Box>

        {/* Data Content (relative Z-index) */}
        <Box sx={{ position: "relative", zIndex: 10 }}>
          <Typography
            variant="body1"
            fontWeight="medium"
            letterSpacing={1.5}
            sx={{ opacity: 0.8, color: COLORS.black }}
          >
            TOTAL ORDERS
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-end",
              width: "auto",
              mx: "auto",
              flexDirection: "column",
              mt: 3,
              color: COLORS.black,
            }}
          >
            <Typography
              variant="h2"
              fontWeight="bold"
              sx={{ my: 1, fontSize: "2rem" }}
            >
              {orderCount.toLocaleString()}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="semibold"
              sx={{ opacity: 0.7, color: COLORS.black }}
            >
              ALL TIMES ORDERS
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default OrderChart;
