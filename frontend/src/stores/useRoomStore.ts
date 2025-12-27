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

export interface Room {
  id: string;
  homeId: string;
  ownerId: string;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const useRoomStore = defineStore("rooms", () => {
  const session = useSessionStore();

  const rooms = ref<Room[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchRooms = async (homeId: string) => {
    if (!session.uid) return;
    loading.value = true;
    error.value = null;
    try {
      const roomsRef = collection(db, "rooms");
      // Query by homeId to get rooms for this home.
      // Owner check is enforced by security rules, but good to have context.
      const q = query(
        roomsRef,
        where("homeId", "==", homeId),
        orderBy("createdAt", "asc")
      );
      const snap = await getDocs(q);
      rooms.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Room));
    } catch (e: any) {
      console.error("fetchRooms error", e);
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  const createRoom = async (homeId: string, name: string) => {
    if (!session.uid) throw new Error("Not signed in");
    loading.value = true;
    try {
      const roomsRef = collection(db, "rooms");
      await addDoc(roomsRef, {
        homeId,
        ownerId: session.uid,
        name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Refresh list
      await fetchRooms(homeId);
    } catch (e: any) {
      error.value = e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  };

  return { rooms, loading, error, fetchRooms, createRoom };
});
