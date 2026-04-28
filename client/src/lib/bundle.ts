import { supabase } from "../supabase/supabase";
const norm = (s: any) => String(s ?? "").trim();
const uniq = (arr: string[]) => Array.from(new Set(arr.map(norm).filter(Boolean)));

export async function createBundleInDB(payload: {
  name: string;
  image_base64: string | null;
  main_categories: string[];
  sub_categories: string[];
  sub_sub_categories: string[];
  product_keys: string[];
}) {

  const { data, error } = await supabase
    .from("bundles")
    .insert({
      name: payload.name,
      image_base64: payload.image_base64,

      // ✅ IMPORTANT: save ARRAY
      main_categories: payload.main_categories ?? [],
      sub_categories: payload.sub_categories ?? [],
      sub_sub_categories: payload.sub_sub_categories ?? [],
    })
    .select("*")
    .single();

  if (error) throw error;

    if (payload.product_keys?.length) {
    await saveBundleItems(String(data.id), payload.product_keys);
  } else {
    await saveBundleItems(String(data.id), []); // clear if none
  }
  return data;
}


export async function updateBundleInDB(payload: {
  id: string;
  name: string;
  image_base64: string | null;
  main_categories: string[];
  sub_categories: string[];
  sub_sub_categories: string[];
  product_keys: string[];
}) {

  const { data, error } = await supabase
    .from("bundles")
    .update({
      name: payload.name,
      image_base64: payload.image_base64,
      main_categories:  payload.main_categories ?? [],
      sub_categories: payload.sub_categories ?? [],
      sub_sub_categories: payload.sub_sub_categories ?? [],
    })
    .eq("id", payload.id)
    .select("*")
    .single();

  if (error) throw error;

    await saveBundleItems(String(data.id), payload.product_keys ?? []);
  return data;

}


async function saveBundleItems(bundle_id: string, product_keys: string[]) {
  // 1) delete old
  const { error: delErr } = await supabase
    .from("bundle_items")
    .delete()
    .eq("bundle_id", bundle_id);
  if (delErr) throw delErr;

  const keys = uniq(product_keys);

  // 2) insert new
  const rows = keys
    .map((k) => {
      const [item_type, item_id] = k.split(":");
      if (!item_type || !item_id) return null;
      if (item_type !== "card" && item_type !== "template") return null;
      return { bundle_id, item_type, item_id: String(item_id) };
    })
    .filter(Boolean) as any[];

  if (rows.length) {
    const { error: insErr } = await supabase.from("bundle_items").insert(rows);
    if (insErr) throw insErr;
  }
}
