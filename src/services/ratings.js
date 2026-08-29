import { supabase, friendlyError } from "./supabase.js";

export async function fetchAllRatings() {
  const { data, error } = await supabase.from("ratings").select("product_name, rating");

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export async function submitRating(productName, rating) {
  const { error } = await supabase.from("ratings").insert([{ product_name: productName, rating }]);

  if (error) {
    console.error(error);
    return { ok: false, message: friendlyError(error, "امتیاز ثبت نشد") };
  }

  return { ok: true };
}
