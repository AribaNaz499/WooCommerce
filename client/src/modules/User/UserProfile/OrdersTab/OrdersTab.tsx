import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { supabase } from "../../../../supabase/supabase";


type OrderStatus = "pending" | "processing" | "completed" | "cancelled" | "refunded" | "paid";

type Order = {
  id: string;
  sessionId?: string | null;
  createdAt: string;
  status: OrderStatus;
  total?: number | null;
  currency?: string | null;
  cardSize?: string | null;
  previewImage?: string | null;
  payerName?: string | null;
  payerEmail?: string | null;
};

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;

  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Karachi",
  }).format(d);
}

function statusChipProps(
  status: OrderStatus
): { label: string; color: "default" | "warning" | "info" | "success" | "error" } {
  switch (status) {
    case "pending":
      return { label: "Pending", color: "warning" };
    case "processing":
      return { label: "Processing", color: "info" };
    case "completed":
      return { label: "Completed", color: "success" };
    case "cancelled":
      return { label: "Cancelled", color: "error" };
    case "refunded":
      return { label: "Refunded", color: "default" };
    case "paid":
      return { label: "Paid", color: "success" };
    default:
      return { label: String(status), color: "default" };
  }
}


type OrderRow = {
  id: number;
  session_id: string | null;
  created_at: string;
  status: string | null;
  amount: number | null;
  currency: string | null;
  card_size: string | null;
  preview_image: string | null;
  payer_name: string | null;
  payer_email: string | null;
};

async function fetchMyOrdersFromSupabase(signal?: any): Promise<Order[]> {
  if (signal?.aborted) return [];

  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw new Error(userErr.message);

  const user = userRes?.user;
  if (!user?.id) throw new Error("You are not logged in. Please login and retry.");

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,session_id,created_at,status,amount,currency,card_size,preview_image,payer_name,payer_email"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .abortSignal(signal ?? null);

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as unknown as OrderRow[];

  return rows.map((o) => ({
    id: String(o.id),
    sessionId: o.session_id ?? null,
    createdAt: o.created_at,
    status: (o.status as OrderStatus) ?? "paid",
    total: typeof o.amount === "number" ? o.amount : null,
    currency: o.currency ?? "GBP",
    cardSize: o.card_size ?? null,
    previewImage: o.preview_image ?? null,
    payerName: o.payer_name ?? null,
    payerEmail: o.payer_email ?? null,
  }));
}

const OrdersTab: React.FC = () => {
  const theme = useTheme();
  const isUpMd = useMediaQuery(theme.breakpoints.up("md"));

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await fetchMyOrdersFromSupabase(ac.signal);
        setOrders(list);
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    })();

    return () => ac.abort();
  }, []);

  // const counts = useMemo(() => {
  //   const map: Record<string, number> = {};
  //   for (const def of TAB_DEFS) {
  //     if (def.key === "all") map[def.key] = orders.length;
  //     else map[def.key] = orders.filter((o) => o.status === def.key).length;
  //   }
  //   return map;
  // }, [orders]);


  return (
    <Box sx={{ width: "100%",mb:4 }}>
      {/* <Tabs
        value={tab}
        onChange={(_, v: OrdersTabKey) => setTab(v)}
        variant="scrollable"
        allowScrollButtonsMobile
        scrollButtons="auto"
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 0.5,
          minHeight: 44,
          bgcolor: "background.paper",
          "& .MuiTabs-indicator": { display: "none" },
          "& .MuiTabs-flexContainer": { gap: 0.5 },
          "& .MuiTab-root": {
            minHeight: 36,
            py: 0.5,
            px: 1.25,
            borderRadius: 1.5,
            textTransform: "none",
            fontSize: 13,
            fontWeight: 700,
            color: "text.secondary",
            "&.Mui-selected": {
              bgcolor: "action.selected",
              color: "text.primary",
            },
          },
        }}
      >
        {TAB_DEFS.map((t) => (
          <Tab
            key={t.key}
            value={t.key}
            label={
              <Badge
                badgeContent={counts[t.key] ?? 0}
                color="default"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: 11,
                    height: 18,
                    minWidth: 18,
                    borderRadius: 999,
                  },
                }}
              >
                <Box component="span" sx={{ pr: 1 }}>
                  {t.label}
                </Box>
              </Badge>
            }
          />
        ))}
      </Tabs> */}

      <Box sx={{ mt: 2 }}>
        {loading && (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 220 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && orders.length === 0 && (
          <Box
            sx={{
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 2,
              p: 2,
              textAlign: "center",
              color: "text.secondary",
            }}
          >
            No orders found.
          </Box>
        )}

        {!loading && !error && (
          <>
            {isUpMd ? (
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  overflow: "hidden",
                  bgcolor: "background.paper",
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {/* <TableCell sx={{ fontWeight: 800 }}>Session ID</TableCell> */}
                      <TableCell sx={{ fontWeight: 800 }}>Preview</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Date & time</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">
                        Price
                      </TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">
                        Currency
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {orders.map((o) => {
                      const chip = statusChipProps(o.status);
                      const priceText = typeof o.total === "number" ? o.total.toFixed(2) : "—";

                      return (
                        <TableRow key={o.id}>
                          <TableCell>
                            {o.previewImage ? (
                              <Box
                                component="img"
                                src={o.previewImage}
                                alt="preview"
                                sx={{
                                  width: 74,
                                  height: 74,
                                  borderRadius: 1.5,
                                  objectFit: "cover",
                                  border: "1px solid",
                                  borderColor: "divider",
                                  // cursor:'pointer'
                                }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Typography sx={{ fontWeight: 700 }}>
                              {o.payerName ?? "—"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {o.payerEmail ?? "—"}
                            </Typography>
                          </TableCell>

                          <TableCell>{formatDateTime(o.createdAt)}</TableCell>

                          <TableCell>
                            <Chip size="small" label={chip.label} color={chip.color} />
                          </TableCell>

                          <TableCell align="right">{priceText}</TableCell>
                          <TableCell align="right">{o.currency ?? "GBP"}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {orders.map((o) => {
                  const chip = statusChipProps(o.status);
                  const priceText = typeof o.total === "number" ? o.total.toFixed(2) : "—";

                  return (
                    <Card key={o.id} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ py: 1.25, "&:last-child": { pb: 1.25 } }}>
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                            <Typography sx={{ fontWeight: 900 }} noWrap>
                              {o.sessionId ?? o.id}
                            </Typography>
                            <Chip size="small" label={chip.label} color={chip.color} />
                          </Stack>

                          <Divider />

                          <Stack direction="row" gap={1.25} alignItems="center">
                            {o.previewImage ? (
                              <Box
                                component="img"
                                src={o.previewImage}
                                alt="preview"
                                sx={{
                                  width: 56,
                                  height: 56,
                                  borderRadius: 2,
                                  objectFit: "cover",
                                  border: "1px solid",
                                  borderColor: "divider",
                                }}
                              />
                            ) : null}

                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700 }}>
                                {o.payerName ?? "—"}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {o.payerEmail ?? "—"}
                              </Typography>
                            </Box>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Date
                            </Typography>
                            <Typography variant="body2">{formatDateTime(o.createdAt)}</Typography>
                          </Stack>

                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Price
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800 }}>
                              {priceText} {o.currency ?? "GBP"}
                            </Typography>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default OrdersTab;
