<script setup>
import { computed, onMounted, ref } from "vue";
import { menu } from "../../data/menuData.js";
import { priceCatalog } from "../../data/catalog.js";
import { fetchPriceOverrides, upsertPriceOverride } from "../../services/prices.js";
import { formatPrice } from "../../utils/formatPrice.js";

const catalog = priceCatalog(menu);
const overrides = ref({});
const drafts = ref({});
const query = ref("");
const savingKey = ref("");
const message = ref("");
const loading = ref(true);

const rows = computed(() => {
  const q = query.value.trim();
  return catalog
    .map((row) => {
      const override = overrides.value[row.key];
      const effective = override == null ? row.staticPrice : Number(override);
      return { ...row, effective, hasOverride: override != null };
    })
    .filter((row) => !q || row.label.includes(q) || row.category.includes(q));
});

function flash(text) {
  message.value = text;
  setTimeout(() => {
    message.value = "";
  }, 2800);
}

async function loadPrices() {
  loading.value = true;
  const result = await fetchPriceOverrides();
  loading.value = false;
  if (!result.ok) {
    flash(result.message);
    return;
  }
  overrides.value = result.map;
  const next = {};
  catalog.forEach((row) => {
    next[row.key] = String(result.map[row.key] ?? row.staticPrice);
  });
  drafts.value = next;
}

async function saveRow(row) {
  const price = Number(drafts.value[row.key]);
  if (!Number.isFinite(price) || price < 0) {
    flash("قیمت نامعتبر است");
    return;
  }
  savingKey.value = row.key;
  const result = await upsertPriceOverride(row.key, price);
  savingKey.value = "";
  if (!result.ok) {
    flash(result.message);
    return;
  }
  overrides.value = { ...overrides.value, [row.key]: price };
}

onMounted(loadPrices);
</script>

<template>
  <section class="admin-panel-section">
    <h1>مدیریت قیمت‌ها</h1>
    <p class="admin-help">قیمت‌ها به هزار تومان. سایزها جداگانه ذخیره می‌شوند.</p>
    <input v-model="query" class="price-search" type="search" placeholder="جستجوی آیتم..." />
    <p v-if="message" class="msg-error">{{ message }}</p>
    <p v-if="loading" class="admin-loading">در حال بارگذاری...</p>

    <div class="price-list">
      <div v-for="row in rows" :key="row.key" class="price-row">
        <div>
          <strong>{{ row.label }}</strong>
          <small>{{ row.category }} — فعلی {{ formatPrice(row.effective) }}</small>
        </div>
        <div class="price-edit">
          <input
            type="number"
            min="0"
            :value="drafts[row.key]"
            @input="drafts[row.key] = $event.target.value"
            @change="saveRow(row)"
          />
          <span v-if="savingKey === row.key">...</span>
        </div>
      </div>
    </div>
  </section>
</template>
