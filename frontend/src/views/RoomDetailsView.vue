<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "@/views/AppLayout.vue";
import { useHomesStore } from "@/stores/useHomeStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useItemStore, type Item, type ItemField } from "@/stores/useItemStore";
import { useModalStore } from "@/stores/useModalStore";
import ItemEditorDrawer from "@/modals/ItemEditorDrawer.vue";

import Button from "primevue/button";
import Breadcrumb from "primevue/breadcrumb";
import Card from "primevue/card";
import Menu from "primevue/menu";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

const route = useRoute();
const homesStore = useHomesStore();
const router = useRouter();
const roomStore = useRoomStore();
const itemStore = useItemStore();
const modalStore = useModalStore();
const confirm = useConfirm();
const toast = useToast();

const roomId = route.params.roomId as string;
// We assume context is already available via stores, but we might need to fetch if direct link.
// For now, let's just fetch items. If we need home/room context names, we'd need to fetch those too.
// Since roomStore has the rooms list if we navigated from home, we try to find it.

const roomName = computed(() => {
    return roomStore.rooms.find(r => r.id === roomId)?.name ?? "Room";
});

const homeId = computed(() => {
    return roomStore.rooms.find(r => r.id === roomId)?.homeId;
});

const breadcrumbHome = computed(() => ({
    icon: "pi pi-home",
    route: { name: "home" }
}));

const breadcrumbItems = computed(() => {
    const items = [];
    const homeLabel = homesStore.currentHome?.name ?? "Home";
    if (homeId.value) {
        items.push({
            label: homeLabel,
            route: { name: "home-details", params: { homeId: homeId.value } }
        });
    } else {
        items.push({ label: homeLabel });
    }
    items.push({ label: roomName.value });
    return items;
});

// Item Form State
const isEditing = ref(false);
const savingItem = ref(false);
const itemForm = ref({
    id: "",
    title: "",
    type: "",
    fields: [] as ItemField[]
});

const menu = ref();
const selectedItem = ref<Item | null>(null);

const menuItems = ref([
    {
        label: 'Options',
        items: [
            {
                label: 'Edit',
                icon: 'pi pi-pencil',
                command: () => {
                    if (selectedItem.value) openEditItemDialog(selectedItem.value);
                }
            },
            {
                label: 'Delete',
                icon: 'pi pi-trash',
                class: 'text-red-500',
                command: () => {
                    if (selectedItem.value) confirmDeleteItem(selectedItem.value);
                }
            }
        ]
    }
]);

onMounted(() => {
    itemStore.fetchItems(roomId);
    // If roomStore is empty (direct nav), we might want to fetch room details here. 
    // For MVP, we'll skip fetching the specific room detail if missing and just show "Room".
});

const openCreateItemDialog = () => {
    isEditing.value = false;
    itemForm.value = { id: "", title: "", type: "", fields: [] };
    modalStore.open("item");
};

const openEditItemDialog = (item: Item) => {
    isEditing.value = true;
    // Clone fields deeply
    itemForm.value = {
        id: item.id,
        title: item.title,
        type: item.type ?? "",
        fields: item.fields.map(f => ({ ...f }))
    };
    modalStore.open("item");
};

const isEmptyRow = (field: ItemField) => !field.key.trim() && !field.value.trim();

const saveItem = async () => {
    if (!itemForm.value.title.trim()) return;
    if (itemForm.value.fields.some(field => isEmptyRow(field))) return;
    
    // Filter empty fields
    const fieldsToSave = itemForm.value.fields
        .filter(field => field.key.trim() || field.value.trim())
        .map(field => ({
            key: field.key.trim(),
            value: field.value.trim()
        }));

    savingItem.value = true;
    try {
        if (isEditing.value) {
            await itemStore.updateItem(itemForm.value.id, {
                title: itemForm.value.title.trim(),
                type: itemForm.value.type,
                fields: fieldsToSave
            });
            toast.add({ severity: 'success', summary: 'Updated', detail: 'Item updated', life: 3000 });
        } else {
            // Need homeId... if we navigated directly, we might not have it.
            // But we can get it from the room if we fetched room details. 
            // Or assume user flow: Dashboard -> Home -> Room -> Item.
            // If direct link, creating item might fail if we don't know homeId.
            // For now, let's grab it from currentHome if available, or fail gracefully.
            const homeId = homesStore.currentHome?.id; 
            if (!homeId) {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Cannot create item: Home context lost. Please navigate from Dashboard.' });
                return;
            }
            
            await itemStore.createItem(
                homeId,
                roomId,
                itemForm.value.title.trim(),
                fieldsToSave,
                itemForm.value.type
            );
            toast.add({ severity: 'success', summary: 'Created', detail: 'Item created', life: 3000 });
        }
        modalStore.close("item");
    } catch (e: any) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error', detail: e.message });
    } finally {
        savingItem.value = false;
    }
};

const toggleMenu = (event: Event, item: Item) => {
    selectedItem.value = item;
    menu.value.toggle(event);
};

const confirmDeleteItem = (item: Item) => {
    confirm.require({
        message: `Delete "${item.title}"?`,
        header: 'Delete Item',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger'
        },
        accept: () => {
            itemStore.deleteItem(item.id);
            toast.add({ severity: 'info', summary: 'Deleted', detail: 'Item deleted', life: 3000 });
        }
    });
};

const detailPreview = (item: Item) => {
    const previewFields = item.fields
        .filter(field => field.key.trim() || field.value.trim())
        .slice(0, 2);

    if (previewFields.length === 0) {
        return "No details yet";
    }

    return previewFields
        .map(field => {
            const label = field.key.trim();
            const value = field.value.trim();
            if (label && value) return `${label}: ${value}`;
            return label || value;
        })
        .join(" \u00b7 ");
};

const goToItem = (itemId: string) => {
    router.push({ name: "item-details", params: { roomId, itemId } });
};

</script>

<template>
  <AppLayout>
    <div class="space-y-6 w-full max-w-4xl mx-auto p-4">
        <div class="mb-2">
            <Breadcrumb :home="breadcrumbHome" :model="breadcrumbItems" 
            :pt="{
                root: {
                    class: 'bg-transparent! text-sm p-0 m-0'
                },
            }">
                <template #item="{ item, props }">
                    <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
                        <a :href="href" v-bind="props.action" @click="navigate">
                            <span v-if="item.icon" :class="[item.icon, 'text-color']" />
                            <span class="text-surface-600">{{ item.label }}</span>
                        </a>
                    </router-link>
                    <span v-else v-bind="props.action" class="text-surface-700 dark:text-surface-0">
                        {{ item.label }}
                    </span>
                </template>
            </Breadcrumb>
        </div>
        <div class="flex items-center justify-between">
            <div>
                <h1 class="text-2xl font-bold text-surface-900">{{ roomName }}</h1>
            </div>
              <Button icon="pi pi-plus" rounded @click="openCreateItemDialog" />
        </div>

        <div v-if="itemStore.loading" class="text-center py-8">
             <i class="pi pi-spin pi-spinner text-2xl text-surface-500"></i>
        </div>

        <div v-else-if="itemStore.items.length === 0" class="text-center py-12 bg-surface-50 rounded-xl border border-dashed border-surface-200">
             <p class="text-surface-600 mb-2">No items yet.</p>
             <Button label="Add your first item" text @click="openCreateItemDialog" />
        </div>

        <div v-else class="flex flex-col gap-4">
            <Card
                v-for="item in itemStore.items"
                :key="item.id"
                class="border border-surface-200 shadow-none relative group cursor-pointer"
                @click="goToItem(item.id)"
            >
                <template #content>
                    <div class="flex justify-between items-start gap-3">
                        <div class="space-y-2 w-full">
                            <div class="flex items-center justify-between gap-2">
                                <span class="font-semibold text-lg">{{ item.title }}</span>
                                <Button 
                                    icon="pi pi-ellipsis-v" 
                                    text 
                                    rounded 
                                    severity="secondary" 
                                    class="opacity-0 group-hover:opacity-100 transition-opacity" 
                                    @click.stop="toggleMenu($event, item)" 
                                />
                            </div>
                            <p class="text-sm text-surface-600">
                                {{ detailPreview(item) }}
                            </p>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>

    <ItemEditorDrawer
      v-model:visible="modalStore.item"
      v-model:form="itemForm"
      :is-editing="isEditing"
      :saving="savingItem"
      @save="saveItem"
    />
    
    <Menu ref="menu" :model="menuItems" :popup="true" />
    <ConfirmDialog />
  </AppLayout>
</template>
