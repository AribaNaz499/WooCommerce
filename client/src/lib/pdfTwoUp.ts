export type SlidesPayload = Record<string, string>;

type TwoUpOptions = {
  gapPx?: number;
  dpi?: number;
  background?: string | null;
  quality?: number;
  orientation?: "portrait" | "landscape";
  fit?: "contain" | "cover";
  pairStrategy?: "sequential" | "outer-inner";
  swapPairs?: boolean;
  pageMm?: { w: number; h: number };
  outputFormat?: "jpeg" | "png";
  pageTitle?: (args: {
    pageIndex: number;
    leftKey?: string;
    rightKey?: string;
  }) => string | null | undefined;
  titleStyle?: {
    font?: string;
    color?: string;
    background?: string;
    paddingX?: number;
    paddingY?: number;
    radius?: number;
    align?: "left" | "center" | "right";
    offsetX?: number;
    offsetY?: number;
  };
};

type TenUpOptions = TwoUpOptions & {
  columns?: number;
  rows?: number;
  marginPx?: number;
};

const A4_PORTRAIT_MM = { w: 210, h: 297 };
const A3_PORTRAIT_MM = { w: 297, h: 420 };
const A5_PORTRAIT_MM = { w: 148, h: 210 };
const US_LETTER_MM = { w: 215.9, h: 279.4 };
const HALF_US_LETTER_MM = { w: 139.7, h: 215.9 };
const US_TABLOID_MM = { w: 279.4, h: 431.8 };
const A4_LANDSCAPE_MM = { w: 297, h: 210 };
const US_LETTER_LANDSCAPE_MM = { w: 279.4, h: 215.9 };
const MUG_WRAP_11OZ_MM = { w: 228, h: 88.9 };
const mmToPx = (mm: number, dpi: number) => Math.round((mm / 25.4) * dpi);

const normalizeSizeKey = (size?: string) => {
  const raw = String(size ?? "").trim().toLowerCase();
  if (!raw) return "";
  const s = raw
    .replace(/[()]/g, "")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .replace(/×/g, "x");
  if (s.includes("tabloid")) return "us_tabloid";
  if (s.includes("half") && s.includes("letter")) return "half_us_letter";
  if (s.includes("letter")) return "us_letter";
  if (s.includes("a3")) return "a3";
  if (s.includes("a5")) return "a5";
  if (s.includes("a4")) return "a4";
  return s;
};

const defaultOptions: Required<TwoUpOptions> = {
  gapPx: 10,
  dpi: 300,
  background: "#ffffff",
  quality: 0.92,
  orientation: "landscape",
  fit: "contain",
  pairStrategy: "sequential",
  swapPairs: false,
  pageMm: A4_PORTRAIT_MM,
  outputFormat: "jpeg",
  pageTitle: () => undefined,
  titleStyle: {
    font: "22px Arial",
    color: "#111111",
    background: "rgba(255,255,255,0.75)",
    paddingX: 8,
    paddingY: 6,
    radius: 4,
    align: "left",
    offsetX: 12,
    offsetY: 12,
  },
};

const getSlideOrder = (key: string) => {
  const match = key.match(/(\d+)/);
  if (!match) return Number.POSITIVE_INFINITY;
  return Number.parseInt(match[1], 10);
};

const sortSlideKeys = (keys: string[]) =>
  [...keys].sort((a, b) => {
    const na = getSlideOrder(a);
    const nb = getSlideOrder(b);
    if (na !== nb) return na - nb;
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });

const applyPairStrategy = (
  keys: string[],
  strategy: "sequential" | "outer-inner",
) => {
  if (strategy !== "outer-inner") return keys;
  const out: string[] = [];
  let i = 0;
  let j = keys.length - 1;
  while (i <= j) {
    if (i === j) {
      out.push(keys[i]);
      break;
    }
    out.push(keys[i], keys[j]);
    i += 1;
    j -= 1;
  }
  return out;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });

const flipImageToDataUrl = async (src: string): Promise<string> => {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return src;
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
};

export const isCardsCategory = (name?: string) => {
  const n = String(name ?? "").trim().toLowerCase();
  return n === "cards" || n.includes("card");
};

export const isBusinessCardsCategory = (name?: string) =>
  /business\s*cards?/i.test(String(name ?? ""));

export const isBusinessLeafletsCategory = (name?: string) =>
  /business\s*leaflets?/i.test(String(name ?? ""));

export const isCandlesCategory = (name?: string) =>
  /candle/i.test(String(name ?? ""));

export const isNotebooksCategory = (name?: string) =>
  /notebook/i.test(String(name ?? ""));

export const isCoastersCategory = (name?: string) =>
  /coaster/i.test(String(name ?? ""));

export const isMirrorPrintCategory = (name?: string) => {
  const n = String(name ?? "").trim().toLowerCase();
  return (
    n.includes("coaster") ||
    n.includes("notebook") ||
    n.includes("mug") ||
    n.includes("apparel") ||
    n.includes("clothing") ||
    n.includes("clothes") ||
    n.includes("tote bag") ||
    n.includes("tote") ||
    n.includes("bag")
  );
};

export async function mirrorSlides(slides: SlidesPayload): Promise<SlidesPayload> {
  const entries = await Promise.all(
    Object.entries(slides as Record<string, string>).map(async ([k, v]) => {
      const src = typeof v === "string" ? v : "";
      if (!src) return [k, v] as const;
      const flipped = await flipImageToDataUrl(src);
      return [k, flipped] as const;
    })
  );
  return Object.fromEntries(entries);
}

export const isA4Size = (size?: string) =>
  normalizeSizeKey(size) === "a4";

export const isBusinessCardPrintSize = (size?: string) => {
  const s = normalizeSizeKey(size);
  return (
    s === "a5" ||
    s === "a4" ||
    s === "a3" ||
    s === "us_letter" ||
    s === "half_us_letter" ||
    s === "us_tabloid"
  );
};

export const isParallelCardSize = (size?: string) => {
  const s = normalizeSizeKey(size);
  return (
    s === "a5" ||
    s === "a4" ||
    s === "a3" ||
    s === "us_letter" ||
    s === "half_us_letter" ||
    s === "us_tabloid"
  );
};

export const isLeafletTwoUpSize = (size?: string) => {
  const s = normalizeSizeKey(size);
  return s === "a5" || s === "half_us_letter";
};

export const getPageMmForSize = (size?: string) => {
  const s = normalizeSizeKey(size);
  if (s === "a3") return A3_PORTRAIT_MM;
  if (s === "a5") return A5_PORTRAIT_MM;
  if (s === "mug_wrap_11oz") return MUG_WRAP_11OZ_MM;
  if (s === "us_letter") return US_LETTER_MM;
  if (s === "half_us_letter") return HALF_US_LETTER_MM;
  if (s === "us_tabloid") return US_TABLOID_MM;
  return A4_PORTRAIT_MM;
};

export const getLeafletTwoUpPageMm = (size?: string) => {
  const s = normalizeSizeKey(size);
  if (s === "half_us_letter") return US_LETTER_MM;
  return A4_PORTRAIT_MM;
};

export const isNotebookTwoUpSize = (size?: string) => {
  const s = normalizeSizeKey(size);
  return s === "a5" || s === "half_us_letter";
};

export const getNotebookTwoUpPageMm = (size?: string) => {
  const s = normalizeSizeKey(size);
  if (s === "half_us_letter") return US_LETTER_MM;
  return A4_PORTRAIT_MM;
};

export const isInviteTwoUpSize = (size?: string) => {
  const s = normalizeSizeKey(size);
  return s === "a5" || s === "half_us_letter";
};

export const getInviteTwoUpPageMm = (size?: string) => {
  const s = normalizeSizeKey(size);
  if (s === "half_us_letter") return US_LETTER_LANDSCAPE_MM;
  return A4_LANDSCAPE_MM;
};

export const isMugWrapSize = (size?: string) =>
  normalizeSizeKey(size) === "mug_wrap_11oz";

export const getMugWrapPageMm = (size?: string) => {
  const s = normalizeSizeKey(size);
  if (s === "mug_wrap_11oz") return MUG_WRAP_11OZ_MM;
  return MUG_WRAP_11OZ_MM;
};

type FixedGridOptions = {
  columns?: number;
  rows?: number;
  labelMm?: { w: number; h: number };
  pageMm?: { w: number; h: number };
  gapMm?: number;
  distribute?: boolean;
  dpi?: number;
  background?: string | null;
  quality?: number;
  fit?: "contain" | "cover";
  outputFormat?: "jpeg" | "png";
  fillMode?: "repeat" | "sequence";
  mirrorPage?: boolean;
};

export async function buildFixedGridSlides(
  slides: SlidesPayload,
  options?: FixedGridOptions,
): Promise<SlidesPayload> {
  const opts: Required<FixedGridOptions> = {
    columns: 2,
    rows: 3,
    labelMm: { w: 70, h: 70 },
    pageMm: A4_PORTRAIT_MM,
    gapMm: 0,
    distribute: false,
    dpi: 300,
    background: "#ffffff",
    quality: 0.92,
    fit: "contain",
    outputFormat: "jpeg",
    fillMode: "repeat",
    mirrorPage: false,
    ...(options ?? {}),
  };

  const keys = sortSlideKeys(Object.keys(slides).filter((k) => slides[k]));
  if (keys.length === 0) return {};

  const pageWidth = mmToPx(opts.pageMm.w, opts.dpi);
  const pageHeight = mmToPx(opts.pageMm.h, opts.dpi);
  const cols = Math.max(1, Math.floor(opts.columns));
  const rows = Math.max(1, Math.floor(opts.rows));

  let labelW = mmToPx(opts.labelMm.w, opts.dpi);
  let labelH = mmToPx(opts.labelMm.h, opts.dpi);
  let gapX = mmToPx(Math.max(0, opts.gapMm), opts.dpi);
  let gapY = mmToPx(Math.max(0, opts.gapMm), opts.dpi);

  // fit grid inside page if needed
  const totalW = cols * labelW + gapX * (cols - 1);
  const totalH = rows * labelH + gapY * (rows - 1);
  const scaleDown = Math.min(1, pageWidth / totalW, pageHeight / totalH);
  if (scaleDown < 1) {
    labelW = Math.floor(labelW * scaleDown);
    labelH = Math.floor(labelH * scaleDown);
    gapX = Math.floor(gapX * scaleDown);
    gapY = Math.floor(gapY * scaleDown);
  }

  let gridW = cols * labelW + gapX * (cols - 1);
  let gridH = rows * labelH + gapY * (rows - 1);
  let marginX = Math.max(0, Math.floor((pageWidth - gridW) / 2));
  let marginY = Math.max(0, Math.floor((pageHeight - gridH) / 2));

  if (opts.distribute && cols > 1 && rows > 1) {
    // distribute gaps so the grid fills the page (no top/bottom/side margins)
    gapX = Math.max(0, Math.floor((pageWidth - cols * labelW) / (cols - 1)));
    gapY = Math.max(0, Math.floor((pageHeight - rows * labelH) / (rows - 1)));
    gridW = cols * labelW + gapX * (cols - 1);
    gridH = rows * labelH + gapY * (rows - 1);
    marginX = 0;
    marginY = 0;
  }

  const output: SlidesPayload = {};
  let pageIndex = 1;

  if (opts.fillMode === "sequence") {
    const slots = cols * rows;
    for (let i = 0; i < keys.length; i += slots) {
      const pageKeys = keys.slice(i, i + slots);
      if (!pageKeys.length) continue;

      const images = await Promise.all(
        pageKeys.map(async (k) => {
          const src = slides[k];
          if (!src) return null;
          try {
            return await loadImage(src);
          } catch {
            return null;
          }
        })
      );

      const canvas = document.createElement("canvas");
      canvas.width = pageWidth;
      canvas.height = pageHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;

      const bg = opts.background;
      if (bg && bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, pageWidth, pageHeight);
      }

      if (opts.mirrorPage) {
        ctx.save();
        ctx.translate(pageWidth, 0);
        ctx.scale(-1, 1);
      }

      images.forEach((img, idx) => {
        if (!img) return;
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        const slotX = marginX + c * (labelW + gapX);
        const slotY = marginY + r * (labelH + gapY);
        const scale =
          opts.fit === "cover"
            ? Math.max(labelW / img.width, labelH / img.height)
            : Math.min(labelW / img.width, labelH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const offsetX = slotX + (labelW - drawW) / 2;
        const offsetY = slotY + (labelH - drawH) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      });

      if (opts.mirrorPage) ctx.restore();

      output[`slide${pageIndex}`] =
        opts.outputFormat === "png"
          ? canvas.toDataURL("image/png")
          : canvas.toDataURL("image/jpeg", opts.quality);
      pageIndex += 1;
    }

    return output;
  }

  for (const key of keys) {
    const src = slides[key];
    if (!src) continue;

    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    const bg = opts.background;
    if (bg && bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, pageWidth, pageHeight);
    }

    if (opts.mirrorPage) {
      ctx.save();
      ctx.translate(pageWidth, 0);
      ctx.scale(-1, 1);
    }

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const slotX = marginX + c * (labelW + gapX);
        const slotY = marginY + r * (labelH + gapY);
        const scale =
          opts.fit === "cover"
            ? Math.max(labelW / img.width, labelH / img.height)
            : Math.min(labelW / img.width, labelH / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const offsetX = slotX + (labelW - drawW) / 2;
        const offsetY = slotY + (labelH - drawH) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      }
    }

    if (opts.mirrorPage) ctx.restore();

    output[`slide${pageIndex}`] =
      opts.outputFormat === "png"
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", opts.quality);
    pageIndex += 1;
  }

  return output;
}

export async function buildTwoUpSlides(
  slides: SlidesPayload,
  options?: TwoUpOptions,
): Promise<SlidesPayload> {
  const opts = {
    ...defaultOptions,
    ...(options ?? {}),
    titleStyle: { ...defaultOptions.titleStyle, ...(options?.titleStyle ?? {}) },
  };
  const keys = applyPairStrategy(
    sortSlideKeys(Object.keys(slides).filter((k) => slides[k])),
    opts.pairStrategy,
  );

  if (keys.length === 0) return {};

  const baseMm = opts.pageMm ?? A4_PORTRAIT_MM;
  const pageMm =
    opts.orientation === "landscape"
      ? { w: baseMm.h, h: baseMm.w }
      : baseMm;
  const pageWidth = mmToPx(pageMm.w, opts.dpi);
  const pageHeight = mmToPx(pageMm.h, opts.dpi);

  const output: SlidesPayload = {};
  let pageIndex = 1;

  for (let i = 0; i < keys.length; i += 2) {
    let leftKey = keys[i];
    let rightKey = keys[i + 1];
    if (opts.swapPairs && rightKey) {
      [leftKey, rightKey] = [rightKey, leftKey];
    }

    const leftSrc = slides[leftKey];
    if (!leftSrc) continue;

    const [leftImg, rightImg] = await Promise.all([
      loadImage(leftSrc),
      rightKey && slides[rightKey] ? loadImage(slides[rightKey]) : Promise.resolve(null),
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    if (opts.background && opts.background !== "transparent") {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, pageWidth, pageHeight);
    }

    const slotWidth = (pageWidth - opts.gapPx) / 2;
    const slotHeight = pageHeight;

    const drawInSlot = (img: HTMLImageElement, slotX: number) => {
      const scale =
        opts.fit === "cover"
          ? Math.max(slotWidth / img.width, slotHeight / img.height)
          : Math.min(slotWidth / img.width, slotHeight / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const offsetX = slotX + (slotWidth - drawW) / 2;
      const offsetY = (slotHeight - drawH) / 2;
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
    };

    drawInSlot(leftImg, 0);
    if (rightImg) drawInSlot(rightImg, slotWidth + opts.gapPx);

    const title = opts.pageTitle?.({
      pageIndex,
      leftKey,
      rightKey,
    });
    if (title) {
      const style = opts.titleStyle;
      const font = style.font ?? "22px Arial";
      const paddingX = style.paddingX ?? 8;
      const paddingY = style.paddingY ?? 6;
      const offsetX = style.offsetX ?? 12;
      const offsetY = style.offsetY ?? 12;
      const align = style.align ?? "left";

      ctx.save();
      ctx.font = font;
      ctx.textBaseline = "top";
      ctx.fillStyle = style.color ?? "#111111";

      const metrics = ctx.measureText(title);
      const textW = metrics.width;
      const textH = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
      const boxW = textW + paddingX * 2;
      const boxH = textH + paddingY * 2;

      let x = offsetX;
      if (align === "center") x = (pageWidth - boxW) / 2 + offsetX;
      if (align === "right") x = pageWidth - boxW - offsetX;
      const y = offsetY;

      if (style.background) {
        ctx.fillStyle = style.background;
        const r = Math.max(0, style.radius ?? 0);
        if (r > 0) {
          const right = x + boxW;
          const bottom = y + boxH;
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.lineTo(right - r, y);
          ctx.quadraticCurveTo(right, y, right, y + r);
          ctx.lineTo(right, bottom - r);
          ctx.quadraticCurveTo(right, bottom, right - r, bottom);
          ctx.lineTo(x + r, bottom);
          ctx.quadraticCurveTo(x, bottom, x, bottom - r);
          ctx.lineTo(x, y + r);
          ctx.quadraticCurveTo(x, y, x + r, y);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillRect(x, y, boxW, boxH);
        }
      }

      ctx.fillStyle = style.color ?? "#111111";
      ctx.fillText(title, x + paddingX, y + paddingY);
      ctx.restore();
    }

    output[`slide${pageIndex}`] =
      opts.outputFormat === "png"
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", opts.quality);
    pageIndex += 1;
  }

  return output;
}

export async function buildTenUpSlides(
  slides: SlidesPayload,
  options?: TenUpOptions,
): Promise<SlidesPayload> {
  const opts: Required<TenUpOptions> = {
    ...defaultOptions,
    orientation: "portrait",
    columns: 2,
    rows: 5,
    marginPx: 12,
    ...(options ?? {}),
    titleStyle: { ...defaultOptions.titleStyle, ...(options?.titleStyle ?? {}) },
  };

  const keys = sortSlideKeys(Object.keys(slides).filter((k) => slides[k]));
  if (keys.length === 0) return {};

  const baseMm = opts.pageMm ?? A4_PORTRAIT_MM;
  const pageMm =
    opts.orientation === "landscape"
      ? { w: baseMm.h, h: baseMm.w }
      : baseMm;
  const pageWidth = mmToPx(pageMm.w, opts.dpi);
  const pageHeight = mmToPx(pageMm.h, opts.dpi);

  const cols = Math.max(1, Math.floor(opts.columns));
  const rows = Math.max(1, Math.floor(opts.rows));
  const margin = Math.max(0, opts.marginPx);
  const gapX = Math.max(0, opts.gapPx);
  const gapY = Math.max(0, opts.gapPx);

  const slotWidth = (pageWidth - margin * 2 - gapX * (cols - 1)) / cols;
  const slotHeight = (pageHeight - margin * 2 - gapY * (rows - 1)) / rows;

  const output: SlidesPayload = {};
  let pageIndex = 1;

  for (const key of keys) {
    const src = slides[key];
    if (!src) continue;

    const img = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;

    if (opts.background && opts.background !== "transparent") {
      ctx.fillStyle = opts.background;
      ctx.fillRect(0, 0, pageWidth, pageHeight);
    }

    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const slotX = margin + c * (slotWidth + gapX);
        const slotY = margin + r * (slotHeight + gapY);
        const scale =
          opts.fit === "cover"
            ? Math.max(slotWidth / img.width, slotHeight / img.height)
            : Math.min(slotWidth / img.width, slotHeight / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const offsetX = slotX + (slotWidth - drawW) / 2;
        const offsetY = slotY + (slotHeight - drawH) / 2;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      }
    }

    output[`slide${pageIndex}`] =
      opts.outputFormat === "png"
        ? canvas.toDataURL("image/png")
        : canvas.toDataURL("image/jpeg", opts.quality);
    pageIndex += 1;
  }

  return output;
}
