<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useSessionStore } from "@/stores/useSessionStore";
import { useThemeStore } from "@/stores/useThemeStore";
import HomeBonesLogo from "@/assets/HB.png";

import Button from "primevue/button";
import Menu from "primevue/menu";
import Avatar from "primevue/avatar";
import SelectButton from "primevue/selectbutton";

const session = useSessionStore();
const theme = useThemeStore();
const router = useRouter();

const menu = ref();

const themeOptions = [
  { value: "system", icon: "pi pi-desktop" },
  { value: "light", icon: "pi pi-sun" },
  { value: "dark", icon: "pi pi-moon" },
];

const email = computed(() => session.user?.email ?? "");
const avatarLabel = computed(() =>
  email.value ? email.value.charAt(0).toUpperCase() : "?"
);

const menuItems = ref([
  {
    label: "Navigation",
    items: [
      {
        label: "Dashboard",
        icon: "pi pi-th-large",
        command: () => go("home")
      }
    ]
  }
]);

const toggleMenu = (event: Event) => {
  menu.value?.toggle(event);
};

const closeMenu = () => {
  menu.value?.hide?.();
};

const go = (name: string) => {
  closeMenu();
  router.push({ name });
};

const logout = async () => {
  closeMenu();
  await session.logout();
  router.replace({ name: "login" });
};

const currentYear = new Date().getFullYear();
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
        @click="toggleMenu"
      />
    </div>
  </header>

  <Menu ref="menu" :model="menuItems" :popup="true" class="w-72">
    <template #start>
      <div class="flex items-center gap-2 px-2 py-2">
        <img :src="HomeBonesLogo" alt="HomeBones Logo" class="h-8 w-8" />
        <span class="text-lg font-semibold">HomeBones</span>
      </div>
    </template>
    <template #item="{ item, props }">
      <a class="flex items-center gap-2" v-bind="props.action">
        <span :class="item.icon"></span>
        <span>{{ item.label }}</span>
      </a>
    </template>
    <template #end>
      <div class="flex flex-col gap-3 px-2 pb-2">
        <div class="flex items-center justify-between">
          <span class="text-bold text-lg text-surface-600">Theme</span>
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
        <p class="flex justify-center text-xs text-surface-400">&copy; {{ currentYear }} <a href="https://junipra.com" target="_blank" class="text-purple-400 ml-1">Junipra Web Services</a></p>
      </div>
    </template>
  </Menu>
</template>
