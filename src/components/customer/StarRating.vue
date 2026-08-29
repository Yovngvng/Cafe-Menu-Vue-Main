<script setup>
import { computed } from "vue";
import { useRatings } from "../../composables/useRatings.js";

const props = defineProps({
  productName: { type: String, required: true },
});

const { getSummary, getUserVote, hasOrdered, rate } = useRatings();

const summary = computed(() => getSummary(props.productName));
const userVote = computed(() => getUserVote(props.productName));
const ordered = computed(() => hasOrdered(props.productName));
const canRate = computed(() => ordered.value && !userVote.value);
const displayValue = computed(() => userVote.value || Math.round(summary.value.avg));

async function onStarClick(value) {
  if (!canRate.value) return;
  await rate(props.productName, value);
}
</script>

<template>
  <div class="rating-widget">
    <div class="stars" :class="{ voted: !canRate }">
      <span
        v-for="n in 5"
        :key="n"
        class="star"
        :class="{ filled: n <= displayValue }"
        @click="onStarClick(n)"
      >★</span>
    </div>

    <p class="rating-summary">
      {{ summary.count > 0 ? `امتیاز: ${summary.avg.toFixed(1)} از ${summary.count} نظر` : "هنوز نظری ثبت نشده، اولین نفر باش!" }}
    </p>

    <p v-if="!ordered" class="rating-note">
      برای ثبت امتیاز، اول باید این محصول رو سفارش داده باشی
    </p>
  </div>
</template>
