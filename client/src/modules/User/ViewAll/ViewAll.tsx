import { useEffect, useMemo, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { TuneOutlined } from "@mui/icons-material";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { COLORS } from "../../../constant/color";
import useModal from "../../../hooks/useModal";
import ProductPopup from "../../../components/ProductPopup/ProductPopup";
import MainLayout from "../../../layout/MainLayout";
import { USER_ROUTES } from "../../../constant/route";
import SmartImage from "../../../components/SmartImage/SmartImage";
import { shouldSmartCropCategory } from "../../../lib/thumbnail";
import TemplateSvgThumbnail from "../../../components/TemplateSvgThumbnail/TemplateSvgThumbnail";
import {
  fetchAllCardsCatalog,
  fetchAllCategoryNamesFromDB,
  fetchTempletDesignsByCategory,
  fetchAllTempletDesigns,
} from "../../../source/source";
import { useAuth } from "../../../context/AuthContext";
import { logTiming } from "../../../lib/debugTimings";
import { isSafariBrowser } from "../../../lib/platform";
import {
  buildSignInRedirectUrl,
  getAuthReturnPath,
  savePendingAuthRedirect,
} from "../../../lib/authRedirect";

const VIEW_ALL = "View All Filters";

// Types
interface Category {
  id: number;
  name: string;
}

interface CardItem {
  id: number;
  cardname?: string;
  cardcategory?: string;
  cardCategory?: string;
  card_category?: string;
  subCategory?: string;
  subcategory?: string;
  subSubCategory?: string;
  sub_subcategory?: string;
  category?: string;
  imageurl?: string;
  imageUrl?: string;
  lastpageImageUrl?: string;
  __type?: "card" | "templet";
  [key: string]: any;
}

interface TemplateItem {
  id: number;
  title?: string;
  category?: string;
  subCategory?: string;
  subcategory?: string;
  subSubCategory?: string;
  sub_subcategory?: string;
  categoryName?: string;
  templetCategory?: string;
  img_url?: string;
  imageUrl?: string;
  __type?: "card" | "templet";
  [key: string]: any;
}

type ItemType = CardItem | TemplateItem;

const lc = (s: string | null | undefined): string => {
  return s == null ? "" : String(s).trim().toLowerCase();
};

const norm = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "");

const singular = (value: unknown): string => {
  const clean = norm(value);
  if (!clean || clean.endsWith("ss")) return clean;
  if (clean.endsWith("ies")) return `${clean.slice(0, -3)}y`;
  if (clean.endsWith("s")) return clean.slice(0, -1);
  return clean;
};

const categoryAliases = (value: unknown): string[] => {
  const clean = norm(value);
  const single = singular(value);
  return Array.from(new Set([clean, single].filter(Boolean)));
};

const matchesCategoryLike = (left: unknown, right: unknown): boolean => {
  const leftKeys = categoryAliases(left);
  const rightKeys = categoryAliases(right);
  if (!leftKeys.length || !rightKeys.length) return false;
  return leftKeys.some((l) =>
    rightKeys.some((r) => l === r || l.includes(r) || r.includes(l))
  );
};

const getItemCategory = (item: ItemType): string => {
  if (item?.cardcategory) return item.cardcategory;
  if (item?.cardCategory) return item.cardCategory;
  if ((item as any)?.card_category) return (item as any).card_category;
  if (item?.category) return item.category;
  if ((item as any)?.categoryName) return (item as any).categoryName;
  if ((item as any)?.templetCategory) return (item as any).templetCategory;
  return "";
};

const getItemDisplayCategory = (item: ItemType): string => {
  const subSubCategory = getItemSubSubCategory(item);
  if (subSubCategory) return subSubCategory;

  const subCategory = getItemSubCategory(item);
  if (subCategory) return subCategory;

  return getItemCategory(item);
};

const getItemSubCategory = (item: ItemType): string => {
  return String((item as any)?.subCategory ?? (item as any)?.subcategory ?? "").trim();
};

const getItemSubSubCategory = (item: ItemType): string => {
  return String((item as any)?.subSubCategory ?? (item as any)?.sub_subcategory ?? "").trim();
};

const isCardsMainCategory = (value?: string) => lc(value) === "cards";

const mergeUniqueItemsByTypeAndId = (items: ItemType[]): ItemType[] => {
  const seen = new Set<string>();
  const merged: ItemType[] = [];

  for (const item of items) {
    const key = `${item.__type ?? "item"}-${String((item as any)?.id ?? "")}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }

  return merged;
};

const ViewAllCard = () => {
  const navigate = useNavigate();
  const { search } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const isSafari = useMemo(() => isSafariBrowser(), []);
  const queryClient = useQueryClient();

  const debugPanelEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      isSafariBrowser() ||
      window.localStorage.getItem("debug_console_enabled_v1") === "1" ||
      new URLSearchParams(window.location.search).get("debugConsole") === "1"
    );
  }, []);

  const state = (location.state || {}) as {
    categoryName?: string;
    categoryId?: number;
    subCategory?: string;
    subSubCategory?: string;
    focusProductId?: string | number;
    focusProductType?: "card" | "templet";
  };

  const routeName = decodeURIComponent(search || "");
  const routeCategoryName = (state.categoryName || routeName || "").trim();
  const routeCategoryId = state.categoryId || null;
  const routeSubCategory = String(state.subCategory ?? "").trim();
  const routeSubSubCategory = String(state.subSubCategory ?? "").trim();

  const title = routeCategoryName || "All Products";
  const viewingCardsCategory = isCardsMainCategory(routeCategoryName);
  const viewingSpecificNonCardCategory =
    Boolean(routeCategoryName) && !viewingCardsCategory;

  const { open: isCategoryModal, openModal, closeModal } = useModal();
  const [selectedCate, setSelectedCate] = useState<ItemType | null>(null);
  const [activeTab, setActiveTab] = useState<{ id: number | null; name: string }>({
    id: null,
    name: VIEW_ALL,
  });

  // ✅ FIX 4: refetchOnMount: "always" — ye asal root cause fix hai.
  // Pehle refetchOnMount: true tha jo React Query mein sirf tab refetch karta hai
  // jab data stale ho. Lekin Safari mein window.location.replace() ke baad
  // component remount hota hai aur React Query cached (empty) data serve karta tha
  // bina network fetch ke — isliye 4 min tak "loading" aur phir "not found" aata tha.
  // "always" guarantee karta hai ke har mount pe fresh network fetch ho.
  const queryOptions = {
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: "always" as const,
  } as const;

  const fetchTemplatesForViewAll = async (): Promise<TemplateItem[]> => {
    const fullTemplates = await fetchAllTempletDesigns();
    if (fullTemplates.length > 1) return fullTemplates;

    const categoryRows = await fetchAllCategoryNamesFromDB();
    const templateCategories = categoryRows
      .map((c: Category) => c.name)
      .filter((name: string) => !isCardsMainCategory(name));

    if (templateCategories.length === 0) return fullTemplates;

    const results = await Promise.allSettled(
      templateCategories.map((category) =>
        fetchTempletDesignsByCategory({
          category,
          subCategory: null,
          subSubCategory: null,
        })
      )
    );

    const fallbackTemplates = results.flatMap((result) =>
      result.status === "fulfilled" ? result.value : []
    ) as TemplateItem[];

    const merged = mergeUniqueItemsByTypeAndId([
      ...fullTemplates.map((item: TemplateItem) => ({ ...item, __type: "templet" as const })),
      ...fallbackTemplates.map((item: TemplateItem) => ({ ...item, __type: "templet" as const })),
    ]);

    return merged.map(({ __type, ...item }) => item as TemplateItem);
  };

  const getCachedTemplatesFallback = (): TemplateItem[] => {
    const cached = queryClient.getQueryData<TemplateItem[]>(["templates"]) ?? [];
    if (!cached.length) return [];

    if (!viewingSpecificNonCardCategory) return cached;

    return cached.filter((item) => {
      const itemCat = getItemCategory(item);
      const itemSubCat = getItemSubCategory(item);
      const matchesMainCategory =
        matchesCategoryLike(itemCat, routeCategoryName) ||
        matchesCategoryLike(itemSubCat, routeCategoryName);

      if (!matchesMainCategory) return false;
      if (routeSubCategory && norm(itemSubCat) !== norm(routeSubCategory)) return false;
      if (routeSubSubCategory && norm(getItemSubSubCategory(item)) !== norm(routeSubSubCategory)) return false;
      return true;
    });
  };

  const { data: categories = [], isLoading: catLoading, isError: categoriesError, error: categoriesQueryError } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchAllCategoryNamesFromDB,
    ...queryOptions,
  });

  const { data: cards = [], isLoading: cardsLoading, isError: cardsError, error: cardsQueryError } = useQuery({
    queryKey: ["cards"],
    queryFn: fetchAllCardsCatalog,
    ...queryOptions,
  });

  const {
    data: templates = [],
    isLoading: templatesLoading,
    isError: templatesError,
    error: templatesQueryError,
  } = useQuery({
    queryKey: viewingSpecificNonCardCategory
      ? ["templates", "view-all", routeCategoryName, routeSubCategory, routeSubSubCategory]
      : ["templates"],
    placeholderData: () => getCachedTemplatesFallback(),
    queryFn: () =>
      viewingSpecificNonCardCategory
        ? fetchTempletDesignsByCategory({
            category: routeCategoryName,
            subCategory: routeSubCategory || null,
            subSubCategory: routeSubSubCategory || null,
          })
        : fetchTemplatesForViewAll(),
    ...queryOptions,
  });

  const allCategories = useMemo(() => {
    return categories.map((c: Category) => ({ id: c.id, name: c.name }));
  }, [categories]);

  // ✅ FIX: Resume after login - open product popup if focusProductId is set
  useEffect(() => {
    const focusId = state.focusProductId;
    const focusType = state.focusProductType;
    if (!focusId || !user) return;

    // Wait for data to load
    const allItems: ItemType[] = [
      ...cards.map((c: CardItem) => ({ ...c, __type: "card" as const })),
      ...templates.map((t: TemplateItem) => ({ ...t, __type: "templet" as const })),
    ];

    if (allItems.length === 0) return; // still loading

    const found = allItems.find((item) => {
      const id = String((item as any).id);
      const matches = id === String(focusId);
      if (focusType) return matches && item.__type === focusType;
      return matches;
    });

    if (found) {
      // Clear focusProductId from location state so it doesn't re-trigger
      navigate(location.pathname, {
        replace: true,
        state: {
          ...state,
          focusProductId: undefined,
          focusProductType: undefined,
        },
      });
      setSelectedCate(found);
      openModal();
    }
  }, [state.focusProductId, user, cards, templates]);

  // Update active tab when URL changes
  useEffect(() => {
    if (!routeCategoryName) {
      if (activeTab.name !== VIEW_ALL) {
        setActiveTab({ id: null, name: VIEW_ALL });
      }
      return;
    }
    const hit = allCategories.find((c) => lc(c.name) === lc(routeCategoryName));
    const newName = hit?.name || routeCategoryName;
    if (activeTab.name !== newName) {
      setActiveTab({
        id: hit?.id || routeCategoryId || null,
        name: newName,
      });
    }
  }, [routeCategoryName, routeCategoryId, allCategories, activeTab.name]);

  // ✅ FIX 5: Safari BFCache useEffect — refetchType: "all" use karo "active" ki jagah.
  // "active" sirf un queries ko refetch karta hai jo abhi mount hain —
  // lekin BFCache restore ke waqt queries abhi "active" nahi hoti.
  // "all" guarantee karta hai ke wo bhi re-fetch hon jo abhi mount ho rahi hain.
  useEffect(() => {
    if (!isSafari) return;
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        console.log("[ViewAll Safari] BFCache restore - force refetching");
        queryClient.removeQueries({ queryKey: ["cards"] });
        queryClient.removeQueries({ queryKey: ["templates"] });
        queryClient.removeQueries({ queryKey: ["categories"] });
        queryClient.removeQueries({
          predicate: (q) => q.queryKey[0] === "templates",
        });
        queryClient.invalidateQueries({
          queryKey: ["cards"],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["templates"],
          refetchType: "all",
        });
        queryClient.invalidateQueries({
          queryKey: ["categories"],
          refetchType: "all",
        });
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [isSafari, queryClient]);

  const clickViewAll = () => {
    setActiveTab({ id: null, name: VIEW_ALL });
    navigate(USER_ROUTES.VIEW_ALL, {
      replace: true,
      state: { categoryName: null, categoryId: null },
    });
  };

  const clickTab = (c: { id: number; name: string }) => {
    setActiveTab({ id: c.id, name: c.name });
    navigate(`${USER_ROUTES.VIEW_ALL}/${encodeURIComponent(c.name)}`, {
      replace: true,
      state: { categoryName: c.name, categoryId: c.id },
    });
  };

  // Filter items
  const filteredItems = useMemo(() => {
    const cardItems: ItemType[] = cards.map((c: CardItem) => ({ ...c, __type: "card" as const }));
    const templateItems: ItemType[] = templates.map((t: TemplateItem) => ({ ...t, __type: "templet" as const }));
    const allItems: ItemType[] = [...cardItems, ...templateItems];

    if (activeTab.name === VIEW_ALL) return allItems;

    const selectedCategory = activeTab.name;

    return allItems.filter((item: ItemType) => {
      if (isCardsMainCategory(selectedCategory)) {
        if (item.__type !== "card") return false;
        if (routeSubCategory && norm(getItemSubCategory(item)) !== norm(routeSubCategory)) return false;
        if (routeSubSubCategory && norm(getItemSubSubCategory(item)) !== norm(routeSubSubCategory)) return false;
        return true;
      }

      if (item.__type !== "templet") return false;

      const itemCat = getItemCategory(item);
      const itemSubCat = getItemSubCategory(item);
      const matchesMainCategory =
        matchesCategoryLike(itemCat, selectedCategory) ||
        matchesCategoryLike(itemSubCat, selectedCategory);

      if (!matchesMainCategory) return false;
      if (routeSubCategory && norm(itemSubCat) !== norm(routeSubCategory)) return false;
      if (routeSubSubCategory && norm(getItemSubSubCategory(item)) !== norm(routeSubSubCategory)) return false;

      return true;
    });
  }, [cards, templates, activeTab.name, routeSubCategory, routeSubSubCategory]);

  const loading = catLoading && categories.length === 0;

  const productsPending =
    filteredItems.length === 0 &&
    ((cardsLoading && cards.length === 0) ||
      (templatesLoading && templates.length === 0));

  const countLabel = productsPending ? "..." : String(filteredItems.length);
  const filteredCardCount = filteredItems.filter((item) => item.__type === "card").length;
  const filteredTemplateCount = filteredItems.filter((item) => item.__type === "templet").length;
  const categoriesErrorText = categoriesQueryError instanceof Error ? categoriesQueryError.message : "";
  const cardsErrorText = cardsQueryError instanceof Error ? cardsQueryError.message : "";
  const templatesErrorText = templatesQueryError instanceof Error ? templatesQueryError.message : "";

  useEffect(() => {
    logTiming("ViewAll.queryState", {
      activeTab: activeTab.name,
      cardsCount: cards.length,
      templatesCount: templates.length,
      filteredCount: filteredItems.length,
      loading,
      productsPending,
      isSafari,
      signedIn: Boolean(user),
      routeCategoryName,
      routeSubCategory,
      routeSubSubCategory,
    });
  }, [
    activeTab.name,
    cards.length,
    filteredItems.length,
    productsPending,
    isSafari,
    loading,
    routeCategoryName,
    routeSubCategory,
    routeSubSubCategory,
    templates.length,
    user,
  ]);

  const openProductPopup = async (item: ItemType) => {
    if (!user) {
      const returnPath = getAuthReturnPath(location);
      savePendingAuthRedirect({
        path: returnPath,
        autoResume: true,
        state: {
          ...((location.state as any) ?? {}),
          focusProductId: (item as any)?.id ?? null,
          focusProductType: item.__type ?? "card",
        },
      });
      navigate(buildSignInRedirectUrl(returnPath), {
        state: {
          redirectTo: returnPath,
          redirectState: {
            ...((location.state as any) ?? {}),
            focusProductId: (item as any)?.id ?? null,
            focusProductType: item.__type ?? "card",
          },
        },
      });
      return;
    }
    setSelectedCate(item);
    openModal();
  };

  const getImageSrc = (item: ItemType): string => {
    if (item.__type === "templet") {
      const template = item as TemplateItem;
      return template?.img_url || (template as any)?.imageUrl || (template as any)?.imageurl || "";
    }
    const card = item as CardItem;
    return card?.imageUrl || card?.imageurl || (card as any)?.lastpageImageUrl || "";
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress sx={{ color: COLORS.primary }} />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box
        sx={{
          width: { lg: "1340px", md: "100%", sm: "100%", xs: "100%" },
          m: "auto",
          p: { lg: 3, md: 3, sm: 3, xs: 1 },
        }}
      >
        <Box sx={{ textAlign: "center", mt: 1 }}>
          <Typography sx={{ fontSize: { md: 30, sm: 30, xs: 24 }, fontWeight: 900 }}>
            {title}
            <sub style={{ fontSize: 18, opacity: 0.75 }}>({countLabel})</sub>
          </Typography>
          <Typography sx={{ fontSize: { md: 14, xs: 10 }, opacity: 0.8 }}>
            Browse all products{routeCategoryName ? ` under ${routeCategoryName} category` : ""}.
          </Typography>
        </Box>

        {debugPanelEnabled && (
          <Box
            sx={{
              mt: 2, mb: 1, p: 1.5, borderRadius: 2,
              background: "#0f172a", color: "#e2e8f0",
              fontFamily: "monospace", fontSize: 12, lineHeight: 1.5,
              position: "sticky",
              top: 6,
              zIndex: 20,
            }}
          >
            <Typography sx={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#93c5fd", mb: 0.5 }}>
              ViewAll Debug
            </Typography>
            <Box>routeCategory: {routeCategoryName || "(none)"}</Box>
            <Box>routeSubCategory: {routeSubCategory || "(none)"}</Box>
            <Box>routeSubSubCategory: {routeSubSubCategory || "(none)"}</Box>
            <Box>activeTab: {activeTab.name}</Box>
            <Box>queryMode: {viewingSpecificNonCardCategory ? "templates-filtered" : "full-catalog"}</Box>
            <Box>cardsLoading: {String(cardsLoading)} | templatesLoading: {String(templatesLoading)}</Box>
            <Box>categoriesLoading: {String(catLoading)}</Box>
            <Box>cardsCount: {cards.length} | templatesCount: {templates.length}</Box>
            <Box>filteredCount: {filteredItems.length}</Box>
            <Box>filteredCards: {filteredCardCount} | filteredTemplates: {filteredTemplateCount}</Box>
            <Box>productsPending: {String(productsPending)}</Box>
            <Box>signedIn: {String(Boolean(user))}</Box>
            <Box>categoriesError: {String(categoriesError)}</Box>
            <Box>cardsError: {String(cardsError)}</Box>
            <Box>templatesError: {String(templatesError)}</Box>
            <Box sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
              categoriesMsg: {categoriesErrorText || "(none)"}
            </Box>
            <Box sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
              cardsMsg: {cardsErrorText || "(none)"}
            </Box>
            <Box sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
              templatesMsg: {templatesErrorText || "(none)"}
            </Box>
          </Box>
        )}

        {/* Category Tabs */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", my: 3 }}>
          <Box
            onClick={clickViewAll}
            sx={{
              py: 1, px: 3, borderRadius: 20,
              bgcolor: activeTab.name === VIEW_ALL ? COLORS.primary : "transparent",
              color: activeTab.name === VIEW_ALL ? COLORS.white : COLORS.black,
              border: `1px solid ${activeTab.name === VIEW_ALL ? "transparent" : COLORS.black}`,
              cursor: "pointer", fontSize: "14px",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            <TuneOutlined fontSize="small" />
            {VIEW_ALL}
          </Box>

          {allCategories.map((c: { id: number; name: string }) => (
            <Box
              key={c.id}
              onClick={() => clickTab(c)}
              sx={{
                py: 1, px: 3, borderRadius: 20,
                bgcolor: lc(activeTab.name) === lc(c.name) ? COLORS.primary : "transparent",
                color: lc(activeTab.name) === lc(c.name) ? COLORS.white : COLORS.black,
                border: `1px solid ${lc(activeTab.name) === lc(c.name) ? "transparent" : COLORS.black}`,
                cursor: "pointer", fontSize: "14px",
              }}
            >
              {c.name}
            </Box>
          ))}
        </Box>

        {/* Products Grid */}
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "21px", mt: 2 }}>
          {productsPending ? (
            <Box sx={{ width: "100%", height: 200, display: "grid", placeItems: "center", color: "gray" }}>
              <Box sx={{ display: "grid", placeItems: "center", gap: 1 }}>
                <CircularProgress size={28} sx={{ color: COLORS.primary }} />
                <Typography sx={{ fontSize: 14, color: "gray" }}>Loading products...</Typography>
              </Box>
            </Box>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item: ItemType, idx: number) => {
              const src = getImageSrc(item);
              const isTemplet = item.__type === "templet";
              const itemCategory = getItemCategory(item);
              const itemDisplayCategory = getItemDisplayCategory(item);
              const enableSmartCrop = isTemplet && shouldSmartCropCategory(itemCategory);
              const isCandle = /candle/i.test(itemCategory);
              const isMug = /mug/i.test(itemCategory);
              const isBag = /bag/i.test(itemCategory);
              const isSticker = /sticker/i.test(itemCategory);
              const useContain = isCandle || isMug || isBag || isSticker;

              return (
                <Box
                  key={`${item.__type ?? "item"}-${String((item as any).id ?? idx)}`}
                  onClick={() => openProductPopup(item)}
                  sx={{
                    width: 248, height: 350, borderRadius: 2,
                    boxShadow: 3, cursor: "pointer", overflow: "hidden",
                    backgroundColor: "#fff",
                    position: "relative",
                  }}
                >
                  {isTemplet ? (
                    <TemplateSvgThumbnail
                      template={item}
                      fallbackSrc={src}
                      alt={(item as TemplateItem).title || (item as CardItem).cardname || "product"}
                      sx={{ width: "100%", height: "100%", display: "block" }}
                    />
                  ) : (
                    <SmartImage
                      src={src}
                      alt={(item as CardItem).cardname || "product"}
                      enable={enableSmartCrop}
                      sx={{
                        width: "100%", height: "100%",
                        objectFit: useContain ? "contain" : "cover",
                        display: "block",
                      }}
                    />
                  )}

                  {itemDisplayCategory ? (
                    <Box
                      sx={{
                        position: "absolute",
                        left: 12,
                        bottom: 12,
                        maxWidth: "calc(100% - 24px)",
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 999,
                        backgroundColor: "rgba(17, 24, 39, 0.82)",
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {itemDisplayCategory}
                    </Box>
                  ) : null}
                </Box>
              );
            })
          ) : (
            <Box sx={{ width: "100%", height: 200, display: "grid", placeItems: "center", color: "gray" }}>
              Product not found
            </Box>
          )}
        </Box>

        {/* Product Popup */}
        {isCategoryModal && selectedCate && (
          <ProductPopup
            open={isCategoryModal}
            onClose={() => {
              closeModal();
              setSelectedCate(null);
            }}
            cate={selectedCate}
            isTempletDesign={selectedCate.__type === "templet"}
            priceLoading={false}
          />
        )}
      </Box>
    </MainLayout>
  );
};

export default ViewAllCard;