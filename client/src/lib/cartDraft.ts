import { create } from "zustand";

export type SizeKey = "a5" | "a4" | "a3" | "half_us_letter" | "us_letter" | "us_tabloid" | "mug_wrap_11oz" | "coaster_95";

export type CartItem = {
  id: string | number;
  type: "card" | "template";
  title: string;
  category: string;
  img?: string;

  selectedSize: SizeKey;
  prices: { actual: any; sale: any };
  isOnSale?: boolean;
  displayPrice?: number;

  // ✅ NEW
  draftId: string;              // unique per basket item
  accessplan: "free" | "bundle" | "pro";
};

type AddResult =
  | { ok: true }
  | { ok: false; reason: "exists" };

type CartState = {
  cart: CartItem[];
  addToCart: (item: CartItem) => AddResult;
  updateCartItem: (id: any, type: CartItem["type"], next: Partial<CartItem>) => void;
  removeFromCart: (id: any, type: CartItem["type"]) => void;
  clearCart: () => void;
};

function persist(cart: CartItem[]) {
  try {
    localStorage.setItem("basket_cart", JSON.stringify(cart));
  } catch {}
}

function loadInitial(): CartItem[] {
  try {
    const raw = localStorage.getItem("basket_cart");
    if (!raw) return [];
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: loadInitial(),

  addToCart: (item) => {
    const cart = get().cart;

    // ✅ "same product" existence logic:
    // اگر آپ چاہتے ہیں same product multiple times but different draftId allowed → remove this check
    const exists = cart.some((x) => String(x.id) === String(item.id) && x.type === item.type);
    if (exists) return { ok: false, reason: "exists" };

    const next = [...cart, item];
    persist(next);
    set({ cart: next });
    return { ok: true };
  },

  updateCartItem: (id, type, next) => {
    const cart = get().cart.map((x) => {
      if (String(x.id) === String(id) && x.type === type) return { ...x, ...next };
      return x;
    });
    persist(cart);
    set({ cart });
  },

  removeFromCart: (id, type) => {
    const cart = get().cart.filter((x) => !(String(x.id) === String(id) && x.type === type));
    persist(cart);
    set({ cart });
  },

  clearCart: () => {
    persist([]);
    set({ cart: [] });
  },
}));


// src/lib/cartDraft.ts
const key = (draftId: string) => `basket:draft:${draftId}:slides`;

export function saveBasketDraftSlides(draftId: string, slides: any) {
  if (!draftId) return;
  try {
    localStorage.setItem(key(draftId), JSON.stringify(slides));
  } catch {}
}

export function readBasketDraftSlides(draftId: string) {
  if (!draftId) return null;
  try {
    const raw = localStorage.getItem(key(draftId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hasBasketDraftSlides(draftId: string) {
  const v = readBasketDraftSlides(draftId);
  return Boolean(v && (v.slide1 || v.slide2 || v.slide3 || v.slide4));
}

export function clearBasketDraftSlides(draftId: string) {
  if (!draftId) return;
  try {
    localStorage.removeItem(key(draftId));
  } catch {}
}
