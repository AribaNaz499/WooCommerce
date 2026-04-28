import { AreaChart, Area, XAxis, ResponsiveContainer } from "recharts";
import { Box, Typography } from "@mui/material";
import { COLORS } from "../../../../../constant/color";
import { useEffect, useState } from "react";
import { fetchCardCount, fetchTempletCardCount } from "../../../../../source/source";

// --- Mock Data ---
const productData = [
  { name: "M", value: 100 },
  { name: "T", value: 3000 },
  { name: "W", value: 5000 },
  { name: "Th", value: 3500 },
  { name: "F", value: 4500 },
  { name: "S", value: 6500 },
  { name: "Su", value: 5500 },
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

// --- Total Product Chart (Pink/Red Gradient Card) ---
const TotalProductChart = () => {

  const [cardCount, setCardCount] = useState(0);
  const [templetCardCount, setTempletCardCount] = useState(0);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const count: any = await fetchCardCount();
        setCardCount(count);
      } catch (err) {
        console.error("Error fetching cards count:", err);
      }
    };

    loadCount();
  }, []);

  useEffect(() => {
    const loadCount = async () => {
      try {
        const templetCardCount: any = await fetchTempletCardCount();
        setTempletCardCount(templetCardCount);
      } catch (err) {
        console.error("Error fetching cards count:", err);
      }
    };

    loadCount();
  }, []);

  const totalCards = cardCount + templetCardCount;


  return (
    <Box
      sx={{
        flex: "1 1 300px",
        maxWidth: { md: '100%', sm: '100%', xs: "100%" },
        minWidth: 300,
        mb: { md: 0, sm: 0, xs: 1 },
        minHeight: 0,
      }}
    >
      <Box
        sx={{
          position: "relative",
          p: 3,
          color: COLORS.black,
          height: { md: 200, sm: 200, xs: 180 },
          boxShadow: "0 14px 30px rgba(5,10,36,0.08)",
          borderRadius: 4,
          border: "1px solid rgba(0,0,0,0.06)",
          background: "#ffffff",
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
            data={productData}
            colorId="colorProduct"
            colorStart="rgba(86,190,204,0.45)"
            colorEnd="rgba(86,190,204,0.05)"
            strokeColor={COLORS.primary}
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
            TOTAL PRODUCTS
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
              {totalCards?.toLocaleString()}
            </Typography>
            <Typography
              variant="body2"
              fontWeight="semibold"
              sx={{ opacity: 0.7, color: COLORS.black }}
            >
              ALL TIMES PRODUCTS
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TotalProductChart;
