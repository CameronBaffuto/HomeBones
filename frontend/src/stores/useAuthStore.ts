import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { auth } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

export const useAuthStore = defineStore("auth", () => {
  const mode = ref<"login" | "register">("login");
  const email = ref("");
  const password = ref("");
  const loading = ref(false);
  const error = ref<string | null>(null);

  const title = computed(() =>
    mode.value === "register" ? "Create your account" : "Welcome back"
  );

  const primaryLabel = computed(() =>
    mode.value === "register" ? "Create account" : "Sign in"
  );

  const setMode = (next: "login" | "register") => {
    mode.value = next;
    error.value = null;
  };

  const setEmail = (v: string | undefined) => {
    email.value = v ?? "";
    error.value = null;
  };

  const setPassword = (v: string | undefined) => {
    password.value = v ?? "";
    error.value = null;
  };

  const reset = () => {
    email.value = "";
    password.value = "";
    error.value = null;
    loading.value = false;
  };

  const submit = async () => {
    error.value = null;
    loading.value = true;

    try {
      const e = email.value.trim();
      const p = password.value;

      if (!e || !p) throw new Error("Enter your email and password.");

      if (mode.value === "register") {
        await createUserWithEmailAndPassword(auth, e, p);
      } else {
        await signInWithEmailAndPassword(auth, e, p);
      }

      reset();
    } catch (err: any) {
      error.value = err?.message ?? "Authentication error";
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    mode,
    email,
    password,
    loading,
    error,
    title,
    primaryLabel,
    setMode,
    setEmail,
    setPassword,
    reset,
    submit,
  };
});
