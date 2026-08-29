<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { menu } from "../data/menuData.js";
import Menu from "../components/customer/Menu.vue";
import Cart from "../components/customer/Cart.vue";

const route = useRoute();

const CART_KEY = "cafeCart";

function loadCart() {
  try {
    const saved = sessionStorage.getItem(CART_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

const cart = ref(loadCart());
const showCart = ref(false);
const toast = ref(false);
const toastText = ref("");
const showScrollTop = ref(false);

const orderLocation = ref("");
const tableNumber = ref("");
const orderNote = ref("");

const cartQty = computed(() =>
  cart.value.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
);

watch(
  cart,
  () => {
    sessionStorage.setItem(CART_KEY, JSON.stringify(cart.value));
  },
  { deep: true }
);

async function addToCart(item) {
  const existing = cart.value.find((i) => i.name === item.name);

  if (existing) {
    existing.quantity++;
    toastText.value = ` تعداد ${item.name} افزایش یافت`;
  } else {
    cart.value.push({
      ...item,
      quantity: 1,
    });
    toastText.value = `${item.name} به سبد خرید اضافه شد`;
  }

  toast.value = true;
  setTimeout(() => {
    toast.value = false;
  }, 2200);
}

function changeQty({ index, delta }) {
  const item = cart.value[index];
  if (!item) return;
  const next = item.quantity + delta;
  if (next <= 0) {
    cart.value.splice(index, 1);
  } else {
    item.quantity = next;
  }
}

function removeFromCart(index) {
  cart.value.splice(index, 1);
}

function clearCart() {
  cart.value = [];
}

const ORDERED_KEY = "orderedProducts";

function handleOrdered() {
  const ordered = JSON.parse(localStorage.getItem(ORDERED_KEY) || "{}");
  cart.value.forEach((item) => {
    ordered[item.name] = true;
    if (item.productName) ordered[item.productName] = true;
  });
  localStorage.setItem(ORDERED_KEY, JSON.stringify(ordered));

  cart.value = [];
  orderLocation.value = "";
  tableNumber.value = "";
  orderNote.value = "";
}

function onScroll() {
  showScrollTop.value = window.scrollY > 400;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const table = route.query.table;
  if (!table) return;

  const validTable = ["1", "2", "3", "4", "5"].includes(String(table));
  if (!validTable) return;

  tableNumber.value = String(table);
  orderLocation.value = route.query.location === "outdoor" ? "فضای باز" : "سالن";
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});
</script>

<template>
  <header class="app-header">
    <h1>کافه ژوان</h1>
  </header>

  <button class="cart-toggle-btn" @click="showCart = true">
    💳 سبد خرید ({{ cartQty }})
  </button>

  <Menu :menu="menu" @add="addToCart" />
  <Cart
    :items="cart"
    :visible="showCart"
    v-model:location="orderLocation"
    v-model:table-number="tableNumber"
    v-model:note="orderNote"
    @change-qty="changeQty"
    @remove="removeFromCart"
    @clear="clearCart"
    @close="showCart = false"
    @ordered="handleOrdered"
  />

  <button
    v-show="showScrollTop"
    class="scroll-to-top"
    type="button"
    aria-label="بازگشت به بالا"
    @click="scrollToTop"
  >
    ⇡
  </button>

  <Transition name="toast">
    <div v-if="toast" class="toast-success">✅ {{ toastText }}</div>
  </Transition>
</template>
