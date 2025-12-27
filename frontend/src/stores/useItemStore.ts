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
  orderBy,
  Timestamp,
} from "firebase/firestore";

export interface ItemField {
  key: string;
  value: string;
}

export interface Item {
  id: string;
  homeId: string;
  roomId: string;
  ownerId: string;
  title: string;
  type?: string;
  fields: ItemField[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const useItemStore = defineStore("items", () => {
  const session = useSessionStore();

  const items = ref<Item[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchItems = async (roomId: string) => {
    if (!session.uid) return;
    loading.value = true;
    error.value = null;
    try {
      const itemsRef = collection(db, "items");
      const q = query(
        itemsRef,
        where("roomId", "==", roomId),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      items.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Item));
    } catch (e: any) {
      console.error("fetchItems error", e);
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  const createItem = async (
    homeId: string,
    roomId: string,
    title: string,
    fields: ItemField[] = [],
    type?: string
  ) => {
    if (!session.uid) throw new Error("Not signed in");
    loading.value = true;
    try {
      const itemsRef = collection(db, "items");
      await addDoc(itemsRef, {
        homeId,
        roomId,
        ownerId: session.uid,
        title,
        type: type || null,
        fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Refresh list
      await fetchItems(roomId);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return { items, loading, error, fetchItems, createItem };
});
