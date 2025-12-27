<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "@/views/AppLayout.vue";
import { useHomesStore } from "@/stores/useHomeStore";
import { useRoomStore } from "@/stores/useRoomStore";
import { useItemStore, type Item, type ItemField } from "@/stores/useItemStore";

import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Card from "primevue/card";
import Menu from "primevue/menu";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";
import Tag from "primevue/tag";

const route = useRoute();
const router = useRouter();
const homesStore = useHomesStore();
const roomStore = useRoomStore();
const itemStore = useItemStore();
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

const goBack = () => {
    if (homeId.value) {
        router.push({ name: 'home-details', params: { homeId: homeId.value } });
    } else {
        router.push({ name: 'home' });
    }
};

// Item Form State
const showItemDialog = ref(false);
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
    showItemDialog.value = true;
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
    showItemDialog.value = true;
};

const addField = () => {
    itemForm.value.fields.push({ key: "", value: "" });
};

const removeField = (index: number) => {
    itemForm.value.fields.splice(index, 1);
};

const saveItem = async () => {
    if (!itemForm.value.title.trim()) return;
    
    // Filter empty fields
    const fieldsToSave = itemForm.value.fields.filter(f => f.key.trim() || f.value.trim());

    savingItem.value = true;
    try {
        if (isEditing.value) {
            await itemStore.updateItem(itemForm.value.id, {
                title: itemForm.value.title,
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
                itemForm.value.title,
                fieldsToSave,
                itemForm.value.type
            );
            toast.add({ severity: 'success', summary: 'Created', detail: 'Item created', life: 3000 });
        }
        showItemDialog.value = false;
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

</script>

<template>
  <AppLayout>
    <div class="space-y-6 w-full max-w-4xl mx-auto p-4">
        
        <div class="mb-2">
            <Button 
                label="Back to Home" 
                icon="pi pi-arrow-left" 
                text 
                size="small" 
                class="p-0 text-surface-500 hover:text-primary-600" 
                @click="goBack" 
            />
        </div>

        <div class="flex items-center justify-between">
             <div>
                  <h1 class="text-2xl font-bold text-surface-900">{{ roomName }}</h1>
                  <p class="text-surface-600 text-sm">Items in this room</p>
              </div>
              <Button label="New Item" icon="pi pi-plus" @click="openCreateItemDialog" />
        </div>

        <div v-if="itemStore.loading" class="text-center py-8">
             <i class="pi pi-spin pi-spinner text-2xl text-surface-500"></i>
        </div>

        <div v-else-if="itemStore.items.length === 0" class="text-center py-12 bg-surface-50 rounded-xl border border-dashed border-surface-200">
             <p class="text-surface-600 mb-2">No items yet.</p>
             <Button label="Add your first item" text @click="openCreateItemDialog" />
        </div>

        <div v-else class="flex flex-col gap-4">
            <Card v-for="item in itemStore.items" :key="item.id" class="border border-surface-200 shadow-none relative group">
                <template #content>
                    <div class="flex justify-between items-start">
                        <div class="space-y-2 w-full">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <span class="font-semibold text-lg">{{ item.title }}</span>
                                    <Tag v-if="item.type" :value="item.type" severity="secondary" class="text-xs" />
                                </div>
                                <Button 
                                    icon="pi pi-ellipsis-v" 
                                    text 
                                    rounded 
                                    severity="secondary" 
                                    class="opacity-0 group-hover:opacity-100 transition-opacity" 
                                    @click="toggleMenu($event, item)" 
                                />
                            </div>

                            <div v-if="item.fields.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-2">
                                <div v-for="(field, idx) in item.fields" :key="idx" class="text-sm border-b border-surface-100 last:border-0 pb-1">
                                    <span class="text-surface-500 mr-2">{{ field.key }}:</span>
                                    <span class="text-surface-900">{{ field.value }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Card>
        </div>
    </div>

    <!-- Item Dialog -->
    <Dialog v-model:visible="showItemDialog" modal :header="isEditing ? 'Edit Item' : 'New Item'" :style="{ width: '35rem' }">
        <div class="flex flex-col gap-4">
            <div class="flex gap-4">
                 <div class="flex-1 flex flex-col gap-1">
                    <label class="text-sm font-semibold">Title</label>
                    <InputText v-model="itemForm.title" placeholder="e.g. Paint Color" />
                 </div>
                 <div class="w-1/3 flex flex-col gap-1">
                    <label class="text-sm font-semibold">Type (Optional)</label>
                    <InputText v-model="itemForm.type" placeholder="e.g. Material" />
                 </div>
            </div>

            <div class="border-t border-surface-200 my-1"></div>
            
            <div class="flex items-center justify-between">
                <span class="font-semibold text-sm">Details</span>
                <Button label="Add Detail" icon="pi pi-plus" size="small" text @click="addField" />
            </div>

            <div class="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-1">
                <div v-for="(field, index) in itemForm.fields" :key="index" class="flex gap-2 items-center">
                    <InputText v-model="field.key" placeholder="Key (e.g. Brand)" class="flex-1" size="small" />
                    <InputText v-model="field.value" placeholder="Value (e.g. Behr)" class="flex-1" size="small" />
                    <Button icon="pi pi-trash" text severity="danger" size="small" @click="removeField(index)" />
                </div>
                <div v-if="itemForm.fields.length === 0" class="text-center py-4 text-sm text-surface-500 bg-surface-50 rounded">
                    No details added.
                </div>
            </div>
        </div>
        <template #footer>
            <Button label="Cancel" severity="secondary" @click="showItemDialog = false" />
            <Button label="Save" @click="saveItem" :loading="savingItem" />
        </template>
    </Dialog>
    
    <Menu ref="menu" :model="menuItems" :popup="true" />
    <ConfirmDialog />
  </AppLayout>
</template>
