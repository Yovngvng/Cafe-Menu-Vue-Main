<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
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
const activeCategory = ref(props.menu[0].category);
const featuredItems = getFeaturedItems(props.menu);

const selectedProduct = ref(null);
const selectedSizeIndex = ref(0);
const toppingSelected = ref(false);
const adding = ref(false);

const { loadRatings } = useRatings();

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

function scrollToSection(index, category) {
  activeCategory.value = category;
  const section = document.getElementById("section-" + index);
  if (!section) return;
  const navH = navRef.value?.offsetHeight || 0;
  const top = section.getBoundingClientRect().top + window.pageYOffset - navH - 8;
  window.scrollTo({ top, behavior: "smooth" });
}

let itemObserver;
let sectionObserver;

function setupObservers() {
  itemObserver?.disconnect();
  sectionObserver?.disconnect();

  itemObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll(".menu-item-row").forEach((el) => itemObserver.observe(el));

  const navButtons = navRef.value?.querySelectorAll("button") || [];
  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = Number(entry.target.dataset.index);
        const cat = props.menu[index]?.category;
        if (cat) activeCategory.value = cat;
        const btn = navButtons[index];
        if (btn) {
          btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      });
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
  );
  document.querySelectorAll(".menu-section").forEach((el) => sectionObserver.observe(el));
}

onMounted(async () => {
  await nextTick();
  setupObservers();
});

onUnmounted(() => {
  itemObserver?.disconnect();
  sectionObserver?.disconnect();
});
</script>

<template>
  <nav ref="navRef" class="category-nav">
    <button
      v-for="(category, index) in menu"
      :key="category.category"
      @click="scrollToSection(index, category.category)"
      :class="{ active: activeCategory === category.category }"
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
    <section
      v-for="(category, index) in menu"
      :id="'section-' + index"
      :key="category.category"
      class="menu-section"
      :data-index="index"
    >
      <h2>{{ category.category }}</h2>
      <div
        class="menu-item-row"
        v-for="item in category.items"
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
