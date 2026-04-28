import { useCallback, useRef, useState, type RefObject } from "react";

export type AlignGuides = {
  showV: boolean;
  showH: boolean;
  x: number;
  y: number;
};

export type AlignItem = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Options = {
  threshold?: number;
  scale?: number;
};

type DragResult = {
  x: number;
  y: number;
  snappedX: boolean;
  snappedY: boolean;
};

type LineType = "start" | "center" | "end";

const buildLines = (items: AlignItem[], axis: "x" | "y") => {
  const lines: number[] = [];
  items.forEach((it) => {
    if (axis === "x") {
      lines.push(it.x, it.x + it.w / 2, it.x + it.w);
    } else {
      lines.push(it.y, it.y + it.h / 2, it.y + it.h);
    }
  });
  return lines;
};

const findSnap = (
  movingLines: { type: LineType; value: number }[],
  candidates: number[],
  threshold: number
) => {
  let best: { delta: number; line: number; type: LineType } | null = null;

  for (const ml of movingLines) {
    for (const c of candidates) {
      const delta = c - ml.value;
      const abs = Math.abs(delta);
      if (abs <= threshold) {
        if (!best || abs < Math.abs(best.delta)) {
          best = { delta, line: c, type: ml.type };
        }
      }
    }
  }

  return best;
};

export function useAlignGuides(
  containerRef: RefObject<HTMLElement | null>,
  options?: Options
) {
  const threshold = options?.threshold ?? 4;
  const scale = options?.scale ?? 1;
  const [active, setActive] = useState(false);
  const [guides, setGuides] = useState<AlignGuides>({
    showV: false,
    showH: false,
    x: 0,
    y: 0,
  });
  const last = useRef<AlignGuides>(guides);

  const update = useCallback(
    (
      x: number,
      y: number,
      w: number,
      h: number,
      items?: AlignItem[],
      excludeId?: string
    ): DragResult => {
      const el = containerRef.current;
      if (!el) return { x, y, snappedX: false, snappedY: false };

      const rect = el.getBoundingClientRect();
      const width = rect.width / Math.max(0.0001, scale);
      const height = rect.height / Math.max(0.0001, scale);
      const cx = width / 2;
      const cy = height / 2;

      const filtered =
        items?.filter((it) => (excludeId ? it.id !== excludeId : true)) ?? [];

      const candidateX = [0, cx, width, ...buildLines(filtered, "x")];
      const candidateY = [0, cy, height, ...buildLines(filtered, "y")];

      const movingX = [
        { type: "start" as const, value: x },
        { type: "center" as const, value: x + w / 2 },
        { type: "end" as const, value: x + w },
      ];
      const movingY = [
        { type: "start" as const, value: y },
        { type: "center" as const, value: y + h / 2 },
        { type: "end" as const, value: y + h },
      ];

      const snapX = findSnap(movingX, candidateX, threshold);
      const snapY = findSnap(movingY, candidateY, threshold);

      let nextX = x;
      let nextY = y;

      if (snapX) {
        if (snapX.type === "start") nextX = snapX.line;
        if (snapX.type === "center") nextX = snapX.line - w / 2;
        if (snapX.type === "end") nextX = snapX.line - w;
      }

      if (snapY) {
        if (snapY.type === "start") nextY = snapY.line;
        if (snapY.type === "center") nextY = snapY.line - h / 2;
        if (snapY.type === "end") nextY = snapY.line - h;
      }

      const next: AlignGuides = {
        showV: Boolean(snapX),
        showH: Boolean(snapY),
        x: snapX ? snapX.line : cx,
        y: snapY ? snapY.line : cy,
      };

      const prev = last.current;
      if (
        prev.showV !== next.showV ||
        prev.showH !== next.showH ||
        prev.x !== next.x ||
        prev.y !== next.y
      ) {
        last.current = next;
        setGuides(next);
      }

      return {
        x: nextX,
        y: nextY,
        snappedX: Boolean(snapX),
        snappedY: Boolean(snapY),
      };
    },
    [containerRef, threshold, scale]
  );

  const start = useCallback(() => {
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    setGuides((prev) => ({ ...prev, showV: false, showH: false }));
  }, []);

  return {
    guides,
    isActive: active,
    onDragStart: start,
    onDrag: update,
    onDragStop: stop,
  };
}
