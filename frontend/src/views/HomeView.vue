<script setup lang="ts">
import { onMounted, ref } from "vue";
import AppLayout from "@/views/AppLayout.vue";
import Button from "primevue/button";

import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { useHomesStore } from "@/stores/useHomeStore";
import { useSessionStore } from "@/stores/useSessionStore";

const homes = useHomesStore();
const session = useSessionStore();

const homeName = ref<string>("");
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    const id = await homes.ensureHome();

    const snap = await getDoc(doc(db, "homes", id));
    if (!snap.exists()) throw new Error("Home doc not found after creation.");

    const data = snap.data() as { name?: string };
    homeName.value = data.name ?? "My Home";
  } catch (e: any) {
    error.value = e?.message ?? "Failed to load home";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <AppLayout>
    <div class="space-y-4 w-full">
      <h1 class="text-2xl font-bold sm:text-3xl md:text-4xl text-surface-900">
        Welcome to HomeBones!
      </h1>
      <p class="text-base text-surface-600 sm:text-lg">
        Your smart home management system
      </p>

      <div class="rounded-xl border border-surface-200 bg-surface-0 p-4">
        <div v-if="loading" class="text-sm text-surface-600">
          Loading your home…
        </div>

        <div v-else-if="error" class="text-sm text-red-600">
          {{ error }}
        </div>

        <div v-else class="space-y-2">
          <div class="text-sm text-surface-600">Current home</div>
          <div class="text-lg font-semibold text-surface-900">{{ homeName }}</div>

          <div class="grid gap-1 text-xs text-surface-600">
            <div>
              <span class="font-medium">homeId:</span>
              <span class="font-mono">{{ homes.homeId }}</span>
            </div>
            <div>
              <span class="font-medium">uid:</span>
              <span class="font-mono">{{ session.uid }}</span>
            </div>
          </div>
        </div>
      </div>

      <Button label="Get Started" icon="pi pi-home" class="mt-2" />
    </div>
  </AppLayout>
</template>
