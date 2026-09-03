const BASE = import.meta.env.BASE_URL || "./";

function setLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setMeta(name, content) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function applyInstallBranding(isAdmin) {
  if (typeof document === "undefined") return;
  if (isAdmin) {
    document.title = "مدیریت کافه";
    setLink("manifest", `${BASE}admin-manifest.webmanifest`);
    setLink("apple-touch-icon", `${BASE}admin-apple-touch-icon.png`);
    setLink("icon", `${BASE}admin-icon-192.png`);
    setMeta("apple-mobile-web-app-title", "مدیریت کافه");
    setMeta("theme-color", "#102540");
    return;
  }
  document.title = "کافه ژوان";
  setLink("manifest", `${BASE}manifest.webmanifest`);
  setLink("apple-touch-icon", `${BASE}apple-touch-icon.png`);
  setLink("icon", `${BASE}favicon.png`);
  setMeta("apple-mobile-web-app-title", "کافه ژوان");
  setMeta("theme-color", "#0a192f");
}
