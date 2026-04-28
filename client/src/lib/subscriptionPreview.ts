const SUBSCRIPTION_PREVIEW_STORAGE_KEY = "subscription_preview_payload";

export type SubscriptionPreviewSlides = Record<string, string>;

type PersistedSubscriptionPreview = {
  previewKey?: string;
  slides: SubscriptionPreviewSlides;
};

const getValidSlides = (slides?: Record<string, unknown> | null): SubscriptionPreviewSlides =>
  Object.fromEntries(
    Object.entries(slides ?? {}).filter(
      ([, value]) => typeof value === "string" && value.startsWith("data:image/"),
    ),
  ) as SubscriptionPreviewSlides;

export const saveSubscriptionPreviewPayload = (
  slides?: Record<string, unknown> | null,
  previewKey?: string | null,
) => {
  if (typeof sessionStorage === "undefined") return;
  const validSlides = getValidSlides(slides);
  if (!Object.keys(validSlides).length) return;

  const payload: PersistedSubscriptionPreview = {
    slides: validSlides,
    ...(previewKey ? { previewKey } : {}),
  };

  try {
    sessionStorage.setItem(SUBSCRIPTION_PREVIEW_STORAGE_KEY, JSON.stringify(payload));
  } catch {}
};

export const readSubscriptionPreviewPayload = (expectedPreviewKey?: string | null): SubscriptionPreviewSlides => {
  if (typeof sessionStorage === "undefined") return {};

  try {
    const stored = sessionStorage.getItem(SUBSCRIPTION_PREVIEW_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as PersistedSubscriptionPreview | null;
    const validSlides = getValidSlides(parsed?.slides);
    if (!Object.keys(validSlides).length) return {};

    const storedPreviewKey = String(parsed?.previewKey ?? "").trim();
    const nextPreviewKey = String(expectedPreviewKey ?? "").trim();
    if (storedPreviewKey && nextPreviewKey && storedPreviewKey !== nextPreviewKey) {
      return {};
    }

    return validSlides;
  } catch {
    return {};
  }
};

export const clearSubscriptionPreviewPayload = () => {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(SUBSCRIPTION_PREVIEW_STORAGE_KEY);
  } catch {}
};
