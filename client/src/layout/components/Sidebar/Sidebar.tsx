import { Box } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { ADMINS_DASHBOARD } from "../../../constant/route";
import {
  AddShoppingCart,
  ArrowForwardIos,
  AssessmentOutlined,
  FolderOutlined,
  FormatListBulleted,
  HomeOutlined,
  LocalOfferOutlined,
  NewspaperOutlined,
  OndemandVideoOutlined,
  PeopleOutline,
  Person2Outlined,
  SettingsOutlined,
  WorkspacePremiumOutlined,
} from "@mui/icons-material";
import { COLORS } from "../../../constant/color";

const Sidebar = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const links = [
    {
      icon: <HomeOutlined />,
      title: "Dashboard",
      href: ADMINS_DASHBOARD.HOME,
    },
    {
      icon: <Person2Outlined />,
      title: "Customers",
      href: ADMINS_DASHBOARD.CUSTOMERS,
    },
    {
      icon: <FormatListBulleted />,
      title: "Orders",
      href: ADMINS_DASHBOARD.ORDERS_LIST,
    },
    {
      icon: <LocalOfferOutlined />,
      title: "Products",
      href: ADMINS_DASHBOARD.PRODUCTS_LIST,
    },
    {
      icon: <FolderOutlined />,
      title: "Categories",
      href: ADMINS_DASHBOARD.ADMIN_CATEGORIES,
    },
    {
      icon: <AddShoppingCart />,
      title: "Add Products",
      href: ADMINS_DASHBOARD.ADD_NEW_CARDS,
    },
    {
      icon: <NewspaperOutlined />,
      title: "Our Blogs",
      href: ADMINS_DASHBOARD.ADMIN_BLOGS,
    },
    {
      icon: <WorkspacePremiumOutlined />,
      title: "Subscriptions",
      href: ADMINS_DASHBOARD.ADMIN_SUBSCRIPTION_PLANS,
    },
    {
      icon: <PeopleOutline />,
      title: "Community Hub",
      href: ADMINS_DASHBOARD.ADMIN_COMMUNITY_HUB,
    },
    {
      icon: <OndemandVideoOutlined />,
      title: "Toturial Guide",
      href: ADMINS_DASHBOARD.ADMIN_TOTURIAL_GUIDE,
    },
    {
      icon: <AssessmentOutlined />,
      title: "Reports",
      href: ADMINS_DASHBOARD.ADMIN_REPORTS,
    },
    {
      icon: <SettingsOutlined />,
      title: "Personal Settings",
      href: ADMINS_DASHBOARD.SETTINGS,
    },
  ];

  return (
    <Box>
      <Box
        sx={{
          // pt: 2,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 0,
        }}
      >
        {links.map((e) => {
          const isActive = pathname === e.href;

          return (
            <Link
              to={e.href}
              key={e.href}
              style={{
                display: "flex",
                gap: "25px",
                justifyContent: "space-between",
                alignItems: "center",
                height: "44px",
                borderRadius: 10,
                fontWeight: 600,
                paddingLeft: 12,
                fontSize: '12px',
                textDecoration: "none",
                color: isActive ? COLORS.black : "rgba(255,255,255,0.78)",
                backgroundColor: isActive ? "rgba(86,190,204,0.75)" : "transparent",
                border: isActive ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
                transition: "background-color 0.3s",
                marginBottom: 4,
                boxShadow: isActive ? "0 10px 24px rgba(6,10,35,0.35)" : "none",
              }}
            >
              <Box
                sx={{ display: "flex", gap: 1, alignItems: "center", flex: 1 }}
              >
                {e.icon}
                {e.title}
              </Box>

              <ArrowForwardIos fontSize="small" />
            </Link>
          );
        })}
      </Box>
    </Box>
  );
};

export default Sidebar;
