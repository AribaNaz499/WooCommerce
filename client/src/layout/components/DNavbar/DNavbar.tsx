import React from "react";
import {
  AppBar,
  Toolbar,
  // Typography,
  Box,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Avatar,
  Badge,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import {
  // ArrowDropDown,
  Chat,
  LogoutOutlined,
  Notifications,
  SettingsOutlined,
} from "@mui/icons-material";
import { COLORS } from "../../../constant/color";
import useModal from "../../../hooks/useModal";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { useAdmin } from "../../../context/AdminContext";
import { useNavigate } from "react-router-dom";
import { ADMINS_DASHBOARD } from "../../../constant/route";
import NotificationModal from "../../../modules/Admin/Home/components/NotificationModal/NotificationModal";
import { useNotifications } from "../../../context/NotificationContext";

const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: "#ffffff",
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#ffffff",
  },
  marginLeft: 0,
  width: "100%",
  flexGrow: 3 / 4,
  [theme.breakpoints.up("sm")]: {
    marginLeft: theme.spacing(1),
    width: "auto",
  },
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    flex: 1,
    fontSize: '12px',
    color: COLORS.black,
    "&::placeholder": {
      color: "rgba(0,0,0,0.6)",
      opacity: 1, 
    },
    [theme.breakpoints.up("md")]: {
      width: "20ch",
    },
  },
}));

const DNavbar = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const navigate = useNavigate();

  const { logout, admin } = useAdmin();
  const { unreadCount } = useNotifications();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const {
    open: isLogoutModal,
    openModal: openLogoutModal,
    closeModal: closeLogoutModal,
  } = useModal();
  const {
    open: isNotificationModal,
    openModal: openNotificationModal,
    closeModal: closeNotificationModal,
  } = useModal();

  const handleSignOut = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar
      position="static"
      sx={{
        background:
          "linear-gradient(90deg, rgba(16,20,45,0.98) 0%, rgba(18,22,46,0.98) 100%)",
        boxShadow: "0 12px 30px rgba(5,10,36,0.6)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        display: { md: 'flex', sm: 'flex', xs: 'none' }
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Left side - Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
          <Box
            component={"img"}
            src="/assets/images/LOGO.png"
            sx={{
              width: 230,
              height: 50,
            }}
          />
          <Search>
            <SearchIconWrapper>
              <SearchIcon sx={{ color: COLORS.seconday }} />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="   Search everything..."
              fullWidth
              inputProps={{ "aria-label": "search" }}
            />
          </Search>
        </Box>

        {/* Right side - Admin dropdown */}
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton sx={{ color: COLORS.primary }} onClick={() => navigate(ADMINS_DASHBOARD.ADMIN_COMMUNITY_HUB)}>
            <Chat />
          </IconButton>
          <IconButton sx={{ color: COLORS.green }} onClick={openNotificationModal}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          <Avatar
            sx={{
              bgcolor: COLORS.primary,
              width: 30,
              height: 30,
              cursor: 'pointer',
              color: COLORS.black,
              border: "2px solid rgba(255,255,255,0.8)",
            }}
            onClick={handleMenu}
            src={admin?.profile_image || undefined}
          >
            {
              !admin?.profile_image && admin?.first_name
                ? admin.first_name[0].toUpperCase()
                : null
            }
          </Avatar>

          {/* <Box
            onClick={handleMenu}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              bgcolor: "#ffffff",
              px: 1.2,
              py: 0.4,
              borderRadius: 20,
              cursor: "pointer",
              border: "1px solid rgba(0,0,0,0.08)",
            }}
          >
            <Typography sx={{ color: COLORS.black, fontSize: '12px', fontWeight: 600 }}>
              {admin?.first_name}
            </Typography>
            <ArrowDropDown sx={{ color: COLORS.black }} />
          </Box> */}

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 150,
                ml: -2,
                borderRadius: 2,
                boxShadow: "0 16px 36px rgba(5,10,36,0.25)",
              },
            }}
          >
            {/* <MenuItem onClick={() => navigate(ADMINS_DASHBOARD.SETTINGS)}>
              <PersonOutline /> Profile
            </MenuItem> */}
            <MenuItem onClick={() => navigate(ADMINS_DASHBOARD.SETTINGS)}>
              <SettingsOutlined /> Settings
            </MenuItem>
            <MenuItem onClick={openLogoutModal} sx={{ color: '#e91d1dff' }}> <LogoutOutlined /> Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
      {isLogoutModal && (
        <ConfirmModal
          open={isLogoutModal}
          onCloseModal={closeLogoutModal}
          icon={<LogoutOutlined />}
          btnText="Yes,Sure"
          title="Are you sure to logout, You are Admin"
          onClick={handleSignOut}
        />
      )}
      {isNotificationModal && (
        <NotificationModal
          open={isNotificationModal}
          onCloseModal={closeNotificationModal}
        />
      )}
    </AppBar>
  );
};

export default DNavbar;
