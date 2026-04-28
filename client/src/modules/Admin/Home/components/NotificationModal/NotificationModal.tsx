import {
  Box,
  Modal,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Tooltip,
  CircularProgress,
  Stack,
  ListItemButton,
} from "@mui/material";
import { Close, DoneAll, DeleteOutline } from "@mui/icons-material";
import { useNotifications } from "../../../../../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import { ADMINS_DASHBOARD } from "../../../../../constant/route";

type Props = {
  open: boolean;
  onCloseModal: () => void;
};

const style = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { md: 700, sm: 500, xs: "95%" },
  height: { md: 600, sm: 600, xs: 500 },
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: "12px",
  p: 2,
  textAlign: "left" as const,
  overflowY: "auto" as const,
};

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function TypeChip({ type }: { type: "user" | "topic" | "order" | "blog" }) {
  const cfg =
    type === "order"
      ? { label: "Order", color: "primary" as const }
      : type === "blog"
      ? { label: "Blog", color: "success" as const }
      : type === "topic"
      ? { label: "Topic", color: "warning" as const }
      : { label: "User", color: "info" as const };

  return <Chip size="small" label={cfg.label} color={cfg.color} variant="outlined" />;
}

const NotificationModal = ({ open, onCloseModal }: Props) => {
  const { notifications, loading, markAllRead, clearAll, removeById, unreadCount } = useNotifications();
  const navigate = useNavigate();

  // type -> route
  const typeToRoute: Record<"user" | "topic" | "order" | "blog", string> = {
    order: ADMINS_DASHBOARD.ORDERS_LIST,
    blog: ADMINS_DASHBOARD.ADMIN_BLOGS,
    topic: ADMINS_DASHBOARD.ADMIN_COMMUNITY_HUB,
    user: ADMINS_DASHBOARD.CUSTOMERS,
  };

  const goTo = (n: {
    id: string | number;
    type: "user" | "topic" | "order" | "blog";
    source_id?: string | number;
  }) => {
    const route = typeToRoute[n.type];
    if (!route) return;
    navigate(route, { state: { fromNotificationId: n.id, sourceId: n.source_id } });
    onCloseModal();
  };

  return (
    <Modal open={open} onClose={onCloseModal}>
      <Box sx={{ ...style }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6">Notifications</Typography>
          <Box>
            <Tooltip title="Mark all as read">
              <IconButton onClick={markAllRead}><DoneAll /></IconButton>
            </Tooltip>
            <Tooltip title="Clear all">
              <IconButton onClick={clearAll}><DeleteOutline /></IconButton>
            </Tooltip>
            <IconButton onClick={onCloseModal}><Close /></IconButton>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={1}>
          {unreadCount} unread
        </Typography>
        <Divider />

        {loading ? (
          <Box py={6} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box py={6} textAlign="center">
            <Typography variant="body1">No notifications</Typography>
          </Box>
        ) : (
          <List sx={{ mt: 1 }}>
            {notifications.map((n) => (
              <Box key={n.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    borderRadius: 2,
                    "&:hover": { bgcolor: "rgba(0,0,0,0.03)" },
                  }}
                  secondaryAction={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {!n.read && <Chip size="small" color="error" label="New" />}
                      <Tooltip title="Dismiss">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeById(n.id);
                          }}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  }
                >
                  {/* Make the row clickable to navigate */}
                  <ListItemButton
                    onClick={() => goTo(n)}
                    sx={{
                      borderRadius: 2,
                      py: 1.2,
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <TypeChip type={n.type} />
                          <Typography fontWeight={700}>{n.title}</Typography>
                        </Stack>
                      }
                      secondary={
                        <Box>
                          {n.body && (
                            <Typography variant="body2" color="text.primary" sx={{ whiteSpace: "pre-wrap" }}>
                              {n.body}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {formatWhen(n.created_at)} • {n.table} • id: {String(n.source_id)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </Box>
            ))}
          </List>
        )}
      </Box>
    </Modal>
  );
};

export default NotificationModal;
