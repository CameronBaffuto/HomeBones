import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { useSessionStore } from "@/stores/useSessionStore";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/LoginView.vue"),
  },
  {
    path: "/",
    name: "home",
    component: () => import("@/views/DashboardView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/homes/:homeId",
    name: "home-details",
    component: () => import("@/views/HomeDetailsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/rooms/:roomId",
    name: "room-details",
    component: () => import("@/views/RoomDetailsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

async function waitForAuthReady(): Promise<void> {
  const auth = useSessionStore();

  if (auth.ready) return;

  await new Promise<void>((resolve) => {
    const stop = auth.$subscribe(() => {
      if (auth.ready) {
        stop();
        resolve();
      }
    });
  });
}

router.beforeEach(async (to) => {
  await waitForAuthReady();

  const auth = useSessionStore();
  const requiresAuth = !!to.meta.requiresAuth;

  if (requiresAuth && !auth.isAuthed) {
    return { name: "login" };
  }

  if (to.name === "login" && auth.isAuthed) {
    return { name: "home" };
  }

  return true;
});

export default router;
