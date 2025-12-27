import { defineStore } from "pinia";
import { ref } from "vue";
import { db } from "@/firebase";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  orderBy
} from "firebase/firestore";

export interface Home {
  id: string;
  ownerId: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const useHomesStore = defineStore("homes", () => {
  const session = useSessionStore();

  const homes = ref<Home[]>([]);
  const currentHome = ref<Home | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchHomes = async () => {
    if (!session.uid) return;
    loading.value = true;
    error.value = null;
    try {
      const homesRef = collection(db, "homes");
      const q = query(
        homesRef, 
        where("ownerId", "==", session.uid), 
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      homes.value = snap.docs.map(d => ({ id: d.id, ...d.data() } as Home));
    } catch (e: any) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  const createHome = async (name: string) => {
    if (!session.uid) throw new Error("Not signed in");
    loading.value = true;
    try {
      const homesRef = collection(db, "homes");
      const now = serverTimestamp();
      
      const docRef = await addDoc(homesRef, {
        ownerId: session.uid,
        name,
        createdAt: now,
        updatedAt: now,
      });

      // Optimistic update: Add to local state immediately
      // Note: serverTimestamp() returns a FieldValue, which isn't directly readable as a Date until fetched.
      // For display purposes, we can approximate it or re-fetch in background.
      const newHome: Home = {
        id: docRef.id,
        ownerId: session.uid,
        name,
        createdAt: Timestamp.now(), // Approximate for immediate display
        updatedAt: Timestamp.now(),
      };
      
      homes.value.unshift(newHome);
      
      return docRef.id;
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const selectHome = async (homeId: string) => {
      // If we already have the home in our list, use it
      const found = homes.value.find(h => h.id === homeId);
      if (found) {
          currentHome.value = found;
          return;
      }
      
      // Otherwise fetch it (e.g. direct navigation)
      loading.value = true;
      try {
          const docRef = doc(db, "homes", homeId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
              currentHome.value = { id: snap.id, ...snap.data() } as Home;
          } else {
              error.value = "Home not found";
              currentHome.value = null;
          }
      } catch(e: any) {
          error.value = e.message;
      } finally {
          loading.value = false;
      }
  }

  return { homes, currentHome, loading, error, fetchHomes, createHome, selectHome };
});
