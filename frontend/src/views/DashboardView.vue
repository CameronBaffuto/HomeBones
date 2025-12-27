<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import AppLayout from "@/views/AppLayout.vue";
import { useHomesStore, type Home } from "@/stores/useHomeStore";
import { useModalStore } from "@/stores/useModalStore";
import CreateHomeDialog from "@/modals/CreateHomeDialog.vue";
import EditHomeDialog from "@/modals/EditHomeDialog.vue";
import Button from "primevue/button";
import Card from "primevue/card";
import { useToast } from "primevue/usetoast";
import Menu from "primevue/menu";
import ConfirmDialog from "primevue/confirmdialog";
import { useConfirm } from "primevue/useconfirm";

const homesStore = useHomesStore();
const modalStore = useModalStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const newHomeName = ref("");
const creating = ref(false);

const editingHomeId = ref<string | null>(null);
const editHomeName = ref("");
const editing = ref(false);

const menu = ref();
const selectedHome = ref<Home | null>(null);

const menuItems = ref([
    {
        label: 'Options',
        items: [
            {
                label: 'Rename',
                icon: 'pi pi-pencil',
                command: () => {
                    if (selectedHome.value) openEditDialog(selectedHome.value);
                }
            },
            {
                label: 'Delete',
                icon: 'pi pi-trash',
                class: 'text-red-500',
                command: () => {
                    if (selectedHome.value) confirmDeleteHome(selectedHome.value);
                }
            }
        ]
    }
]);

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
  modalStore.open("createHome");
};

const createHome = async () => {
  if (!newHomeName.value.trim()) return;
  creating.value = true;
  try {
    const id = await homesStore.createHome(newHomeName.value);
    modalStore.close("createHome");
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

const toggleMenu = (event: Event, home: Home) => {
    selectedHome.value = home;
    menu.value.toggle(event);
};

const openEditDialog = (home: Home) => {
    editingHomeId.value = home.id;
    editHomeName.value = home.name;
    modalStore.open("editHome");
};

const saveEditHome = async () => {
    if (!editingHomeId.value || !editHomeName.value.trim()) return;
    editing.value = true;
    try {
        await homesStore.updateHome(editingHomeId.value, editHomeName.value);
        modalStore.close("editHome");
        toast.add({ severity: 'success', summary: 'Updated', detail: 'Home renamed successfully', life: 3000 });
    } finally {
        editing.value = false;
    }
};

const confirmDeleteHome = (home: Home) => {
    confirm.require({
        message: `Are you sure you want to delete "${home.name}"? This action cannot be undone.`,
        header: 'Delete Home',
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
            homesStore.deleteHome(home.id);
            toast.add({ severity: 'info', summary: 'Deleted', detail: 'Home deleted', life: 3000 });
        }
    });
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
          class="cursor-pointer hover:shadow-md transition-shadow border border-surface-200 shadow-none relative group"
          @click="goToHome(home.id)"
        >
          <template #title>
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 overflow-hidden">
                    <i class="pi pi-home text-primary-500"></i>
                    <span class="truncate">{{ home.name }}</span>
                </div>
                <Button 
                    icon="pi pi-ellipsis-v" 
                    text 
                    rounded 
                    severity="secondary" 
                    class="opacity-0 group-hover:opacity-100 transition-opacity" 
                    @click.stop="toggleMenu($event, home)" 
                />
            </div>
          </template>
          <template #content>
            <p class="text-xs text-surface-500">
              Created: {{ home.createdAt?.toDate ? home.createdAt.toDate().toLocaleDateString() : 'Just now' }}
            </p>
          </template>
        </Card>
      </div>
    </div>

    <CreateHomeDialog
      v-model:visible="modalStore.createHome"
      v-model:name="newHomeName"
      :loading="creating"
      @create="createHome"
    />

    <EditHomeDialog
      v-model:visible="modalStore.editHome"
      v-model:name="editHomeName"
      :loading="editing"
      @save="saveEditHome"
    />

    <Menu ref="menu" :model="menuItems" :popup="true" />
    <ConfirmDialog />
  </AppLayout>
</template>
