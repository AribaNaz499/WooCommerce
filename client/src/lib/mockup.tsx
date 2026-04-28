import type { SxProps, Theme } from "@mui/material/styles";

export type MockupOverlay = {
  top: string;
  left: string;
  width: string;
  height: string;
  rotate?: string;
  borderRadius?: number | string;
  objectFit?: "contain" | "cover" | "fill";
  opacity?: number;
  filter?: string;
  clipPath?: string;
  sx?: SxProps<Theme>;
};

export type MockupConfig = {
  mockupSrc: string;
  cardAspectRatio: string;
  overlay: MockupOverlay;
};

const normalizeCategory = (v?: string) => (v ?? "").toLowerCase().trim();

const CATEGORY_MOCKUPS: Array<{
  match: (category?: string) => boolean;
  cfg: MockupConfig;
}> = [
    // Bags mockup
    {
      match: (category) => /(tote\s*bag|bags?)/i.test(normalizeCategory(category)),
      cfg: {
        mockupSrc: "/assets/mockup/bag-mockup.png",
        cardAspectRatio: "1 / 1.2",
        overlay: {
          top: "45%",
          left: "20%",
          width: "60%",
          height: "40%",
          rotate: "0deg",
          objectFit: "contain",
          opacity: 0.98,
          filter: "contrast(1.05) saturate(1.02)",
        },
      },
    },
    // Coaster mockup
  {
    match: (category) => normalizeCategory(category).includes("coaster"),
    cfg: {
      mockupSrc: "/assets/mockup/coaster-mockup.jpg",
      cardAspectRatio: "1 / 1.2",
      overlay: {
          top: "16.5%",
          left: "18%",
          width: "64%",
          height: "68.3%",
          rotate: "0deg",
          objectFit: "contain",
          borderRadius: "2px",
          opacity: 0.98,
          filter: "contrast(1.05) saturate(1.02)",
      },
    },
  },
  // Candle mockup
  {
    match: (category) => /candle/i.test(normalizeCategory(category)),
    cfg: {
      mockupSrc: "/assets/mockup/candle-mockup.jpeg",
      cardAspectRatio: "1 / 1.2",
      overlay: {
        top: "32%",
        left: "25%",
        width: "50%",
        height: "43%",
        rotate: "0deg",
        objectFit: "contain",
        opacity: 0.98,
        filter: "contrast(1.05) saturate(1.02)",
      },
    },
  },
    // Invitation
    {
      match: (category) => normalizeCategory(category).includes("invites"),
      cfg: {
        mockupSrc: "/assets/mockup/invitation-mockup.jpg",
        cardAspectRatio: "1 / 1.2",
        overlay: {
          top: "15%",
          left: "31.3%",
          width: "38%",
          height: "70%",
          rotate: "0deg",
          objectFit: "fill",
          filter: "contrast(1.05) saturate(1.02)",
        },
      },
    },
    // Clothing mockup
    {
      match: (category) => /clothing|clothes|apparel/i.test(normalizeCategory(category)),
      cfg: {
        mockupSrc: "/assets/mockup/Tshirt-mockup.jpg",
        cardAspectRatio: "1 / 1.2",
        overlay: {
          top: "30%",
          left: "33%",
          width: "35%",
          height: "50%",
          rotate: "0deg",
          objectFit: "contain",
          opacity: 0.98,
          filter: "contrast(1.05) saturate(1.02)",
        },
      },
    },
    // Business Leaflets
    {
      match: (category) => normalizeCategory(category).includes("business leaflets"),
      cfg: {
        mockupSrc: "/assets/mockup/business-leaflets-mockup.jpg",
        cardAspectRatio: "1 / 1.2",
        overlay: {
          top: "15%",
          left: "33.2%",
          width: "34.5%",
          height: "70%",
          rotate: "0deg",
          objectFit: "fill",
          opacity: 0.98,
          filter: "contrast(1.05) saturate(1.02)",
        },
      },
    },
    // Business Card
    {
      match: (category) => normalizeCategory(category).includes("business card"),
      cfg: {
        mockupSrc: "/assets/mockup/business-card-mockup.jpg",
        cardAspectRatio: "1 / 1",
        overlay: {
          borderRadius: 0,
          top: "20.45%",
          left: "16.1%",
          width: "67%",
          height: "59%",
          rotate: "0deg",
          objectFit: "fill",
          opacity: 0.98,
          filter: "contrast(1.05) saturate(1.02)",
        },
      },
    },
    // Sticker mockup
    {
      match: (category) => normalizeCategory(category).includes("sticker"),
      cfg: {
        mockupSrc: "/assets/mockup/stickers-Mockup.jpeg",
        cardAspectRatio: "1 / 1.2",
        overlay: {
          top: "10%",
          left: "10%",
          width: "70%",
          height: "70%",
          rotate: "0deg",
          objectFit: "contain",
          opacity: 0.98,
          // filter: "contrast(1.05) saturate(1.02)",
        },
      },  
    },
    // Mug (cup of tea)
    {
      match: (category) => normalizeCategory(category).includes("mug"),
      cfg: {
        mockupSrc: "/assets/mockup/mug-mockup.jpg",
        cardAspectRatio: "1 / 1",
        overlay: {
          top: "3%",
          left: "30%",
          width: "30%",
          height: "26%",
          rotate: "0deg",
          borderRadius: 6,
          objectFit: "fill",
          opacity: 0.98,
        },
      },
    },
    {
      match: (category) => normalizeCategory(category).includes("notebooks"),
      cfg: {
        mockupSrc: "/assets/mockup/notebook-mockup.jpg",
        cardAspectRatio: "1 / 1",
        overlay: {
          top: "20%",
          left: "36.9%",
          width: "28.5%",
          height: "58.5%",
          rotate: "0deg",
          objectFit: "fill",
          opacity: 0.98,
        },
      },
    },
    // Photo art
    {
      match: (category) => {
        const c = normalizeCategory(category);
        return c.includes("leaflet") || c.includes("photo art") || c.includes("flyer");
      },
      cfg: {
        mockupSrc: "/assets/mockup/photoArt-mockup.jpeg",
        cardAspectRatio: "1 / 1.25",
        overlay: {
          top: "21%",
          left: "36%",
          width: "32%",
          height: "57%",
          rotate: "0deg",
          objectFit: "fill",
          opacity: 0.98,
        },
      },
    },
    // Wall art
    {
      match: (category) => {
        const c = normalizeCategory(category);
        return c.includes("leaflet") || c.includes("wall art") || c.includes("flyer");
      },
      cfg: {
        mockupSrc: "/assets/mockup/wallart-mockup.jpg",
        cardAspectRatio: "1 / 1.25",
        overlay: {
          top: "26.5%",
          left: "39.2%",
          width: "21.5%",
          height: "39%",
          rotate: "0deg",
          objectFit: "fill",
          opacity: 0.98,
        },
      },
    },
    // 4 slide greeting card
    {
      match: (category) => normalizeCategory(category).includes("card"),
      cfg: {
        mockupSrc: "/assets/mockup/greeting-card-mockup.jpg",
        cardAspectRatio: "1 / 1",
        overlay: {
          top: "20%",
          left: "31%",
          width: "36%",
          height: "74%",
          objectFit: "fill",
        },
      },
    },
  ];

export const getMockupConfig = (category?: string): MockupConfig | null => {
  const hit = CATEGORY_MOCKUPS.find((x) => x.match(category));
  return hit?.cfg ?? null;
};

