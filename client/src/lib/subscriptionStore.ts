// src/lib/subscriptionStore.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const SUBSCRIPTION_TABLE = "subscription";
export const SUBSCRIPTION_KEY = "pricing_page_v1";

export function createSupabaseClient(): SupabaseClient | null {
  const url = import.meta?.env?.VITE_SUPABASE_URL;
  const anon = import.meta?.env?.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export async function loadSubscriptionConfig<T>(
  supabase: SupabaseClient,
  key: string = SUBSCRIPTION_KEY
): Promise<T | null> {
  const { data, error } = await supabase
    .from(SUBSCRIPTION_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.value as T) ?? null;
}

export async function saveSubscriptionConfigWithStatus<T>(
  supabase: SupabaseClient,
  value: T,
  key: string = SUBSCRIPTION_KEY
): Promise<"inserted" | "updated"> {
  const { data: existing, error: existsErr } = await supabase
    .from(SUBSCRIPTION_TABLE)
    .select("id")
    .eq("key", key)
    .maybeSingle();

  if (existsErr) throw new Error(existsErr.message);

  const { error: upsertErr } = await supabase
    .from(SUBSCRIPTION_TABLE)
    .upsert({ key, value }, { onConflict: "key" });

  if (upsertErr) throw new Error(upsertErr.message);

  return existing?.id ? "updated" : "inserted";
}
