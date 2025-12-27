import { defineStore } from "pinia";
import { ref } from "vue";

export type ModalKey = "createHome" | "editHome" | "createRoom" | "editRoom" | "item";

export const useModalStore = defineStore("modals", () => {
  const createHome = ref(false);
  const editHome = ref(false);
  const createRoom = ref(false);
  const editRoom = ref(false);
  const item = ref(false);

  const modals = { createHome, editHome, createRoom, editRoom, item };

  const open = (key: ModalKey) => {
    modals[key].value = true;
  };

  const close = (key: ModalKey) => {
    modals[key].value = false;
  };

  const closeAll = () => {
    Object.values(modals).forEach(modal => {
      modal.value = false;
    });
  };

  return { createHome, editHome, createRoom, editRoom, item, open, close, closeAll };
});
