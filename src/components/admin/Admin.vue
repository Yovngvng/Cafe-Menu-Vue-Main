<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../../services/supabase.js";
import { getOrders, updateOrderStatus, deleteOrder } from "../../services/orders.js";
import { signOutAdmin } from "../../services/auth.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { playBeep } from "../../utils/playBeep.js";
import {
  STATUS,
  STATUS_PRIORITY,
  canonicalStatus,
  nextStatus,
  orderTimestamp,
  cafeDayKey,
  isSameCafeDay,
  persianDate,
} from "../../utils/orderStatus.js";
import OrderCard from "./OrderCard.vue";

const router = useRouter();
const orders = ref([]);
const showToast = ref(false);
const currentFilter = ref("all");
const dateScope = ref("today");
const clock = ref(Date.now());
const actionMessage = ref("");
const loading = ref(true);

const visibleOrders = computed(() => {
  if (dateScope.value !== "today") return orders.value;
  return orders.value.filter((order) => isSameCafeDay(orderTimestamp(order), clock.value));
});

const todayOrders = computed(() => visibleOrders.value.length);

const waitingOrders = computed(
  () => visibleOrders.value.filter((order) => canonicalStatus(order.status) === STATUS.WAITING).length
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
    if (!isSameCafeDay(orderTimestamp(order), clock.value)) return sum;
    return sum + Number(order.total || 0);
  }, 0)
);

const todayLabel = computed(() => persianDate(clock.value));

function flashAction(text) {
  actionMessage.value = text;
  setTimeout(() => {
    actionMessage.value = "";
  }, 3200);
}

async function loadOrders() {
  const result = await getOrders();
  if (!result.ok) {
    flashAction(result.message);
    if (result.error?.code === "PGRST301" || String(result.error?.message || "").includes("JWT")) {
      await signOutAdmin();
      router.replace("/admin/login");
    }
    return;
  }
  orders.value = result.orders;
}

function showNewOrderToast() {
  showToast.value = true;
  playBeep();
  setTimeout(() => {
    showToast.value = false;
  }, 3000);
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

const otherOrders = computed(() => {
  const rest = byNewestFirst.value.slice(3);
  const filtered =
    currentFilter.value === "all"
      ? rest
      : rest.filter((o) => canonicalStatus(o.status) === currentFilter.value);
  return [...filtered].sort((a, b) => {
    const pa = STATUS_PRIORITY[canonicalStatus(a.status)] ?? 0;
    const pb = STATUS_PRIORITY[canonicalStatus(b.status)] ?? 0;
    if (pa !== pb) return pa - pb;
    return orderTimestamp(a) - orderTimestamp(b);
  });
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

onMounted(async () => {
  await loadOrders();
  loading.value = false;
  let lastDayKey = cafeDayKey(clock.value);
  clockTimer = setInterval(async () => {
    clock.value = Date.now();
    const nextDayKey = cafeDayKey(clock.value);
    if (nextDayKey !== lastDayKey) {
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
          showNewOrderToast();
        }
      }
    )
    .subscribe();
});

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel);
  }
  if (clockTimer) clearInterval(clockTimer);
});
</script>

<template>
  <div class="admin">
    <Transition name="toast">
      <div v-if="showToast" class="toast-success">🔔 سفارش جدید رسید!</div>
    </Transition>

    <div class="admin-toolbar">
      <button type="button" class="logout-btn" @click="logout">خروج</button>
    </div>

    <div class="admin-today-bar">
      <div>تاریخ: {{ todayLabel }}</div>
      <div>درآمد امروز: {{ formatPrice(todayOnlyIncome) }}</div>
    </div>

    <div class="admin-filters date-scope">
      <button
        type="button"
        class="filter-btn"
        :class="{ active: dateScope === 'today' }"
        @click="dateScope = 'today'"
      >فقط امروز</button>
      <button
        type="button"
        class="filter-btn"
        :class="{ active: dateScope === 'all' }"
        @click="dateScope = 'all'"
      >همه سفارش‌ها</button>
    </div>

    <h1>مدیریت سفارش ها</h1>
    <p v-if="actionMessage" class="msg-error">{{ actionMessage }}</p>
    <p v-if="loading" class="admin-loading">در حال بارگذاری...</p>

    <div class="dashboard">
      <div class="dashboard-card">
        <h3>سفارش ها 📦</h3>
        <span>{{ todayOrders }}</span>
      </div>

      <div class="dashboard-card">
        <h3>فروش 💰</h3>
        <span>{{ formatPrice(todayIncome) }}</span>
      </div>

      <div class="dashboard-card waiting">
        <h3>در انتظار 🟡</h3>
        <span>{{ waitingOrders }}</span>
      </div>

      <div class="dashboard-card ready">
        <h3>آماده 🟢</h3>
        <span>{{ readyOrders }}</span>
      </div>

      <div class="dashboard-card">
        <h3>تحویل شده ✅</h3>
        <span>{{ doneOrders }}</span>
      </div>
    </div>

    <button id="clearDoneOrders" @click="clearDoneOrders">حذف سفارش های تحویل داده شده</button>

    <h2>۳ سفارش آخر</h2>
    <OrderCard
      v-for="order in latestThree"
      :key="order.id"
      :order="order"
      @change-status="changeStatus"
      @delete="handleDelete"
    />

    <h2>سایر سفارش ها</h2>
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
        :class="{ active: currentFilter === STATUS.READY }"
        @click="currentFilter = STATUS.READY"
      >آماده شد</button>
      <button
        type="button"
        class="filter-btn"
        :class="{ active: currentFilter === STATUS.DONE }"
        @click="currentFilter = STATUS.DONE"
      >تحویل داده شد</button>
    </div>

    <OrderCard
      v-for="order in otherOrders"
      :key="order.id"
      :order="order"
      @change-status="changeStatus"
      @delete="handleDelete"
    />
  </div>
</template>
