self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type !== "NEW_ORDER") return;
  event.waitUntil(
    self.registration.showNotification(data.title || "مدیریت کافه", {
      body: data.body || "سفارش جدید رسید",
      icon: "./admin-apple-touch-icon.png",
      badge: "./admin-icon-192.png",
      silent: false,
      vibrate: [180, 70, 180, 70, 280, 90, 420],
      tag: "cafe-new-order",
      renotify: true,
      data: { url: "./admin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL("./admin", self.registration.scope).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes("/admin") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
