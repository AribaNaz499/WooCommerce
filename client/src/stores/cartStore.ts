import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SizeKey =
  | "a5"
  | "a4"
  | "a3"
  | "half_us_letter"
  | "us_letter"
  | "us_tabloid"
  | "mug_wrap_11oz"
  | "coaster_95";
export type PriceTable = Partial<Record<SizeKey, number>>;

export type CartItemType = "card" | "templet";

export type CartItem = {
  id: string;                 // ✅ always string
  type: CartItemType;         // ✅ "card" | "templet"
  img?: string;
  title?: string;
  category?: string;

  selectedSize: SizeKey;

  prices: {
    actual: PriceTable;
    sale?: Partial<PriceTable>;
  };

  isOnSale: boolean;
  displayPrice: number;

  polygonlayout?: any; // card editor
  rawStores?: any;     // template editor
  templetDesign?: any;
};

type AddResult = { ok: true } | { ok: false; reason: "exists" | "invalid" };

type CartState = {
  cart: CartItem[];
  addToCart: (item: CartItem) => AddResult;
  updateCartItem: (id: string, type: CartItemType, patch: Partial<CartItem>) => void;
  removeFromCart: (id: string, type?: CartItemType) => void;
  clearCart: () => void;
  hasItem: (id: string, type: CartItemType) => boolean;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],

      hasItem: (id, type) =>
        get().cart.some((x) => x.id === String(id) && x.type === type),

      addToCart: (item) => {
        const id = String(item?.id || "").trim();
        if (!id) return { ok: false, reason: "invalid" };

        const normalized: CartItem = { ...item, id };

        if (get().hasItem(normalized.id, normalized.type)) {
          return { ok: false, reason: "exists" };
        }

        set((s) => ({ cart: [...s.cart, normalized] }));
        return { ok: true };
      },

      updateCartItem: (id, type, patch) => {
        const targetId = String(id).trim();
        set((s) => ({
          cart: s.cart.map((x) => {
            if (x.id !== targetId || x.type !== type) return x;
            return { ...x, ...patch, id: x.id, type: x.type }; // keep id/type stable
          }),
        }));
      },

      removeFromCart: (id, type) => {
        const targetId = String(id).trim();
        set((s) => ({
          cart: s.cart.filter((x) => {
            const sameId = x.id === targetId;
            if (!sameId) return true;
            if (!type) return false;
            return x.type !== type;
          }),
        }));
      },

      clearCart: () => set({ cart: [] }),
    }),
    { name: "cart-store-v2" }
  )
);
