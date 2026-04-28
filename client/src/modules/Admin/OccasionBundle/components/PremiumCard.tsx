import React, { useMemo, useState } from "react";
import { Box, Card, CardMedia, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CardGiftcard, EmojiEvents } from "@mui/icons-material";
import { fetchAllCardsFromDB } from "../../../../source/source";
import PremiumCardModal from "./PremiumCardModal";
import { COLORS } from "../../../../constant/color";
import { supabase } from "../../../../supabase/supabase";

type ActiveTab = "cards" | "templates";

type CardRow = {
  id: number | string;
  cardName?: string; cardname?: string;
  cardcategory?: string; card_category?: string; cardCategory?: string;
  subCategory?: string; subcategory?: string;
  subSubCategory?: string; sub_subcategory?: string;
  image_url?: string; imageUrl?: string; imageurl?: string;
  lastpageImageUrl?: string; lastpageimageurl?: string;
  accessplan?: string; accessPlan?: string; access?: string;
};

type TemplateRow = {
  id: number | string;
  title?: string; name?: string;
  category?: string;
  subCategory?: string; subcategory?: string;
  subSubCategory?: string; sub_subcategory?: string;
  img_url?: string; image_url?: string; imageurl?: string;
  lastpageImageUrl?: string; lastpageimageurl?: string;
  accessplan?: string; accessPlan?: string; access?: string;
};

type PremiumItem = {
  source: ActiveTab;
  id: number | string;
  title: string;
  category: string;
  subCategory: string;
  subSubCategory: string;
  image: string;
  access: "free" | "pro" | "bundle";
};

const norm = (s?: string | null) => (s ?? "").trim();
const lc = (s: any) => String(s ?? "").trim().toLowerCase();

const pickImage = (x: any) =>
  x.lastpageimageurl ||
  x.lastpageImageUrl ||
  x.imageUrl ||
  x.imageurl ||
  x.image_url ||
  x.img_url ||
  "";

const normalizeAccess = (x: any): "free" | "pro" | "bundle" => {
  const v = lc(x?.accessplan ?? x?.accessPlan ?? x?.access ?? x?.plan);
  if (v === "pro" || v === "premium") return "pro";
  if (v === "bundle") return "bundle";
  return "free";
};

async function fetchTemplatesLight(): Promise<any[]> {
  const { data, error } = await supabase
    .from("templetDesign")
    .select("id,title,img_url,accessplan,category,created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

const AccessBadge = ({ kind }: { kind: "pro" | "bundle" }) => (
  <Box
    sx={{
      position: "absolute",
      top: 10,
      left: 10,
      zIndex: 2,
      width: 44,
      height: 44,
      borderRadius: 999,
      display: "grid",
      placeItems: "center",
      bgcolor: "rgba(255,255,255,0.92)",
      boxShadow: "0 10px 20px rgba(0,0,0,0.25)",
      transform: "rotate(-12deg)",
      border: "1px solid rgba(0,0,0,0.08)",
    }}
  >
    {kind === "bundle" ? (
      <CardGiftcard sx={{ fontSize: 36,color:COLORS.primary }} />
    ) : (
      <EmojiEvents sx={{ fontSize: 40,color:'orange' }} />
    )}
  </Box>
);

const PremiumCards: React.FC = () => {
  const { data: cards = [], isLoading: isLoadingCards, isError: isErrorCards } = useQuery<CardRow[]>({
    queryKey: ["cards"],
    queryFn: fetchAllCardsFromDB,
    staleTime: 1000 * 60 * 5,
  });

  const { data: templates = [], isLoading: isLoadingTemplates, isError: isErrorTemplates } = useQuery<TemplateRow[]>({
    queryKey: ["templates"],
    queryFn: fetchTemplatesLight,
    staleTime: 1000 * 60 * 5,
  });

  const [selected, setSelected] = useState<any | null>(null);

  const items = useMemo<PremiumItem[]>(() => {
    const cardItems: PremiumItem[] = (cards ?? []).map((c: any) => ({
      source: "cards",
      id: c.id,
      title: norm(c.cardName ?? c.cardname) || "Card",
      category: norm(c.cardCategory ?? c.cardcategory ?? c.card_category),
      subCategory: norm(c.subCategory ?? c.subcategory),
      subSubCategory: norm(c.subSubCategory ?? c.sub_subcategory),
      image: pickImage(c),
      access: normalizeAccess(c),
    }));

    const tplItems: PremiumItem[] = (templates ?? []).map((t: any) => ({
      source: "templates",
      id: t.id,
      title: norm(t.title ?? t.name) || "Template",
      category: norm(t.category),
      subCategory: norm(t.subCategory ?? t.subcategory),
      subSubCategory: norm(t.subSubCategory ?? t.sub_subcategory),
      image: pickImage(t),
      access: normalizeAccess(t),
    }));

    return [...cardItems, ...tplItems].filter((x) => !!x.image);
  }, [cards, templates]);

  const isLoading = isLoadingCards || isLoadingTemplates;
  const isError = isErrorCards || isErrorTemplates;

  if (!isLoading && !isError && items.length === 0) {
    return (
      <Box sx={{ minHeight: "45vh", display: "grid", placeItems: "center" }}>
        <Typography sx={{ fontWeight: 800, color: "text.secondary" }}>
          Cards not found
        </Typography>
      </Box>
    );
  }

  if (isError) toast.error("Failed to load cards/templates");

  return (
    <Box sx={{ p: 2 }}>
      {isLoading && <Typography>Loading...</Typography>}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr", md: "repeat(5, 1fr)" },
          gap: 2,
        }}
      >
        {items.map((it) => (
          <Card
            key={`${it.source}-${it.id}`}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              cursor: "pointer",
              position: "relative",
            }}
            onClick={() => setSelected(it)}
          >
            {it.access === "bundle" ? <AccessBadge kind="bundle" /> : null}
            {it.access === "pro" ? <AccessBadge kind="pro" /> : null}

            <CardMedia
              component="img"
              height="350"
              image={it.image}
              alt={it.title}
              sx={{ objectFit: "cover" }}
            />
          </Card>
        ))}
      </Box>

      {selected && (
        <PremiumCardModal
          open={Boolean(selected)}
          onClose={() => setSelected(null)}
          item={selected}
          onUpdated={(next) => setSelected(next)}
        />
      )}
    </Box>
  );
};

export default PremiumCards;