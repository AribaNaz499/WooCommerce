import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Box, Typography } from "@mui/material";
import { COLORS } from "../../../../../constant/color";

const PiChart = ({ totalOrder }: any) => {
  const data = [
    { name: "Purple", value: 30 },
    { name: "Blue", value: 25 },
    { name: "Pink", value: 48 },
  ];
  // const total = data.reduce((sum, v) => sum + v.value, 0);
  const colors = ["url(#gradPrimary)", "url(#gradSecondary)", "url(#gradGreen)"];

  return (
    <Box
      sx={{
        position: "relative",
        width: 250,
        height: 250,
        borderRadius: "50%",
        background:
          "radial-gradient(60% 60% at 30% 20%, rgba(255,255,255,0.96), rgba(255,255,255,0.9) 35%, rgba(86,190,204,0.12) 70%), linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(141,109,161,0.1) 60%)",
        boxShadow: "0 20px 45px rgba(5,10,36,0.12)",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <defs>
            <linearGradient id="gradPrimary" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={COLORS.primary} />
              <stop offset="100%" stopColor={COLORS.seconday} />
            </linearGradient>
            <linearGradient id="gradSecondary" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={COLORS.seconday} />
              <stop offset="100%" stopColor={COLORS.green} />
            </linearGradient>
            <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={COLORS.green} />
              <stop offset="100%" stopColor={COLORS.primary} />
            </linearGradient>
          </defs>

          {/* Outer background */}
          <Pie
            data={[{ name: "Track", value: 100 }]}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={92}
            outerRadius={104}
          >
            <Cell fill="rgba(86,190,204,0.12)" />
          </Pie>

          {/* Gradient segments */}
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={75}
            outerRadius={117}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            animationDuration={1000}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center content */}
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 117,
          height: 117,
          borderRadius: "50%",
          background: "linear-gradient(180deg,#FFFFFF,#F9FAFB)",
          boxShadow: 8,
          // boxShadow:
          //   "0 16px 36px rgba(2,6,23,0.06), inset 0 6px 18px rgba(0,0,0,0.04)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 800,
            color: COLORS.black,
          }}
        >
          {totalOrder}
        </Typography>
        <Typography variant="subtitle2" sx={{ color: COLORS.black }} fontWeight={700}>
          Total
        </Typography>
      </Box>
    </Box>
  );
};

export default PiChart;
