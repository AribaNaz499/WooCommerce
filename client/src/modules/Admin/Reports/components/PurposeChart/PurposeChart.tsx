import { Box, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";
import { fetchAllOrders } from "../../../../../source/source";
import { buildDashboardMetrics, formatGBP } from "../../../../../lib/analytics";

const COLORS = {
    yellow: "#FFC107",
    green: "#00C49F",
    gray: "#E5E7EB",
    blue: "#007BFF",
};

type OrderRow = {
    id: string;
    created_at: string;
    status: string;
    amount: number;
};


const PurposeChart = () => {
    const [rawOrders, setRawOrders] = useState<OrderRow[]>([]);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const result: any[] = await fetchAllOrders();

                const clean: OrderRow[] = (result || []).map((item: any) => ({
                    id: String(item.id),
                    created_at: item.created_at,
                    status: String(item.status ?? ""),
                    amount: Number(item.amount) || 0,
                }));

                setRawOrders(clean);
            } catch (err) {
                console.error("fetchAllOrders error:", err);
            } finally {
            }
        };

        loadOrders();
    }, []);

    // TODO: make this dynamic (from settings/db) if you want
    const monthGoal = 10000;

    const metrics = useMemo(
        () => buildDashboardMetrics(rawOrders, monthGoal),
        [rawOrders, monthGoal]
    );

    // If no line data, show a fallback point so chart doesn't look broken
    const lineData = metrics.revenueLine.length
        ? metrics.revenueLine
        : [{ name: "—", value: 0 }];

    return (
        <Box sx={{ width: "50%", minWidth: 0 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "stretch",
                    width: "100%",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                {/* Sales Goal */}
                <Box
                    sx={{
                        bgcolor: "#fff",
                        borderRadius: 3,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        p: 3,
                        width: { md: "50%", sm: "50%", xs: "100%" },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Sales Goal
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <ResponsiveContainer width="50%" height={120}>
                            <PieChart>
                                <Pie
                                    data={metrics.salesGoal}
                                    dataKey="value"
                                    innerRadius={40}
                                    outerRadius={55}
                                    startAngle={90}
                                    endAngle={-270}
                                    animationDuration={1200}
                                >
                                    <Cell key="Achieved" fill={COLORS.yellow} />
                                    <Cell key="Remaining" fill={COLORS.gray} />
                                </Pie>

                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{ fontWeight: 700, fontSize: "16px" }}
                                >
                                    {metrics.achievedPct}%
                                </text>
                            </PieChart>
                        </ResponsiveContainer>

                        <Box>
                            <Typography>
                                Sold for: <b>{formatGBP(metrics.totalPaid)}</b>
                            </Typography>
                            <Typography>
                                Month goal: <b>{formatGBP(metrics.monthGoal)}</b>
                            </Typography>
                            <Typography>
                                Left: <b>{formatGBP(metrics.left)}</b>
                            </Typography>
                            <Typography sx={{ mt: 1, fontSize: 13, color: "gray" }}>
                                Paid orders: <b>{metrics.paidCount}</b> / {metrics.totalOrders}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Conversion Rate */}
                <Box
                    sx={{
                        bgcolor: "#fff",
                        borderRadius: 3,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        p: 3,
                        width: { md: "48%", sm: "48%", xs: "100%" },
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Conversion Rate
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <ResponsiveContainer width="50%" height={120}>
                            <PieChart>
                                <Pie
                                    data={metrics.conversionRate}
                                    dataKey="value"
                                    innerRadius={40}
                                    outerRadius={55}
                                    startAngle={90}
                                    endAngle={-270}
                                    animationDuration={1200}
                                >
                                    <Cell key="Converted" fill={COLORS.green} />
                                    <Cell key="Not Converted" fill={COLORS.gray} />
                                </Pie>

                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    style={{ fontWeight: 700, fontSize: "16px" }}
                                >
                                    {metrics.conversionPct}%
                                </text>
                            </PieChart>
                        </ResponsiveContainer>

                        <Box>
                            <Typography>
                                Total orders: <b>{metrics.totalOrders}</b>
                            </Typography>
                            <Typography>
                                Paid orders: <b>{metrics.paidCount}</b>
                            </Typography>
                            <Typography>
                                Pending/Other: <b>{metrics.totalOrders - metrics.paidCount}</b>
                            </Typography>

                            {/* If you later add funnel events, replace these with real funnel stats */}
                            <Typography sx={{ mt: 1, fontSize: 13, color: "gray" }}>
                                (Based on paid / total)
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Revenue Trend (Daily Paid Revenue) */}
                <Box
                    sx={{
                        bgcolor: "#fff",
                        borderRadius: 3,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        p: 3,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        Paid Revenue Trend
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                        <Typography variant="body2">
                            Avg order value (paid): <b>{formatGBP(metrics.avgOrderValue)}</b>
                        </Typography>
                        <Typography variant="body2">
                            Total paid: <b>{formatGBP(metrics.totalPaid)}</b>
                        </Typography>
                    </Box>

                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={lineData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.gray} vertical={false} />

                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fontSize: 12, fill: COLORS.blue }}
                                dy={6}
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 12, fill: "#666" }}
                                domain={["auto", "auto"]}
                            />

                            <Tooltip
                                formatter={(value: any) => formatGBP(Number(value) || 0)}
                                contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #eee",
                                    borderRadius: 10,
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                                }}
                                cursor={{ stroke: "#E0E0E0", strokeWidth: 1 }}
                            />

                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={COLORS.blue}
                                strokeWidth={3}
                                dot={false}
                                activeDot={{ r: 5 }}
                                animationDuration={1400}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Box>
            </Box>
        </Box>
    );
};

export default PurposeChart;
