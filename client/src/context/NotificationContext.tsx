import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../supabase/supabase";
import { useAdmin } from "./AdminContext";

export type NotificationType = "user" | "topic" | "order" | "blog";

export type NotificationItem = {
  id: string;                // synthetic: `${table}:${rowId}`
  table: "Users" | "topic_messages" | "orders" | "blogs";
  type: NotificationType;
  title: string;
  body?: string | null;
  created_at: string;        // ISO
  source_id: string | number;
  read: boolean;
  payload?: Record<string, unknown>;
};

type Ctx = {
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAllRead: () => void;
  clearAll: () => void;
  removeById: (id: string) => void;
};

const NotificationContext = createContext<Ctx | null>(null);

function makeId(table: string, source_id: string | number) {
  return `${table}:${source_id}`;
}

function safeCreatedAt(row: any) {
  return row?.created_at ?? new Date().toISOString();
}

function normalizeRow(table: "Users" | "topic_messages" | "orders" | "blogs", row: any): NotificationItem {
  switch (table) {
    case "Users":
      return {
        id: makeId(table, row.id),
        table,
        type: "user",
        title: `New user: ${row?.name ?? row?.email ?? row?.id}`,
        body: row?.email ?? null,
        created_at: safeCreatedAt(row),
        source_id: row.id,
        read: false,
        payload: row,
      };
    case "topic_messages":
      return {
        id: makeId(table, row.id),
        table,
        type: "topic",
        title: `New topic message${row?.topic ? ` in "${row.topic}"` : ""}`,
        body: row?.message ?? row?.content ?? null,
        created_at: safeCreatedAt(row),
        source_id: row.id,
        read: false,
        payload: row,
      };
    case "orders":
      return {
        id: makeId(table, row.id),
        table,
        type: "order",
        title: `New order #${row?.id}`,
        body: row?.status ? `Status: ${row.status}` : null,
        created_at: safeCreatedAt(row),
        source_id: row.id,
        read: false,
        payload: row,
      };
    case "blogs":
      return {
        id: makeId(table, row.id),
        table,
        type: "blog",
        title: `New blog: ${row?.title ?? row?.id}`,
        body: row?.summary ?? null,
        created_at: safeCreatedAt(row),
        source_id: row.id,
        read: false,
        payload: row,
      };
    default:
      return {
        id: makeId(table, row.id),
        table,
        type: "blog",
        title: `New item in ${table}`,
        body: null,
        created_at: safeCreatedAt(row),
        source_id: row.id,
        read: false,
        payload: row,
      };
  }
}

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const chanRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const { isAdmin, loading: adminLoading } = useAdmin();

  const addOrReplace = (item: NotificationItem) => {
    setNotifications((prev) => {
      const exists = prev.findIndex((n) => n.id === item.id);
      if (exists >= 0) {
        const next = [...prev];
        next[exists] = { ...item, read: prev[exists].read && item.read };
        return next.sort((a, b) => b.created_at.localeCompare(a.created_at));
      }
      return [item, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at));
    });
  };

  const loadInitial = async () => {
    try {
      setLoading(true);
      const queries = [
        supabase.from("Users").select("id,name,email,created_at").order("created_at", { ascending: false }).limit(50),
        supabase
          .from("topic_messages")
          .select("id,topic,message,content,created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("orders").select("id,status,created_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("blogs").select("id,title,summary,created_at").order("created_at", { ascending: false }).limit(50),
      ] as const;

      const [u, t, o, b] = await Promise.all(queries);

      const list: NotificationItem[] = [];
      if (u.data) list.push(...u.data.map((r: any) => normalizeRow("Users", r)));
      if (t.data) list.push(...t.data.map((r: any) => normalizeRow("topic_messages", r)));
      if (o.data) list.push(...o.data.map((r: any) => normalizeRow("orders", r)));
      if (b.data) list.push(...b.data.map((r: any) => normalizeRow("blogs", r)));

      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
      setNotifications(list);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtime = () => {
    if (chanRef.current) return;

    const channel = supabase.channel("realtime:notifications");

    // Users INSERT
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "Users" },
      (payload) => addOrReplace(normalizeRow("Users", payload.new))
    );

    // Topic messages INSERT
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "topic_messages" },
      (payload) => addOrReplace(normalizeRow("topic_messages", payload.new))
    );

    // Orders INSERT
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "orders" },
      (payload) => addOrReplace(normalizeRow("orders", payload.new))
    );

    // Blog INSERT
    channel.on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "blogs" },
      (payload) => addOrReplace(normalizeRow("blogs", payload.new))
    );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Optional toast
      }
    });

    chanRef.current = channel;
  };

  useEffect(() => {
    if (adminLoading) return;

    if (!isAdmin) {
      setNotifications([]);
      setLoading(false);
      if (chanRef.current) {
        supabase.removeChannel(chanRef.current);
        chanRef.current = null;
      }
      return;
    }

    void loadInitial();
    setupRealtime();

    return () => {
      if (chanRef.current) {
        supabase.removeChannel(chanRef.current);
        chanRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, adminLoading]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const removeById = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const value: Ctx = {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    clearAll,
    removeById,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
};
