import { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import { isIosTouchDevice, isSafariBrowser } from "../../lib/platform";

type ConsoleLevel = "log" | "info" | "warn" | "error";

type ConsoleEntry = {
  id: number;
  level: ConsoleLevel;
  text: string;
  at: string;
};

const MAX_ENTRIES = 150;
const STORAGE_KEY = "safari_debug_console_entries_v1";
const ENABLE_KEY = "debug_console_enabled_v1";

const levelColor: Record<ConsoleLevel, string> = {
  log: "#d1d5db",
  info: "#93c5fd",
  warn: "#fcd34d",
  error: "#fca5a5",
};

const stringifyArg = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const DebugConsoleOverlay = () => {
  const enabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    const forcedByQuery = params.get("debugConsole") === "1";
    const forcedByStorage = window.localStorage.getItem(ENABLE_KEY) === "1";
    const ios = isIosTouchDevice();
    const safari = isSafariBrowser();
    return forcedByQuery || forcedByStorage || ios || safari || !import.meta.env.PROD;
  }, []);
  const [entries, setEntries] = useState<ConsoleEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.slice(-MAX_ENTRIES);
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(ENABLE_KEY, "1");
    } catch {}
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let nextId = entries.length > 0 ? Math.max(...entries.map((entry) => entry.id)) + 1 : 1;
    const original = {
      log: console.log.bind(console),
      info: console.info.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };

    const push = (level: ConsoleLevel, args: unknown[]) => {
      const text = args.map(stringifyArg).join(" ");
      setEntries((prev) => {
        const next = [
          ...prev,
          {
            id: nextId++,
            level,
            text,
            at: new Date().toLocaleTimeString(),
          },
        ];
        return next.slice(-MAX_ENTRIES);
      });
    };

    console.log = (...args: unknown[]) => {
      push("log", args);
      original.log(...args);
    };

    console.info = (...args: unknown[]) => {
      push("info", args);
      original.info(...args);
    };

    console.warn = (...args: unknown[]) => {
      push("warn", args);
      original.warn(...args);
    };

    console.error = (...args: unknown[]) => {
      push("error", args);
      original.error(...args);
    };

    const onError = (event: ErrorEvent) => {
      push("error", [
        "[window.error]",
        event.message,
        event.filename ? `@ ${event.filename}:${event.lineno}:${event.colno}` : "",
      ]);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      push("error", ["[unhandledrejection]", event.reason]);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    push("info", ["[debug-console] iPhone Safari overlay active"]);

    return () => {
      console.log = original.log;
      console.info = original.info;
      console.warn = original.warn;
      console.error = original.error;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
    } catch {}
  }, [enabled, entries]);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [entries, open]);

  if (!enabled) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        left: 10,
        right: 10,
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)",
        zIndex: 20000,
        borderRadius: 2,
        overflow: "hidden",
        border: open ? "1px solid rgba(255,255,255,0.2)" : "none",
        background: open ? "rgba(7, 10, 18, 0.94)" : "transparent",
        color: "#fff",
        boxShadow: open ? "0 18px 50px rgba(0,0,0,0.45)" : "none",
        backdropFilter: open ? "blur(10px)" : "none",
        pointerEvents: "none",
      }}
    >
      {!open && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", pointerEvents: "auto" }}>
          <Box
            onClick={() => setOpen(true)}
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 999,
              background: "rgba(7, 10, 18, 0.94)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              pointerEvents: "auto",
            }}
          >
            Open Debug Console
          </Box>
        </Box>
      )}

      {open && (
        <Box sx={{ pointerEvents: "auto" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.5,
              py: 1,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: 700 }}>
              Safari Debug Console ({entries.length})
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => {
                  setEntries([]);
                  try {
                    window.sessionStorage.removeItem(STORAGE_KEY);
                  } catch {}
                }}
                sx={{ color: "#fff", fontSize: 12 }}
              >
                C
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setOpen(false)}
                sx={{ color: "#fff", fontSize: 12 }}
              >
                _
              </IconButton>
            </Box>
          </Box>

          <Box
            ref={scrollRef}
            sx={{
              maxHeight: "42vh",
              overflowY: "auto",
              px: 1.25,
              py: 1,
              fontFamily: "monospace",
              fontSize: 11,
              lineHeight: 1.45,
            }}
          >
            {entries.length === 0 ? (
              <Typography sx={{ fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>
                Waiting for logs...
              </Typography>
            ) : (
              entries.map((entry) => (
                <Box key={entry.id} sx={{ mb: 0.75, color: levelColor[entry.level] }}>
                  <span style={{ opacity: 0.7 }}>[{entry.at}]</span> {entry.text}
                </Box>
              ))
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DebugConsoleOverlay;
