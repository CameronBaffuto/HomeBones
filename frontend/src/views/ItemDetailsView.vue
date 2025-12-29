<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "@/views/AppLayout.vue";
import { useRoomStore } from "@/stores/useRoomStore";
import { useItemStore, type ItemField } from "@/stores/useItemStore";
import { useModalStore } from "@/stores/useModalStore";
import ItemEditorDrawer from "@/modals/ItemEditorDrawer.vue";
import Button from "primevue/button";
import { useToast } from "primevue/usetoast";

const route = useRoute();
const router = useRouter();
const roomStore = useRoomStore();
const itemStore = useItemStore();
const modalStore = useModalStore();
const toast = useToast();

const roomId = computed(() => route.params.roomId as string);
const itemId = computed(() => route.params.itemId as string);

const item = computed(() =>
  itemStore.items.find(storedItem => storedItem.id === itemId.value)
);

const detailFields = computed(() => {
  if (!item.value) return [];
  return item.value.fields
    .filter(field => field.key.trim() || field.value.trim())
    .map(field => ({
      key: field.key.trim(),
      value: field.value.trim()
    }));
});

const roomName = computed(() => {
  return roomStore.rooms.find(room => room.id === roomId.value)?.name ?? "Room";
});

const isEditing = ref(false);
const savingItem = ref(false);
const itemForm = ref({
  id: "",
  title: "",
  type: "",
  fields: [] as ItemField[]
});

const isEmptyRow = (field: ItemField) => !field.key.trim() && !field.value.trim();

const openEditItem = () => {
  if (!item.value) return;
  isEditing.value = true;
  itemForm.value = {
    id: item.value.id,
    title: item.value.title,
    type: item.value.type ?? "",
    fields: item.value.fields.map(field => ({ ...field }))
  };
  modalStore.open("item");
};

const goBack = () => {
  router.back();
};

const saveItem = async () => {
  if (!itemForm.value.title.trim()) return;
  if (itemForm.value.fields.some(field => isEmptyRow(field))) return;

  const fieldsToSave = itemForm.value.fields.filter(
    field => field.key.trim() || field.value.trim()
  );

  savingItem.value = true;
  try {
    await itemStore.updateItem(itemForm.value.id, {
      title: itemForm.value.title.trim(),
      type: itemForm.value.type,
      fields: fieldsToSave.map(field => ({
        key: field.key.trim(),
        value: field.value.trim()
      }))
    });
    modalStore.close("item");
    toast.add({ severity: "success", summary: "Updated", detail: "Item updated", life: 3000 });
  } catch (e: any) {
    console.error(e);
    toast.add({ severity: "error", summary: "Error", detail: e.message });
  } finally {
    savingItem.value = false;
  }
};

const fetchItem = async () => {
  if (!itemId.value) return;
  await itemStore.fetchItem(itemId.value);
};

onMounted(fetchItem);

watch(itemId, () => {
  fetchItem();
});
</script>

<template>
  <AppLayout>
    <div class="space-y-6 w-full max-w-3xl mx-auto p-4">
      <Button @click="goBack" label="Back" variant="text" size="small" icon="pi pi-arrow-left" />

      <div class="flex flex-row gap-3 items-center justify-between">
        <div>
          <p class="text-sm text-surface-500">{{ roomName }}</p>
          <h1 class="text-2xl font-bold text-surface-900">
            {{ item?.title ?? "Item" }}
          </h1>
        </div>
        <Button icon="pi pi-pencil" variant="text" @click="openEditItem" :disabled="!item" />
      </div>

      <div v-if="!itemStore.loading && item && detailFields.length > 0" class="space-y-4">
        <div
          v-for="(field, idx) in detailFields"
          :key="idx"
          class="border-b border-surface-200 pb-3 last:border-b-0"
        >
          <div class="text-xs font-semibold uppercase tracking-wide text-surface-500">
            {{ field.key || "Label" }}
          </div>
          <div class="text-base text-surface-900">
            {{ field.value || "—" }}
          </div>
        </div>
      </div>

      <div
        v-else-if="!itemStore.loading && !item"
        class="rounded-xl border border-dashed border-surface-200 bg-surface-50 p-6 text-center"
      >
        <p class="text-surface-600">Item not found.</p>
      </div>

      <div
        v-else-if="!itemStore.loading"
        class="rounded-xl border border-dashed border-surface-200 bg-surface-50 p-6 text-center"
      >
        <p class="text-surface-600 mb-3">No details added yet.</p>
        <Button label="Add details" icon="pi pi-plus" @click="openEditItem" :disabled="!item" />
      </div>

      <div v-else class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-2xl text-surface-500"></i>
      </div>
    </div>

    <ItemEditorDrawer
      v-model:visible="modalStore.item"
      v-model:form="itemForm"
      :is-editing="isEditing"
      :saving="savingItem"
      @save="saveItem"
    />
  </AppLayout>
</template>
