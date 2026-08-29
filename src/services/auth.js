import { supabase } from "./supabase.js";

export async function signInAdmin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error, message: error.message === "Invalid login credentials" ? "ایمیل یا رمز اشتباهه" : "ورود انجام نشد" };
  }
  return { ok: true, session: data.session, user: data.user };
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error };
  return { ok: true };
}
