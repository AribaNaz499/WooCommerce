type BaseEl = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
};

export type TemplateTextEl = BaseEl & {
  type: "text";
  text: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textDecoration?: string;
  lineHeight?: number;
  align?: "left" | "center" | "right";
  rotation?: number;
  curve?: number;
};

export type TemplateImageEl = BaseEl & { type: "image"; src: string };
export type TemplateStickerEl = BaseEl & { type: "sticker"; src: string };
export type TemplateAnyEl = TemplateTextEl | TemplateImageEl | TemplateStickerEl;

export type TemplateSlide = {
  id: number;
  label?: string;
  elements: TemplateAnyEl[];
  bgColor?: string | null;
};

type RenderOptions = {
  width: number;
  height: number;
  pixelRatio?: number;
  backgroundColor?: string;
};

const GENERIC_FONT_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
]);

const imageCache = new Map<string, Promise<HTMLImageElement>>();

const toNum = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const normalizeFontFamily = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const quoted = raw.match(/['"]([^'"]+)['"]/);
  if (quoted?.[1]) return quoted[1].trim();
  const first = raw.split(",")[0]?.trim() ?? "";
  return first.replace(/^['"]|['"]$/g, "").trim();
};

const formatCanvasFontFamily = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "Arial";

  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const unquoted = part.replace(/^['"]|['"]$/g, "").trim();
      const lower = unquoted.toLowerCase();
      if (GENERIC_FONT_FAMILIES.has(lower)) return lower;
      if (/^[-a-z0-9]+$/i.test(unquoted)) return unquoted;
      return `"${unquoted.replace(/"/g, '\\"')}"`;
    })
    .join(", ");
};

const resolveImageSrc = (src: string) => {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("/") && typeof window !== "undefined") {
    return `${window.location.origin}${src}`;
  }
  return src;
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result || ""));
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });

const loadHtmlImage = (src: string, crossOrigin?: "anonymous") =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });

const loadImage = (src: string): Promise<HTMLImageElement> => {
  const resolved = resolveImageSrc(src);
  if (!resolved) return Promise.reject(new Error("Missing image src"));
  const cached = imageCache.get(resolved);
  if (cached) return cached;

  const promise = (async () => {
    try {
      // Preferred: CORS-enabled load keeps the canvas exportable.
      return await loadHtmlImage(resolved, "anonymous");
    } catch {}

    try {
      // Safari fallback: allow non-CORS images to render to the preview texture.
      // This may taint canvas exports, handled by caller fallback.
      return await loadHtmlImage(resolved);
    } catch {}

    try {
      // Last fallback: fetch and inline as data URL when CORS fetch is permitted.
      const resp = await fetch(resolved, { mode: "cors" });
      if (!resp.ok) throw new Error(`Failed to fetch image: ${resolved}`);
      const blob = await resp.blob();
      const dataUrl = await blobToDataUrl(blob);
      return await loadHtmlImage(dataUrl);
    } catch {
      throw new Error(`Failed to load image: ${resolved}`);
    }
  })();

  imageCache.set(resolved, promise);
  void promise.catch(() => {
    // Avoid permanently caching transient load failures.
    if (imageCache.get(resolved) === promise) imageCache.delete(resolved);
  });
  return promise;
};

const fitContain = (
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
) => {
  const scale = Math.min(destW / srcW, destH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return {
    x: (destW - width) / 2,
    y: (destH - height) / 2,
    width,
    height,
  };
};

const fitCover = (
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
) => {
  const scale = Math.max(destW / srcW, destH / srcH);
  const width = srcW * scale;
  const height = srcH * scale;
  return {
    x: (destW - width) / 2,
    y: (destH - height) / 2,
    width,
    height,
  };
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) => {
  const lines: string[] = [];
  const normalized = String(text ?? "").replace(/\r/g, "");
  const paragraphs = normalized.split("\n");

  const breakWord = (word: string) => {
    let current = "";
    const chunks: string[] = [];
    for (const char of word) {
      const next = `${current}${char}`;
      if (current && ctx.measureText(next).width > maxWidth) {
        chunks.push(current);
        current = char;
      } else {
        current = next;
      }
    }
    if (current) chunks.push(current);
    return chunks;
  };

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      return;
    }

    let current = "";
    words.forEach((word) => {
      if (ctx.measureText(word).width > maxWidth) {
        if (current) {
          lines.push(current);
          current = "";
        }
        breakWord(word).forEach((chunk) => lines.push(chunk));
        return;
      }

      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });

    if (current) lines.push(current);
    if (paragraphIndex < paragraphs.length - 1) lines.push("");
  });

  return lines;
};

const quadraticPoint = (
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) => {
  const oneMinusT = 1 - t;
  return {
    x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
    y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
  };
};

const quadraticTangent = (
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) => ({
  x: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
  y: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
});

const buildCurveSamples = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  steps = 240,
) => {
  const samples: Array<{ t: number; point: { x: number; y: number }; length: number }> = [];
  let total = 0;
  let previous = quadraticPoint(0, p0, p1, p2);
  samples.push({ t: 0, point: previous, length: 0 });

  for (let i = 1; i <= steps; i += 1) {
    const t = i / steps;
    const point = quadraticPoint(t, p0, p1, p2);
    total += Math.hypot(point.x - previous.x, point.y - previous.y);
    samples.push({ t, point, length: total });
    previous = point;
  }

  return { p0, p1, p2, samples, totalLength: total };
};

const getCurvePosition = (
  distance: number,
  curve: ReturnType<typeof buildCurveSamples>,
) => {
  const clamped = Math.max(0, Math.min(distance, curve.totalLength));
  for (let i = 1; i < curve.samples.length; i += 1) {
    const prev = curve.samples[i - 1];
    const next = curve.samples[i];
    if (clamped > next.length) continue;
    const span = next.length - prev.length || 1;
    const ratio = (clamped - prev.length) / span;
    const t = prev.t + (next.t - prev.t) * ratio;
    return { t, point: quadraticPoint(t, curve.p0, curve.p1, curve.p2) };
  }
  const last = curve.samples[curve.samples.length - 1];
  return { t: last.t, point: last.point };
};

const drawTextUnderline = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
) => {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.lineWidth = Math.max(1, ctx.lineWidth);
  ctx.strokeStyle = ctx.fillStyle as string;
  ctx.stroke();
};

const getTextLineMetrics = (
  ctx: CanvasRenderingContext2D,
  line: string,
  fontSize: number,
) => {
  const sample = line || "Mg";
  const metrics = ctx.measureText(sample);
  const ascent = Math.max(
    0,
    toNum((metrics as any).actualBoundingBoxAscent, fontSize * 0.8),
  );
  const descent = Math.max(
    0,
    toNum((metrics as any).actualBoundingBoxDescent, fontSize * 0.2),
  );
  return { ascent, descent };
};

const drawCurvedText = (
  ctx: CanvasRenderingContext2D,
  text: TemplateTextEl,
  lines: string[],
) => {
  const safeW = Math.max(1, toNum(text.width, 1));
  const safeH = Math.max(1, toNum(text.height, 1));
  const content = lines.join(" ").trim();
  if (!content) return;

  const curveVal = Math.max(-200, Math.min(200, toNum(text.curve, 0)));
  const curvePx = (curveVal / 100) * (safeH / 2);
  const midY = safeH / 2;
  const p0 = { x: 0, y: midY };
  const p1 = { x: safeW / 2, y: midY - curvePx };
  const p2 = { x: safeW, y: midY };
  const curve = buildCurveSamples(p0, p1, p2);

  const glyphs = Array.from(content);
  const widths = glyphs.map((glyph) => ctx.measureText(glyph).width);
  const totalGlyphWidth = widths.reduce((sum, width) => sum + width, 0);
  const align = text.align ?? "center";
  const startDistance =
    align === "left"
      ? 0
      : align === "right"
      ? Math.max(0, curve.totalLength - totalGlyphWidth)
      : Math.max(0, (curve.totalLength - totalGlyphWidth) / 2);

  let consumed = 0;
  glyphs.forEach((glyph, index) => {
    const glyphWidth = widths[index] || 0;
    const distance = startDistance + consumed + glyphWidth / 2;
    const { t, point } = getCurvePosition(distance, curve);
    const tangent = quadraticTangent(t, p0, p1, p2);
    const angle = Math.atan2(tangent.y, tangent.x);

    ctx.save();
    ctx.translate(point.x, point.y);
    ctx.rotate(angle);
    ctx.fillText(glyph, -glyphWidth / 2, 0);
    ctx.restore();

    consumed += glyphWidth;
  });
};

const drawTextElement = (
  ctx: CanvasRenderingContext2D,
  text: TemplateTextEl,
) => {
  const width = Math.max(1, toNum(text.width, 1));
  const height = Math.max(1, toNum(text.height, 1));
  const fontSize = Math.max(1, toNum(text.fontSize, 16));
  const fontWeight = text.fontWeight ?? (text.bold ? 700 : 400);
  const fontStyle = text.fontStyle ?? (text.italic ? "italic" : "normal");
  const fontFamily = text.fontFamily || "Arial";
  const lineHeightRatio = Math.max(0.8, toNum(text.lineHeight, 1.2));
  const lineHeight = fontSize * lineHeightRatio;
  const rotation = (toNum(text.rotation, 0) * Math.PI) / 180;
  const align = text.align ?? "center";
  const textColor = text.color ?? "#111111";
  const textDecoration = String(text.textDecoration ?? "none").toLowerCase();

  ctx.save();
  ctx.translate(toNum(text.x, 0) + width / 2, toNum(text.y, 0) + height / 2);
  if (rotation) ctx.rotate(rotation);
  ctx.translate(-width / 2, -height / 2);
  ctx.fillStyle = textColor;
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${formatCanvasFontFamily(fontFamily)}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = align as CanvasTextAlign;

  const lines = wrapText(ctx, text.text ?? "", width);
  if (Math.abs(toNum(text.curve, 0)) > 0.5) {
    drawCurvedText(ctx, text, lines);
    ctx.restore();
    return;
  }

  const lineMetrics = lines.map((line) => getTextLineMetrics(ctx, line, fontSize));
  const totalHeight = lines.length * lineHeight;
  const blockTop = Math.max(0, (height - totalHeight) / 2);
  const anchorX = align === "left" ? 0 : align === "right" ? width : width / 2;

  lines.forEach((line, index) => {
    const metrics = lineMetrics[index];
    const lineTop = blockTop + index * lineHeight;
    const glyphHeight = metrics.ascent + metrics.descent;
    const glyphTop = lineTop + Math.max(0, (lineHeight - glyphHeight) / 2);
    const y = glyphTop + metrics.ascent;
    ctx.fillText(line, anchorX, y);
    if (line && textDecoration.includes("underline")) {
      const measured = ctx.measureText(line).width;
      const underlineX =
        align === "left" ? anchorX : align === "right" ? anchorX - measured : anchorX - measured / 2;
      drawTextUnderline(
        ctx,
        underlineX,
        y + Math.max(1, metrics.descent * 0.45),
        measured,
      );
    }
  });

  ctx.restore();
};

export const collectTemplateSlideFonts = (slides: TemplateSlide[]) => {
  const fonts = new Set<string>();
  (slides ?? []).forEach((slide) => {
    (slide?.elements ?? []).forEach((element) => {
      if (element?.type !== "text") return;
      const family = normalizeFontFamily((element as TemplateTextEl).fontFamily);
      if (!family) return;
      if (GENERIC_FONT_FAMILIES.has(family.toLowerCase())) return;
      fonts.add(family);
    });
  });
  return Array.from(fonts);
};

export const renderTemplateSlideToCanvas = async (
  slide: TemplateSlide,
  options: RenderOptions,
) => {
  const pixelRatio = Math.max(1, toNum(options.pixelRatio, 1));
  const width = Math.max(1, Math.round(toNum(options.width, 1)));
  const height = Math.max(1, Math.round(toNum(options.height, 1)));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * pixelRatio));
  canvas.height = Math.max(1, Math.round(height * pixelRatio));

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const background = slide?.bgColor || options.backgroundColor || "#ffffff";
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const ordered = [...(slide?.elements ?? [])].sort((a, b) => {
    const zA = toNum(a?.zIndex, 1) + (a?.type === "text" ? 100000 : 0);
    const zB = toNum(b?.zIndex, 1) + (b?.type === "text" ? 100000 : 0);
    return zA - zB;
  });

  for (const element of ordered) {
    if (element.type === "text") {
      drawTextElement(ctx, element as TemplateTextEl);
      continue;
    }

    const src = String((element as TemplateImageEl | TemplateStickerEl).src ?? "");
    if (!src) continue;

    try {
      const img = await loadImage(src);
      const fit = element.type === "sticker" ? fitContain : fitCover;
      const widthPx = Math.max(1, toNum(element.width, 1));
      const heightPx = Math.max(1, toNum(element.height, 1));
      const box = fit(
        Math.max(1, img.naturalWidth || img.width),
        Math.max(1, img.naturalHeight || img.height),
        widthPx,
        heightPx,
      );

      ctx.save();
      ctx.translate(toNum(element.x, 0), toNum(element.y, 0));
      ctx.beginPath();
      ctx.rect(0, 0, widthPx, heightPx);
      ctx.clip();
      ctx.drawImage(img, box.x, box.y, box.width, box.height);
      ctx.restore();
    } catch {
      // Skip broken assets so the rest of the design still renders.
    }
  }

  return canvas;
};
