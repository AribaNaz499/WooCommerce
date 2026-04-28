import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Box, CircularProgress, FormControl, MenuItem, Select, Typography } from "@mui/material";
import { COLORS } from "../../../../../constant/color";
import { useEffect, useState } from "react";


export default function VisitorMiniChart() {
  const [visitorData, setVisitorData] = useState([]);
  const [loading, setLoading] = useState(true);


  const [filter, setFilter] = useState("weekly");

  useEffect(() => {
    async function loadVisitors() {
      try {
        const res = await fetch(`/api/visitors?range=${filter}`);
        // const res = await fetch(`http://localhost:5000/visitors?range=${filter}`);
        const data = await res.json();
        setVisitorData(data);
      } catch (err) {
        console.error("Failed to load GA4 visitors:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVisitors();
  }, [filter]);


  return (
    <Box
      sx={{
        width: { md: '35%', sm: '100%', xs: '100%' },
        height: 200,
        minWidth: 0,
        borderRadius: 3,
        boxShadow: "0 14px 30px rgba(5,10,36,0.08)",
        p: 2,
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography
          variant="body2"
          sx={{ color: COLORS.black, textAlign: "center", letterSpacing: 0.5 }}
        >
          WEBSITE VISITORS
        </Typography>
        {/* Filter dropdown */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={filter}
              variant="standard"
              label=""
              onChange={(e) => setFilter(e.target.value)}
              sx={{
                color: COLORS.black,
                borderBottom: "1px solid rgba(0,0,0,0.2)",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },
                ".MuiSvgIcon-root": { color: COLORS.black },
              }}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="live">Live</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      {loading ? (
        <CircularProgress sx={{ color: COLORS.seconday, display: 'flex', justifyContent: 'center', alignItems: 'center', m: 'auto' }} />
      ) : (
        <>
          <Box sx={{ height: 120, minHeight: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visitorData}
                margin={{ right: 10, left: -15, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="lineColor" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={COLORS.primary} />
                    <stop offset="50%" stopColor={COLORS.seconday} />
                    <stop offset="100%" stopColor={COLORS.green} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.12)" />
                <XAxis dataKey="day" stroke="rgba(0,0,0,0.6)" tick={{ fontSize: 10, fill: COLORS.black }} />
                <YAxis stroke="rgba(0,0,0,0.6)" tick={{ fontSize: 10, fill: COLORS.black }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "8px",
                    color: COLORS.black,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="visitors"
                  stroke="url(#lineColor)"
                  strokeWidth={2.5}
                  dot={{ r: 3, stroke: "#ffffff", strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                  animationBegin={0}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Box>
  );
}
