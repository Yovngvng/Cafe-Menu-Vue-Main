<script setup>
import { computed, onMounted, ref } from "vue";
import { menu } from "../../data/menuData.js";
import { stockCatalog } from "../../data/catalog.js";
import { copyAvailability, fetchAvailability, upsertAvailability } from "../../services/availability.js";
import { cafeDayKey, recentCafeDayKeys } from "../../utils/orderStatus.js";

const items = stockCatalog(menu);
const todayKey = computed(() => cafeDayKey());
const yesterdayKey = computed(() => recentCafeDayKeys(2)[1] || "");
const available = ref({});
const loading = ref(true);
const busyKey = ref("");
const message = ref("");

const groups = computed(() => {
  const map = new Map();
  items.forEach((item) => {
    if (!map.has(item.category)) map.set(item.category, []);
    map.get(item.category).push(item);
  });
  return [...map.entries()].map(([category, rows]) => ({ category, rows }));
});

function flash(text) {
  message.value = text;
  setTimeout(() => {
    message.value = "";
  }, 2800);
}

async function loadToday() {
  loading.value = true;
  const result = await fetchAvailability(todayKey.value);
  loading.value = false;
  if (!result.ok) {
    flash(result.message);
    return;
  }
  const next = {};
  result.rows.forEach((row) => {
    next[row.item_key] = Boolean(row.is_available);
  });
  available.value = next;
}

async function toggle(item) {
  const next = !available.value[item.item_key];
  busyKey.value = item.item_key;
  const result = await upsertAvailability({
    itemKey: item.item_key,
    dateKey: todayKey.value,
    isAvailable: next,
  });
  busyKey.value = "";
  if (!result.ok) {
    flash(result.message);
    return;
  }
  available.value = { ...available.value, [item.item_key]: next };
}

async function copyYesterday() {
  if (!yesterdayKey.value) return;
  busyKey.value = "copy";
  const result = await copyAvailability(
    yesterdayKey.value,
    todayKey.value,
    items.map((item) => item.item_key)
  );
  busyKey.value = "";
  if (!result.ok) {
    flash(result.message);
    return;
  }
  flash("موجودی دیروز کپی شد");
  await loadToday();
}

onMounted(loadToday);
</script>

<template>
  <section class="admin-panel-section">
    <h1>موجودی روزانه</h1>
    <p class="admin-help">آبمیوه‌ها و کیک‌های امروز ({{ todayKey }}). بدون رکورد = ناموجود.</p>
    <button type="button" class="copy-yesterday-btn" :disabled="busyKey === 'copy'" @click="copyYesterday">
      {{ busyKey === "copy" ? "در حال کپی..." : "کپی از دیروز" }}
    </button>
    <p v-if="message" class="msg-error">{{ message }}</p>
    <p v-if="loading" class="admin-loading">در حال بارگذاری...</p>

    <div v-for="group in groups" :key="group.category" class="stock-group">
      <h2>{{ group.category }}</h2>
      <label v-for="item in group.rows" :key="item.item_key" class="stock-row">
        <span>{{ item.name }}</span>
        <input
          type="checkbox"
          :checked="Boolean(available[item.item_key])"
          :disabled="Boolean(busyKey)"
          @change="toggle(item)"
        />
      </label>
    </div>
  </section>
</template>
