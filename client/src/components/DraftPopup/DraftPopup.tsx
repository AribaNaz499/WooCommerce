import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import { IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import {useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import LandingButton from "../LandingButton/LandingButton";
import { USER_ROUTES } from "../../constant/route";

import { useSlide1 } from "../../context/Slide1Context";
import { useSlide2 } from "../../context/Slide2Context";
import { useSlide3 } from "../../context/Slide3Context";
import { useSlide4 } from "../../context/Slide4Context";

import { setDraftCardId } from "../../lib/draftCardId";

const style = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: { md: 450, sm: 450, xs: "92%" },
    bgcolor: "background.paper",
    borderRadius: 3,
};

function clearEditorStorage() {
    try {
        const KEYS = ["selectedSize", "selectedVariant", "categorieTemplet", "3dModel", "selectedPrices"];
        KEYS.forEach((k) => localStorage.removeItem(k));
        sessionStorage.removeItem("slides");
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.startsWith("templetEditor:draft:")) localStorage.removeItem(key);
        }
    } catch { }
}

export type DraftFullRow = {
    card_id: string;
    cover_screenshot: string | null;
    title: string | null;
    category: string | null;
    description: string | null;
    updated_at: string;

    // ✅ IMPORTANT: full draft payload
    layout?: any;
    slide1?: any;
    slide2?: any;
    slide3?: any;
    slide4?: any;

    selected_size?: "a4" | "a3" | "us_letter" | string | null;
    prices?: any; // optional
    display_price?: number | null;
    is_on_sale?: boolean | null;
};

type Props = {
    open: boolean;
    onClose: () => void;
    draft?: DraftFullRow | null;
};

const templateEditorStorageKey = (productId: string | number) =>
  `templet_editor_state:${String(productId).trim()}`;

const buildTemplateSlidesFromDraft = (draft?: DraftFullRow | null) => {
  if (!draft) return [];
  return [draft.slide1, draft.slide2, draft.slide3, draft.slide4].filter(Boolean);
};

const DraftPopup = ({ open, onClose, draft }: Props) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const { resetSlide1State } = useSlide1();
    const { resetSlide2State } = useSlide2();
    const { resetSlide3State } = useSlide3();
    const { resetSlide4State } = useSlide4();

    // const title = useMemo(() => draft?.title ?? "Untitled Draft", [draft]);
    // const category = useMemo(() => draft?.category ?? "default", [draft]);
    // const description = useMemo(() => draft?.description ?? "", [draft]);

    const handleContinue = () => {
  if (!draft?.card_id) return;

  setLoading(true);

  try {
    // ✅ 1) clear old editor localStorage
    clearEditorStorage();

    // ✅ 2) set storage from draft (so navbar save uses correct meta/price/size too)
    const selectedSize = (draft.selected_size ?? "a4") as string;

    try {
      localStorage.setItem("selectedSize", selectedSize);

      localStorage.setItem(
        "selectedVariant",
        JSON.stringify({
          key: selectedSize,
          title: selectedSize,
          price: draft.display_price ?? null,
          basePrice: null,
        })
      );

      if (draft.prices) localStorage.setItem("selectedPrices", JSON.stringify(draft.prices));
    } catch {}

    // ✅ 3) reset global contexts BEFORE opening draft
    resetSlide1State();
    resetSlide2State();
    resetSlide3State();
    resetSlide4State();

    const templateLayout =
      draft?.layout && typeof draft.layout === "object" && draft.layout.__editorType === "template"
        ? draft.layout
        : null;

    if (templateLayout?.productId) {
      const productId = String(templateLayout.productId).trim();
      const category = String(templateLayout.category ?? draft.category ?? "general").trim() || "general";
      const adminDesign = templateLayout.adminDesign ?? null;
      const userSlides =
        Array.isArray(templateLayout.userSlides) && templateLayout.userSlides.length > 0
          ? templateLayout.userSlides
          : buildTemplateSlidesFromDraft(draft);
      const activeSlide =
        Number.isFinite(Number(templateLayout.activeSlide)) ? Number(templateLayout.activeSlide) : 0;

      try {
        localStorage.setItem(`template:draft:id:${productId}`, draft.card_id);
        if (adminDesign && userSlides.length) {
          localStorage.setItem(
            templateEditorStorageKey(productId),
            JSON.stringify({
              adminDesign,
              userSlides,
              activeSlide,
              selectedElId: templateLayout.selectedElId ?? null,
              savedAt: Date.now(),
            })
          );
        }
      } catch {}

      setTimeout(() => {
        navigate(`${USER_ROUTES.TEMPLET_EDITORS}/${encodeURIComponent(category)}/${productId}`, {
          state: {
            templetDesign: templateLayout.templetDesign ?? undefined,
          },
        });
        setLoading(false);
        onClose();
      }, 3000);
      return;
    }

    // ✅ 4) set current draft id (card editor drafts)
    setDraftCardId(draft.card_id);

    // ✅ 5) 3 seconds loading then navigate (card editor drafts)
    setTimeout(() => {
      navigate(`${USER_ROUTES.HOME}/${draft.card_id}`, {
        state: {
          draftFull: draft,
          layout: draft.layout,
          title: draft.title,
          category: draft.category,
          description: draft.description,
          plan: selectedSize,
          poster: draft.cover_screenshot,
          __draft: true,
        },
      });

      setLoading(false);
      onClose();
    }, 3000);
  } catch (e: any) {
    toast.error(e?.message ?? "Failed to open draft");
    setLoading(false);
  }
};

    return (
        <Modal
            open={open}
            onClose={onClose}
            BackdropProps={{ sx: { backgroundColor: "rgba(10, 10, 10, 0.34)" } }}
        >
            <Box sx={{ ...style, height: { md: "auto", sm: "auto", xs: "520px" }, overflowY: "auto" }}>
                <Box sx={{ display: { md: "flex", sm: "flex", xs: "block" }, p: 2, gap: 2, flexDirection: 'column' }}>
                    <Box
                        sx={{
                            width: { md: "100%", sm: "50%", xs: "100%" },
                            height: { md: 550, sm: 450, xs: 280 },
                            borderRadius: 3,
                            overflow: "hidden",
                            position: "relative",
                            bgcolor: "#fafafa",
                        }}
                    >
                        <Box
                            component="img"
                            src={draft?.cover_screenshot ?? ""}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    </Box>

                    <Box sx={{ width: { md: "100%", sm: "100%", xs: "100%" } }}>
                        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", mt: 4 }}>
                            <LandingButton title="Close" variant="outlined" width="150px" personal onClick={onClose} />
                            <LandingButton
                                title="Continue Editing"
                                width="180px"
                                personal
                                loading={loading}
                                onClick={handleContinue}
                            />
                        </Box>
                    </Box>
                </Box>

                <IconButton
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: "black",
                        color: "white",
                        width: "30px",
                        height: "30px",
                        "&:hover": { bgcolor: "#212121" },
                    }}
                >
                    <Close fontSize="large" />
                </IconButton>
            </Box>
        </Modal>
    );
};

export default DraftPopup;
