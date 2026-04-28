// File: src/pages/dashboard/customers/components/CustomerCard/CustomerCard.tsx
import { Box, IconButton, Typography } from "@mui/material";
import { Visibility, Delete, CardGiftcard } from "@mui/icons-material";
import { COLORS } from "../../../../../constant/color";

type Props = {
  user: any;
  onView: () => void;
  onDelete: () => void;
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
const getCreatedDate = (u: any) => new Date(u?.created_at || u?.createdAt || Date.now()).toLocaleDateString();

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
  if (premiumActive(u)) return "pro"; // ✅ pro overrides bundle
  if (bundleActive(u)) return "bundle";
  return "free";
}

function formatDateShort(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "—";
  const d = new Date(expiresAt);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString();
}

const CustomerCard = ({ user, onView, onDelete }: Props) => {
  const provider = getProvider(user);
  const kind = getPlanKind(user);

  const proExpiry = formatDateShort(user?.premium_expires_at);
  const bundleExpiry = formatDateShort(
    user?.bundle_expires_at || user?.bundleExpiresAt || user?.bundle_expiry || user?.bundle_expire_at
  );

  return (
    <Box p={1} sx={{ width: { md: 250, sm: 280, xs: "98%" } }}>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: { md: 350, sm: 280, xs: 250 },
          borderRadius: 2,
          overflow: "hidden",
          cursor: "pointer",
          bgcolor: "#fff",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
          "&:hover .overlay": { opacity: 1, transform: "translateY(0)" },
          border: `1px solid ${COLORS.primary}`,
        }}
      >
        {/* Rounded avatar */}
        <Box
          sx={{
            width: 150,
            height: 150,
            borderRadius: "50%",
            overflow: "visible",
            position: "absolute",
            left: "50%",
            top: 40,
            transform: "translateX(-50%)",
            border: "3px solid #997d7d",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "grid",
            placeItems: "center",
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
                top: -30,
                left: "50%",
                transform: "translateX(-50%) rotate(-28deg)",
                width: 55,
                height: 55,
                objectFit: "contain",
                zIndex: 5,
                pointerEvents: "none",
                bgcolor: "rgba(255,255,255,0.92)",
                borderRadius:'50%',
                p:1,
                filter: "drop-shadow(0px 6px 6px rgba(0,0,0,0.25))",
              }}
            />
          ) : null}

          {/* ✅ Bundle: gift icon */}
          {kind === "bundle" ? (
            <Box
              sx={{
                position: "absolute",
                top: -28,
                left: "50%",
                transform: "translateX(-50%) rotate(-18deg)",
                width: 52,
                height: 52,
                borderRadius: 999,
                bgcolor: "rgba(255,255,255,0.92)",
                display: "grid",
                placeItems: "center",
                zIndex: 5,
                pointerEvents: "none",
                boxShadow: "0 10px 20px rgba(0,0,0,0.22)",
                border: "1px solid rgba(0,0,0,0.08)",
              }}
            >
              <CardGiftcard sx={{ color: COLORS.primary, fontSize: 28 }} />
            </Box>
          ) : null}

          {/* Avatar image */}
          <Box
            component="img"
            src={getAvatar(user)}
            alt="avatar"
            onError={(e: any) => {
              e.currentTarget.src = "/assets/images/user.png";
            }}
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              borderRadius: "50%",
            }}
          />
        </Box>

        {/* Name / Email / Date */}
        <Box
          sx={{
            position: "absolute",
            bottom: 14,
            width: "100%",
            textAlign: "center",
            px: 2,
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 0.5 }}>{getName(user)}</Typography>

          {user?.email ? (
            <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 0.3 }} noWrap>
              {user.email}
            </Typography>
          ) : null}

          <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
            Joined: {getCreatedDate(user)} {provider === "google" ? "• Google" : ""}
          </Typography>

          {kind === "pro" && user?.premium_expires_at ? (
            <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.4 }}>
              Pro Expires: {proExpiry}
            </Typography>
          ) : null}

          {kind === "bundle" ? (
            <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.4 }}>
              Bundle Expires: {bundleExpiry}
            </Typography>
          ) : null}
        </Box>

        {/* Hover overlay actions */}
        <Box
          className="overlay"
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1.5,
            opacity: 0,
            transform: "translateY(12px)",
            transition: "all 0.25s ease",
            bgcolor: "rgba(0,0,0,0.35)",
          }}
        >
          <IconButton
            onClick={onView}
            sx={{
              bgcolor: COLORS.white,
              color: COLORS.primary,
              "&:hover": { bgcolor: "#f0f0f0" },
            }}
          >
            <Visibility />
          </IconButton>

          <IconButton
            onClick={onDelete}
            sx={{
              bgcolor: "#fff",
              color: "red",
              "&:hover": { bgcolor: "#f0f0f0" },
            }}
          >
            <Delete />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomerCard;
