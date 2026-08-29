import { ref } from "vue";
import { fetchAllRatings, submitRating } from "../services/ratings.js";
import { nameAliases } from "../data/menuUtils.js";

const RATED_KEY = "ratedProducts";
const ORDERED_KEY = "orderedProducts";

// cache ساده و مشترک بین همه استفاده‌های این composable تو کل اپ
const allRatings = ref([]);

export function useRatings() {
  async function loadRatings() {
    allRatings.value = await fetchAllRatings();
  }

  function getSummary(productName) {
    const aliases = nameAliases(productName);
    const productRatings = allRatings.value.filter((r) => aliases.includes(r.product_name));
    if (productRatings.length === 0) return { avg: 0, count: 0 };
    const sum = productRatings.reduce((s, r) => s + r.rating, 0);
    return { avg: sum / productRatings.length, count: productRatings.length };
  }

  function lookupLocal(key, productName) {
    const store = JSON.parse(localStorage.getItem(key) || "{}");
    return nameAliases(productName).some((alias) => store[alias]);
  }

  function getUserVote(productName) {
    const voted = JSON.parse(localStorage.getItem(RATED_KEY) || "{}");
    for (const alias of nameAliases(productName)) {
      if (voted[alias]) return voted[alias];
    }
    return null;
  }

  function markUserVote(productName, value) {
    const voted = JSON.parse(localStorage.getItem(RATED_KEY) || "{}");
    voted[productName] = value;
    localStorage.setItem(RATED_KEY, JSON.stringify(voted));
  }

  function hasOrdered(productName) {
    return lookupLocal(ORDERED_KEY, productName);
  }

  async function rate(productName, value) {
    const result = await submitRating(productName, value);
    if (result.ok) {
      markUserVote(productName, value);
      allRatings.value.push({ product_name: productName, rating: value });
    }
    return result.ok;
  }

  return { allRatings, loadRatings, getSummary, getUserVote, hasOrdered, rate };
}
