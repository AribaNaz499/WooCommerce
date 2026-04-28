const now = () =>
  typeof performance !== "undefined" && typeof performance.now === "function"
    ? performance.now()
    : Date.now();

const shouldLogTimings = () => {
  if (typeof window === "undefined") return !import.meta.env.PROD;
  return !import.meta.env.PROD || window.localStorage.getItem("debug_timings") === "1";
};

export const startTiming = (label: string, meta?: Record<string, unknown>) => {
  const startedAt = now();
  if (shouldLogTimings()) {
    console.log(`[timing:start] ${label}`, {
      at: new Date().toISOString(),
      ...(meta ?? {}),
    });
  }
  return startedAt;
};

export const finishTiming = (
  label: string,
  startedAt: number,
  meta?: Record<string, unknown>
) => {
  const durationMs = Math.round((now() - startedAt) * 100) / 100;
  if (shouldLogTimings()) {
    console.log(`[timing:end] ${label}`, {
      durationMs,
      at: new Date().toISOString(),
      ...(meta ?? {}),
    });
  }
  return durationMs;
};

export const logTiming = (label: string, meta?: Record<string, unknown>) => {
  if (shouldLogTimings()) {
    console.log(`[timing:mark] ${label}`, {
      at: new Date().toISOString(),
      ...(meta ?? {}),
    });
  }
};
