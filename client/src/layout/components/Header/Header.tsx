import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { COLORS } from "../../../constant/color";
import LOGO from "/assets/images/blackLOGO.png";
import { ChevronLeft, ChevronRight, Close, Drafts, Logout, Person, Search, Settings, WorkspacePremium } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { USER_ROUTES } from "../../../constant/route";
import MegaMenu from "../../../components/MegaMenu/MegaMenu";
import { useCartStore } from "../../../stores";
import { Avatar, Badge, Link, ListItemIcon, Menu, MenuItem } from "@mui/material";
import useModal from "../../../hooks/useModal";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { useAuth } from "../../../context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import RemindersDrawer from "../../../components/RemindersDrawer/RemindersDrawer";
import {
  fetchAllCardsCatalog,
  fetchAllCategoriesFromDB,
  fetchAllCategoryNamesFromDB,
  fetchAllTempletDesigns,
} from "../../../source/source";

interface Props {
  window?: () => Window;
}

const drawerWidth = 200;
const navItems = ["Home", "About", "Contact"];

function useHScrollArrows() {
  const listRef = React.useRef<HTMLUListElement | null>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);
  const update = React.useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 0);
    setCanRight(scrollLeft < max - 1);
  }, []);

  React.useEffect(() => {
    update();
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => update();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [update]);

  const scrollByAmount = React.useCallback((dir: "left" | "right") => {
    const el = listRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.8) * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  return { listRef, canLeft, canRight, scrollByAmount };
}

export default function Header(props: Props) {
  const { window } = props;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading, signOut } = useAuth();
  const { cart } = useCartStore();
  const location = useLocation()


  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const { data: navCategories = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ["navCategories"],
    queryFn: fetchAllCategoriesFromDB,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  React.useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: ["categories"],
      queryFn: fetchAllCategoryNamesFromDB,
      staleTime: 1000 * 60 * 5,
    });
    queryClient.prefetchQuery({
      queryKey: ["cards"],
      queryFn: fetchAllCardsCatalog,
      staleTime: 1000 * 60 * 5,
    });
    queryClient.prefetchQuery({
      queryKey: ["templates"],
      queryFn: fetchAllTempletDesigns,
      staleTime: 1000 * 60 * 5,
    });
  }, [queryClient]);

  const navCategoriesWithFallback = React.useMemo(() => {
    const addMugSubs = (subs: any[]) => {
      const desired = ["Initials/Name", "Slogans"];
      const list = Array.isArray(subs) ? [...subs] : [];
      desired.forEach((d) => {
        if (!list.some((s) => String(s).trim().toLowerCase() === d.toLowerCase())) {
          list.push(d);
        }
      });
      return list;
    };

    return (navCategories ?? []).map((c: any) => {
      const name = String(c?.name ?? "");
      if (name.toLowerCase().includes("mug")) {
        return { ...c, subcategories: addMugSubs(c?.subcategories) };
      }
      return c;
    });
  }, [navCategories]);

  // Only strings for the top row
  const mainCategoryNames = React.useMemo(
    () => navCategoriesWithFallback.map((c) => c.name).filter(Boolean),
    [navCategoriesWithFallback]
  );

  // Build a map: main name -> MegaMenuItem
  const megaMenuMap: Record<string, any> = React.useMemo(() => {
    const map: Record<string, any> = {};
    for (const c of navCategoriesWithFallback) {
      const subs = c.subcategories ?? [];
      const subSub = c.sub_subcategories ?? {};

      const cols: any[] = subs.map((sub: any) => ({
        name: sub,
        links: (subSub[sub] ?? []).slice(0),
      }));

      map[c.name] = {
        title: c.name,
        categories: cols,
      };
    }
    return map;
  }, [navCategories]);

  const handleDrawerToggle = () => {
    setMobileOpen((prevState) => !prevState);
  };

  const [hoveredMenuItem, setHoveredMenuItem] = React.useState<string | null>(null);
  const handleMouseEnter = (item: string) => setHoveredMenuItem(item);
  const handleMouseLeave = () => setHoveredMenuItem(null);
  // const handleSelect = () => setHoveredMenuItem(null);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { listRef, canLeft, canRight, scrollByAmount } = useHScrollArrows();
  const accountReady = Boolean(user || profile);
  const avatarSrc =
    user?.user_metadata?.avatar_url ||
    profile?.profileUrl ||
    undefined;
  const avatarAlt =
    user?.user_metadata?.name ||
    profile?.full_name ||
    user?.email ||
    profile?.email ||
    "Account";
  const avatarInitial =
    avatarAlt?.trim().charAt(0).toUpperCase() || "A";


  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleCloseMenu();
    openLogout();
  };

  const openSignIn = React.useCallback(() => {
    navigate(USER_ROUTES.SIGNIN, {
      state: {
        redirectTo: null,
        redirectState: null,
      },
    });
  }, [location, navigate]);

  // For Logout Modal
  const {
    open: isOpenLogout,
    openModal: openLogout,
    closeModal: closeLogout,
  } = useModal();

  if (isError) {
    return <Box sx={{ p: 2, textAlign: "center" }}>Failed to load categories</Box>;
  }

  const drawer = (
    <Box sx={{ textAlign: "center", pt: 8 }}>
      <IconButton sx={{ position: "absolute", top: 0, right: 2 }}>
        <Close onClick={handleDrawerToggle} fontSize="large" />
      </IconButton>
      <Box
        component={"img"}
        src={LOGO}
        alt="LOGO"
        sx={{ width: 200, height: 50, mb: { md: 8, sm: 8, xs: 0 } }}
      />
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem key={item} disablePadding>
            <ListItemButton sx={{ textAlign: "center" }}>
              <ListItemText primary={item} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box
      sx={{
        display: "flex",
        bgcolor: COLORS.white,
        flexDirection: "column",
        position: "relative",
        pt: 1,
        width: "100%",
      }}
    >
      <Box
        sx={{
          width: { lg: "1360px", md: "100%", sm: "100%", xs: "100%" },
          display: "flex",
          justifyContent: "center",
          m: "auto",
        }}
      >
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            background: "transparent",
            position: "sticky",
            // top: 20,
            width: "100%",
          }}
        >
          <Toolbar>
            <Box
              sx={{
                display: { md: "none", sm: "none", xs: "flex" },
                flexDirection: "column",
                width: "100%",
                mb: 2,
              }}
            >
              <Box
                sx={{
                  display: { md: "none", sm: "none", xs: "flex" },
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ color: COLORS.black, mt: -2 }}
                  >
                    <MenuIcon fontSize="large" />
                  </IconButton>
                  <a href="/">
                    <Box
                      component={"img"}
                      src={LOGO}
                      alt="LOGO"
                      width={150}
                      height={50}
                    />
                  </a>

                </Box>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {accountReady ? (
                    <>
                      <IconButton onClick={handleOpenMenu}>
                        <Avatar sx={{ bgcolor: "orange" }} src={avatarSrc} alt={avatarAlt}>
                          {!avatarSrc ? avatarInitial : null}
                        </Avatar>
                      </IconButton>

                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleCloseMenu}
                      >
                        <MenuItem
                          onClick={() => {
                            // navigate(USER_ROUTES.ACCOUNT_SETTINGS);
                            handleCloseMenu();
                          }}
                          sx={{ width: 150 }}
                        >
                          <ListItemIcon>
                            <Person fontSize="small" />
                          </ListItemIcon>
                          <Typography>Profile</Typography>
                        </MenuItem>

                        <MenuItem
                          onClick={() => {
                            // navigate(USER_ROUTES.SETTINGS);
                            handleCloseMenu();
                          }}
                        >
                          <ListItemIcon>
                            <Settings fontSize="small" />
                          </ListItemIcon>
                          <Typography>Settings</Typography>
                        </MenuItem>

                        <MenuItem onClick={handleLogout}>
                          <ListItemIcon>
                            <Logout fontSize="small" sx={{ color: "red" }} />
                          </ListItemIcon>
                          <Typography>Logout</Typography>
                        </MenuItem>
                      </Menu>
                    </>
                  ) : loading ? null : (
                    <IconButton
                      sx={iconStyle}
                      onClick={openSignIn}
                    >
                      <Box
                        component={"img"}
                        src="/assets/icons/Account.svg"
                        sx={{
                          width: 35,
                          height: 35,
                        }}
                      />
                      <Typography fontSize={"10px"}>Accounts</Typography>
                    </IconButton>
                  )}

                  <IconButton
                    sx={iconStyle}
                    onClick={() => navigate(USER_ROUTES.ADD_TO_CART)}
                  >
                    {/* ✅ Add badge here */}
                    <Badge
                      badgeContent={cart.length}
                      color="error"
                      overlap="circular"
                      showZero
                    >
                      <Box
                        component={"img"}
                        src="/assets/icons/Basket.svg"
                        sx={{
                          width: 35,
                          height: 35,
                        }}
                      />
                    </Badge>
                    <Typography fontSize={"10px"}>Basket</Typography>
                  </IconButton>
                </Box>
              </Box>

              <Box
                sx={{
                  border: `2px solid ${COLORS.black}`,
                  borderRadius: 8,
                  flexGrow: 1,
                  height: "45px",
                  display: "flex",
                  // bgcolor: "lightGray",
                  // bgcolor:COLORS.gray,
                  justifyContent: "space-between",
                  alignItems: "center",
                  // py: 1,
                }}
              >
                <Box
                  component="input"
                  sx={searchInputStyle}
                  placeholder="Search for cards, gift and flowers...."
                  onChange={(e) => setSearch(e.target.value)}
                />

                <Search
                  onClick={() => navigate(`${USER_ROUTES.VIEW_ALL}/${search}`)}
                  fontSize="large"
                  sx={{ color: COLORS.black, mr: 1, cursor: "pointer" }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                flexGrow: 1,
                display: {
                  md: "flex",
                  xs: "none",
                  sm: "block",
                },
                alignItems: "center",
              }}
            >
              <a href="/">
                <Box
                  component={"img"}
                  src={LOGO}
                  alt="LOGO"
                  width={{ lg: "450px", md: "450px", sm: "550px", xs: "100%" }}
                  height={150}
                />
              </a>
              <Box
                sx={{
                  // bgcolor: COLORS.black,
                  // border:`1px solid ${COLORS.black}`,
                  borderRadius: 2,
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2,
                  height: "70px",
                }}
              >
                <Box
                  sx={{
                    border: `2px solid ${COLORS.black}`,
                    borderRadius: 8,
                    flexGrow: 1,
                    height: "45px",
                    display: "flex",
                    // bgcolor: "lightGray",
                    // bgcolor:COLORS.gray,
                    justifyContent: "space-between",
                    alignItems: "center",
                    // py: 1,
                  }}
                >
                  <Box
                    component="input"
                    sx={searchInputStyle}
                    placeholder="Search for cards, gift and flowers...."
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && search.trim() !== "") {
                        navigate(`${USER_ROUTES.VIEW_ALL}/${search}`);
                      }
                    }}
                  />

                  <Search
                    onClick={() =>
                      navigate(`${USER_ROUTES.VIEW_ALL}/${search}`)
                    }
                    fontSize="large"
                    sx={{ color: COLORS.black, mr: 1, cursor: "pointer" }}
                  />
                </Box>
                <Box
                  sx={{
                    display: {
                      md: "flex",
                      xs: "none",
                      sm: "block",
                      gap: "12px",
                    },
                  }}
                >
                  {/* reminder drawer  */}

                  <RemindersDrawer />
                  {accountReady ? (
                    <>
                      <IconButton onClick={handleOpenMenu}>
                        <Avatar
                          sx={{
                            bgcolor: "orange",
                            width: 40,
                            height: 40,
                            border: "2px solid orange",
                          }}
                          src={avatarSrc}
                          alt={avatarAlt}
                        >
                          {!avatarSrc ? avatarInitial : null}
                        </Avatar>
                      </IconButton>

                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleCloseMenu}
                      >
                        <MenuItem
                          onClick={() => {
                            navigate(USER_ROUTES.USER_PROFILE);
                            handleCloseMenu();
                          }}
                          sx={{ width: 150 }}
                        >
                          <ListItemIcon>
                            <Person fontSize="small" />
                          </ListItemIcon>
                          <Typography>Profile</Typography>
                        </MenuItem>

                        <MenuItem
                          onClick={() => {
                            navigate(USER_ROUTES.USER_DRAFTS_CARDS);
                            handleCloseMenu();
                          }}
                        >
                          <ListItemIcon>
                            <Drafts fontSize="small" />
                          </ListItemIcon>
                          <Typography>Drafts</Typography>
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            navigate(USER_ROUTES.PREMIUM_PLANS);
                            handleCloseMenu();
                          }}
                        >
                          <ListItemIcon>
                            <WorkspacePremium fontSize="small" />
                          </ListItemIcon>
                          <Typography>Subscription</Typography>
                        </MenuItem>

                        <MenuItem onClick={handleLogout}>
                          <ListItemIcon>
                            <Logout fontSize="small" sx={{ color: "red" }} />
                          </ListItemIcon>
                          <Typography>Logout</Typography>
                        </MenuItem>
                      </Menu>
                    </>
                  ) : loading ? null : (
                    <IconButton
                      sx={iconStyle}
                      onClick={openSignIn}
                    >
                      <Box
                        component={"img"}
                        src="/assets/icons/Account.svg"
                        sx={{
                          width: 35,
                          height: 35,
                        }}
                      />
                      {/* <Person fontSize="large"/> */}
                      <Typography fontSize="12px">Accounts</Typography>
                    </IconButton>
                  )}

                  <IconButton
                    sx={iconStyle}
                    onClick={() => navigate(USER_ROUTES.ADD_TO_CART)}
                  >
                    {/* ✅ Add badge here */}
                    <Badge
                      badgeContent={cart.length}
                      color="error"
                      overlap="circular"
                      showZero
                    >
                      <Box
                        component={"img"}
                        src="/assets/icons/Basket.svg"
                        sx={{
                          width: 35,
                          height: 35,
                        }}
                      />
                      {/* <ShoppingBag fontSize="large"/> */}
                    </Badge>
                    <Typography fontSize={"12px"}>Basket</Typography>
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>
        <nav>
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                bgcolor: COLORS.primary,
                color: COLORS.white,
              },
            }}
          >
            {drawer}
          </Drawer>
        </nav>
      </Box>
      {
        location.pathname === USER_ROUTES.USER_PROFILE || location.pathname === USER_ROUTES.SUBSCRIPTION ? null :
          <Box
            sx={{
              width: "100%",
              display: { md: "flex", sm: "flex", xs: "flex" },
              m: "auto",
              flexDirection: "column",
              position: "relative",
              bgcolor: COLORS.primary,
              mt: "3px",
            }}
            onMouseLeave={handleMouseLeave}
          >

            {/* Left arrow */}
            <IconButton
              onClick={() => scrollByAmount("left")}
              disabled={!canLeft}
              sx={{
                position: "absolute",
                left: { lg: 0, md: 0, sm: 0, xs: 4 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                bgcolor: "rgba(255,255,255,0.95)",
                border: "1px solid #e5e7eb",
                boxShadow: 1,
                "&:hover": { bgcolor: "#fff" },
                opacity: canLeft ? 1 : 0.5,
                pointerEvents: canLeft ? "auto" : "none",
                width: { xs: 28, sm: 32, md: 36 },
                height: { xs: 28, sm: 32, md: 36 },
              }}
            >
              <ChevronLeft />
            </IconButton>

            {/* Right arrow */}
            <IconButton
              onClick={() => scrollByAmount("right")}
              disabled={!canRight}
              sx={{
                position: "absolute",
                right: { lg: 0, md: 0, sm: 0, xs: 4 },
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 2,
                bgcolor: "rgba(255,255,255,0.95)",
                border: "1px solid #e5e7eb",
                boxShadow: 1,
                "&:hover": { bgcolor: "#fff" },
                opacity: canRight ? 1 : 0.5,
                pointerEvents: canRight ? "auto" : "none",
                width: { xs: 28, sm: 32, md: 36 },
                height: { xs: 28, sm: 32, md: 36 },
              }}
            >
              <ChevronRight />
            </IconButton>

            <List
              ref={listRef}
              disablePadding
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 2, sm: 3, md: 5 },
                p: { xs: 1.5, sm: 2, md: 3 },
                m: "auto",
                flexWrap: "nowrap",
                overflowX: "auto",
                scrollBehavior: "smooth",
                width: { lg: 1300, md: '100%', sm: '100%', xs: "100%" },
                // Hide scrollbar
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
                position: "relative",
                maskImage:
                  "linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)",
              }}
            >

              {isLoading && <Box sx={{ pt: 2, textAlign: "center", justifyContent: 'center', display: 'flex', m: 'auto' }}>Loading...</Box>}

              {mainCategoryNames.map((name) => (
                <ListItem
                  key={name}
                  disableGutters
                  disablePadding
                  onMouseEnter={() => handleMouseEnter(name)}
                  sx={{ flex: "0 0 auto", width: "auto" }}
                >
                  <Link
                    component="button"
                    type="button"
                    onClick={() =>
                      navigate(`${USER_ROUTES.VIEW_ALL}/${encodeURIComponent(name)}`, {
                        state: { categoryName: name },
                      })
                    }
                    sx={{
                      m: 0,
                      p: 0,
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: 16,
                      color: COLORS.black,
                      background: "transparent",
                      border: "none",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      "&:hover": { color: "rgba(46, 46, 46, 1)" },
                    }}
                  >
                    {name}
                  </Link>
                </ListItem>
              ))}
            </List>

            <Box
              sx={{
                width: { lg: "1340px", md: "100%", sm: "", xs: "auto" },
                display: "flex",
                m: "auto",
                justifyContent: "center",
              }}
            >
              {hoveredMenuItem && megaMenuMap[hoveredMenuItem] && (
                <MegaMenu data={megaMenuMap[hoveredMenuItem]} onSelect={({ tabName, subCategory, subSubCategory }) => {
                  navigate(`${USER_ROUTES.VIEW_ALL}/${encodeURIComponent(tabName)}`, {
                    state: { categoryName: tabName, subCategory, subSubCategory },
                  });
                }}
                />
              )}
            </Box>
          </Box>
      }


      {isOpenLogout && (
        <ConfirmModal open={isOpenLogout} onCloseModal={closeLogout} />
      )}
    </Box>
  );
}

const iconStyle = {
  color: COLORS.black,
  flexDirection: "column",
  "&:hover": {
    color: COLORS.primary,
    bgcolor: "transparent",
  },
};

const searchInputStyle = {
  width: "100%",
  height: "42px",
  borderRadius: 8,
  bgcolor: "transparent",
  border: "none",
  outline: "none",
  ml: 1,
  "&:hover": {
    border: "none",
    outline: "none",
  },
  "&:focus": {
    border: "none",
    outline: "none",
  },
  "&:active": {
    border: "none",
    outline: "none",
  },
  "&::placeholder": {
    color: "#212121",
    fontWeight: 700,
    fontSize: "14px",
  },
};
