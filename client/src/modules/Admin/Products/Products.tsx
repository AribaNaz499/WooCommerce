import {
  Box,
  CircularProgress,
  Typography,
  Tabs,
  Tab,
  Badge,
  Paper,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import DashboardLayout from "../../../layout/DashboardLayout";
import { supabase, supabaseAdmin } from "../../../supabase/supabase";
import useModal from "../../../hooks/useModal";
import ConfirmModal from "../../../components/ConfirmModal/ConfirmModal";
import { Delete, Style as CardsIcon, Category as TemplatesIcon, FilterList } from "@mui/icons-material";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ProductCard from "./components/ProductCard/ProductCard";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ADMINS_DASHBOARD } from "../../../constant/route";
import {
  fetchAllCardsFromDB,
  fetchAllCategoriesFromDB,
  fetchAllTempletDesigns,
} from "../../../source/source";

type CardRow = {
  id: number;
  cardName?: string; cardname?: string;
  cardcategory?: string; card_category?: string;
  subCategory?: string; subcategory?: string;
  subSubCategory?: string; sub_subcategory?: string;
  sku?: string;
  actualPrice?: number; actualprice?: number;
  salePrice?: number; saleprice?: number;
  description?: string;
  image_url?: string; imageUrl?: string; imageurl?: string;
  lastpageImageUrl?: string; lastpageimageurl?: string;
  created_at?: string;
  polygon_shape?: string;
};

type Category = {
  id: number | string;
  name: string;
  subcategories?: string[];
  sub_subcategories?: Record<string, string[]>;
};

type TemplateDesign = {
  id: number | string;
  title?: string; name?: string;
  category?: string;
  img_url?: string; image_url?: string; imageurl?: string;
  lastpageImageUrl?: string; lastpageimageurl?: string;
  polygon_shape?: string;
  created_at?: string;
  description?: string;
  sku?: string;
  actual_price?: number; actualprice?: number;
  sale_price?: number; saleprice?: number;
  // optional new columns
  subCategory?: string; subcategory?: string;
  subSubCategory?: string; sub_subcategory?: string;
};

const ALL = "ALL";
type ActiveTab = "cards" | "templates";
type DeletePick = { id: number | string; source: ActiveTab };

/* ---------------- Helpers ---------------- */

// delete helpers
const deleteCardById = async (id: number | string) => {
  const { error } = await supabaseAdmin.from("cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return id;
};
const deleteTemplateById = async (id: number | string) => {
  const { error } = await supabaseAdmin.from("templetDesign").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return id;
};
const getTabIndex = (t: ActiveTab) => (t === "cards" ? 0 : 1);
const indexToTab = (i: number): ActiveTab => (i === 0 ? "cards" : "templates");

// cards normalize helpers
const getCardMain = (r: CardRow) => (r.cardcategory ?? r.card_category ?? "").trim();
const getSub = (r: CardRow) => (r.subCategory ?? r.subcategory ?? "").trim();
const getSubSub = (r: CardRow) => (r.subSubCategory ?? r.sub_subcategory ?? "").trim();

// fallback tree from rows (for cards)
function buildCardTreesFromRows(rows: CardRow[]) {
  const subs = new Set<string>();
  const map: Record<string, Set<string>> = {};
  for (const r of rows) {
    const sub = getSub(r);
    const subsub = getSubSub(r);
    if (!sub) continue;
    subs.add(sub);
    if (!map[sub]) map[sub] = new Set();
    if (subsub) map[sub].add(subsub);
  }
  const subcategories = Array.from(subs).sort();
  const sub_subcategories: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(map)) sub_subcategories[k] = Array.from(v).sort();
  return { subcategories, sub_subcategories };
}

function FilterBar({
  categories,
  category,
  onCategoryChange,
  subcategories,
  subcategory,
  onSubcategoryChange,
  subsubcategories,
  subsubcategory,
  onSubsubcategoryChange,
}: {
  categories: string[];
  category: string;
  onCategoryChange: (v: string) => void;
  subcategories: string[];
  subcategory: string;
  onSubcategoryChange: (v: string) => void;
  subsubcategories: string[];
  subsubcategory: string;
  onSubsubcategoryChange: (v: string) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #E6E9EF",
        bgcolor: "#F7F8FB",
        px: 2.5,
        py: 1.4,
        mb: 2,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1.5 }}>
          <FilterList fontSize="small" />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Filters</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <Select
            value={category}
            displayEmpty
            onChange={(e) => onCategoryChange(String(e.target.value))}
            renderValue={(v) => (v === ALL ? "Category" : v)}
            sx={{
              borderRadius: 999,
              bgcolor: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D6DAE6" },
            }}
          >
            <MenuItem value={ALL}>All categories</MenuItem>
            {categories.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <Select
            value={subcategory}
            displayEmpty
            onChange={(e) => onSubcategoryChange(String(e.target.value))}
            renderValue={(v) => (v === ALL ? "Subcategory" : v)}
            sx={{
              borderRadius: 999,
              bgcolor: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D6DAE6" },
            }}
            disabled={subcategories.length === 0}
          >
            <MenuItem value={ALL}>All subcategories</MenuItem>
            {subcategories.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <Select
            value={subsubcategory}
            displayEmpty
            onChange={(e) => onSubsubcategoryChange(String(e.target.value))}
            renderValue={(v) => (v === ALL ? "Sub‑subcategory" : v)}
            sx={{
              borderRadius: 999,
              bgcolor: "#fff",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#D6DAE6" },
            }}
            disabled={subsubcategories.length === 0}
          >
            <MenuItem value={ALL}>All sub‑subcategories</MenuItem>
            {subsubcategories.map((name) => (
              <MenuItem key={name} value={name}>{name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}

/* ---------------- Page ---------------- */
const Products = () => {
  // state
  const [activeTab, setActiveTab] = useState<ActiveTab>("cards");

  // cards filter state
  const [cardMainCat, setCardMainCat] = useState<string>(ALL);
  const [selectedSubCat, setSelectedSubCat] = useState<string>(ALL);
  const [selectedSubSub, setSelectedSubSub] = useState<string>(ALL);

  // templates filter state
  const [tMainCat, setTMainCat] = useState<string>(ALL);
  const [tSubCat, setTSubCat] = useState<string>(ALL);
  const [tSubSub, setTSubSub] = useState<string>(ALL);

  const [selectedToDelete, setSelectedToDelete] = useState<DeletePick | null>(null);

  // (kept to reuse ConfirmModal UX)
  const { open: _isTemplateModalOpen, closeModal: _closeTemplateModal } = useModal();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // queries
  const { data: cards = [], isLoading: isLoadingCards, isError: isErrorCards } = useQuery<CardRow[]>({
    queryKey: ["cards"],
    queryFn: fetchAllCardsFromDB,
    staleTime: 1000 * 60 * 5,
    refetchOnMount: "always",
  });
  const { data: templates = [], isLoading: isLoadingTemplates, isError: isErrorTemplates } = useQuery<TemplateDesign[]>({
    queryKey: ["templates-list"], // الگ key رکھو
    queryFn: fetchAllTempletDesigns,
    staleTime: 1000 * 60 * 10, // 10 منٹ تک cache رکھو
    gcTime: 1000 * 60 * 30,    // garbage collect 30 منٹ بعد
    refetchOnMount: "always",
  });
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: fetchAllCategoriesFromDB,
    staleTime: 1000 * 60 * 30,
  });

  // const PAGE_SIZE = 20;

  // const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  //   queryKey: ["templates"],
  //   queryFn: ({ pageParam = 0 }) => fetchTemplatesPaginated(pageParam),
  //   getNextPageParam: (lastPage) => lastPage.nextCursor,
  // });

  const norm = (s?: string | null) => (s ?? "").trim();
  const ciEq = (a: string, b: string) =>
    a.localeCompare(b, undefined, { sensitivity: "accent" }) === 0;

  // categories helpers
  const cardsTree = useMemo(() => {
    const match = categories.find((c) => ciEq((c?.name ?? "").trim(), "Cards"));
    return match || null;
  }, [categories]);
  const cardMainCats = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((r) => {
      const v = getCardMain(r);
      if (v) set.add(v);
    });
    return Array.from(set).sort();
  }, [cards]);
  const templateMainCats = useMemo(
    () => categories.map((c) => (c?.name ?? "").trim()).filter((n) => n && n !== "Cards"),
    [categories]
  );

  // cards: usable subcats/sub-subcats with fallback
  const { cardSubcategories, subSubMap } = useMemo(() => {
    const built = buildCardTreesFromRows(cards);
    const apiSubs = cardsTree?.subcategories ?? [];
    const apiMap = cardsTree?.sub_subcategories ?? {};

    const mergedSubs = Array.from(new Set([...apiSubs, ...built.subcategories])).sort();

    const mergedMap: Record<string, string[]> = {};
    const allSubs = new Set<string>([
      ...Object.keys(apiMap),
      ...Object.keys(built.sub_subcategories),
      ...mergedSubs,
    ]);
    for (const sub of allSubs) {
      const fromApi = apiMap[sub] ?? [];
      const fromBuilt = built.sub_subcategories[sub] ?? [];
      mergedMap[sub] = Array.from(new Set([...fromApi, ...fromBuilt])).sort();
    }

    return { cardSubcategories: mergedSubs, subSubMap: mergedMap };
  }, [cardsTree, cards]);

  const visibleSubSubs = useMemo(
    () => (selectedSubCat !== ALL ? (subSubMap[selectedSubCat] ?? []) : []),
    [selectedSubCat, subSubMap]
  );

  // templates: derive subcats/sub-subcats based on chosen main category
  const tSubcats = useMemo(() => {
    if (tMainCat === ALL) return [];
    const row = categories.find(c => (c?.name ?? "").trim() === tMainCat);
    return (row?.subcategories ?? []).slice().sort();
  }, [categories, tMainCat]);

  const tSubSubMap = useMemo(() => {
    if (tMainCat === ALL) return {};
    const row = categories.find(c => (c?.name ?? "").trim() === tMainCat);
    return row?.sub_subcategories ?? {};
  }, [categories, tMainCat]);

  const tVisibleSubSubs = useMemo(
    () => (tSubCat !== ALL ? (tSubSubMap[tSubCat] ?? []) : []),
    [tSubCat, tSubSubMap]
  );

  // reset on tab change
  useEffect(() => {
    // cards
    setCardMainCat(ALL);
    setSelectedSubCat(ALL);
    setSelectedSubSub(ALL);
    // templates
    setTMainCat(ALL);
    setTSubCat(ALL);
    setTSubSub(ALL);
  }, [activeTab]);

  // domain items
  const domainItems = activeTab === "cards" ? cards : templates;

  const tplGetCat = (t: any) => norm(t.category);
  const tplGetSub = (t: any) => norm(t.subCategory ?? t.subcategory);
  const tplGetSubSub = (t: any) => norm(t.subSubCategory ?? t.sub_subcategory);


  // filtering
  const filteredItems = useMemo(() => {
    if (activeTab === "cards") {
      let out = (domainItems as CardRow[]).slice();

      if (cardMainCat !== ALL) {
        out = out.filter((r) => ciEq(getCardMain(r), cardMainCat));
      }
      if (selectedSubCat !== ALL) {
        out = out.filter((r) => ciEq(getSub(r), selectedSubCat));
      }
      if (selectedSubSub !== ALL) {
        out = out.filter((r) => ciEq(getSubSub(r), selectedSubSub));
      }
      return out;
    }

    // ===== templates =====
    let out = (domainItems as TemplateDesign[]).slice();

    // main category
    if (tMainCat !== ALL) {
      out = out.filter((t) => ciEq(tplGetCat(t), tMainCat));
    }

    // subCategory (only apply if a specific sub was chosen)
    if (tSubCat !== ALL) {
      out = out.filter((t) => ciEq(tplGetSub(t), tSubCat));
    }

    // subSubCategory (only apply if any boxes checked AND a subCategory is chosen)
    if (tSubCat !== ALL && tSubSub !== ALL) {
      out = out.filter((t) => ciEq(tplGetSubSub(t), tSubSub));
    }

    return out;
  }, [
    domainItems,
    activeTab,
    // cards deps
    cardMainCat,
    selectedSubCat,
    selectedSubSub,
    // templates deps
    tMainCat,
    tSubCat,
    tSubSub,
  ]);


  // mutations
  const deleteCardMutation = useMutation({
    mutationFn: deleteCardById,
    onSuccess: (id) => {
      toast.success("Card deleted successfully");
      queryClient.setQueryData<CardRow[]>(["cards"], (old) => (old ? old.filter((c) => c.id !== id) : []));
      setSelectedToDelete(null);
    },
    onError: () => toast.error("Error deleting card"),
  });
  const deleteTemplateMutation = useMutation({
    mutationFn: deleteTemplateById,
    onSuccess: (id) => {
      toast.success("Template deleted successfully");
      queryClient.setQueryData<TemplateDesign[]>(["templates-list"], (old) =>
        old ? old.filter((t) => t.id !== id) : [],
      );
      setSelectedToDelete(null);
    },
    onError: () => toast.error("Error deleting template"),
  });

  const handleConfirmDelete = () => {
    if (!selectedToDelete) return;
    if (selectedToDelete.source === "cards") deleteCardMutation.mutate(selectedToDelete.id);
    else deleteTemplateMutation.mutate(selectedToDelete.id);
  };

  // utils
  const imageForEdit = (x: {
    lastpageimageurl?: string;
    imageurl?: string;
    image_url?: string;
    img_url?: string;
    lastpageImageUrl?: string;
  }) =>
    x.lastpageimageurl ||
    x.lastpageImageUrl ||
    x.imageurl ||
    x.image_url ||
    x.img_url ||
    "";

  const onEditCard = (row: any) => {
    navigate(ADMINS_DASHBOARD.ADD_NEW_CARDS, {
      state: {
        mode: "edit",
        id: row.id,
        product: {
          cardName: row.cardname ?? row.cardName,
          cardCategory: row.cardcategory ?? row.card_category,
          subCategory: row.subCategory ?? row.subcategory ?? "",
          subSubCategory: row.subSubCategory ?? row.sub_subcategory ?? "",
          sku: row.sku,
          actualPrice: row.actualprice ?? row.actualPrice,
          a4price: row.a4price,
          a5price: row.a5price,
          usletter: row.usletter,
          salePrice: row.saleprice ?? row.salePrice,
          salea4price: row.salea4price,
          salea5price: row.salea5price,
          saleusletter: row.saleusletter,
          description: row.description ?? "",
          imageUrl: imageForEdit(row),
          polygon_shape: row.polygon_shape ?? "",
          lastpageImageUrl: row.lastpageImageUrl ?? row.lastpageimageurl ?? "",
          polygonlayout: row.polygonlayout ?? row.polyganLayout ?? null,
          polyganLayout: row.polygonlayout ?? row.polyganLayout ?? null,
        },
      },
    });
  };


  // NEW: open TempletForm with prefill + preview in left box
  const safeParse = (v: any) => {
    if (!v) return null;
    if (typeof v === "object") return v;
    if (typeof v === "string") {
      try { return JSON.parse(v); } catch { return null; }
    }
    return null;
  };

  const onEditTemplate = async (tpl: TemplateDesign & any) => {

    const { data: fullTpl, error } = await supabase
      .from("templetDesign")
      .select("*") // ← اب صرف ایک row، raw_stores وغیرہ لے لو
      .eq("id", tpl.id)
      .single();

    if (error || !fullTpl) {
      toast.error("Failed to load template details");
      return;
    }

    const rawStores = safeParse(
      fullTpl.raw_stores ?? fullTpl.rawStores ?? null
    );

    navigate(ADMINS_DASHBOARD.ADD_NEW_TEMPLETS_CARDS, {
      state: {
        mode: "edit",
        id: tpl.id,

        rawStores, // ✅ normalized

        imgUrl:
          tpl.img_url ??
          tpl.image_url ??
          tpl.imageurl ??
          tpl.lastpageImageUrl ??
          tpl.lastpageimageurl ??
          "",

        product: {
          cardname: tpl.title ?? tpl.name ?? "",
          cardcategory: tpl.category ?? "",

          subCategory: tpl.subCategory ?? tpl.subcategory ?? "",
          subSubCategory: tpl.subSubCategory ?? tpl.sub_subcategory ?? "",

          sku: tpl.sku ?? "",
          actualprice: tpl.actualprice ?? tpl.actualPrice ?? "",
          a4price: tpl.a4price ?? "",
          a5price: tpl.a5price ?? "",
          usletter: tpl.usletter ?? "",

          saleprice: tpl.saleprice ?? tpl.salePrice ?? "",
          salea4price: tpl.salea4price ?? "",
          salea5price: tpl.salea5price ?? "",
          saleusletter: tpl.saleusletter ?? "",

          description: tpl.description ?? "",
        },
      },
    });
  };



  return (
    <DashboardLayout
      title="Products"
      addBtn={activeTab === "cards" ? "Add Card" : "Add Template"}
      onClick={() =>
        navigate(activeTab === "cards" ? ADMINS_DASHBOARD.ADD_NEW_CARDS : ADMINS_DASHBOARD.ADMIN_CATEGORIES_EDITOR)
      }
    >
      {/* Header Tabs */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Tabs
          value={getTabIndex(activeTab)}
          onChange={(_, idx: number) => setActiveTab(indexToTab(idx))}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": { textTransform: "none", minHeight: 40, fontWeight: 700 },
          }}
        >
          <Tab
            icon={<CardsIcon fontSize="small" />}
            iconPosition="start"
            label={<Badge color="error" badgeContent={cards.length}>Cards</Badge>}
          />
          <Tab
            icon={<TemplatesIcon fontSize="small" />}
            iconPosition="start"
            label={<Badge color="error" badgeContent={templates.length}>Templates</Badge>}
          />
        </Tabs>
      </Box>

      <FilterBar
        categories={activeTab === "cards" ? cardMainCats : templateMainCats}
        category={activeTab === "cards" ? cardMainCat : tMainCat}
        onCategoryChange={(name) => {
          if (activeTab === "cards") {
            setCardMainCat(name);
            setSelectedSubCat(ALL);
            setSelectedSubSub(ALL);
            return;
          }
          setTMainCat(name);
          setTSubCat(ALL);
          setTSubSub(ALL);
        }}
        subcategories={activeTab === "cards" ? cardSubcategories : tSubcats}
        subcategory={activeTab === "cards" ? selectedSubCat : tSubCat}
        onSubcategoryChange={(name) => {
          if (activeTab === "cards") {
            setSelectedSubCat(name);
            setSelectedSubSub(ALL);
            return;
          }
          setTSubCat(name);
          setTSubSub(ALL);
        }}
        subsubcategories={activeTab === "cards" ? visibleSubSubs : tVisibleSubSubs}
        subsubcategory={activeTab === "cards" ? selectedSubSub : tSubSub}
        onSubsubcategoryChange={(name) => {
          if (activeTab === "cards") {
            setSelectedSubSub(name);
            return;
          }
          setTSubSub(name);
        }}
      />

      <Box sx={{ mt: 2 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {(activeTab === "cards" ? isLoadingCards : isLoadingTemplates) ? (
            <Box sx={{ width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "40vh" }}>
              <CircularProgress disableShrink sx={{ color: "black" }} />
              loading...
            </Box>
          ) : (activeTab === "cards" ? isErrorCards : isErrorTemplates) ? (
            <Typography color="error">Failed to load {activeTab === "cards" ? "cards" : "templates"}.</Typography>
          ) : filteredItems.length === 0 ? (
            <Typography>No items found.</Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 2.5,
                alignItems: "stretch",
              }}
            >
              {filteredItems.map((item: any) => (
                <ProductCard
                  key={`${activeTab}-${item.id}`}
                  data={
                    activeTab === "cards"
                      ? ({
                        id: item.id,
                        card_name: item.cardName ?? item.card_name ?? item.cardname ?? "Card",
                        card_category: item.cardcategory ?? item.card_category ?? "",
                        subCategory: item.subCategory ?? item.subcategory ?? null,
                        subSubCategory: item.subSubCategory ?? item.sub_subcategory ?? null,
                        sku: item.sku ?? "",
                        actual_price: item.actualPrice ?? item.actual_price ?? item.actualprice ?? 0,
                        sale_price: item.salePrice ?? item.sale_price ?? item.saleprice ?? 0,
                        description: item.description ?? "",
                        created_at: item.created_at ?? new Date().toISOString(),
                        img_url:
                          item.lastpageimageurl ??
                          item.imageUrl ??
                          item.imageurl ??
                          item.image_url ??
                          item.lastpageImageUrl ??
                          "",
                        lastpageImageUrl: item.lastpageImageUrl ?? item.lastpageimageurl ?? "",
                        polygon_shape: item.polygon_shape ?? null,
                        __type: "card",
                      } as any)
                      : ({
                        id: item.id,
                        card_name: item.title ?? item.name ?? "Template",
                        card_category: item.category ?? "",
                        sku: item.sku ?? "",
                        actual_price: item.actualPrice ?? item.actual_price ?? item.actualprice ?? 0,
                        sale_price: item.salePrice ?? item.sale_price ?? item.saleprice ?? 0,
                        description: item.description ?? "",
                        created_at: item.created_at ?? new Date().toISOString(),
                        img_url: item.img_url ?? item.image_url ?? item.imageurl ?? item.lastpageimageurl ?? "",
                        lastpageImageUrl: item.lastpageImageUrl ?? item.lastpageimageurl ?? "",
                        polygon_shape: item.polygon_shape,
                        subCategory: item.subCategory ?? item.subcategory ?? null,
                        subSubCategory: item.subSubCategory ?? item.sub_subcategory ?? null,
                        __type: "templet",
                      } as const)
                  }
                  onEdit={activeTab === "cards" ? () => onEditCard(item as CardRow) : () => onEditTemplate(item as TemplateDesign)}
                  openDeleteModal={(id: number | string) => setSelectedToDelete({ id, source: activeTab })}
                />
              ))}
            </Box>
          )}
        </Box>
      </Box>

      {/* Delete confirm */}
      {selectedToDelete && (
        <ConfirmModal
          open={Boolean(selectedToDelete)}
          onCloseModal={() => setSelectedToDelete(null)}
          title={`Delete this ${selectedToDelete.source === "cards" ? "card" : "template"}?`}
          icon={<Delete fontSize="large" />}
          btnText={
            (selectedToDelete.source === "cards" ? deleteCardMutation.isPending : deleteTemplateMutation.isPending)
              ? "Deleting..."
              : "Delete"
          }
          onClick={handleConfirmDelete}
        />
      )}
    </DashboardLayout>
  );
};

export default Products;
