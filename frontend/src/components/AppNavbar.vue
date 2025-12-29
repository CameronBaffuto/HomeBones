<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/useSessionStore";
import { useThemeStore } from "@/stores/useThemeStore";
import HomeBonesLogo from "@/assets/HB.png";

import Button from "primevue/button";
import Drawer from "primevue/drawer";
import Avatar from "primevue/avatar";
import SelectButton from "primevue/selectbutton";

const session = useSessionStore();
const theme = useThemeStore();
const router = useRouter();

const menuOpen = ref(false);

const themeOptions = [
  { value: "system", icon: "pi pi-desktop" },
  { value: "light", icon: "pi pi-sun" },
  { value: "dark", icon: "pi pi-moon" },
];

const email = computed(() => session.user?.email ?? "");
const avatarLabel = computed(() =>
  email.value ? email.value.charAt(0).toUpperCase() : "?"
);

const go = (name: string) => {
  menuOpen.value = false;
  router.push({ name });
};

const logout = async () => {
  menuOpen.value = false;
  await session.logout();
  router.replace({ name: "login" });
};
</script>

<template>
  <header class="px-5 sticky top-0 z-50 bg-surface-0/95 backdrop-blur">
    <div class="flex items-center justify-between px-3 py-3">
      <div class="flex items-center gap-2 cursor-pointer" @click="go('home')">
        <slot name="logo">
          <img :src="HomeBonesLogo" alt="HomeBones Logo" class="w-10 h-10" />
          <span class="text-base font-semibold">HomeBones</span>
        </slot>
      </div>

      <Button
        icon="pi pi-bars"
        text
        rounded
        @click="menuOpen = true"
      />
    </div>
  </header>

  <Drawer
    v-model:visible="menuOpen"
    position="right"
    class="w-[88vw] max-w-sm"
    :showCloseIcon="false"
  >
    <template #header>
      <div class="flex w-full items-center justify-between px-1">
        <div class="flex items-center gap-2">
          <i class="pi pi-lightbulb"></i>
          <span class="font-semibold">HomeBones</span>
        </div>
        <Button
          icon="pi pi-times"
          text
          rounded
          @click="menuOpen = false"
        />
      </div>
    </template>

    <div class="flex h-full flex-col">
      <nav class="mt-2 flex flex-col gap-1">
        <Button
          label="Dashboard"
          icon="pi pi-th-large"
          text
          class="justify-start"
          @click="go('home')"
        />
      </nav>

        <div class="mt-auto pt-4">
            <div class="flex items-center justify-between py-2">
                <span class="text-sm text-surface-600">Theme</span>

                <SelectButton
                    :modelValue="theme.mode"
                    :options="themeOptions"
                    optionLabel="value"
                    optionValue="value"
                    dataKey="value"
                    @update:modelValue="theme.setMode"
                >
                    <template #option="{ option }">
                    <i :class="option.icon" class="text-sm" />
                    </template>
                </SelectButton>
            </div>
            <div class="flex items-center justify-between rounded-xl bg-surface-50 px-3 py-3">
                <div class="flex items-center gap-3 min-w-0">
                <Avatar :label="avatarLabel" shape="circle" />
                <div class="min-w-0">
                    <p class="text-xs text-surface-500">Signed in as</p>
                    <p class="text-sm font-medium truncate">
                    {{ email || "Account" }}
                    </p>
                </div>
                </div>

                <Button
                v-if="session.isAuthed"
                icon="pi pi-sign-out"
                text
                rounded
                severity="danger"
                @click="logout"
                />
            </div>
        </div>
    </div>    
  </Drawer>
</template>
