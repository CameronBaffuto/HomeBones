<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useHomesStore } from "@/stores/useHomeStore";

import Button from "primevue/button";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Message from "primevue/message";
import SelectButton from "primevue/selectbutton";

const auth = useAuthStore();
const homes = useHomesStore();
const router = useRouter();

const modeOptions = [
  { label: "Sign in", value: "login" },
  { label: "Create", value: "register" },
];

const title = computed(() => (auth.mode === "register" ? "Create your account" : "Welcome back"));
const primaryLabel = computed(() => (auth.mode === "register" ? "Create account" : "Sign in"));

async function onPrimaryClick() {
  try {
    await auth.submit();
    await homes.ensureHome();
    router.replace({ name: "home" });
  } catch {
    // auth store already sets auth.error
  }
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-surface-50 px-4 py-6">
    <div class="w-full max-w-sm rounded-2xl border border-surface-200 bg-surface-0 p-6 shadow-sm">
      <div class="mb-6 text-center">
        <div class="flex items-center justify-center gap-2">
          <i class="pi pi-home text-xl"></i>
          <h1 class="text-xl font-semibold">HomeBones</h1>
        </div>
        <p class="mt-2 text-sm text-surface-600">{{ title }}</p>
      </div>

      <div class="mb-4">
        <SelectButton
          v-model="auth.mode"
          :options="modeOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
          fluid
          :disabled="auth.loading"
        />
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">Email</label>
          <InputText
            class="w-full"
            inputmode="email"
            autocomplete="email"
            placeholder="you@example.com"
            :disabled="auth.loading"
            :modelValue="auth.email"
            @update:modelValue="auth.setEmail"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-surface-700 mb-1">Password</label>
          <Password
            class="w-full"
            inputClass="w-full"
            :feedback="auth.mode === 'register'"
            toggleMask
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="auth.loading"
            :modelValue="auth.password"
            @update:modelValue="auth.setPassword"
          />
          <p class="mt-1 text-xs text-surface-500">
            {{ auth.mode === "register" ? "Minimum 6 characters." : " " }}
          </p>
        </div>

        <Message v-if="auth.error" severity="error" class="w-full">
          {{ auth.error }}
        </Message>

        <Button
          class="w-full"
          :label="primaryLabel"
          icon="pi pi-check"
          :loading="auth.loading"
          @click="onPrimaryClick"
        />
      </div>

      <div class="mt-6 text-xs text-surface-500 flex items-center justify-between">
        <span>By continuing, you agree to save home info to your account.</span>
        <i class="pi pi-lock"></i>
      </div>
    </div>
  </div>
</template>