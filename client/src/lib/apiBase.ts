const rawBase = import.meta.env.VITE_API_BASE;

export const API_BASE = rawBase
  ? String(rawBase).replace(/\/+$/, "")
  : "/api";

