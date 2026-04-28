export type CropToContentOptions = {
  background?: [number, number, number];
  threshold?: number;
  alphaThreshold?: number;
  padding?: number;
  minCropRatio?: number;
  maxScanSize?: number;
};

const getPixel = (data: Uint8ClampedArray, width: number, x: number, y: number) => {
  const i = (y * width + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]] as const;
};

const avgColor = (points: Array<[number, number]>, data: Uint8ClampedArray, w: number, h: number) => {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  points.forEach(([x, y]) => {
    const xx = Math.max(0, Math.min(w - 1, x));
    const yy = Math.max(0, Math.min(h - 1, y));
    const [pr, pg, pb] = getPixel(data, w, xx, yy);
    r += pr;
    g += pg;
    b += pb;
    count += 1;
  });
  if (!count) return [255, 255, 255] as const;
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)] as const;
};

export const shouldSmartCropCategory = (category?: string) => {
  const raw = String(category ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
  if (!raw) return false;
  return raw.includes("invite") || raw.includes("photo art") || raw.replace(/\s/g, "") === "photoart";
};

export async function cropImageToContent(src: string, opts?: CropToContentOptions): Promise<string> {
  if (!src) return src;
  if (typeof document === "undefined") return src;

  const options = {
    background: opts?.background,
    threshold: opts?.threshold ?? 14,
    alphaThreshold: opts?.alphaThreshold ?? 8,
    padding: opts?.padding ?? 6,
    minCropRatio: opts?.minCropRatio ?? 0.92,
    maxScanSize: opts?.maxScanSize ?? 320,
  };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const imgW = Math.max(1, img.naturalWidth || img.width || 1);
        const imgH = Math.max(1, img.naturalHeight || img.height || 1);

        const scale = Math.min(1, options.maxScanSize / Math.max(imgW, imgH));
        const scanW = Math.max(1, Math.round(imgW * scale));
        const scanH = Math.max(1, Math.round(imgH * scale));

        const scanCanvas = document.createElement("canvas");
        scanCanvas.width = scanW;
        scanCanvas.height = scanH;
        const scanCtx = scanCanvas.getContext("2d", { willReadFrequently: true });
        if (!scanCtx) {
          resolve(src);
          return;
        }

        scanCtx.drawImage(img, 0, 0, scanW, scanH);
        const imgData = scanCtx.getImageData(0, 0, scanW, scanH);
        const data = imgData.data;

        const bg =
          options.background ??
          avgColor(
            [
              [0, 0],
              [scanW - 1, 0],
              [0, scanH - 1],
              [scanW - 1, scanH - 1],
              [Math.floor(scanW / 2), 0],
              [Math.floor(scanW / 2), scanH - 1],
              [0, Math.floor(scanH / 2)],
              [scanW - 1, Math.floor(scanH / 2)],
            ],
            data,
            scanW,
            scanH
          );

        let minX = scanW;
        let minY = scanH;
        let maxX = -1;
        let maxY = -1;

        const step = Math.max(1, Math.floor(Math.max(scanW, scanH) / 200));
        const isBg = (r: number, g: number, b: number, a: number) => {
          if (a <= options.alphaThreshold) return true;
          return (
            Math.abs(r - bg[0]) <= options.threshold &&
            Math.abs(g - bg[1]) <= options.threshold &&
            Math.abs(b - bg[2]) <= options.threshold
          );
        };

        for (let y = 0; y < scanH; y += step) {
          for (let x = 0; x < scanW; x += step) {
            const [r, g, b, a] = getPixel(data, scanW, x, y);
            if (isBg(r, g, b, a)) continue;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }

        if (maxX < 0 || maxY < 0) {
          resolve(src);
          return;
        }

        const invScale = 1 / scale;
        const pad = Math.max(0, options.padding);
        const minX0 = Math.max(0, Math.floor(minX * invScale) - pad);
        const minY0 = Math.max(0, Math.floor(minY * invScale) - pad);
        const maxX0 = Math.min(imgW - 1, Math.ceil((maxX + 1) * invScale) + pad);
        const maxY0 = Math.min(imgH - 1, Math.ceil((maxY + 1) * invScale) + pad);

        const cropW = Math.max(1, maxX0 - minX0 + 1);
        const cropH = Math.max(1, maxY0 - minY0 + 1);

        if (cropW / imgW > options.minCropRatio && cropH / imgH > options.minCropRatio) {
          resolve(src);
          return;
        }

        const out = document.createElement("canvas");
        out.width = cropW;
        out.height = cropH;
        const outCtx = out.getContext("2d");
        if (!outCtx) {
          resolve(src);
          return;
        }

        outCtx.drawImage(img, minX0, minY0, cropW, cropH, 0, 0, cropW, cropH);
        resolve(out.toDataURL("image/png"));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
