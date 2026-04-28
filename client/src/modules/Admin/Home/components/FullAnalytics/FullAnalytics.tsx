import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, Typography, Box } from "@mui/material";
import { COLORS } from "../../../../../constant/color";

const data = [
  { name: "Page A", uv: 4000, pv: 2400 },
  { name: "Page B", uv: 3000, pv: 1398 },
  { name: "Page C", uv: 2000, pv: 9800 },
  { name: "Page D", uv: 2780, pv: 3908 },
  { name: "Page E", uv: 1890, pv: 4800 },
  { name: "Page F", uv: 2390, pv: 3800 },
  { name: "Page G", uv: 3490, pv: 4300 },
];

const SimpleAreaChart = () => {
  return (
    <Card
      sx={{
        p: 0,
        width:'50%',
        borderRadius: 4,
        background:
          "linear-gradient(135deg, rgba(255,165,0,0.15), rgba(255,255,255,0.15))",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <Typography
        variant="h6"
        fontWeight="bold"
        textAlign="start"
        mb={2}
        sx={{
          letterSpacing: 1,
          color:COLORS.black
        }}
      >
        Total Growth Overview
      </Typography>

      <Box sx={{ width: "100%", height: 350 }}>
        <ResponsiveContainer>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {/* Gradient definition */}
            <defs>
              <linearGradient id="orangeWhite" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ff7a00" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#ffffff" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.2)"
            />
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(20,20,30,0.9)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 10,
              }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#ffb347" }}
            />

            <Area
              type="monotone"
              dataKey="uv"
              stroke="#ffb347"
              strokeWidth={3}
              fill="url(#orangeWhite)"
              dot={{
                r: 5,
                stroke: "#fff",
                strokeWidth: 2,
                fill: "#ff7a00",
                filter: "drop-shadow(0 0 5px rgba(255,140,0,0.6))",
              }}
              activeDot={{
                r: 8,
                fill: "#ff7a00",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  );
};

export default SimpleAreaChart;
