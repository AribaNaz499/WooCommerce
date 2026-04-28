import { useMemo, useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { COLORS } from "../../constant/color";

interface Category {
  name: string;      // main category
  links: string[];   // subCategories or "sub > subSub" strings (optional)
}

interface MegaMenuItem {
  title: string;
  categories: Category[];
}

type MegaSelectPayload = {
  tabName: string;                 // main category (active.name)
  subCategory?: string | null;     // selected subCategory
  subSubCategory?: string | null;  // selected subSubCategory (optional)
  isFooter?: boolean;              // shop all / footer link
  label?: string;                  // clicked label
};

const splitFooters = (links: string[] = []) => {
  const footers = links.filter((l) => /shop all/i.test(l) || /all .*$/i.test(l));
  const items = links.filter((l) => !footers.includes(l));
  return { items, footers };
};

const distributeIntoThree = <T,>(arr: T[]) => {
  const cols: [T[], T[], T[]] = [[], [], []];
  arr.forEach((item, i) => cols[i % 3].push(item));
  return cols;
};

// if your data already comes like "Birthday Cards > Funny"
// then this parser will split it.
// Otherwise it will treat whole string as subCategory.
const parseLink = (link: string) => {
  const parts = link
    .split(/>|\/|-/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    subCategory: parts[0] ?? link,
    subSubCategory: parts[1] ?? null,
  };
};

const MegaMenu = ({
  data,
  onSelect,
}: {
  data: MegaMenuItem;
  onSelect: (payload: MegaSelectPayload) => void;
}) => {
  const columns = useMemo(() => {
    const cats = data?.categories ?? [];
    return cats.map((col) => {
      const { items, footers } = splitFooters(col.links ?? []);
      return { ...col, items, footers };
    });
  }, [data]);

  const [activeIdx, setActiveIdx] = useState(0);

  // hovered subCategory + list of subSubCategory
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [subSubList, setSubSubList] = useState<string[]>([]);

  useEffect(() => {
    if (activeIdx >= columns.length) setActiveIdx(0);
  }, [columns.length, activeIdx]);

  const active = columns[activeIdx];

  // when main category changes, reset sub/subSub
  useEffect(() => {
    setActiveSub(null);
    setSubSubList([]);
  }, [activeIdx]);

  const [colA, colB, colC] = useMemo(() => distributeIntoThree(columns), [columns]);

  // derive "sub categories" list from active.items
  // - if active.items contain "Sub > SubSub" strings:
  //   we build unique subCategory list, and on hover show subSub list for that subCategory.
  // - if active.items are plain strings:
  //   then subSubList will be empty unless your data supports it.
  const subCategories = useMemo(() => {
    const list = active?.items ?? [];
    const map = new Map<string, string[]>();

    list.forEach((raw) => {
      const { subCategory, subSubCategory } = parseLink(raw);
      if (!map.has(subCategory)) map.set(subCategory, []);
      if (subSubCategory) {
        map.get(subCategory)!.push(subSubCategory);
      }
    });

    // remove duplicates in subSub arrays
    for (const [k, arr] of map.entries()) {
      map.set(k, Array.from(new Set(arr)));
    }

    return Array.from(map.entries()).map(([name, subs]) => ({
      name,
      subs,
    }));
  }, [active?.items]);

  const handleSubHover = (subName: string) => {
    setActiveSub(subName);

    const found = subCategories.find((s) => s.name === subName);
    setSubSubList(found?.subs ?? []);
  };

  const handleSubClick = (subName: string) => {
    onSelect({
      tabName: active?.name ?? "",
      subCategory: subName,
      subSubCategory: null,
      isFooter: false,
      label: subName,
    });
  };

  const handleSubSubClick = (subSub: string) => {
    onSelect({
      tabName: active?.name ?? "",
      subCategory: activeSub,
      subSubCategory: subSub,
      isFooter: false,
      label: subSub,
    });
  };

  const handleFooterClick = (label: string) => {
    onSelect({
      tabName: active?.name ?? "",
      subCategory: null,
      subSubCategory: null,
      isFooter: true,
      label,
    });
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: "80%",
        left: 0,
        width: "100%",
        zIndex: 10,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "auto",
      }}
      role="dialog"
      aria-label={data?.title ?? "Mega menu"}
    >
      <Box
        sx={{
          width: { lg: 1340, md: "100%", sm: "100%", xs: "100%" },
          bgcolor: "#fff",
          p: 3,
          boxShadow: 3,
          position: "absolute",
          top: 0,
          minHeight: 240,
          maxHeight: 520,
          overflowY: "auto",
          "&::-webkit-scrollbar": { height: "6px", width: 6 },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
            borderRadius: "20px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: COLORS.primary,
            borderRadius: "20px",
          },
          display: "grid",
          gap: 3,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "1fr",
            // 3 columns for main category names, then subCategories, then subSubCategories
            md: "repeat(3, minmax(0, 1fr)) minmax(0, 1.2fr) minmax(0, 1.2fr)",
          },
        }}
      >
        {/* Column 1 */}
        <Box role="list" aria-label="Categories column 1">
          {colA.map((category, idx) => {
            const realIdx = columns.indexOf(category);
            const isActive = realIdx === activeIdx;
            return (
              <Typography
                key={`cat-a-${category.name}-${idx}`}
                variant="subtitle1"
                onMouseEnter={() => setActiveIdx(realIdx)}
                onFocus={() => setActiveIdx(realIdx)}
                tabIndex={0}
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: isActive ? COLORS.primary : COLORS.seconday,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  textDecoration: isActive ? "underline" : "none",
                }}
                aria-current={isActive ? "true" : undefined}
              >
                {category.name}
              </Typography>
            );
          })}
        </Box>

        {/* Column 2 */}
        <Box role="list" aria-label="Categories column 2">
          {colB.map((category, idx) => {
            const realIdx = columns.indexOf(category);
            const isActive = realIdx === activeIdx;
            return (
              <Typography
                key={`cat-b-${category.name}-${idx}`}
                variant="subtitle1"
                onMouseEnter={() => setActiveIdx(realIdx)}
                onFocus={() => setActiveIdx(realIdx)}
                tabIndex={0}
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: isActive ? COLORS.primary : COLORS.seconday,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  textDecoration: isActive ? "underline" : "none",
                }}
                aria-current={isActive ? "true" : undefined}
              >
                {category.name}
              </Typography>
            );
          })}
        </Box>

        {/* Column 3 */}
        <Box role="list" aria-label="Categories column 3">
          {colC.map((category, idx) => {
            const realIdx = columns.indexOf(category);
            const isActive = realIdx === activeIdx;
            return (
              <Typography
                key={`cat-c-${category.name}-${idx}`}
                variant="subtitle1"
                onMouseEnter={() => setActiveIdx(realIdx)}
                onFocus={() => setActiveIdx(realIdx)}
                tabIndex={0}
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: isActive ? COLORS.primary : COLORS.seconday,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  textDecoration: isActive ? "underline" : "none",
                }}
                aria-current={isActive ? "true" : undefined}
              >
                {category.name}
              </Typography>
            );
          })}
        </Box>

        {/* Column 4 — SubCategories */}
        <Box>
          {active ? (
            <>
              <Typography sx={{ fontWeight: 700, mb: 1, color: COLORS.seconday }}>
                {active.name}
              </Typography>

              <List
                dense
                disablePadding
                sx={{
                  p: 0,
                  m: 0,
                  overflow: "auto",
                  maxHeight: 360,
                  "&::-webkit-scrollbar": { width: 6 },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#ddd",
                    borderRadius: 10,
                  },
                }}
                aria-label={`Subcategories of ${active.name}`}
              >
                {subCategories.map((sc, i) => {
                  const isActiveSub = sc.name === activeSub;
                  return (
                    <ListItemButton
                      key={`sub-${active.name}-${sc.name}-${i}`}
                      sx={{
                        py: 0.25,
                        px: 0,
                        "&:hover": { bgcolor: "transparent" },
                      }}
                      disableRipple
                      onMouseEnter={() => handleSubHover(sc.name)}
                      onFocus={() => handleSubHover(sc.name)}
                      onClick={() => handleSubClick(sc.name)} // ✅ navigate with tab + subCategory
                    >
                      <ListItemText
                        primary={sc.name}
                        primaryTypographyProps={{
                          fontSize: 14,
                          color: isActiveSub ? COLORS.primary : "#212121",
                          fontWeight: isActiveSub ? 700 : 400,
                        }}
                        sx={{
                          m: 0,
                          "& .MuiListItemText-primary:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      />
                    </ListItemButton>
                  );
                })}

                {/* Footers */}
                {active.footers.length > 0 && (
                  <Box sx={{ pt: 0.75 }}>
                    {active.footers.map((link, i) => (
                      <ListItemButton
                        key={`footer-${active.name}-${link}-${i}`}
                        sx={{
                          py: 0.25,
                          px: 0,
                          "&:hover": { bgcolor: "transparent" },
                        }}
                        disableRipple
                        onClick={() => handleFooterClick(link)} // ✅ shop all => only tab
                      >
                        <ListItemText
                          primary={link}
                          primaryTypographyProps={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: COLORS.primary,
                          }}
                          sx={{
                            m: 0,
                            "& .MuiListItemText-primary:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </Box>
                )}
              </List>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No subcategories
            </Typography>
          )}
        </Box>

        {/* Column 5 — SubSubCategories */}
        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1, color: COLORS.seconday }}>
            {activeSub ? activeSub : " "}
          </Typography>

          {subSubList.length > 0 ? (
            <List
              dense
              disablePadding
              sx={{
                p: 0,
                m: 0,
                overflow: "auto",
                maxHeight: 360,
                "&::-webkit-scrollbar": { width: 6 },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#ddd",
                  borderRadius: 10,
                },
              }}
              aria-label={`Sub-subcategories of ${activeSub ?? ""}`}
            >
              {subSubList.map((ss, i) => (
                <ListItemButton
                  key={`subsub-${active?.name}-${activeSub}-${ss}-${i}`}
                  sx={{
                    py: 0.25,
                    px: 0,
                    "&:hover": { bgcolor: "transparent" },
                  }}
                  disableRipple
                  onClick={() => handleSubSubClick(ss)} // ✅ navigate with tab + sub + subSub
                >
                  <ListItemText
                    primary={ss}
                    primaryTypographyProps={{ fontSize: 14, color: "#212121" }}
                    sx={{
                      m: 0,
                      "& .MuiListItemText-primary:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {activeSub ? "No sub-subcategories" : "Hover a subcategory"}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default MegaMenu;
