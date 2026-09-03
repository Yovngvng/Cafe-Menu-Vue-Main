<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { supabase, startSessionKeepAlive, refreshAdminSession } from "../../services/supabase.js";
import { getOrders, updateOrderStatus, deleteOrder } from "../../services/orders.js";
import { signOutAdmin } from "../../services/auth.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { playBeep } from "../../utils/playBeep.js";
import { alertNewOrder, isIOS, isStandaloneDisplay, notificationPermission, registerAdminAlertsWorker, requestAlertPermission } from "../../utils/adminAlerts.js";
import { extractOrderTax, productLines } from "../../utils/orderTotals.js";
import {
  STATUS,
  canonicalStatus,
  nextStatus,
  isOpenStatus,
  orderTimestamp,
  cafeDayKey,
  isCafeDay,
  persianDate,
  recentCafeDayKeys,
  dailyOrderNumbers,
} from "../../utils/orderStatus.js";
import OrderCard from "./OrderCard.vue";
import DailyStock from "./DailyStock.vue";
import PriceManager from "./PriceManager.vue";

const router = useRouter();
const orders = ref([]);
const showToast = ref(false);
const currentFilter = ref("all");
const clock = ref(Date.now());
const selectedDayKey = ref(cafeDayKey(Date.now()));
const actionMessage = ref("");
const loading = ref(true);
const showBestSellers = ref(false);
const adminTab = ref("orders");
const notifyState = ref(notificationPermission() === "granted" ? "granted" : "default");
const showAlertSetup = computed(() => notifyState.value !== "granted");
const iosHint = computed(() => isIOS() && !isStandaloneDisplay());

const todayKey = computed(() => cafeDayKey(clock.value));
const isTodayView = computed(() => selectedDayKey.value === todayKey.value);

const reportDayOptions = computed(() => {
  const keys = recentCafeDayKeys(90, clock.value);
  const seen = new Set(keys);
  orders.value.forEach((order) => {
    const key = cafeDayKey(orderTimestamp(order));
    if (key && !seen.has(key)) {
      seen.add(key);
      keys.push(key);
    }
  });
  return keys;
});

const visibleOrders = computed(() =>
  orders.value.filter((order) => isCafeDay(orderTimestamp(order), selectedDayKey.value))
);

const todayOrders = computed(() => visibleOrders.value.length);

const waitingOrders = computed(
  () => visibleOrders.value.filter((order) => isOpenStatus(order.status)).length
);

const readyOrders = computed(
  () => visibleOrders.value.filter((order) => canonicalStatus(order.status) === STATUS.READY).length
);

const doneOrders = computed(
  () => visibleOrders.value.filter((order) => canonicalStatus(order.status) === STATUS.DONE).length
);

const todayIncome = computed(() =>
  visibleOrders.value.reduce((sum, order) => sum + Number(order.total || 0), 0)
);

const todayOnlyIncome = computed(() =>
  orders.value.reduce((sum, order) => {
    if (!isCafeDay(orderTimestamp(order), todayKey.value)) return sum;
    return sum + Number(order.total || 0);
  }, 0)
);

const todayLabel = computed(() => persianDate(clock.value));

const dailyNumbers = computed(() => dailyOrderNumbers(orders.value));

const dayTaxTotal = computed(() =>
  visibleOrders.value.reduce((sum, order) => sum + extractOrderTax(order.items), 0)
);

const bestSellers = computed(() => {
  const counts = new Map();
  visibleOrders.value.forEach((order) => {
    productLines(order.items).forEach((item) => {
      const name = item.name;
      const qty = Number(item.quantity) || 0;
      counts.set(name, (counts.get(name) || 0) + qty);
    });
  });
  return [...counts.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name, "fa"));
});

function goToday() {
  selectedDayKey.value = todayKey.value;
}

function closeBestSellers() {
  showBestSellers.value = false;
}

function onAdminKeydown(event) {
  if (event.key === "Escape" && showBestSellers.value) {
    closeBestSellers();
  }
}

function flashAction(text) {
  actionMessage.value = text;
  setTimeout(() => {
    actionMessage.value = "";
  }, 3200);
}

async function loadOrders() {
  const result = await getOrders();
  if (!result.ok) {
    const jwtIssue =
      result.error?.code === "PGRST301" || String(result.error?.message || "").includes("JWT");
    if (jwtIssue) {
      const session = await refreshAdminSession();
      if (session) {
        const retry = await getOrders();
        if (retry.ok) {
          orders.value = retry.orders;
          return;
        }
      }
      await signOutAdmin();
      router.replace("/admin/login");
      return;
    }
    flashAction(result.message);
    return;
  }
  orders.value = result.orders;
}

function showNewOrderToast(order) {
  showToast.value = true;
  alertNewOrder(order);
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
}

async function enableAlerts() {
  notifyState.value = await requestAlertPermission();
  playBeep();
}

const byNewestFirst = computed(() => {
  return [...visibleOrders.value].sort((a, b) => {
    const ta = orderTimestamp(a);
    const tb = orderTimestamp(b);
    if (tb !== ta) return tb - ta;
    return String(b.id).localeCompare(String(a.id));
  });
});

const latestThree = computed(() => byNewestFirst.value.slice(0, 3));

const filteredOrders = computed(() => {
  if (currentFilter.value === "all") return byNewestFirst.value;
  if (currentFilter.value === STATUS.WAITING) {
    return byNewestFirst.value.filter((order) => isOpenStatus(order.status));
  }
  return byNewestFirst.value.filter((order) => canonicalStatus(order.status) === currentFilter.value);
});

async function changeStatus(order) {
  const newStatus = nextStatus(order.status);
  if (!newStatus) return;
  const result = await updateOrderStatus(order.id, newStatus);
  if (!result.ok) {
    flashAction(result.message);
    return;
  }
  await loadOrders();
}

async function handleDelete(id) {
  const result = await deleteOrder(id);
  if (!result.ok) {
    flashAction(result.message);
    return;
  }
  await loadOrders();
}

async function clearDoneOrders() {
  const done = visibleOrders.value.filter((o) => canonicalStatus(o.status) === STATUS.DONE);
  for (const order of done) {
    const result = await deleteOrder(order.id);
    if (!result.ok) {
      flashAction(result.message);
      return;
    }
  }
  await loadOrders();
}

async function logout() {
  await signOutAdmin();
  router.replace("/admin/login");
}

let channel;
let clockTimer;
let stopKeepAlive;

onMounted(async () => {
  window.addEventListener("keydown", onAdminKeydown);
  notifyState.value = notificationPermission();
  registerAdminAlertsWorker();
  stopKeepAlive = startSessionKeepAlive();
  await loadOrders();
  loading.value = false;
  let lastDayKey = cafeDayKey(clock.value);
  clockTimer = setInterval(async () => {
    clock.value = Date.now();
    const nextDayKey = cafeDayKey(clock.value);
    if (nextDayKey !== lastDayKey) {
      if (selectedDayKey.value === lastDayKey) {
        selectedDayKey.value = nextDayKey;
      }
      lastDayKey = nextDayKey;
      await loadOrders();
    }
  }, 30000);

  channel = supabase
    .channel("orders")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
      },
      async (payload) => {
        await loadOrders();
        if (payload.eventType === "INSERT") {
          showNewOrderToast(payload.new);
        }
      }
    )
    .subscribe();
});

onUnmounted(() => {
  window.removeEventListener("keydown", onAdminKeydown);
  if (channel) {
    supabase.removeChannel(channel);
  }
  if (clockTimer) clearInterval(clockTimer);
  if (stopKeepAlive) stopKeepAlive();
});
</script>

<template>
  <div class="admin">
    <Transition name="toast">
      <div v-if="showToast" class="toast-success">🔔 سفارش جدید رسید!</div>
    </Transition>

    <div class="admin-toolbar">
      <div class="admin-tabs">
        <button type="button" class="filter-btn" :class="{ active: adminTab === 'orders' }" @click="adminTab = 'orders'">سفارش‌ها</button>
        <button type="button" class="filter-btn" :class="{ active: adminTab === 'stock' }" @click="adminTab = 'stock'">موجودی روزانه</button>
        <button type="button" class="filter-btn" :class="{ active: adminTab === 'prices' }" @click="adminTab = 'prices'">مدیریت قیمت‌ها</button>
      </div>
      <button type="button" class="logout-btn" @click="logout">خروج</button>
    </div>

    <div v-if="showAlertSetup" class="notify-banner">
      <p v-if="notifyState === 'denied'">
        اعلان مرورگر مسدود است. از تنظیمات سایت اجازه بدهید تا سفارش‌های جدید در پس‌زمینه هم خبر داده شوند.
      </p>
      <p v-else-if="iosHint">
        روی آیفون، این دکمه را بزنید تا صدا فعال شود. برای اعلان سیستم، پنل را از سافاری با «افزودن به صفحه اصلی» نصب کنید و از همان میانبر باز کنید.
      </p>
      <p v-else>
        برای هشدار صوتی و اعلان وقتی پنل در پس‌زمینه است، یک‌بار روی دکمه بزنید.
      </p>
      <button type="button" @click="enableAlerts">فعال‌سازی هشدار سفارش</button>
    </div>

    <DailyStock v-if="adminTab === 'stock'" />
    <PriceManager v-if="adminTab === 'prices'" />
    <template v-if="adminTab === 'orders'">
    <div class="admin-today-bar">
      <div>تاریخ: {{ todayLabel }}</div>
      <div>درآمد امروز: {{ formatPrice(todayOnlyIncome) }}</div>
    </div>

    <div class="admin-filters date-scope">
      <button
        type="button"
        class="filter-btn"
        :class="{ active: isTodayView }"
        @click="goToday"
      >فقط امروز</button>
      <label class="report-date-label">
        گزارش روز
        <select v-model="selectedDayKey" class="report-date-select">
          <option v-for="key in reportDayOptions" :key="key" :value="key">{{ key }}</option>
        </select>
      </label>
    </div>

    <h1>سفارش‌ها</h1>
    <p v-if="!isTodayView" class="report-heading">گزارش {{ selectedDayKey }}</p>
    <p v-if="actionMessage" class="msg-error">{{ actionMessage }}</p>
    <p v-if="loading" class="admin-loading">در حال بارگذاری...</p>

    <div class="dashboard">
      <div class="dashboard-card">
        <h3>سفارش‌ها</h3>
        <span>{{ todayOrders }}</span>
      </div>

      <div class="dashboard-card">
        <h3>فروش</h3>
        <span>{{ formatPrice(todayIncome) }}</span>
      </div>

      <div class="dashboard-card waiting">
        <h3>باز</h3>
        <span>{{ waitingOrders }}</span>
      </div>

      <div v-if="readyOrders" class="dashboard-card ready">
        <h3>آمادهٔ قبلی</h3>
        <span>{{ readyOrders }}</span>
      </div>

      <div class="dashboard-card">
        <h3>تحویل‌شده</h3>
        <span>{{ doneOrders }}</span>
      </div>

      <div v-if="dayTaxTotal" class="dashboard-card">
        <h3>مالیات روز</h3>
        <span>{{ formatPrice(dayTaxTotal) }}</span>
      </div>
    </div>

    <button type="button" class="best-sellers-btn" @click="showBestSellers = true">
      مشاهده پر فروش‌ها
    </button>

    <button id="clearDoneOrders" @click="clearDoneOrders">حذف سفارش های تحویل داده شده</button>

    <h2>آخرین سفارش‌ها</h2>
    <OrderCard
      v-for="order in latestThree"
      :key="order.id"
      :order="order"
      :daily-number="dailyNumbers[order.id]"
      @change-status="changeStatus"
      @delete="handleDelete"
    />

    <h2>همه سفارش‌های این روز</h2>
    <div class="admin-filters">
      <button
        type="button"
        class="filter-btn"
        :class="{ active: currentFilter === 'all' }"
        @click="currentFilter = 'all'"
      >همه</button>
      <button
        type="button"
        class="filter-btn"
        :class="{ active: currentFilter === STATUS.WAITING }"
        @click="currentFilter = STATUS.WAITING"
      >در انتظار</button>
      <button
        type="button"
        class="filter-btn"
        :class="{ active: currentFilter === STATUS.DONE }"
        @click="currentFilter = STATUS.DONE"
      >تحویل داده شد</button>
    </div>

    <p v-if="!filteredOrders.length" class="admin-loading">سفارشی در این وضعیت نیست.</p>
    <OrderCard
      v-for="order in filteredOrders"
      :key="order.id"
      :order="order"
      :daily-number="dailyNumbers[order.id]"
      @change-status="changeStatus"
      @delete="handleDelete"
    />

    <div
      v-if="showBestSellers"
      class="modal"
      @click.self="closeBestSellers"
    >
      <div class="modal-content best-sellers-modal" @click.stop>
        <button
          type="button"
          class="best-sellers-close"
          aria-label="بستن"
          title="بستن"
          @click="closeBestSellers"
        >
          <span aria-hidden="true">✕</span>
        </button>
        <h2>پرفروش‌های {{ selectedDayKey }}</h2>
        <p v-if="bestSellers.length === 0" class="admin-loading">برای این روز سفارشی ثبت نشده.</p>
        <ol v-else class="best-seller-list">
          <li v-for="item in bestSellers" :key="item.name">
            <span>{{ item.name }}</span>
            <strong>{{ item.quantity }} عدد</strong>
          </li>
        </ol>
      </div>
    </div>
    </template>
  </div>
</template>
