import { Box, type SxProps, type Theme } from "@mui/material";
import { useMemo, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import SmartImage from "../SmartImage/SmartImage";
import { buildGoogleFontsUrls, loadGoogleFontsOnce } from "../../constant/googleFonts";
import { supabase } from "../../supabase/supabase";
import {
  getTemplateDisplayFactor,
  scaleTemplateElementBy,
} from "../../lib/templateEditorScale";

type TemplateLike = {
  id?: string | number;
  category?: string;
  img_url?: string;
  image_url?: string;
  imageurl?: string;
  poster?: string;
  slides?: any;
  raw_stores?: any;
  rawStores?: any;
};

type Props = {
  template?: TemplateLike | null;
  fallbackSrc?: string;
  alt?: string;
  sx?: SxProps<Theme>;
};

const LIVE_FONT_CATEGORIES =
  /(mug|bag|candle|candles|invite|invites|Invites|clothing|apparel|sticker|stickers|stciker|stcikers|notebook|notebooks|wall\s*art|business[\s-]*leaflets?)/i;
const GENERIC_FONTS = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "cursive",
  "fantasy",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
]);

const parseMaybeJson = (value: any) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const toNum = (v: any, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const normalizeFontFamily = (value?: string | null) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const quoted = raw.match(/['"]([^'"]+)['"]/);
  if (quoted?.[1]) return quoted[1].trim();
  const first = raw.split(",")[0]?.trim() ?? "";
  if (!first) return "";
  return first.replace(/^['"]|['"]$/g, "").trim();
};

const resolveElementFont = (el: any) =>
  normalizeFontFamily(
    el?.fontFamily ??
      el?.font_family ??
      el?.["font-family"] ??
      el?.fontFamily1 ??
      el?.fontFamily2 ??
      el?.fontFamily3 ??
      el?.fontFamily4 ??
      el?.style?.fontFamily ??
      el?.style?.font_family ??
      el?.style?.["font-family"] ??
      "",
  );

const firstDefinedValue = (...values: any[]) => {
  for (const value of values) {
    if (value === 0 || value === false) return value;
    if (typeof value === "string") {
      if (value.trim()) return value;
      continue;
    }
    if (value != null) return value;
  }
  return undefined;
};

const resolveElementFontWeight = (el: any): string | number => {
  const raw = firstDefinedValue(
    el?.fontWeight,
    el?.font_weight,
    el?.["font-weight"],
    el?.style?.fontWeight,
    el?.style?.font_weight,
    el?.style?.["font-weight"],
  );
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return el?.bold ? 700 : 400;
    const asNum = Number(trimmed);
    if (Number.isFinite(asNum) && asNum > 0) return asNum;
    return trimmed;
  }
  return el?.bold ? 700 : 400;
};

const resolveElementFontStyle = (el: any): string => {
  const raw = firstDefinedValue(
    el?.fontStyle,
    el?.font_style,
    el?.["font-style"],
    el?.style?.fontStyle,
    el?.style?.font_style,
    el?.style?.["font-style"],
  );
  if (typeof raw === "string") return raw.trim() || (el?.italic ? "italic" : "normal");
  return el?.italic ? "italic" : "normal";
};

const resolveElementTextDecoration = (el: any): string => {
  const raw = firstDefinedValue(
    el?.textDecoration,
    el?.text_decoration,
    el?.["text-decoration"],
    el?.style?.textDecoration,
    el?.style?.text_decoration,
    el?.style?.["text-decoration"],
  );
  if (typeof raw === "string") return raw.trim() || "none";
  if (el?.underline) return "underline";
  return "none";
};

const resolveElementColor = (el: any): string =>
  String(
    firstDefinedValue(
      el?.color,
      el?.fill,
      el?.style?.color,
      el?.style?.fill,
      "#111111",
    ),
  );

const resolveElementRotation = (el: any): number =>
  toNum(
    firstDefinedValue(
      el?.rotation,
      el?.rotate,
      el?.style?.rotation,
      el?.style?.rotate,
    ),
    0,
  );

const normalizeElementType = (el: any) => {
  const t = String(el?.type ?? "").toLowerCase();
  if (t) return t;
  if (el?.text != null) return "text";
  if (el?.sticker) return "sticker";
  if (el?.src || el?.image || el?.url || el?.imageUrl) return "image";
  return "";
};

const slideToken = (value: any): string => {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const n = Number(raw);
  if (Number.isFinite(n)) return String(n);
  const lower = raw.toLowerCase();
  if (lower === "front") return "1";
  if (lower === "back") return "2";
  return lower;
};

const slideAliases = (value: any): string[] => {
  const token = slideToken(value);
  if (!token) return [];
  const out = new Set<string>([token]);
  const n = Number(token);
  if (Number.isFinite(n)) {
    out.add(`slide${n}`);
    out.add(`Slide${n}`);
    if (n === 1) out.add("front");
    if (n === 2) out.add("back");
  } else {
    out.add(token.replace(/\s+/g, ""));
  }
  return Array.from(out);
};

const detectCanvas = (rawStores: any, elements: any[]) => {
  const fitW = toNum(rawStores?.config?.fitCanvas?.width, 0);
  const fitH = toNum(rawStores?.config?.fitCanvas?.height, 0);
  const pxW = toNum(rawStores?.canvas?.px?.w, 0);
  const pxH = toNum(rawStores?.canvas?.px?.h, 0);
  const mmW = toNum(rawStores?.canvas?.mm?.w, 0);
  const mmH = toNum(rawStores?.canvas?.mm?.h, 0);
  const cfgW = toNum(rawStores?.config?.mmWidth, 0);
  const cfgH = toNum(rawStores?.config?.mmHeight, 0);
  const mmToPx = (mm: number) => (mm / 25.4) * 96;

  let w = fitW || pxW || mmW || (cfgW ? mmToPx(cfgW) : 0);
  let h = fitH || pxH || mmH || (cfgH ? mmToPx(cfgH) : 0);

  if (!w || !h) {
    let maxX = 0;
    let maxY = 0;
    elements.forEach((el) => {
      const x = toNum(el?.x ?? el?.left, 0);
      const y = toNum(el?.y ?? el?.top, 0);
      const ew = toNum(el?.width ?? el?.w, 0);
      const eh = toNum(el?.height ?? el?.h, 0);
      maxX = Math.max(maxX, x + ew);
      maxY = Math.max(maxY, y + eh);
    });
    w = Math.max(400, maxX);
    h = Math.max(565, maxY);
  }

  return {
    width: Math.max(1, Math.round(w)),
    height: Math.max(1, Math.round(h)),
  };
};

const normalizePos = (el: any, canvasW: number, canvasH: number) => {
  let x = toNum(el?.x ?? el?.left, 0);
  let y = toNum(el?.y ?? el?.top, 0);
  let w = toNum(el?.width ?? el?.w, 0);
  let h = toNum(el?.height ?? el?.h, 0);

  const isUnit = (n: number) => n >= 0 && n <= 1.000001;
  const looksRelative =
    isUnit(x) &&
    isUnit(y) &&
    w > 0 &&
    w <= 1.000001 &&
    h > 0 &&
    h <= 1.000001;
  if (looksRelative) {
    x = x * canvasW;
    y = y * canvasH;
    w = w * canvasW;
    h = h * canvasH;
  }

  return {
    x,
    y,
    w: Math.max(1, w),
    h: Math.max(1, h),
  };
};

const resolveLayer = (el: any) => {
  const explicit = Number(el?.zIndex ?? el?.z_index);
  if (Number.isFinite(explicit)) return explicit;
  return normalizeElementType(el) === "text" ? 2 : 1;
};

const sortByVisualLayer = (elements: any[]) =>
  elements
    .map((el, index) => ({ el, index }))
    .sort((a, b) => {
      const la = resolveLayer(a.el);
      const lb = resolveLayer(b.el);
      if (la !== lb) return la - lb;
      return a.index - b.index;
    })
    .map(({ el }) => el);

async function fetchTemplateSlidesById(id: string) {
  const { data, error } = await supabase
    .from("templetDesign")
    .select("id,slides,raw_stores")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

const fallbackImageSrc = (t?: TemplateLike | null) =>
  t?.img_url ?? t?.image_url ?? t?.imageurl ?? t?.poster ?? "";

const TemplateSvgThumbnail = ({ template, fallbackSrc, alt = "template", sx }: Props) => {
  const categoryName = String(template?.category ?? "");
  const shouldRenderLive = LIVE_FONT_CATEGORIES.test(categoryName);
  const isMugCategory = /mug/i.test(categoryName);
  const isInviteCategory = /invite/i.test(categoryName);
  const id = template?.id != null ? String(template.id) : "";

  const localSlides = parseMaybeJson(template?.slides);
  const localRawStores = parseMaybeJson(template?.raw_stores ?? template?.rawStores);
  const hasLocalRawSlides =
    Array.isArray(localRawStores?.slides) && localRawStores.slides.length > 0;
  const hasLocalRawTextElements =
    Array.isArray(localRawStores?.textElements) && localRawStores.textElements.length > 0;
  const hasLocalSlideData =
    isInviteCategory
      ? hasLocalRawSlides || hasLocalRawTextElements
      : (Array.isArray(localSlides) && localSlides.length > 0) || hasLocalRawSlides;

  const { data: remoteSlides } = useQuery({
    queryKey: ["template-svg-thumb", id],
    queryFn: () => fetchTemplateSlidesById(id),
    enabled: shouldRenderLive && !!id && !hasLocalSlideData,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const slidesSource = useMemo(() => {
    const remoteParsed = parseMaybeJson(remoteSlides?.slides);
    const rsLocal = parseMaybeJson(template?.raw_stores ?? template?.rawStores);
    const rsRemote = parseMaybeJson(remoteSlides?.raw_stores);

    if (isInviteCategory) {
      if (Array.isArray(remoteParsed) && remoteParsed.length > 0) return remoteParsed;
      if (Array.isArray(rsRemote?.slides) && rsRemote.slides.length > 0) return rsRemote.slides;
      if (Array.isArray(localSlides) && localSlides.length > 0) return localSlides;
      if (Array.isArray(rsLocal?.slides) && rsLocal.slides.length > 0) return rsLocal.slides;
      return [];
    }

    if (Array.isArray(localSlides) && localSlides.length > 0) return localSlides;
    if (Array.isArray(remoteParsed) && remoteParsed.length > 0) return remoteParsed;
    if (Array.isArray(rsLocal?.slides) && rsLocal.slides.length > 0) return rsLocal.slides;
    if (Array.isArray(rsRemote?.slides) && rsRemote.slides.length > 0) return rsRemote.slides;
    return [];
  }, [isInviteCategory, localSlides, remoteSlides?.slides, remoteSlides?.raw_stores, template?.raw_stores, template?.rawStores]);

  const rawStores = useMemo(() => {
    const remote = parseMaybeJson(remoteSlides?.raw_stores);
    const local = parseMaybeJson(template?.raw_stores ?? template?.rawStores);

    if (isInviteCategory) {
      if (remote && typeof remote === "object") return remote;
      if (local && typeof local === "object") return local;
      return {};
    }

    if (local && typeof local === "object") return local;
    if (remote && typeof remote === "object") return remote;
    return {};
  }, [isInviteCategory, template?.raw_stores, template?.rawStores, remoteSlides?.raw_stores]);
  const displayFactor = useMemo(() => getTemplateDisplayFactor(rawStores, 1), [rawStores]);

  const firstSlide = slidesSource?.[0];

  const firstSlideElements = useMemo(() => {
    const snapshot = Array.isArray(firstSlide?.elements) ? firstSlide.elements : [];

    const firstAliasSet = new Set(slideAliases(firstSlide?.id));
    const belongsToFirst = (el: any) => {
      const sid = el?.slideId ?? el?.slide_id;
      const aliases = slideAliases(sid);
      if (!aliases.length) return true;
      return aliases.some((a) => firstAliasSet.has(a));
    };

    const separated = [
      ...(Array.isArray(rawStores?.textElements) ? rawStores.textElements : []).map((el: any) => ({
        ...el,
        type: "text",
      })),
      ...(Array.isArray(rawStores?.imageElements) ? rawStores.imageElements : []).map((el: any) => ({
        ...el,
        type: "image",
      })),
      ...(Array.isArray(rawStores?.stickerElements) ? rawStores.stickerElements : []).map((el: any) => ({
        ...el,
        type: "sticker",
      })),
    ].filter((el: any) => belongsToFirst(el));

    const normalizeSnapshot = snapshot.map((el: any) => {
      const t = normalizeElementType(el);
      if (!t) return null;
      return { ...el, type: t };
    }).filter(Boolean);

    const renderElements = separated.length > 0 ? separated : normalizeSnapshot;
    return sortByVisualLayer(
      renderElements.map((el: any) => scaleTemplateElementBy(el, displayFactor)),
    );
  }, [
    displayFactor,
    firstSlide?.elements,
    firstSlide?.id,
    rawStores?.textElements,
    rawStores?.imageElements,
    rawStores?.stickerElements,
  ]);

  const canvas = useMemo(
    () => detectCanvas(rawStores, firstSlideElements),
    [firstSlideElements, rawStores],
  );

  const fonts = useMemo(() => {
    const out = new Set<string>();
    firstSlideElements.forEach((el: any) => {
      const t = normalizeElementType(el);
      if (t !== "text") return;
      const fam = resolveElementFont(el);
      if (!fam) return;
      if (GENERIC_FONTS.has(fam.toLowerCase())) return;
      out.add(fam);
    });
    return Array.from(out);
  }, [firstSlideElements]);

  useEffect(() => {
    if (!fonts.length) return;
    loadGoogleFontsOnce(buildGoogleFontsUrls(fonts));
  }, [fonts]);

  const slideBg = useMemo(() => {
    const slideBgMap = rawStores?.slideBg ?? {};
    const firstRaw = firstSlide?.id;
    const token = slideToken(firstRaw);
    const label = String(firstSlide?.label ?? "").trim();
    const labelKey = label.toLowerCase().replace(/\s+/g, "");
    const keys = [
      firstRaw,
      String(firstRaw ?? ""),
      token,
      `slide${token}`,
      `Slide${token}`,
      label,
      labelKey,
      labelKey === "front" ? "front" : "",
      labelKey === "front" ? "slide1" : "",
      labelKey === "back" ? "back" : "",
      labelKey === "back" ? "slide2" : "",
    ].filter(Boolean);
    for (const k of keys) {
      if (slideBgMap?.[k] != null) return slideBgMap[k];
    }
    return null;
  }, [firstSlide?.id, firstSlide?.label, rawStores?.slideBg]);

  const fallback = fallbackSrc || fallbackImageSrc(template);

  if (!shouldRenderLive || firstSlideElements.length === 0) {
    return <SmartImage src={fallback} alt={alt} sx={sx} />;
  }

  const defs: ReactNode[] = [];
  const nodes: ReactNode[] = [];

  firstSlideElements.forEach((el: any, idx: number) => {
    const type = normalizeElementType(el);
    const { x, y, w, h } = normalizePos(el, canvas.width, canvas.height);

    if (type !== "text") {
      const src = el?.src ?? el?.sticker ?? el?.image ?? el?.url ?? el?.imageUrl;
      if (!src) return;
      const isSticker = type === "sticker" || (!type && !!el?.sticker);
      nodes.push(
        <image
          key={`img-${idx}`}
          href={src}
          x={x}
          y={y}
          width={w}
          height={h}
          preserveAspectRatio={isSticker ? "xMidYMid meet" : "xMidYMid slice"}
        />,
      );
      return;
    }

    const text = String(el?.text ?? el?.value ?? "");
    if (!text) return;

    const alignRaw = String(
      firstDefinedValue(el?.align, el?.textAlign, el?.style?.textAlign, "center"),
    ).toLowerCase();
    const align = alignRaw === "left" ? "left" : alignRaw === "right" ? "right" : "center";
    const textAnchor = align === "left" ? "start" : align === "right" ? "end" : "middle";
    const tx = align === "left" ? x : align === "right" ? x + w : x + w / 2;
    const ty = y + h / 2;
    const rotation = resolveElementRotation(el);
    const curve = Math.max(
      -200,
      Math.min(
        200,
        toNum(firstDefinedValue(el?.curve, el?.arc, el?.style?.curve, el?.style?.arc), 0),
      ),
    );
    const hasCurve = Math.abs(curve) > 0.5;
    const fontSize = Math.max(
      1,
      toNum(
        firstDefinedValue(
          el?.fontSize,
          el?.font_size,
          el?.["font-size"],
          el?.style?.fontSize,
          el?.style?.font_size,
          el?.style?.["font-size"],
        ),
        20,
      ),
    );
    const fontWeight = resolveElementFontWeight(el);
    const fontStyle = resolveElementFontStyle(el);
    const textDecoration = resolveElementTextDecoration(el);
    const fill = resolveElementColor(el);
    const lineHeight = Math.max(
      1,
      toNum(
        firstDefinedValue(
          el?.lineHeight,
          el?.line_height,
          el?.["line-height"],
          el?.style?.lineHeight,
          el?.style?.line_height,
          el?.style?.["line-height"],
        ),
        1.16,
      ),
    );
    const fontFamily = resolveElementFont(el) || "Arial";
    const style = {
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      textDecoration,
      fill,
    } as const;
    const transform = rotation ? `rotate(${rotation} ${tx} ${ty})` : undefined;

    if (!hasCurve) {
      if (isInviteCategory) {
        const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
        nodes.push(
          <foreignObject
            key={`text-invite-fo-${idx}`}
            x={x}
            y={y}
            width={w}
            height={h}
            transform={transform}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: justify,
                textAlign: align,
                fontFamily,
                fontSize,
                fontWeight,
                fontStyle,
                color: fill,
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                lineHeight: String(lineHeight),
              }}
            >
              {text}
            </div>
          </foreignObject>,
        );
        return;
      }

      if (isMugCategory) {
        const justify = align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";
        nodes.push(
          <foreignObject
            key={`text-fo-${idx}`}
            x={x}
            y={y}
            width={w}
            height={h}
            transform={transform}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: justify,
                textAlign: align,
                fontFamily,
                fontSize,
                fontWeight,
                fontStyle,
                color: fill,
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                wordBreak: "break-word",
                lineHeight: String(lineHeight),
              }}
            >
              {text}
            </div>
          </foreignObject>,
        );
        return;
      }

      nodes.push(
        <text
          key={`text-${idx}`}
          x={tx}
          y={ty}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          transform={transform}
          style={style}
        >
          {text}
        </text>,
      );
      return;
    }

    const curvePx = (curve / 100) * (h / 2);
    const midY = y + h / 2;
    const pathId = `curve-${id || "tpl"}-${idx}`;
    defs.push(
      <path
        key={`curve-def-${idx}`}
        id={pathId}
        d={`M ${x} ${midY} Q ${x + w / 2} ${midY - curvePx} ${x + w} ${midY}`}
      />,
    );
    const startOffset = align === "left" ? "0%" : align === "right" ? "100%" : "50%";
    const curveText = (
      <text
        key={`curve-text-${idx}`}
        textAnchor={textAnchor}
        dominantBaseline="middle"
        style={style}
      >
        <textPath
          href={`#${pathId}`}
          startOffset={startOffset}
          style={{
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            textDecoration,
            fill,
          }}
        >
          {text}
        </textPath>
      </text>
    );
    if (transform) {
      nodes.push(
        <g key={`curve-group-${idx}`} transform={transform}>
          {curveText}
        </g>,
      );
      return;
    }
    nodes.push(curveText);
  });

  return (
    <Box
      component="svg"
      viewBox={`0 0 ${canvas.width} ${canvas.height}`}
      preserveAspectRatio="xMidYMid meet"
      sx={sx}
    >
      <defs>{defs}</defs>
      <rect
        x={0}
        y={0}
        width={canvas.width}
        height={canvas.height}
        fill={slideBg?.color || "#ffffff"}
      />
      {slideBg?.image ? (
        <image
          href={String(slideBg.image)}
          x={0}
          y={0}
          width={canvas.width}
          height={canvas.height}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : null}
      {nodes}
    </Box>
  );
};

export default TemplateSvgThumbnail;
