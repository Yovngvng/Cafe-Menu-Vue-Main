<script setup>
import { computed } from "vue";
import { formatPrice } from "../../utils/formatPrice.js";
import { extractOrderTax, extractHolderRequested, extractHolderFee, productLines } from "../../utils/orderTotals.js";
import { canonicalStatus, nextStatus, nextStatusLabel, STATUS, orderTimestamp } from "../../utils/orderStatus.js";

const props = defineProps({
  order: { type: Object, required: true },
  dailyNumber: { type: Number, default: null },
});

defineEmits(["change-status", "delete"]);

const status = computed(() => canonicalStatus(props.order.status));
const isFinal = computed(() => status.value === STATUS.DONE);
const nextLabel = computed(() => nextStatusLabel(status.value));
const hasNext = computed(() => !!nextStatus(status.value));
const displayId = computed(() => {
  if (props.dailyNumber != null) return props.dailyNumber.toLocaleString("fa-IR");
  return "—";
});
const items = computed(() => productLines(props.order.items));
const taxAmount = computed(() => extractOrderTax(props.order.items));
const holderRequested = computed(() => extractHolderRequested(props.order.items));
const holderFee = computed(() => extractHolderFee(props.order.items));

function timeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Math.floor((Date.now() - timestamp) / 60000);
  if (diff < 1) return "همین الان";
  if (diff < 60) return `${diff} دقیقه پیش`;
  return `${Math.floor(diff / 60)} ساعت پیش`;
}

const createdAt = computed(() => orderTimestamp(props.order));

const waitedMinutes = computed(() => {
  if (!createdAt.value) return 0;
  return Math.floor((Date.now() - createdAt.value) / 60000);
});

const isUrgent = computed(() => status.value === STATUS.WAITING && waitedMinutes.value >= 10);

const timeLabel = computed(() => {
  if (!createdAt.value) return "";
  return new Date(createdAt.value).toLocaleString("fa-IR");
});
</script>

<template>
  <div class="order-card" :class="{ 'order-urgent': isUrgent }">
    <h3>سفارش #{{ displayId }}</h3>
    <p v-if="createdAt">زمان: {{ timeLabel }} ({{ timeAgo(createdAt) }})</p>
    <p v-if="order.customer_name">مشتری: {{ order.customer_name }}</p>
    <p v-if="order.order_type">محل: {{ order.order_type }} {{ order.table_number ? '- میز ' + order.table_number : '' }}</p>
    <p v-if="taxAmount">مالیات ۱۰٪: {{ formatPrice(taxAmount) }}</p>
    <p v-if="holderRequested">هولدر: دارد ({{ formatPrice(holderFee) }})</p>
    <p>مبلغ: {{ formatPrice(order.total) }}</p>
    <p>وضعیت: {{ status }}</p>
    <p v-if="order.note">یادداشت: {{ order.note }}</p>
    <div class="order-items">
      <h4>آیتم ها:</h4>
      <ul>
        <li v-for="item in items" :key="item.name">
          {{ item.name }} × {{ item.quantity }} - {{ formatPrice(item.price) }}
        </li>
      </ul>
    </div>
    <button
      v-if="hasNext"
      class="order-next-btn"
      @click="$emit('change-status', order)"
      :disabled="isFinal"
    >
      {{ nextLabel }}
    </button>
    <button class="order-delete-btn" @click="$emit('delete', order.id)">حذف</button>
  </div>
</template>
