import { playBeep, unlockAudio } from "./playBeep.js";

export function notificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestAlertPermission() {
  await unlockAudio();
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (e) {
    return Notification.permission;
  }
}

function pageIsHidden() {
  return typeof document !== "undefined" && (document.hidden || !document.hasFocus());
}

async function showSystemNotification(title, body) {
  const icon = `${import.meta.env.BASE_URL}apple-touch-icon.png`;
  const payload = {
    body,
    icon,
    badge: `${import.meta.env.BASE_URL}favicon.png`,
    silent: false,
    vibrate: [220, 80, 220, 80, 360],
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
    navigator.vibrate?.([220, 80, 220, 80, 360]);
  } catch (e) {
    /* ignore */
  }

  if (notificationPermission() !== "granted") return;
  if (!pageIsHidden()) return;

  const daily = order?.id ? `#${String(order.id).slice(0, 6)}` : "";
  showSystemNotification("سفارش جدید — کافه ژوان", daily ? `سفارش جدید رسید ${daily}` : "سفارش جدید رسید");
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
