import { supabase, friendlyError } from "./supabase.js";

export async function fetchAvailability(dateKey) {
  const { data, error } = await supabase
    .from("item_availability")
    .select("item_key, date, is_available")
    .eq("date", dateKey);

  if (error) {
    console.error(error);
    return { ok: false, rows: [], message: friendlyError(error, "موجودی خونده نشد") };
  }
  return { ok: true, rows: data || [] };
}

export async function upsertAvailability({ itemKey, dateKey, isAvailable }) {
  const { error } = await supabase.from("item_availability").upsert(
    {
      item_key: itemKey,
      date: dateKey,
      is_available: isAvailable,
    },
    { onConflict: "item_key,date" }
  );

  if (error) {
    console.error(error);
    return { ok: false, message: friendlyError(error, "موجودی ذخیره نشد") };
  }
  return { ok: true };
}

export async function copyAvailability(fromDate, toDate, itemKeys) {
  const source = await fetchAvailability(fromDate);
  if (!source.ok) return source;

  const byKey = new Map(source.rows.map((row) => [row.item_key, row.is_available]));
  const payload = itemKeys.map((itemKey) => ({
    item_key: itemKey,
    date: toDate,
    is_available: Boolean(byKey.get(itemKey)),
  }));

  if (!payload.length) return { ok: true };

  const { error } = await supabase.from("item_availability").upsert(payload, { onConflict: "item_key,date" });
  if (error) {
    console.error(error);
    return { ok: false, message: friendlyError(error, "کپی موجودی انجام نشد") };
  }
  return { ok: true };
}

export function subscribeAvailability(onChange) {
  const channel = supabase
    .channel("item_availability_live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "item_availability" },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
