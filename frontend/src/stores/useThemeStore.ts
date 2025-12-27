import { defineStore } from "pinia";
import { ref, computed } from "vue";

type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "homebones_theme";

export const useThemeStore = defineStore("theme", () => {
  const mode = ref<ThemeMode>("system");

  const systemPrefersDark = () =>
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ?? false;

  const resolved = computed<"light" | "dark">(() => {
    if (mode.value === "system") return systemPrefersDark() ? "dark" : "light";
    return mode.value;
  });

  const apply = () => {
    const isDark = resolved.value === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  };

  const init = () => {
    const saved = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? "system";
    mode.value = saved;

    if (window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener?.("change", () => {
          if (mode.value === "system") apply();
        });
    }

    apply();
  };

  const setMode = (next: ThemeMode) => {
    mode.value = next;
    localStorage.setItem(STORAGE_KEY, next);
    apply();
  };

  const toggle = () => {
    setMode(resolved.value === "dark" ? "light" : "dark");
  };

  return { mode, resolved, init, setMode, toggle };
});
