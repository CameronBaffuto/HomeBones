<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/views/AppLayout.vue";
import { useHomesStore } from "@/stores/useHomeStore";
import Button from "primevue/button";
import Card from "primevue/card";
import Dialog from "primevue/dialog";
import InputText from "primevue/inputtext";
import { useToast } from "primevue/usetoast";

const homesStore = useHomesStore();
const router = useRouter();
const toast = useToast();

const showCreateDialog = ref(false);
const newHomeName = ref("");
const creating = ref(false);

onMounted(() => {
  homesStore.fetchHomes();
});

watch(() => homesStore.error, (val) => {
  if (val) {
    toast.add({ severity: 'error', summary: 'Error', detail: val, life: 5000 });
  }
});

const openCreateDialog = () => {
  newHomeName.value = "";
  showCreateDialog.value = true;
};

const createHome = async () => {
  if (!newHomeName.value.trim()) return;
  creating.value = true;
  try {
    const id = await homesStore.createHome(newHomeName.value);
    showCreateDialog.value = false;
    router.push({ name: "home-details", params: { homeId: id } });
  } catch (e) {
    console.error(e);
  } finally {
    creating.value = false;
  }
};

const goToHome = (id: string) => {
  router.push({ name: "home-details", params: { homeId: id } });
};
</script>

<template>
  <AppLayout>
    <div class="space-y-6 w-full max-w-4xl mx-auto p-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-surface-900">My Homes</h1>
        <Button label="New Home" icon="pi pi-plus" @click="openCreateDialog" />
      </div>

      <div v-if="homesStore.loading" class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-2xl text-surface-500"></i>
      </div>

      <div v-else-if="homesStore.homes.length === 0" class="text-center py-12 bg-surface-50 rounded-xl border border-dashed border-surface-200">
        <div class="flex flex-col items-center gap-3">
            <i class="pi pi-home text-4xl text-surface-400"></i>
            <p class="text-surface-600">You don't have any homes yet.</p>
            <Button label="Create your first home" @click="openCreateDialog" />
        </div>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card
          v-for="home in homesStore.homes"
          :key="home.id"
          class="cursor-pointer hover:shadow-md transition-shadow border border-surface-200 shadow-none"
          @click="goToHome(home.id)"
        >
          <template #title>
            <div class="flex items-center gap-2">
                <i class="pi pi-home text-primary-500"></i>
                <span class="truncate">{{ home.name }}</span>
            </div>
          </template>
          <template #content>
            <p class="text-xs text-surface-500">
              Created: {{ home.createdAt?.toDate().toLocaleDateString() ?? 'Just now' }}
            </p>
          </template>
        </Card>
      </div>
    </div>

    <!-- Create Home Dialog -->
    <Dialog v-model:visible="showCreateDialog" modal header="Create New Home" :style="{ width: '25rem' }">
      <div class="flex flex-col gap-4 mb-4">
        <label for="homeName" class="font-semibold w-24">Home Name</label>
        <InputText id="homeName" v-model="newHomeName" class="flex-auto" autocomplete="off" placeholder="e.g. Vacation Cabin" />
      </div>
      <div class="flex justify-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" @click="showCreateDialog = false"></Button>
        <Button type="button" label="Create" @click="createHome" :loading="creating"></Button>
      </div>
    </Dialog>
  </AppLayout>
</template>
