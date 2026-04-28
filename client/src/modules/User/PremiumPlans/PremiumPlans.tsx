import { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "../../../layout/MainLayout";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  Stack,
  Typography,
  Skeleton,
} from "@mui/material";
import { ArrowBackIos, CheckCircleOutline, HighlightOff } from "@mui/icons-material";
import { loadSubscriptionConfig } from "../../../lib/subscriptionStore";
import { supabase } from "../../../supabase/supabase";
import { loadStripe } from "@stripe/stripe-js";
import toast from "react-hot-toast";
import { useAuth } from "../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { COLORS } from "../../../constant/color";
import { API_BASE } from "../../../lib/apiBase";

/**
 * TYPES
 */
type FeatureIconKind = "check" | "cross";
type PricingFeature = { id: string; text: string; icon: FeatureIconKind };
type PricingPlan = {
  id: string;
  code: string; // free | bundle | pro
  name: string;
  tagline: string;
  priceText: string;
  priceSuffix: string;
  highlight: boolean;
  badgeText: string;
  features: PricingFeature[];
};
type PricingConfig = { page: { title: string; subtitle: string }; plans: PricingPlan[] };

const STRIPE_PK =
  import.meta.env.VITE_STRIPE_PK ||
  import.meta.env.VITE_STRIP_PUBLIC_KEY ||
  "pk_test_51S5Pnw6w4VLajVLTFff76bJmNdN9UKKAZ2GKrXL41ZHlqaMxjXBjlCEly60J69hr3noxGXv6XL2Rj4Gp4yfPCjAy00j41t6ReK";

const stripePromise = loadStripe(STRIPE_PK);

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "—";
  const d = new Date(expiresAt);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function FeatureIcon({ kind, highlight }: { kind: FeatureIconKind; highlight: boolean }) {
  if (kind === "cross") return <HighlightOff fontSize="small" color={highlight ? "warning" : "error"} />;
  return <CheckCircleOutline fontSize="small" color={highlight ? "warning" : "action"} />;
}

const getPlanColor = (code: string) => {
  if (code === "free") return COLORS.primary;
  if (code === "bundle") return COLORS.seconday;
  if (code === "pro") return COLORS.green;
  return COLORS.gray;
};


/**
 * Plan-wise visuals
 */
function getPlanVisual(planCode: string, isFree: boolean) {
  if (isFree) {
    return {
      backgroundImage: "none",
      bgcolor: "background.paper" as const,
      badgeSx: { bgcolor: "rgba(0,0,0,0.10)", color: "text.primary" as const },
    };
  }

  const code = (planCode || "").toLowerCase();

  if (code === "pro") {
    return {
      backgroundImage: "linear-gradient(135deg, #ffffff 0%, #ffe3f3 50%, #ff8a00 120%)",
      bgcolor: "transparent" as const,
      badgeSx: { bgcolor: "#ff8a00", color: "#ffffff" },
    };
  }

  if (code === "bundle") {
    return {
      backgroundImage: "linear-gradient(135deg, #ffffff 0%, #fff0dc 50%, #56BECC 120%)",
      bgcolor: "transparent" as const,
      badgeSx: { bgcolor: "#56BECC", color: "#ffffff" },
    };
  }

  return {
    backgroundImage: "linear-gradient(135deg, #ffffff 0%, #e4dce9 50%, #ae8ec2 100%)",
    bgcolor: "transparent" as const,
    badgeSx: { bgcolor: "warning.main", color: "warning.contrastText" as const },
  };
}

function PlanCardView({
  plan,
  isFree,
  showBuyButton,
  onBuy,
  buying,
  disabled,
  // actionText,
}: {
  plan: PricingPlan;
  isFree: boolean;
  showBuyButton: boolean;
  onBuy: () => void;
  buying: boolean;
  disabled?: boolean;
  actionText?: string;
}) {
  const badgeText = (plan.badgeText || "").trim();
  const visual = getPlanVisual(plan.code, isFree);
  const borderColor = getPlanColor(plan.code);

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        height: "100%",
        position: "relative",
        border: `5px solid ${borderColor}`,
        // borderColor: plan.highlight ? "warning.main" : "divider",
        overflow: "visible",
        mt: 4,
        width: "100%",
        backgroundImage: visual.backgroundImage,
        bgcolor: visual.bgcolor,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {badgeText ? (
        <Box
          sx={{
            position: "absolute",
            top: -15,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 2,
          }}
        >
          <Box
            sx={{
              px: 3,
              py: 0.6,
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 0.4,
              boxShadow: 1,
              bgcolor: borderColor,
              color: COLORS.white,
              userSelect: "none",
              whiteSpace: "nowrap",

              // ...visual.badgeSx,
            }}
          >
            {badgeText}
          </Box>
        </Box>
      ) : null}

      <CardContent sx={{ p: 2.5, pt: badgeText ? 4 : 2.5, mt: 3 }}>
        <Stack spacing={1.5}>
          <Box>
            <Typography sx={{ fontSize: { md: 28, xs: 22 }, fontWeight: 900 }}>{plan.name}</Typography>
            <Typography sx={{ color: "gray", fontSize: 14, mt: 0.5 }}>{plan.tagline}</Typography>
          </Box>

          <Box>
            <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
              <Typography sx={{ fontSize: { md: 34, xs: 28 }, fontWeight: 900 }}>{plan.priceText}</Typography>
              {plan.priceSuffix ? (
                <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.secondary" }}>
                  {plan.priceSuffix}
                </Typography>
              ) : null}
            </Stack>
          </Box>

          <Divider />

          <List dense sx={{ py: 0 }}>
            {(plan.features || []).map((f) => (
              <ListItem key={f.id} sx={{ px: 0, gap: 1 }} disableGutters>
                <ListItemIcon sx={{ minWidth: 34, mt: 0.3 }}>
                  <FeatureIcon kind={f.icon} highlight={plan.highlight} />
                </ListItemIcon>
                <Typography sx={{ fontSize: 14, fontWeight: 600, lineHeight: 1.35 }}>{f.text}</Typography>
              </ListItem>
            ))}
          </List>

          {showBuyButton && (
            <Button
              fullWidth
              disabled={disabled || buying}
              onClick={onBuy}
              sx={{
                mt: 3,
                borderRadius: "30px",
                py: 1.3,
                fontWeight: 700,
                fontSize: 20,
                textTransform: "none",
                backgroundColor: borderColor,
                color: COLORS.white,
                "&:hover": {
                  backgroundColor: borderColor,
                  opacity: 0.9,
                },
              }}
            >
              {buying ? "Processing..." : 'Buy Plan'}
            </Button>
          )}

        </Stack>
      </CardContent>
    </Card>
  );
}

function PlansSkeleton() {
  const cardSx = { bgcolor: "#d9d9d9", borderRadius: 2 };

  return (
    <Box sx={{ textAlign: "center", mt: 5 }}>
      <Skeleton variant="text" height={60} width={360} sx={{ mx: "auto", ...cardSx }} />
      <Skeleton variant="text" height={28} width={520} sx={{ mx: "auto", mt: 1, ...cardSx }} />

      <Box
        sx={{
          width: "80%",
          display: "flex",
          gap: 3,
          flexWrap: { xs: "wrap", md: "nowrap" },
          m: "auto",
          mt: 4,
        }}
      >
        {[0, 1, 2].map((k) => (
          <Box key={k} sx={{ width: "100%" }}>
            <Card sx={{ borderRadius: 3, mt: 4, overflow: "hidden" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack spacing={1.5}>
                  <Skeleton variant="text" height={44} width="70%" sx={cardSx} />
                  <Skeleton variant="text" height={22} width="85%" sx={cardSx} />
                  <Skeleton variant="text" height={56} width="55%" sx={cardSx} />
                  <Divider />
                  {[0, 1, 2, 3].map((i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <Skeleton variant="circular" width={20} height={20} sx={{ bgcolor: "#cfcfcf" }} />
                      <Skeleton variant="text" height={22} width="80%" sx={cardSx} />
                    </Stack>
                  ))}
                  <Skeleton variant="rounded" height={46} width="100%" sx={cardSx} />
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function ActiveBannerSkeleton() {
  return (
    <Box sx={{ mt: 4 }}>
      <Skeleton variant="rounded" height={54} sx={{ bgcolor: "#d9d9d9", borderRadius: 3, maxWidth: 820, mx: "auto" }} />
    </Box>
  );
}



export default function PremiumPlans() {
  const { user, plan, premiumExpiresAt, bundleExpiresAt, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [config, setConfig] = useState<PricingConfig | null>(null);

  const confirmRanRef = useRef(false);

  const expiryText = useMemo(() => {
    if (plan === "pro") return formatExpiry(premiumExpiresAt);
    if (plan === "bundle") return formatExpiry(bundleExpiresAt);
    return "—";
  }, [plan, premiumExpiresAt, bundleExpiresAt]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const remote = await loadSubscriptionConfig<PricingConfig>(supabase);
        setConfig(remote ?? null);
        setLoading(false);
      } catch (e: any) {
        setLoading(false);
        toast.error(e?.message || "Failed to load subscription config.");
      }
    };
    run();
  }, []);

  // ✅ confirm after Stripe redirect
  useEffect(() => {
    const runConfirm = async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session_id");
      if (!sessionId) return;
      if (confirmRanRef.current) return;
      confirmRanRef.current = true;

      const toastId = "confirm-subscription";

      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw new Error(sessionErr.message);

        const token = sessionData?.session?.access_token;
        if (!token) throw new Error("Please login again.");

        toast.loading("Activating your plan...", { id: toastId });

        const res = await fetch(`${API_BASE}/subscription/confirm`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || "Confirm failed.");

        await refreshProfile();
        toast.success("Plan activated ✅", { id: toastId });

        params.delete("session_id");
        const clean = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
        window.history.replaceState({}, "", clean);
      } catch (e: any) {
        toast.error(e?.message || "Failed to activate plan.", { id: toastId });
      }
    };

    void runConfirm();
  }, [refreshProfile]);

  useEffect(() => {
    if (user?.id) void refreshProfile();
  }, [user?.id, refreshProfile]);

  const startCheckout = async (planCode: string) => {
    const toastId = "checkout";
    try {
      setBuying(planCode);

      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw new Error(sessionErr.message);

      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Please login first.");

      toast.loading("Navigating to checkout...", { id: toastId });

      const res = await fetch(`${API_BASE}/subscription/create-checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ planCode }),
      });

      const json = await res.json().catch(async () => {
        const text = await res.text().catch(() => "");
        return { error: text };
      });
      if (!res.ok) {
        const details =
          json?.error ||
          `Checkout API failed (${res.status}). Check VITE_API_BASE and backend /subscription/create-checkout-session.`;
        throw new Error(details);
      }

      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load.");

      toast.success("Redirecting...", { id: toastId });

      const { error } = await stripe.redirectToCheckout({ sessionId: json.id });
      if (error) throw error;
    } catch (e: any) {
      toast.error(e?.message || "Checkout failed.", { id: toastId });
      setBuying(null);
    }
  };

  const showPlans = Boolean(config) && plan !== "pro"; // pro user: no need to upsell
  const showBundleAlert = plan === "bundle";
  const showProAlert = plan === "pro";

  return (
    <MainLayout>
      <Box sx={{ width: "100%", py: 4, pb: { md: 15, xs: 4 } }}>
        <Container maxWidth="xl">
          <IconButton sx={{ border: "1px solid gray" }} onClick={() => navigate(-1)}>
            <ArrowBackIos />
          </IconButton>

          {/* ✅ Skeleton loading */}
          {loading ? (
            <>
              <ActiveBannerSkeleton />
              <PlansSkeleton />
            </>
          ) : null}

          {/* ✅ Small success-style message (bundle) */}
          {!loading && showBundleAlert ? (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Alert
                severity="success"
                variant="standard"
                sx={{
                  maxWidth: 820,
                  width: "100%",
                  borderRadius: 3,
                  py: 3,
                  alignItems: "center",
                }}
              >
                Bundle activated. You can Personalise you Bundle cards. Upgrade to <b>Pro</b> and Use Full library.
              </Alert>
            </Box>
          ) : null}

          {/* ✅ Pro message (optional small) */}
          {!loading && showProAlert ? (
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Alert
                severity="success"
                variant="standard"

                sx={{
                  maxWidth: 820,
                  width: "100%",
                  borderRadius: 3,
                  py: 8,
                  fontSize: 25,
                  display: "flex",
                  justifyContent: "center",
                  m: "auto",

                  // ✨ Gradient Background (Right → Left)
                  backgroundImage: "linear-gradient(to left, #ff8a00 0%, #f0bbd9 50%, #f5f1f1 100%)",
                  color: "#222",

                  // remove default success green styling
                  "& .MuiAlert-icon": { color: "#ff8a00" },
                }}
              >
                Hurry! Your Pro Plan is Active 🎉 (Expiry: <b>{expiryText}</b>)
              </Alert>
            </Box>
          ) : null}


          {/* ✅ Show Plans for FREE + BUNDLE (so bundle can upgrade to pro) */}
          {!loading && showPlans ? (
            <Box sx={{ textAlign: "center", mt: 5 }}>
              <Typography sx={{ fontSize: { md: 40, xs: 28 }, fontWeight: 900 }}>
                {config?.page?.title || "Plans"}
              </Typography>

              <Typography
                sx={{
                  fontSize: { md: 18, xs: 14 },
                  width: { md: 820, xs: "100%" },
                  color: "#444444",
                  mx: "auto",
                  mt: 1,
                }}
              >
                {config?.page?.subtitle || ""}
              </Typography>

              <Box
                sx={{
                  width: "80%",
                  display: "flex",
                  gap: 3,
                  flexWrap: { xs: "wrap", md: "nowrap" },
                  m: "auto",
                  mt: 4,
                }}
              >
                {(config?.plans || []).map((p) => {
                  const isFreePlan = p.code === "free" || p.priceText?.toLowerCase() === "free";

                  // ✅ Current plan disable
                  const isCurrentBundle = plan === "bundle" && p.code === "bundle";
                  // const isCurrentPro = plan === "pro" && p.code === "pro";

                  // ✅ Free user: show buy for paid only
                  if (plan === "free") {
                    return (
                      <Box key={p.id} sx={{ width: "100%" }}>
                        <PlanCardView
                          plan={p}
                          isFree={isFreePlan}
                          showBuyButton={!isFreePlan}
                          buying={buying === p.code}
                          onBuy={() => startCheckout(p.code)}
                        />
                      </Box>
                    );
                  }

                  // ✅ Bundle user: show plans + allow ONLY upgrade to pro
                  if (plan === "bundle") {
                    const canBuy = p.code === "pro";
                    return (
                      <Box key={p.id} sx={{ width: "100%" }}>
                        <PlanCardView
                          plan={p}
                          isFree={isFreePlan}
                          showBuyButton={p.code !== "free"}
                          buying={buying === p.code}
                          disabled={isCurrentBundle || !canBuy}
                          actionText={isCurrentBundle ? "Current Plan" : canBuy ? "Buy Plan" : "Not Available"}
                          onBuy={() => startCheckout(p.code)}
                        />
                      </Box>
                    );
                  }

                  // fallback
                  return null;
                })}
              </Box>
            </Box>
          ) : null}
        </Container>
      </Box>
    </MainLayout>
  );
}
