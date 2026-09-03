<script setup>
import { watch } from "vue";
import { RouterView, useRoute } from "vue-router";
import { applyInstallBranding } from "./utils/installBranding.js";

const route = useRoute();

watch(
  () => route.path,
  (path) => {
    applyInstallBranding(path.startsWith("/admin"));
  },
  { immediate: true }
);
</script>

<template>
  <RouterView />
</template>
