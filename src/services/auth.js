import { supabase } from "./supabase.js";
import { clearRememberMe, setRememberMe } from "../utils/authStorage.js";

export async function signInAdmin(email, password, remember = false) {
  setRememberMe(Boolean(remember));
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { ok: false, error, message: error.message === "Invalid login credentials" ? "ایمیل یا رمز اشتباهه" : "ورود انجام نشد" };
  }
  return { ok: true, session: data.session, user: data.user };
}

export async function signOutAdmin() {
  const { error } = await supabase.auth.signOut();
  clearRememberMe();
  if (error) return { ok: false, error };
  return { ok: true };
}
