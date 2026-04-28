
import {
  Box,
  Typography,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllUsersFromDB } from "../../../../../source/source";
import { COLORS } from "../../../../../constant/color";

// ----- Types -----
type UserRow = { id: string | number; created_at: string };

// ----- Date helpers -----
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

function formatMonthLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "short" });
}
function formatDayLabel(d: Date) {
  return d.toLocaleString(undefined, { month: "short", day: "2-digit" });
}

type RangeKey = "week" | "m3" | "m6" | "m12";

function buildBuckets(range: RangeKey) {
  const today = startOfDay(new Date());
  if (range === "week") {
    // Last 7 days inclusive
    const buckets: Date[] = [];
    for (let i = 6; i >= 0; i--) buckets.push(addDays(today, -i));
    return { granularity: "day" as const, dates: buckets };
  }

  const months =
    range === "m3" ? 3 :
      range === "m6" ? 6 :
        12;

  const firstMonth = startOfMonth(addMonths(today, -(months - 1)));
  const buckets: Date[] = [];
  for (let i = 0; i < months; i++) buckets.push(addMonths(firstMonth, i));
  return { granularity: "month" as const, dates: buckets };
}

function inSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}
function inSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth();
}

// ----- Transform users -> chart series -----
function makeSeries(users: UserRow[], range: RangeKey) {
  const { granularity, dates } = buildBuckets(range);
  const parsed = users
    .map(u => ({ ...u, d: new Date(u.created_at) }))
    .filter(u => !isNaN(u.d.getTime()))
    .sort((a, b) => a.d.getTime() - b.d.getTime());

  // Precompute cumulative signups up to each date
  const signupTimes = parsed.map(u => u.d.getTime());

  const series = dates.map((bucketDate, _) => {
    // new signups in bucket
    const newCount = parsed.reduce((acc, u) => {
      if (granularity === "day") return acc + (inSameDay(u.d, bucketDate) ? 1 : 0);
      return acc + (inSameMonth(u.d, bucketDate) ? 1 : 0);
    }, 0);

    // returning = cumulative before the bucket start
    let cutoff: Date;
    if (granularity === "day") {
      cutoff = addDays(bucketDate, 0); // start of that day (already startOfDay)
    } else {
      cutoff = startOfMonth(bucketDate);
    }
    const returning = signupTimes.filter(t => t < cutoff.getTime()).length;

    const name = granularity === "day" ? formatDayLabel(bucketDate) : formatMonthLabel(bucketDate);
    return { name, returning, new: newCount };
  });

  return series;
}

// ----- Component -----
const UsersChart = () => {
  const [range, setRange] = useState<RangeKey>("m12");

  const { data: users = [], isLoading, isError } = useQuery<UserRow[]>({
    queryKey: ["users", "authenticated"],
    queryFn: fetchAllUsersFromDB,
    staleTime: 60_000,
  });

  const data = useMemo(() => makeSeries(users, range), [users, range]);

  return (
    <Box
      sx={{
        background: "#ffffff",
        borderRadius: 3,
        p: 3,
        width: { md: "49%", sm: "100%", xs: "100%" },
        height: 400,
        minWidth: 0,
        boxShadow: "0 14px 30px rgba(5,10,36,0.08)",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: COLORS.black }}>
          Customer Growth
        </Typography>

        <Select
          size="small"
          value={range}
          onChange={(e) => setRange(e.target.value as RangeKey)}
          sx={{
            fontSize: 14,
            bgcolor: "#fff",
            borderRadius: 2,
            border: "1px solid rgba(0,0,0,0.2)",
            "& .MuiOutlinedInput-notchedOutline": { border: "none" },
          }}
        >
          <MenuItem value="week">Last Week</MenuItem>
          <MenuItem value="m3">Last 3 Months</MenuItem>
          <MenuItem value="m6">Last 6 Months</MenuItem>
          <MenuItem value="m12">Last 12 Months</MenuItem>
        </Select>
      </Box>

      {/* States */}
      {isLoading ? (
        <Box sx={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Box sx={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography color="error">Failed to load users</Typography>
        </Box>
      ) : (
        <Box sx={{ height: 320, minHeight: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.12)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#000000", fontSize: 12, dy: 8, opacity: 0.7 }}
                interval={0}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#000000", fontSize: 12, opacity: 0.7 }} />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                contentStyle={{ borderRadius: 10, backgroundColor: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}
              />
              <Legend verticalAlign="top" align="left" iconType="circle" iconSize={10} wrapperStyle={{ top: -5, fontWeight: 500, color: "#000000" }} />
              <Bar dataKey="returning" name="Returning customers" fill="rgba(86,190,204,0.65)" barSize={18} />
              <Bar dataKey="new" name="New customers" fill="rgba(141,109,161,0.8)" barSize={18} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      )}
    </Box>
  );
};

export default UsersChart;
