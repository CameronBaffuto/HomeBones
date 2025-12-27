import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { auth } from "@/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

export const useSessionStore = defineStore("session", () => {
  const user = ref<User | null>(null);
  const ready = ref(false);

  const uid = computed(() => user.value?.uid ?? null);
  const isAuthed = computed(() => !!user.value);

  let unsub: (() => void) | null = null;

  const init = () => {
    if (unsub) return;
    unsub = onAuthStateChanged(auth, (u) => {
      user.value = u;
      ready.value = true;
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { 
    user, 
    ready, 
    uid, 
    isAuthed, 
    init, 
    logout 
 };
});