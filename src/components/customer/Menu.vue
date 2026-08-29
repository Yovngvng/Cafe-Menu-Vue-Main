<script setup>
import { ref, computed, nextTick } from "vue";
import { getFeaturedItems, formatItemListPrice, buildCartLine } from "../../data/menuUtils.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { useRatings } from "../../composables/useRatings.js";
import StarRating from "./StarRating.vue";
import SearchBar from "./SearchBar.vue";

const props = defineProps({
  menu: { type: Array, required: true },
});

const emit = defineEmits(["add"]);

const navRef = ref(null);
const activeCategoryName = ref(props.menu[0]?.category || "");
const featuredItems = getFeaturedItems(props.menu);

const selectedProduct = ref(null);
const selectedSizeIndex = ref(0);
const toppingSelected = ref(false);
const adding = ref(false);

const { loadRatings } = useRatings();

const activeCategory = computed(
  () => props.menu.find((category) => category.category === activeCategoryName.value) || props.menu[0]
);

const selectedSize = computed(() => {
  const sizes = selectedProduct.value?.sizes;
  if (!sizes?.length) return null;
  return sizes[Number(selectedSizeIndex.value)] || sizes[0];
});

const modalPrice = computed(() => {
  const item = selectedProduct.value;
  if (!item) return 0;
  const line = buildCartLine(item, {
    size: selectedSize.value,
    toppingSelected: toppingSelected.value,
  });
  return line.price;
});

function selectCategory(category) {
  activeCategoryName.value = category;
  nextTick(() => {
    const btn = navRef.value?.querySelector("button.active");
    btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  });
}

function openProduct(item) {
  selectedProduct.value = item;
  selectedSizeIndex.value = 0;
  toppingSelected.value = false;
  loadRatings();
}

function closeProduct() {
  selectedProduct.value = null;
  toppingSelected.value = false;
}

async function addProduct() {
  if (!selectedProduct.value) return;
  adding.value = true;
  await new Promise((resolve) => setTimeout(resolve, 400));
  emit(
    "add",
    buildCartLine(selectedProduct.value, {
      size: selectedSize.value,
      toppingSelected: toppingSelected.value,
    })
  );
  adding.value = false;
  closeProduct();
}
</script>

<template>
  <nav ref="navRef" class="category-nav" role="tablist" aria-label="دسته‌بندی منو">
    <button
      v-for="category in menu"
      :key="category.category"
      type="button"
      role="tab"
      :aria-selected="activeCategoryName === category.category"
      :class="{ active: activeCategoryName === category.category }"
      @click="selectCategory(category.category)"
    >
      {{ category.category }}
    </button>
  </nav>

  <SearchBar :menu="menu" @select="openProduct" />

  <div v-if="featuredItems.length" class="featured-section">
    <h2 class="featured-title">ویژه های کافه ژوان</h2>
    <div class="featured-items-container">
      <div
        v-for="item in featuredItems"
        :key="item.name"
        class="featured-card"
        @click="openProduct(item)"
      >
        <img v-if="item.image" :src="item.image" :alt="item.name">
        <div class="feature-name">{{ item.name }}</div>
        <div class="feature-price">{{ formatItemListPrice(item) }}</div>
      </div>
    </div>
  </div>

  <div class="menu-list">
    <section v-if="activeCategory" class="menu-section">
      <h2>{{ activeCategory.category }}</h2>
      <div
        class="menu-item-row show"
        v-for="item in activeCategory.items"
        :key="item.name"
        @click="openProduct(item)"
      >
        <img v-if="item.image" class="menu-image" :src="item.image" :alt="item.name" />
        <div class="menu-info">
          <h3>{{ item.name }}</h3>
          <p v-if="item.description">{{ item.description }}</p>
          <strong>{{ formatItemListPrice(item) }}</strong>
        </div>
      </div>
    </section>
  </div>

  <div v-if="selectedProduct" class="modal" @click="closeProduct">
    <div class="modal-content" @click.stop>
      <img v-if="selectedProduct.image" :src="selectedProduct.image" class="modal-image" />
      <h2>{{ selectedProduct.name }}</h2>
      <p v-if="selectedProduct.description">{{ selectedProduct.description }}</p>

      <div v-if="selectedProduct.sizes?.length" class="option-group">
        <div class="option-label">انتخاب سایز</div>
        <label
          v-for="(size, index) in selectedProduct.sizes"
          :key="size.size"
          class="option-chip"
          :class="{ active: selectedSizeIndex === index }"
        >
          <input type="radio" :value="index" v-model="selectedSizeIndex" />
          <span>{{ size.size }} — {{ formatPrice(size.price) }}</span>
        </label>
      </div>

      <label v-if="selectedProduct.optionalTopping" class="topping-row">
        <input type="checkbox" v-model="toppingSelected" />
        <span>
          {{ selectedProduct.optionalTopping.name }}
          (+{{ formatPrice(selectedProduct.optionalTopping.price) }})
        </span>
      </label>

      <div class="modal-price">{{ formatPrice(modalPrice) }}</div>
      <StarRating :product-name="selectedProduct.name" />
      <button class="modal-btn" @click="addProduct" :disabled="adding">
        {{ adding ? "در حال افزودن..." : "افزودن به سبد خرید" }}
      </button>
    </div>
  </div>
</template>
