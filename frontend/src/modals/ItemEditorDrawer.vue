<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import Drawer from "primevue/drawer";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import type { ItemField } from "@/stores/useItemStore";

type ItemForm = {
  id: string;
  title: string;
  type?: string;
  fields: ItemField[];
};

const visible = defineModel<boolean>("visible", { required: true });
const form = defineModel<ItemForm>("form", { required: true });

const props = defineProps<{ isEditing: boolean; saving: boolean }>();

defineEmits<{ (e: "save"): void }>();

const isEmptyRow = (field: ItemField) =>
  !field.key.trim() && !field.value.trim();

const hasEmptyRow = computed(() =>
  form.value.fields.some(field => isEmptyRow(field))
);

const canAddDetail = computed(() => !hasEmptyRow.value);

const canSave = computed(() =>
  form.value.title.trim().length > 0 && !hasEmptyRow.value
);

const showTitleEditor = ref(false);
const draftTitle = ref("");

const labelRefs = ref<any[]>([]);
const listEndRef = ref<HTMLElement | null>(null);

const setLabelRef = (index: number) => (el: any) => {
  labelRefs.value[index] = el;
};

const focusLabel = (index: number) => {
  const target = labelRefs.value[index];
  if (target?.focus) {
    target.focus();
  }
};

const addDetail = async () => {
  if (!canAddDetail.value) return;
  form.value.fields.push({ key: "", value: "" });
  await nextTick();
  focusLabel(form.value.fields.length - 1);
  listEndRef.value?.scrollIntoView({ behavior: "smooth", block: "end" });
};

const removeDetail = (index: number) => {
  form.value.fields.splice(index, 1);
};

const openTitleEditor = () => {
  draftTitle.value = form.value.title;
  showTitleEditor.value = true;
};

const saveTitle = () => {
  form.value.title = draftTitle.value.trim();
  showTitleEditor.value = false;
};

const cancelTitleEdit = () => {
  showTitleEditor.value = false;
  if (!props.isEditing && !form.value.title.trim()) {
    visible.value = false;
  }
};

const showEditor = computed(() => visible.value && !showTitleEditor.value);

watch(
  () => visible.value,
  (isOpen) => {
    if (!isOpen) return;
    if (!props.isEditing && !form.value.title.trim()) {
      openTitleEditor();
    }
  }
);

const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;

const updateIsMobile = () => {
  if (!mediaQuery) return;
  isMobile.value = mediaQuery.matches;
};

onMounted(() => {
  if (typeof window === "undefined") return;
  mediaQuery = window.matchMedia("(max-width: 640px)");
  updateIsMobile();
  mediaQuery.addEventListener("change", updateIsMobile);
});

onBeforeUnmount(() => {
  if (!mediaQuery) return;
  mediaQuery.removeEventListener("change", updateIsMobile);
});

const headerTitle = computed(() => form.value.title.trim() || "Item");
</script>

<template>
  <Drawer
    v-if="showEditor && isMobile"
    v-model:visible="visible"
    position="bottom"
    :closable="false"
    :style="{ height: '70vh' }"
  >
    <template #header>
      <div class="flex w-full items-center justify-between gap-2">
        <button
          type="button"
          class="text-base font-semibold text-surface-900 hover:text-primary-600 cursor-pointer"
          @click="openTitleEditor"
        >
          {{ props.isEditing ? headerTitle : "New item" }}
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-3">
        <div
          v-for="(field, index) in form.fields"
          :key="index"
          class="flex flex-col gap-2 rounded-lg p-3 sm:flex-row sm:items-center"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1">
            <InputText
              v-model="field.key"
              placeholder="Label"
              class="w-full sm:flex-1"
              :ref="setLabelRef(index)"
            />
            <InputText v-model="field.value" placeholder="Value" class="w-full sm:flex-1" />
          </div>
          <div class="flex justify-end sm:ml-auto">
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              aria-label="Remove detail"
              @click="removeDetail(index)"
            />
          </div>
          <hr v-if="index < form.fields.length - 1" class="my-2 border-gray-600" />
        </div>

        <div
          v-if="form.fields.length === 0"
          class="rounded-lg border border-dashed border-surface-200 bg-surface-50 p-4 text-center text-sm text-surface-500"
        >
          No details added yet.
        </div>
        <div ref="listEndRef" class="h-0"></div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <div>
          <Button
            label="Add detail"
            icon="pi pi-plus"
            size="small"
            text
            :disabled="!canAddDetail"
            @click="addDetail"
          />
        </div>
        <div>
          <Button
            label="Cancel"
            size="small"
            severity="secondary"
            @click="(visible = false)"
            class="mx-1"
          />
          <Button
            label="Save"
            size="small"
            :loading="props.saving"
            :disabled="!canSave"
            @click="$emit('save')"
            class="mx-1"
          />
        </div>
      </div>
    </template>
  </Drawer>

  <Dialog
    v-else-if="showEditor"
    v-model:visible="visible"
    modal
    :closable="true"
    :style="{ width: '50rem', maxWidth: '90vw' }"
  >
    <template #header>
      <div class="flex w-full items-center justify-between gap-2">
        <button
          type="button"
          class="text-base font-semibold text-surface-900 hover:text-primary-600 cursor-pointer"
          @click="openTitleEditor"
        >
          {{ props.isEditing ? headerTitle : "New item" }}
        </button>
      </div>
    </template>

    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-3">
        <div
          v-for="(field, index) in form.fields"
          :key="index"
          class="flex flex-col gap-2 rounded-lg p-3 sm:flex-row sm:items-center"
        >
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1">
            <InputText
              v-model="field.key"
              placeholder="Label"
              class="w-full sm:flex-1"
              :ref="setLabelRef(index)"
            />
            <InputText v-model="field.value" placeholder="Value" class="w-full sm:flex-1" />
          </div>
          <div class="flex justify-end sm:ml-auto">
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              aria-label="Remove detail"
              @click="removeDetail(index)"
            />
          </div>
        </div>

        <div
          v-if="form.fields.length === 0"
          class="rounded-lg border border-dashed border-surface-200 bg-surface-50 p-4 text-center text-sm text-surface-500"
        >
          No details added yet.
        </div>
        <div ref="listEndRef" class="h-0"></div>
      </div>
    </div>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <div>
          <Button
            label="Add detail"
            icon="pi pi-plus"
            size="small"
            text
            :disabled="!canAddDetail"
            @click="addDetail"
          />
        </div>
        <div>
          <Button
            label="Cancel"
            size="small"
            outlined
            severity="secondary"
            @click="(visible = false)"
            class="mx-1"
          />
          <Button
            label="Save"
            size="small"
            :loading="props.saving"
            :disabled="!canSave"
            @click="$emit('save')"
            class="mx-1"
          />
        </div>
      </div>
    </template>
  </Dialog>

  <Dialog v-model:visible="showTitleEditor" modal :style="{ width: '24rem', maxWidth: '90vw' }">
    <template #header>
      <div class="text-base font-semibold text-surface-900">Edit item name</div>
    </template>
    <div class="flex flex-col gap-3">
      <label class="text-sm font-semibold text-surface-700">Item name</label>
      <InputText v-model="draftTitle" placeholder="e.g. Wall paint" />
    </div>
    <template #footer>
      <div class="flex w-full items-center justify-end gap-2">
        <Button label="Cancel" size="small" severity="secondary" outlined @click="cancelTitleEdit" />
        <Button label="Save" size="small" @click="saveTitle" />
      </div>
    </template>
  </Dialog>
</template>
