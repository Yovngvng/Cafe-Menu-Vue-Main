import { createClient } from "@supabase/supabase-js";
import { authStorage } from "../utils/authStorage.js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
  },
});

export function isPermissionError(error) {
  const code = error?.code || "";
  const message = String(error?.message || error || "");
  return (
    code === "42501" ||
    code === "PGRST301" ||
    message.toLowerCase().includes("row-level security") ||
    message.toLowerCase().includes("permission denied") ||
    message.toLowerCase().includes("not authorized")
  );
}

export function friendlyError(error, fallback = "خطا. دوباره امتحان کن") {
  if (isPermissionError(error)) {
    return "اجازه این کار را نداری";
  }
  return fallback;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function refreshAdminSession() {
  try {
    const current = await getSession();
    if (!current) return null;
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return current;
    return data.session || current;
  } catch (e) {
    return getSession();
  }
}

export function startSessionKeepAlive() {
  let timer;
  const tick = () => {
    refreshAdminSession();
  };
  timer = setInterval(tick, 4 * 60 * 1000);
  const onVisible = () => {
    if (document.visibilityState === "visible") tick();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", tick);
  tick();
  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", tick);
  };
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}
