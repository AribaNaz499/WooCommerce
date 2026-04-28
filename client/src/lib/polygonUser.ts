// utils/polygon.user.ts
import type { PolygonLayout } from "./polygon";
import { mergeBuckets } from "./polygon";

/**
 * Hydrates Slide1Context from a v2 polygon layout in USER mode.
 * - Layout (template) frames/stickers/staticText -> ctx.layout1
 * - User images/stickers/freeTexts -> ctx state (preserving locked flags)
 * - BG + flags + oneText/multipleTexts + QR + AI -> ctx state
 */
export function hydrateUserSlide1(ctx: any, poly: PolygonLayout) {
  if (!poly || poly.version !== 2) return;
  const s = poly.slides?.slide1;
  if (!s) return;

  // --- BG ---
  if (typeof ctx.setBgColor1 === "function") ctx.setBgColor1(s.bg?.color ?? null);
  if (typeof ctx.setBgImage1 === "function") ctx.setBgImage1(s.bg?.image ?? null);

  // --- Flags + text layout selection ---
  if (typeof ctx.setShowOneTextRightSideBox1 === "function") {
    ctx.setShowOneTextRightSideBox1(!!s.flags?.showOneText);
  }
  if (typeof ctx.setMultipleTextValue1 === "function") {
    ctx.setMultipleTextValue1(!!s.flags?.multipleText);
  }
  if (typeof ctx.setIsAIimage1 === "function") {
    ctx.setIsAIimage1(!!s.flags?.isAIImage);
  }

  // --- One text block (styling) ---
  if (s.oneText) {
    const ot = s.oneText;
    if (typeof ctx.setOneTextValue1 === "function") ctx.setOneTextValue1(ot.value ?? "");
    if (typeof ctx.setFontSize1 === "function") ctx.setFontSize1(ot.fontSize ?? 16);
    if (typeof ctx.setFontWeight1 === "function") ctx.setFontWeight1(ot.fontWeight ?? 400);
    if (typeof ctx.setFontColor1 === "function") ctx.setFontColor1(ot.fontColor ?? "#000");
    if (typeof ctx.setFontFamily1 === "function") ctx.setFontFamily1(ot.fontFamily ?? "Roboto");
    if (typeof ctx.setTextAlign1 === "function") ctx.setTextAlign1((ot.textAlign as any) ?? "center");
    if (typeof ctx.setVerticalAlign1 === "function") ctx.setVerticalAlign1((ot.verticalAlign as any) ?? "center");
    if (typeof ctx.setRotation1 === "function") ctx.setRotation1(ot.rotation ?? 0);
    if (typeof ctx.setLineHeight1 === "function") ctx.setLineHeight1(ot.lineHeight ?? 1.4);
    if (typeof ctx.setLetterSpacing1 === "function") ctx.setLetterSpacing1(ot.letterSpacing ?? 0);
  }

  // --- Multiple text slices (keep your shape) ---
  if (Array.isArray(s.multipleTexts) && typeof ctx.setTexts1 === "function") {
    ctx.setTexts1(s.multipleTexts);
  }

  // --- Layout (template) → ctx.layout1: elements, stickers, textElements ---
  const layoutElements = mergeBuckets(s.layout?.bgFrames).map((f: any) => ({
    id: f.id, x: f.x, y: f.y, width: f.width, height: f.height,
    src: f.src, zIndex: f.zIndex, rotation: f.rotation, locked: !!f.locked,
  }));

  const layoutStickers = mergeBuckets(s.layout?.stickers).map((st: any) => ({
    id: st.id, sticker: st.sticker, x: st.x, y: st.y, width: st.width, height: st.height,
    rotation: st.rotation, zIndex: st.zIndex, locked: !!st.locked,
  }));

  const staticText = (s.layout?.staticText ?? []).map((te: any) => ({
    id: te.id, text: te.text, x: te.x, y: te.y, width: te.width, height: te.height,
    textAlign: te.textAlign, verticalAlign: te.verticalAlign,
    fontSize: te.fontSize, fontFamily: te.fontFamily, color: te.color,
    fontWeight: te.fontWeight ?? te.bold, italic: te.italic,
    rotation: te.rotation, zIndex: te.zIndex, locked: !!te.locked,
  }));

  if (typeof ctx.setLayout1 === "function") {
    ctx.setLayout1({
      elements: layoutElements,
      stickers: layoutStickers,
      textElements: staticText,
    });
  }

  // --- USER LAYER: images/stickers/free texts ---
  const userImages = mergeBuckets(s.user?.images).map((img: any) => ({
    id: img.id, src: img.src, x: img.x, y: img.y, width: img.width, height: img.height,
    rotation: img.rotation, zIndex: img.zIndex, filter: img.filter, shapePath: img.shapePath,
    locked: !!img.locked,
  }));

  const userStickers = mergeBuckets(s.user?.stickers).map((st: any) => ({
    id: st.id, sticker: st.sticker, x: st.x, y: st.y, width: st.width, height: st.height,
    rotation: st.rotation, zIndex: st.zIndex, locked: !!st.locked,
  }));

  const userFreeTexts = (s.user?.freeTexts ?? []).map((t: any) => ({
    id: t.id, value: t.value, fontSize: t.fontSize, fontWeight: t.fontWeight,
    fontColor: t.fontColor, fontFamily: t.fontFamily, textAlign: t.textAlign,
    verticalAlign: t.verticalAlign, rotation: t.rotation,
    zIndex: t.zIndex, position: t.position, size: t.size,
    lineHeight: t.lineHeight, letterSpacing: t.letterSpacing, locked: !!t.locked,
  }));

  if (typeof ctx.setDraggableImages1 === "function") ctx.setDraggableImages1(userImages);
  if (typeof ctx.setSelectedImage1 === "function") {
    // by default "select all user images" so they are visible (your code filters by selectedImg1)
    ctx.setSelectedImage1(userImages.map((i: any) => i.id));
  }
  if (typeof ctx.setSelectedStickers1 === "function") ctx.setSelectedStickers1(userStickers);
  if (typeof ctx.setTextElements1 === "function") ctx.setTextElements1(userFreeTexts);

  // --- QR ---
  if (s.qrVideo?.url) {
    if (typeof ctx.setSelectedVideoUrl1 === "function") ctx.setSelectedVideoUrl1(s.qrVideo.url);
    if (typeof ctx.setQrPosition1 === "function")
      ctx.setQrPosition1((p: any) => ({ ...p, ...s.qrVideo }));
  } else if (typeof ctx.setSelectedVideoUrl1 === "function") {
    ctx.setSelectedVideoUrl1(null);
  }

  if (s.qrAudio?.url) {
    if (typeof ctx.setSelectedAudioUrl1 === "function") ctx.setSelectedAudioUrl1(s.qrAudio.url);
    if (typeof ctx.setQrAudioPosition1 === "function")
      ctx.setQrAudioPosition1((p: any) => ({ ...p, ...s.qrAudio }));
  } else if (typeof ctx.setSelectedAudioUrl1 === "function") {
    ctx.setSelectedAudioUrl1(null);
  }

  // --- AI ---
  if (s.ai && s.ai.imageUrl) {
    if (typeof ctx.setIsAIimage1 === "function") ctx.setIsAIimage1(true);
    if (typeof ctx.setAIImage1 === "function")
      ctx.setAIImage1({ x: s.ai.x ?? 0, y: s.ai.y ?? 0, width: s.ai.width ?? 200, height: s.ai.height ?? 200 });
    if (typeof ctx.setSelectedAIimageUrl1 === "function") ctx.setSelectedAIimageUrl1(s.ai.imageUrl);
  }
}
