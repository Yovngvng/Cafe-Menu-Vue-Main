import { createRouter, createWebHistory } from "vue-router";
import { getSession } from "../services/supabase.js";

import CustomerView from "../views/CustomerView.vue";
import Admin from "../components/admin/Admin.vue";
import AdminLogin from "../components/admin/AdminLogin.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: CustomerView,
    },
    {
      path: "/admin/login",
      component: AdminLogin,
      meta: { guestOnly: true },
    },
    {
      path: "/admin",
      component: Admin,
      meta: { requiresAuth: true },
    },
  ],
});

router.beforeEach(async (to) => {
  const needsAuth = to.meta.requiresAuth || to.meta.guestOnly;
  if (!needsAuth) return true;

  const session = await getSession();

  if (to.meta.requiresAuth && !session) {
    return { path: "/admin/login", query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && session) {
    return { path: "/admin" };
  }

  return true;
});

export default router;
