<script setup>
import { ref, computed } from "vue";
import { formatItemListPrice } from "../../data/menuUtils.js";

const props = defineProps({
  menu: { type: Array, required: true },
});

const emit = defineEmits(["select"]);

const query = ref("");
const showResults = ref(false);

const allItems = computed(() => {
  const items = [];
  props.menu.forEach((category) => {
    (category.items || []).forEach((item) => items.push(item));
  });
  return items;
});

const results = computed(() => {
  if (!query.value.trim()) return [];
  const q = query.value.trim();
  return allItems.value
    .filter((item) => {
      if (item.name.includes(q)) return true;
      return (item.sizes || []).some(
        (size) => size.size.includes(q) || `${item.name} - ${size.size}`.includes(q)
      );
    })
    .slice(0, 8);
});

function pick(item) {
  emit("select", item);
  query.value = "";
  showResults.value = false;
}
</script>

<template>
  <div class="search-container">
    <input
      v-model="query"
      type="text"
      placeholder="جست و جوی محصول ..."
      autocomplete="off"
      @focus="showResults = true"
      @blur="() => setTimeout(() => (showResults = false), 150)"
    />
    <div class="search-results-box" :style="{ display: showResults && query ? 'block' : 'none' }">
      <div v-if="results.length === 0" class="no-result">نتیجه‌ای پیدا نشد</div>
      <div
        v-for="item in results"
        :key="item.name"
        class="search-result-item"
        @click="pick(item)"
      >
        <img v-if="item.image" :src="item.image" class="search-result-img" :alt="item.name" />
        <div class="search-result-info">
          <div class="search-result-name">{{ item.name }}</div>
          <div class="search-result-price">{{ formatItemListPrice(item) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
