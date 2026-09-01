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
    self.registration.showNotification(data.title || "کافه ژوان", {
      body: data.body || "سفارش جدید رسید",
      icon: "./apple-touch-icon.png",
      badge: "./favicon.png",
      silent: false,
      vibrate: [220, 80, 220, 80, 360],
      tag: "cafe-new-order",
      renotify: true,
      data: { url: "./admin" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "./admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate?.(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
