/** Vanilla 3-step kitchen statuses. */
export const STATUS = {
  WAITING: "در انتظار",
  READY: "آماده شد",
  DONE: "تحویل داده شد",
};

const FROM_LEGACY = {
  "در انتظار": STATUS.WAITING,
  "در حال آماده سازی": STATUS.WAITING,
  "آماده شد": STATUS.READY,
  آماده: STATUS.READY,
  "تحویل داده شد": STATUS.DONE,
};

export function canonicalStatus(status) {
  if (!status) return STATUS.WAITING;
  return FROM_LEGACY[status] || status;
}

export function nextStatus(status) {
  const current = canonicalStatus(status);
  if (current === STATUS.WAITING) return STATUS.READY;
  if (current === STATUS.READY) return STATUS.DONE;
  return null;
}

export function nextStatusLabel(status) {
  const next = nextStatus(status);
  if (next === STATUS.READY) return "آماده شد";
  if (next === STATUS.DONE) return "تحویل داده شد";
  return "تحویل داده شد";
}

export const STATUS_PRIORITY = {
  [STATUS.WAITING]: 0,
  [STATUS.READY]: 1,
  [STATUS.DONE]: 2,
};

export const CAFE_TIME_ZONE = "Asia/Tehran";

export function orderTimestamp(order) {
  if (order?.created_at) {
    const parsed = Date.parse(order.created_at);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const data = order?.data || {};
  if (data.createdAt) return Number(data.createdAt);
  if (data.createAt) return Number(data.createAt);
  return 0;
}

/** Jalali calendar date in the cafe timezone, e.g. ۱۴۰۴/۰۶/۰۴ */
export function cafeDayKey(ms = Date.now()) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: CAFE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

export function isSameCafeDay(timestamp, now = Date.now()) {
  if (!timestamp) return false;
  return cafeDayKey(Number(timestamp)) === cafeDayKey(now);
}

export function isSameLocalDay(timestamp, now = Date.now()) {
  return isSameCafeDay(timestamp, now);
}

export function persianDate(now = Date.now()) {
  return cafeDayKey(now);
}

export function isCafeDay(timestamp, dayKey) {
  if (!timestamp || !dayKey) return false;
  return cafeDayKey(Number(timestamp)) === dayKey;
}

/** Recent Jalali cafe days in Tehran, newest first (today at index 0). */
export function recentCafeDayKeys(days = 90, now = Date.now()) {
  const keys = [];
  const seen = new Set();
  const step = 24 * 60 * 60 * 1000;
  for (let i = 0; i < days; i++) {
    const key = cafeDayKey(now - i * step);
    if (seen.has(key)) continue;
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

/**
 * Daily sequence per Jalali cafe day in Asia/Tehran.
 * First order of the day is 1, independent of global order_number / id.
 */
export function dailyOrderNumbers(orders) {
  const groups = new Map();
  (orders || []).forEach((order) => {
    const key = cafeDayKey(orderTimestamp(order));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(order);
  });

  const numbers = {};
  groups.forEach((list) => {
    list.sort((a, b) => {
      const ta = orderTimestamp(a);
      const tb = orderTimestamp(b);
      if (ta !== tb) return ta - tb;
      return String(a.id).localeCompare(String(b.id));
    });
    list.forEach((order, index) => {
      numbers[order.id] = index + 1;
    });
  });
  return numbers;
}
