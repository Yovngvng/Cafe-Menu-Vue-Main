import { supabase, friendlyError } from "./supabase.js";

export async function fetchPriceOverrides() {
  const { data, error } = await supabase.from("menu_price_overrides").select("item_key, price");
  if (error) {
    console.error(error);
    return { ok: false, map: {}, message: friendlyError(error, "قیمت‌ها خونده نشد") };
  }
  const map = {};
  (data || []).forEach((row) => {
    map[row.item_key] = Number(row.price);
  });
  return { ok: true, map };
}

export async function upsertPriceOverride(itemKey, price) {
  const { error } = await supabase.from("menu_price_overrides").upsert(
    {
      item_key: itemKey,
      price: Number(price),
    },
    { onConflict: "item_key" }
  );
  if (error) {
    console.error(error);
    return { ok: false, message: friendlyError(error, "قیمت ذخیره نشد") };
  }
  return { ok: true };
}
