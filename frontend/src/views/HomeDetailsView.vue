<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import AppLayout from "@/views/AppLayout.vue";
import { useHomesStore } from "@/stores/useHomeStore";
import { useRoomStore } from "@/stores/useRoomStore";
import Button from "primevue/button";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import Card from "primevue/card";

const route = useRoute();
const homesStore = useHomesStore();
const roomStore = useRoomStore();

const homeId = route.params.homeId as string;

const showCreateRoomDialog = ref(false);
const newRoomName = ref("");
const creatingRoom = ref(false);

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

</script>

<template>
  <AppLayout>
    <div class="space-y-6 w-full max-w-4xl mx-auto p-4">
      
      <!-- Header / Loading State -->
      <div v-if="homesStore.loading" class="text-center py-8">
         <i class="pi pi-spin pi-spinner text-2xl text-surface-500"></i>
      </div>

      <div v-else-if="!homesStore.currentHome" class="text-center py-8 text-red-500">
          Home not found or access denied.
      </div>

      <div v-else>
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
                class="border border-surface-200 shadow-none hover:shadow-md transition-shadow cursor-pointer"
              >
                  <template #title>
                      <div class="flex items-center gap-2">
                        <i class="pi pi-box text-surface-500"></i>
                        <span>{{ room.name }}</span>
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
  </AppLayout>
</template>