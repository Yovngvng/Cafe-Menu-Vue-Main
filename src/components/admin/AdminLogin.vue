<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { signInAdmin } from "../../services/auth.js";

const router = useRouter();
const route = useRoute();
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const error = ref("");
const loading = ref(false);

async function tryLogin() {
  error.value = "";
  if (!email.value.trim() || !password.value) {
    error.value = "ایمیل و رمز را وارد کن";
    return;
  }

  loading.value = true;
  const result = await signInAdmin(email.value.trim(), password.value, rememberMe.value);
  loading.value = false;

  if (!result.ok) {
    error.value = result.message;
    return;
  }

  const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/admin";
  router.replace(redirect.startsWith("/admin") ? redirect : "/admin");
}
</script>

<template>
  <div class="login-box">
    <h2>ورود به پنل مدیریت</h2>
    <input
      v-model="email"
      type="email"
      autocomplete="username"
      placeholder="ایمیل"
      @keydown.enter="tryLogin"
    >
    <input
      v-model="password"
      type="password"
      autocomplete="current-password"
      placeholder="رمز عبور"
      @keydown.enter="tryLogin"
    >
    <label class="remember-row">
      <input type="checkbox" v-model="rememberMe" />
      <span>مرا به خاطر بسپار</span>
    </label>
    <button @click="tryLogin" :disabled="loading">
      {{ loading ? "در حال ورود..." : "ورود" }}
    </button>
    <p v-if="error" class="login-error">{{ error }}</p>
  </div>
</template>
