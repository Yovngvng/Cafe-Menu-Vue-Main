import { playBeep, unlockAudio } from "./playBeep.js";

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function notificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export function alertsNeedSetup() {
  const permission = notificationPermission();
  return permission !== "granted";
}

export async function requestAlertPermission() {
  await unlockAudio();
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (e) {
    return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
  }
}

function pageIsBackgrounded() {
  if (typeof document === "undefined") return false;
  return document.visibilityState !== "visible" || document.hidden || !document.hasFocus();
}

async function showSystemNotification(title, body) {
  const icon = `${import.meta.env.BASE_URL}admin-apple-touch-icon.png`;
  const payload = {
    body,
    icon,
    badge: `${import.meta.env.BASE_URL}admin-icon-192.png`,
    silent: false,
    vibrate: [180, 70, 180, 70, 280, 90, 420],
    tag: "cafe-new-order",
    renotify: true,
    data: { url: `${import.meta.env.BASE_URL}admin` },
  };

  try {
    const ready = await navigator.serviceWorker?.ready;
    if (ready?.showNotification) {
      await ready.showNotification(title, payload);
      return;
    }
  } catch (e) {
    console.warn("sw notification failed", e);
  }

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, payload);
    } catch (e) {
      console.warn("notification failed", e);
    }
  }
}

export function alertNewOrder(order) {
  playBeep();
  try {
    navigator.vibrate?.([180, 70, 180, 70, 280, 90, 420]);
  } catch (e) {
    /* ignore */
  }

  if (notificationPermission() !== "granted") return;
  if (!pageIsBackgrounded()) return;

  const daily = order?.id ? `#${String(order.id).slice(0, 6)}` : "";
  showSystemNotification("سفارش جدید — مدیریت کافه", daily ? `سفارش جدید رسید ${daily}` : "سفارش جدید رسید");
}

export async function registerAdminAlertsWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
    });
  } catch (e) {
    console.warn("service worker register failed", e);
    return null;
  }
}
