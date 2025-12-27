<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppLayout from "@/views/AppLayout.vue";
import { useHomesStore } from "@/stores/useHomeStore";
import { useRoomStore, type Room } from "@/stores/useRoomStore";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Card from "primevue/card";
import Menu from "primevue/menu";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";
import { useToast } from "primevue/usetoast";

const route = useRoute();
const router = useRouter();
const homesStore = useHomesStore();
const roomStore = useRoomStore();
const confirm = useConfirm();
const toast = useToast();

const homeId = route.params.homeId as string;

const showCreateRoomDialog = ref(false);
const newRoomName = ref("");
const creatingRoom = ref(false);

const showEditRoomDialog = ref(false);
const editingRoomId = ref<string | null>(null);
const editRoomName = ref("");
const editingRoom = ref(false);

const menu = ref();
const selectedRoom = ref<Room | null>(null);

const menuItems = ref([
    {
        label: 'Options',
        items: [
            {
                label: 'Rename',
                icon: 'pi pi-pencil',
                command: () => {
                    if (selectedRoom.value) openEditRoomDialog(selectedRoom.value);
                }
            },
            {
                label: 'Delete',
                icon: 'pi pi-trash',
                class: 'text-red-500',
                command: () => {
                    if (selectedRoom.value) confirmDeleteRoom(selectedRoom.value);
                }
            }
        ]
    }
]);

onMounted(async () => {
    if (homeId) {
        await homesStore.selectHome(homeId);
        if (homesStore.currentHome) {
            roomStore.fetchRooms(homeId);
        }
    }
});

const openCreateRoomDialog = () => {
    newRoomName.value = "";
    showCreateRoomDialog.value = true;
};

const createRoom = async () => {
    if (!newRoomName.value.trim()) return;
    creatingRoom.value = true;
    try {
        await roomStore.createRoom(homeId, newRoomName.value);
        showCreateRoomDialog.value = false;
    } catch (e) {
        console.error(e);
    } finally {
        creatingRoom.value = false;
    }
};

const toggleMenu = (event: Event, room: Room) => {
    selectedRoom.value = room;
    menu.value.toggle(event);
};

const openEditRoomDialog = (room: Room) => {
    editingRoomId.value = room.id;
    editRoomName.value = room.name;
    showEditRoomDialog.value = true;
};

const saveEditRoom = async () => {
    if (!editingRoomId.value || !editRoomName.value.trim()) return;
    editingRoom.value = true;
    try {
        await roomStore.updateRoom(editingRoomId.value, editRoomName.value);
        showEditRoomDialog.value = false;
        toast.add({ severity: 'success', summary: 'Updated', detail: 'Room renamed successfully', life: 3000 });
    } finally {
        editingRoom.value = false;
    }
};

const confirmDeleteRoom = (room: Room) => {
    confirm.require({
        message: `Are you sure you want to delete "${room.name}"? All items in this room will be inaccessible.`,
        header: 'Delete Room',
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
            roomStore.deleteRoom(room.id);
            toast.add({ severity: 'info', summary: 'Deleted', detail: 'Room deleted', life: 3000 });
        }
    });
};

const goToRoom = (roomId: string) => {
    router.push({ name: 'room-details', params: { roomId } });
};

</script>

<template>
  <AppLayout>
    <div class="space-y-6 w-full max-w-4xl mx-auto p-4">
      
      <!-- Header / Loading State -->
      <div v-if="homesStore.loading" class="text-center py-8">
         <i class="pi pi-spin pi-spinner text-2xl text-surface-500"></i>
      </div>

      <div v-else-if="!homesStore.currentHome" class="text-center py-8 text-red-500">
          Home not found or access denied. <br/>
          <span v-if="homesStore.error" class="text-sm text-surface-600">Error: {{ homesStore.error }}</span>
      </div>

      <div v-else>
          <div class="mb-4">
              <Button 
                label="Back to Dashboard" 
                icon="pi pi-arrow-left" 
                text 
                size="small" 
                class="p-0 text-surface-500 hover:text-primary-600" 
                @click="router.push({ name: 'home' })" 
              />
          </div>
          <div class="flex items-center justify-between mb-6">
              <div>
                  <h1 class="text-2xl font-bold text-surface-900">{{ homesStore.currentHome.name }}</h1>
                  <p class="text-surface-600 text-sm">Manage your rooms and items</p>
              </div>
              <Button label="New Room" icon="pi pi-plus" @click="openCreateRoomDialog" />
          </div>

          <!-- Rooms List -->
          <div v-if="roomStore.loading" class="text-center py-4">
              <i class="pi pi-spin pi-spinner text-xl text-surface-500"></i>
          </div>
          
          <div v-else-if="roomStore.rooms.length === 0" class="text-center py-12 bg-surface-50 rounded-xl border border-dashed border-surface-200">
               <p class="text-surface-600 mb-2">No rooms added yet.</p>
               <Button label="Add a Room" text @click="openCreateRoomDialog" />
          </div>

          <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <Card 
                v-for="room in roomStore.rooms" 
                :key="room.id"
                class="border border-surface-200 shadow-none hover:shadow-md transition-shadow cursor-pointer relative group"
                @click="goToRoom(room.id)"
              >
                  <template #title>
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-2 overflow-hidden">
                            <i class="pi pi-box text-surface-500"></i>
                            <span class="truncate">{{ room.name }}</span>
                        </div>
                        <Button 
                            icon="pi pi-ellipsis-v" 
                            text 
                            rounded 
                            severity="secondary" 
                            class="opacity-0 group-hover:opacity-100 transition-opacity" 
                            @click.stop="toggleMenu($event, room)" 
                        />
                      </div>
                  </template>
                  <template #content>
                      <!-- Future: Item count or summary -->
                      <span class="text-xs text-surface-400">Tap to view items</span>
                  </template>
              </Card>
          </div>
      </div>

    </div>

    <!-- Create Room Dialog -->
    <Dialog v-model:visible="showCreateRoomDialog" modal header="Add New Room" :style="{ width: '25rem' }">
      <div class="flex flex-col gap-4 mb-4">
        <label for="roomName" class="font-semibold w-24">Room Name</label>
        <InputText id="roomName" v-model="newRoomName" class="flex-auto" autocomplete="off" placeholder="e.g. Living Room" />
      </div>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" @click="showCreateRoomDialog = false"></Button>
        <Button type="button" label="Add" @click="createRoom" :loading="creatingRoom"></Button>
      </div>
    </Dialog>

    <!-- Edit Room Dialog -->
    <Dialog v-model:visible="showEditRoomDialog" modal header="Rename Room" :style="{ width: '25rem' }">
        <div class="flex flex-col gap-4 mb-4">
            <label for="editRoomName" class="font-semibold w-24">Name</label>
            <InputText id="editRoomName" v-model="editRoomName" class="flex-auto" autocomplete="off" />
        </div>
        <div class="flex justify-end gap-2">
            <Button type="button" label="Cancel" severity="secondary" @click="showEditRoomDialog = false"></Button>
            <Button type="button" label="Save" @click="saveEditRoom" :loading="editingRoom"></Button>
        </div>
    </Dialog>

    <Menu ref="menu" :model="menuItems" :popup="true" />
    <ConfirmDialog />
  </AppLayout>
</template>
