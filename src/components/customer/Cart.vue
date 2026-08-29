<script setup>
import { computed, ref } from "vue";
import { createOrder } from "../../services/orders.js";
import { formatPrice } from "../../utils/formatPrice.js";
import { orderTotals } from "../../utils/orderTotals.js";

const props = defineProps({
  items: { type: Array, required: true },
  visible: { type: Boolean, required: true },
  location: { type: String, default: "" },
  tableNumber: { type: String, default: "" },
  note: { type: String, default: "" },
  customerName: { type: String, default: "" },
});

const emit = defineEmits([
  "change-qty",
  "remove",
  "clear",
  "close",
  "ordered",
  "update:location",
  "update:tableNumber",
  "update:note",
  "update:customerName",
]);

const totalQty = computed(() =>
  props.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
);

const totals = computed(() => orderTotals(props.items));
const subtotalPrice = computed(() => totals.value.subtotal);
const taxAmount = computed(() => totals.value.tax);
const totalPrice = computed(() => totals.value.total);

const submitting = ref(false);
const message = ref("");
const messageType = ref("");

function showMessage(text, type) {
  message.value = text;
  messageType.value = type;
  setTimeout(() => {
    message.value = "";
  }, 3000);
}

async function submitOrder() {
  if (props.items.length === 0) {
    showMessage("سبد خرید خالیه", "error");
    return;
  }
  if (!props.location) {
    showMessage("محل سفارش رو انتخاب کن", "error");
    return;
  }
  if ((props.location === "سالن" || props.location === "فضای باز") && !props.tableNumber) {
    showMessage("شماره میز رو انتخاب کن", "error");
    return;
  }

  submitting.value = true;
  const result = await createOrder({
    customerName: props.customerName,
    orderType: props.location,
    tableNumber: props.tableNumber,
    note: props.note,
    items: props.items,
    total: totalPrice.value,
    tax: taxAmount.value,
  });
  submitting.value = false;

  if (result.ok) {
    emit("ordered");
    showMessage("سفارش ثبت شد ✅", "success");
  } else {
    showMessage(result.message, "error");
  }
}
</script>

<template>
  <div v-if="visible" class="cart-overlay" @click.self="emit('close')">
    <div class="cart-box">
      <button class="close-btn" @click="emit('close')">بستن ✕</button>
      <h2>سبد خرید ({{ totalQty }})</h2>

      <div class="cart-row" v-for="(item, index) in items" :key="item.name">
        <div class="cart-row-info">
          <span>{{ item.name }}</span>
          <small>{{ formatPrice(item.price) }}</small>
        </div>
        <div class="cart-qty">
          <button type="button" class="qty-btn" @click="emit('change-qty', { index, delta: -1 })">−</button>
          <span>{{ item.quantity }}</span>
          <button type="button" class="qty-btn" @click="emit('change-qty', { index, delta: 1 })">+</button>
          <button type="button" class="remove-line" @click="emit('remove', index)">حذف</button>
        </div>
      </div>

      <div class="order-location-box">
        <label>نام (اختیاری):</label>
        <input
          type="text"
          :value="customerName"
          placeholder="اگر بخوای روی سفارش نوشته بشه"
          @input="emit('update:customerName', $event.target.value)"
        >

        <label>محل سفارش:</label>
        <select
          :value="location"
          @change="emit('update:location', $event.target.value)"
        >
          <option value="">انتخاب کنید</option>
          <option value="سالن">سالن</option>
          <option value="فضای باز">فضای باز</option>
          <option value="بیرون بر">بیرون بر</option>
        </select>

        <div v-if="location === 'سالن' || location === 'فضای باز'">
          <label>شماره میز:</label>
          <select
            :value="tableNumber"
            @change="emit('update:tableNumber', $event.target.value)"
          >
            <option value="">انتخاب میز</option>
            <option v-for="n in 5" :key="n" :value="String(n)">میز {{ n }}</option>
          </select>
        </div>
      </div>

      <div class="order-note-box">
        <label>یادداشت سفارش:</label>
        <textarea
          :value="note"
          @input="emit('update:note', $event.target.value)"
          placeholder="مثلا: بدون شکر, یخ کمتر, خامه بیشتر ..."
        ></textarea>
      </div>

      <div class="cart-totals">
        <p>جمع جزء: {{ formatPrice(subtotalPrice) }}</p>
        <p v-if="taxAmount">مالیات ۱۰٪: {{ formatPrice(taxAmount) }}</p>
        <p class="cart-total">جمع کل: {{ formatPrice(totalPrice) }}</p>
      </div>

      <p v-if="message" :class="messageType === 'success' ? 'msg-success' : 'msg-error'">
        {{ message }}
      </p>

      <div class="cart-actions">
        <button type="button" class="clear-cart-btn" :disabled="!items.length" @click="emit('clear')">
          خالی کردن سبد خرید
        </button>
        <button type="button" @click="submitOrder" :disabled="submitting">
          {{ submitting ? "در حال ثبت..." : "ثبت سفارش" }}
        </button>
      </div>
    </div>
  </div>
</template>
