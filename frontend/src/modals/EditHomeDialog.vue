<script setup lang="ts">
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Button from "primevue/button";

const visible = defineModel<boolean>("visible", { required: true });
const name = defineModel<string>("name", { required: true });

defineProps<{ loading: boolean }>();

defineEmits<{ (e: "save"): void }>();
</script>

<template>
  <Dialog v-model:visible="visible" modal header="Rename Home" :style="{ width: '25rem', maxWidth: '90vw' }">
    <div class="flex flex-col gap-4 mb-4">
      <label for="editName" class="font-semibold w-24">Name</label>
      <InputText id="editName" v-model="name" class="flex-auto" autocomplete="off" />
    </div>
    <div class="flex justify-end gap-2">
      <Button type="button" label="Cancel" severity="secondary" @click="visible = false"></Button>
      <Button type="button" label="Save" @click="$emit('save')" :loading="loading"></Button>
    </div>
  </Dialog>
</template>
