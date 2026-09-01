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
const saving = ref(false);
const message = ref("");
const messageOk = ref(false);
const loading = ref(true);

const rows = computed(() => {
  const q = query.value.trim();
  return catalog
    .map((row) => {
      const override = overrides.value[row.key];
      const savedPrice = override == null ? row.staticPrice : Number(override);
      const draftPrice = Number(drafts.value[row.key]);
      const dirty = Number.isFinite(draftPrice) && draftPrice !== savedPrice;
      return { ...row, savedPrice, dirty };
    })
    .filter((row) => !q || row.label.includes(q) || row.category.includes(q) || row.key.includes(q));
});

const dirtyRows = computed(() => rows.value.filter((row) => row.dirty));

function flash(text, ok = false) {
  message.value = text;
  messageOk.value = ok;
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

function setDraft(key, value) {
  drafts.value = { ...drafts.value, [key]: value };
}

async function savePrices(targets) {
  if (!targets.length) {
    flash("تغییری برای ذخیره نیست");
    return;
  }
  for (const row of targets) {
    const price = Number(drafts.value[row.key]);
    if (!Number.isFinite(price) || price < 0) {
      flash(`قیمت «${row.label}» نامعتبر است`);
      return;
    }
  }
  saving.value = true;
  const nextOverrides = { ...overrides.value };
  for (const row of targets) {
    const price = Number(drafts.value[row.key]);
    const result = await upsertPriceOverride(row.key, price);
    if (!result.ok) {
      saving.value = false;
      flash(result.message);
      return;
    }
    nextOverrides[row.key] = price;
  }
  overrides.value = nextOverrides;
  saving.value = false;
  flash(targets.length === 1 ? "قیمت ذخیره شد" : `${targets.length} قیمت ذخیره شد`, true);
}

onMounted(loadPrices);
</script>

<template>
  <section class="admin-panel-section">
    <h1>مدیریت قیمت‌ها</h1>
    <p class="admin-help">قیمت‌ها به هزار تومان. تا وقتی ذخیره نکنید روی منوی مشتری اعمال نمی‌شود.</p>
    <div class="price-toolbar">
      <input v-model="query" class="price-search" type="search" placeholder="جستجوی آیتم..." />
      <button
        type="button"
        class="price-save-all"
        :disabled="saving || !dirtyRows.length"
        @click="savePrices(dirtyRows)"
      >
        {{ saving ? "در حال ذخیره..." : "ذخیره تغییرات" }}
      </button>
    </div>
    <p v-if="message" :class="messageOk ? 'msg-success' : 'msg-error'">{{ message }}</p>
    <p v-if="loading" class="admin-loading">در حال بارگذاری...</p>

    <div class="price-list">
      <div v-for="row in rows" :key="row.key" class="price-row" :class="{ dirty: row.dirty }">
        <div>
          <strong>{{ row.label }}</strong>
          <small>{{ row.category }} — فعلی {{ formatPrice(row.savedPrice) }}</small>
        </div>
        <div class="price-edit">
          <input
            type="number"
            min="0"
            :value="drafts[row.key]"
            @input="setDraft(row.key, $event.target.value)"
          />
          <button
            type="button"
            class="price-save-btn"
            :disabled="saving || !row.dirty"
            @click="savePrices([row])"
          >
            ذخیره
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
