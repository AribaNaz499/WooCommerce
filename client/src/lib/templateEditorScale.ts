const BOX_KEYS = ["x", "y", "width", "height", "w", "h", "left", "top"] as const;
const TEXT_KEYS = ["fontSize", "font_size", "font-size"] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const scaleNumeric = (value: unknown, factor: number) => {
  if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 0.0001) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value * factor;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    if (Number.isFinite(num)) return String(num * factor);
  }

  return value;
};

const scaleElement = <T>(input: T, factor: number): T => {
  if (!isRecord(input)) return input;
  if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 0.0001) {
    return input;
  }

  const next: Record<string, unknown> = { ...input };
  BOX_KEYS.forEach((key) => {
    if (key in next) next[key] = scaleNumeric(next[key], factor);
  });

  const type = String(next.type ?? "").toLowerCase();
  const isText = type === "text" || next.text != null || next.value != null;
  if (isText) {
    TEXT_KEYS.forEach((key) => {
      if (key in next) next[key] = scaleNumeric(next[key], factor);
    });
  }

  return next as T;
};

const scaleSlides = (slides: unknown, factor: number) => {
  if (!Array.isArray(slides)) return slides;
  if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 0.0001) {
    return slides;
  }

  return slides.map((slide) => {
    if (!isRecord(slide)) return slide;
    const elements = Array.isArray(slide.elements)
      ? slide.elements.map((el) => scaleElement(el, factor))
      : slide.elements;
    return { ...slide, elements };
  });
};

const scaleElementList = (elements: unknown, factor: number) => {
  if (!Array.isArray(elements)) return elements;
  if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 0.0001) {
    return elements;
  }
  return elements.map((el) => scaleElement(el, factor));
};

const parseMaybeSlides = (value: unknown) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : value;
  } catch {
    return value;
  }
};

export const getStoredTemplateMultiplier = (source: any, fallback = 1) => {
  const value =
    source?.editorScale?.multiplier ??
    source?.canvas?.multiplier ??
    source?.config?.multiplier ??
    fallback;
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

export const hasNormalizedTemplateCoords = (source: any) => {
  const value = String(
    source?.editorScale?.coordSpace ?? source?.editorScale?.coordsSpace ?? "",
  )
    .trim()
    .toLowerCase();
  return value === "product";
};

export const getTemplateDisplayFactor = (source: any, fallback = 1) =>
  hasNormalizedTemplateCoords(source)
    ? getStoredTemplateMultiplier(source, fallback)
    : 1;

export const scaleTemplateElementBy = scaleElement;

export const prepareTemplateRawStoresForEditor = (
  rawStores: any,
  currentMultiplier: number,
) => {
  if (!isRecord(rawStores)) return rawStores;

  const storedMultiplier = getStoredTemplateMultiplier(rawStores, currentMultiplier);
  const normalized = hasNormalizedTemplateCoords(rawStores);

  let factor = 1;
  if (normalized) {
    factor = currentMultiplier;
  } else if (storedMultiplier > 0 && currentMultiplier > 0) {
    factor = currentMultiplier / storedMultiplier;
  }

  if (!Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 0.0001) {
    return rawStores;
  }

  return {
    ...rawStores,
    textElements: scaleElementList(rawStores.textElements, factor),
    imageElements: scaleElementList(rawStores.imageElements, factor),
    stickerElements: scaleElementList(rawStores.stickerElements, factor),
    slides: scaleSlides(rawStores.slides, factor),
    snapshotSlides: scaleSlides(parseMaybeSlides(rawStores.snapshotSlides), factor),
  };
};

export const prepareTemplateRawStoresForStorage = (
  rawStores: any,
  multiplier: number,
) => {
  if (!isRecord(rawStores)) return rawStores;

  const factor = multiplier > 0 ? 1 / multiplier : 1;
  const next =
    !Number.isFinite(factor) || factor <= 0 || Math.abs(factor - 1) < 0.0001
      ? rawStores
      : {
          ...rawStores,
          textElements: scaleElementList(rawStores.textElements, factor),
          imageElements: scaleElementList(rawStores.imageElements, factor),
          stickerElements: scaleElementList(rawStores.stickerElements, factor),
          slides: scaleSlides(rawStores.slides, factor),
          snapshotSlides: scaleSlides(parseMaybeSlides(rawStores.snapshotSlides), factor),
        };

  return {
    ...next,
    editorScale: {
      multiplier,
      coordSpace: "product",
    },
  };
};
