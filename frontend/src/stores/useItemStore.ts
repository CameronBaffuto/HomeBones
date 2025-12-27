import { defineStore } from "pinia";
import { ref } from "vue";
import { db } from "@/firebase";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  orderBy,
  Timestamp,
  doc,
  deleteDoc,
  updateDoc
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
        where("ownerId", "==", session.uid),
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
      const newDocRef = doc(itemsRef);
      const now = Timestamp.now();

      const newItem: Item = {
        id: newDocRef.id,
        homeId,
        roomId,
        ownerId: session.uid,
        title,
        type: type || undefined,
        fields,
        createdAt: now,
        updatedAt: now,
      };

      items.value.unshift(newItem);

      setDoc(newDocRef, {
        homeId,
        roomId,
        ownerId: session.uid,
        title,
        type: type || null,
        fields,
        createdAt: now,
        updatedAt: now,
      }).catch(err => {
          console.error(err);
          error.value = "Failed to create item";
      });

    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  const updateItem = async (itemId: string, data: Partial<Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'homeId' | 'roomId'>>) => {
      if (!session.uid) return;
      const idx = items.value.findIndex(i => i.id === itemId);
      if (idx !== -1) {
          items.value[idx] = { ...items.value[idx], ...data } as Item;
      }
      
      const docRef = doc(db, "items", itemId);
      updateDoc(docRef, {
          ...data,
          updatedAt: Timestamp.now()
      }).catch(err => {
          console.error("Failed to update item:", err);
          error.value = "Failed to update item";
      });
  };

  const deleteItem = async (itemId: string) => {
      if (!session.uid) return;
      items.value = items.value.filter(i => i.id !== itemId);
      const docRef = doc(db, "items", itemId);
      deleteDoc(docRef).catch(err => {
          console.error("Failed to delete item:", err);
          error.value = "Failed to delete item";
      });
  };

  return { items, loading, error, fetchItems, createItem, updateItem, deleteItem };
});
