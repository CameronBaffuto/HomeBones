<script setup lang="ts">
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import type { ItemField } from "@/stores/useItemStore";

type ItemForm = {
  id: string;
  title: string;
  type: string;
  fields: ItemField[];
};

const visible = defineModel<boolean>("visible", { required: true });
const form = defineModel<ItemForm>("form", { required: true });

defineProps<{ isEditing: boolean; saving: boolean }>();

defineEmits<{
  (e: "add-field"): void;
  (e: "remove-field", index: number): void;
  (e: "save"): void;
}>();
</script>

<template>
  <Dialog
    v-model:visible="visible"
    modal
    :header="isEditing ? 'Edit Item' : 'New Item'"
    :style="{ width: '35rem', maxWidth: '90vw' }"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-4 sm:flex-row">
        <div class="flex-1 flex flex-col gap-1">
          <label class="text-sm font-semibold">Title</label>
          <InputText v-model="form.title" placeholder="e.g. Paint Color" />
        </div>
        <div class="w-full flex flex-col gap-1 sm:w-1/3">
          <label class="text-sm font-semibold">Type (Optional)</label>
          <InputText v-model="form.type" placeholder="e.g. Material" />
        </div>
      </div>

      <div class="border-t border-surface-200 my-1"></div>

      <div class="flex items-center justify-between">
        <span class="font-semibold text-sm">Details</span>
        <Button label="Add Detail" icon="pi pi-plus" size="small" text @click="$emit('add-field')" />
      </div>

      <div class="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
        <div v-for="(field, index) in form.fields" :key="index" class="flex gap-2 items-center">
          <InputText v-model="field.key" placeholder="Key (e.g. Brand)" class="flex-1" size="small" />
          <InputText v-model="field.value" placeholder="Value (e.g. Behr)" class="flex-1" size="small" />
          <Button icon="pi pi-trash" text severity="danger" size="small" @click="$emit('remove-field', index)" />
        </div>
        <div v-if="form.fields.length === 0" class="text-center py-4 text-sm text-surface-500 bg-surface-50 rounded">
          No details added.
        </div>
      </div>
    </div>
    <template #footer>
      <Button label="Cancel" severity="secondary" @click="visible = false" />
      <Button label="Save" @click="$emit('save')" :loading="saving" />
    </template>
  </Dialog>
</template>
