import { defineStore } from "pinia";
import { ref } from "vue";
import { db } from "@/firebase";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  collection,
  query,
  where,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export const useHomesStore = defineStore("homes", () => {
  const session = useSessionStore();

  const homeId = ref<string | null>(null);
  const loading = ref(false);

  const ensureHome = async (): Promise<string> => {
    if (!session.uid) throw new Error("Not signed in");
    if (homeId.value) return homeId.value;

    loading.value = true;
    try {
      const homesRef = collection(db, "homes");
      const q = query(homesRef, where("ownerId", "==", session.uid), limit(1));
      const snap = await getDocs(q);

      const first = snap.docs[0];
      if (first) {
        homeId.value = first.id;
        return first.id;
      }

      const docRef = await addDoc(homesRef, {
        ownerId: session.uid,
        name: "My Home",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      homeId.value = docRef.id;
      return homeId.value;
    } finally {
      loading.value = false;
    }
  };

  return { homeId, loading, ensureHome };
});
