import { Modal, Box, Typography, IconButton, Chip, Stack, Divider } from "@mui/material";
import { Close, CardGiftcard } from "@mui/icons-material";
import { COLORS } from "../../../../../constant/color";

type Props = {
  open: boolean;
  onClose: () => void;
  user: any;
};

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: 650, sm: 520, xs: "95%" },
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "12px",
  p: 2,
};

// ✅ SAFE avatar resolver (null safe + priority)
const getAvatar = (u: any): string => {
  if (!u) return "/assets/images/user.png";

  const fromProfileUrl = u.profileUrl;
  const fromAvatarCols = u.avatar_url || u.photo_url || u.image || u.image_base64;

  const metaAvatar =
    u?.user_metadata?.avatar_url ||
    u?.user_metadata?.picture ||
    u?.identity_data?.avatar_url ||
    u?.identity_data?.picture ||
    u?.raw_user_meta_data?.avatar_url ||
    u?.raw_user_meta_data?.picture;

  return fromProfileUrl || fromAvatarCols || metaAvatar || "/assets/images/user.png";
};

const getName = (u: any) => u?.name || u?.full_name || u?.display_name || u?.email || "Unknown User";
const getProvider = (u: any) => (u?.provider || u?.auth_provider || "").toLowerCase();
const getCreatedDate = (u: any) => new Date(u?.created_at || u?.createdAt || Date.now()).toLocaleString();

function formatExpiry(expiresAt: string | null | undefined): string {
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

function premiumActive(u: any) {
  const plan = String(u?.plan || u?.subscription_plan || u?.code || "").toLowerCase();
  if (plan === "pro" || plan === "premium") return true;

  if (!u?.isPremium) return false;
  if (!u?.premium_expires_at) return true;

  const t = new Date(u.premium_expires_at).getTime();
  if (!Number.isFinite(t)) return Boolean(u.isPremium);
  return t > Date.now();
}

function bundleActive(u: any) {
  const plan = String(u?.plan || u?.subscription_plan || u?.code || "").toLowerCase();
  if (plan === "bundle") return true;

  if (u?.isBundle || u?.hasBundle) return true;

  const expires =
    u?.bundle_expires_at ||
    u?.bundleExpiresAt ||
    u?.bundle_expiry ||
    u?.bundle_expire_at ||
    null;

  if (!expires) return false;

  const t = new Date(expires).getTime();
  if (!Number.isFinite(t)) return false;
  return t > Date.now();
}

function getPlanKind(u: any): "pro" | "bundle" | "free" {
  if (premiumActive(u)) return "pro";
  if (bundleActive(u)) return "bundle";
  return "free";
}

const CustomerModal = ({ open, onClose, user }: Props) => {
  const provider = getProvider(user);
  const kind = getPlanKind(user);

  const premiumExpiryText = formatExpiry(user?.premium_expires_at);
  const bundleExpiryText = formatExpiry(
    user?.bundle_expires_at || user?.bundleExpiresAt || user?.bundle_expiry || user?.bundle_expire_at
  );

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={style}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography sx={{ fontSize: 20, fontWeight: 800 }}>Customer</Typography>
          <IconButton onClick={onClose} sx={{ color: COLORS.black }}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
          {/* Left: large rounded avatar */}
          <Box sx={{ width: { xs: "100%", sm: 260 }, display: "flex", justifyContent: "center" }}>
            <Box
              sx={{
                width: 220,
                height: 220,
                borderRadius: "50%",
                position: "relative",
                overflow: "visible",
                border: "3px solid #1d61a0ff",
                boxShadow: "0 6px 18px rgba(0,0,0,0.15)",
                bgcolor: "#f6f6f6",
              }}
            >
              {/* ✅ Pro: crown image */}
              {kind === "pro" ? (
                <Box
                  component="img"
                  src="/assets/icons/premiumuser.png"
                  alt="premium crown"
                  sx={{
                    position: "absolute",
                    top: -74,
                    left: "50%",
                    transform: "translateX(-50%) rotate(-8deg)",
                    width: 150,
                    height: 150,
                    objectFit: "contain",
                    zIndex: 5,
                    pointerEvents: "none",
                    filter: "drop-shadow(0px 8px 8px rgba(0,0,0,0.25))",
                  }}
                />
              ) : null}

              {/* ✅ Bundle: gift icon */}
              {kind === "bundle" ? (
                <Box
                  sx={{
                    position: "absolute",
                    top: -34,
                    left: "50%",
                    transform: "translateX(-50%) rotate(-10deg)",
                    width: 68,
                    height: 68,
                    borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.92)",
                    display: "grid",
                    placeItems: "center",
                    zIndex: 5,
                    pointerEvents: "none",
                    boxShadow: "0 12px 22px rgba(0,0,0,0.22)",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                >
                  <CardGiftcard sx={{ color: COLORS.primary, fontSize: 34 }} />
                </Box>
              ) : null}

              <Box
                component="img"
                src={getAvatar(user)}
                alt="avatar"
                onError={(e: any) => {
                  e.currentTarget.src = "/assets/images/user.png";
                }}
                sx={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
              />
            </Box>
          </Box>

          {/* Right: details */}
          <Box sx={{ flex: 1, minWidth: 350 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 0.5 }}>{getName(user)}</Typography>
            {user?.email ? <Typography sx={{ color: "text.secondary", mb: 1.5 }}>{user.email}</Typography> : null}

            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
              <Chip label={`Joined: ${getCreatedDate(user)}`} />
              {provider ? (
                <Chip label={`Provider: ${provider}`} color={provider === "google" ? "success" : "default"} />
              ) : null}

              {kind === "pro" ? <Chip label="Plan: Pro" color="warning" /> : null}
              {kind === "bundle" ? <Chip label="Plan: Bundle" color="info" /> : null}
              {kind === "free" ? <Chip label="Plan: Free" /> : null}
            </Stack>

            <Divider sx={{ my: 1.5 }} />

            {/* ✅ Subscription Info */}
            <Box sx={{ mt: 1 }}>
              <Typography sx={{ fontWeight: 900, mb: 1 }}>Subscription Info</Typography>

              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ color: "text.secondary" }}>Pro Expiry</Typography>
                  <Typography>{kind === "pro" ? premiumExpiryText : "—"}</Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                  <Typography sx={{ color: "text.secondary" }}>Bundle Expiry</Typography>
                  <Typography>{kind === "bundle" ? bundleExpiryText : "—"}</Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
                  <Typography sx={{ color: "text.secondary" }}>Stripe Customer</Typography>
                  <Typography
                    sx={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      fontWeight: 800,
                      wordBreak: "break-all",
                      textAlign: "right",
                      maxWidth: 280,
                    }}
                  >
                    {user.stripe_customer_id || "—"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: "center" }}>
                  <Typography sx={{ color: "text.secondary" }}>Subscription ID</Typography>
                  <Typography
                    sx={{
                      fontFamily: "monospace",
                      fontSize: 12,
                      fontWeight: 800,
                      wordBreak: "break-all",
                      textAlign: "right",
                      maxWidth: 280,
                    }}
                  >
                    {user.stripe_subscription_id || "—"}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
};

export default CustomerModal;
