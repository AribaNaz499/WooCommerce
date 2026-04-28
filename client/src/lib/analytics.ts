type OrderRow = {
    id: string;
    created_at: string;
    status: string; // "paid" | "pending" ...
    amount: number; // keep number
};

type LinePoint = { name: string; value: number };

export function groupByDayPaidRevenue(orders: OrderRow[]): LinePoint[] {
    const map = new Map<string, number>();

    for (const o of orders) {
        if ((o.status || "").toLowerCase() !== "paid") continue;

        const d = new Date(o.created_at);
        if (Number.isNaN(d.getTime())) continue;

        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        map.set(key, (map.get(key) ?? 0) + (Number(o.amount) || 0));
    }

    return Array.from(map.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, value]) => ({
            name: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            value: Math.round(value),
        }));
}

export function formatGBP(n: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function buildDashboardMetrics(orders: OrderRow[], monthGoal: number) {
    const totalOrders = orders.length;

    const paidOrders = orders.filter((o) => (o.status || "").toLowerCase() === "paid");
    const paidCount = paidOrders.length;

    const totalPaid = paidOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    const conversionPct = totalOrders === 0 ? 0 : Math.round((paidCount / totalOrders) * 100);

    const rawPct = monthGoal <= 0 ? 0 : (totalPaid / monthGoal) * 100;
    const achievedPct = Math.min(100, Number(rawPct.toFixed(1)));

    const left = Math.max(0, monthGoal - totalPaid);
    const salesGoal = [
        { name: "Achieved", value: totalPaid },
        { name: "Remaining", value: left },
    ];

    const conversionRate = [
        { name: "Converted", value: conversionPct },
        { name: "Not Converted", value: 100 - conversionPct },
    ];

    const revenueLine = groupByDayPaidRevenue(orders);

    const avgOrderValue = paidCount === 0 ? 0 : totalPaid / paidCount;

    return {
        totalOrders,
        paidCount,
        totalPaid,
        monthGoal,
        left,
        achievedPct,
        conversionPct,
        salesGoal,
        conversionRate,
        revenueLine,
        avgOrderValue,
    };
}