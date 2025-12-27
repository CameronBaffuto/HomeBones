<script setup lang="ts">
import AppLayout from '@/views/AppLayout.vue';
import { Button } from 'primevue';

</script>

<template>
  <AppLayout>
    <h1 class="text-4xl text-green-900">Welcome to HomeBones!</h1>
    <p class="mt-4 text-amber-500">Your smart home management system</p>
    <Button label="Get Started" icon="pi pi-home" class="mt-6" />
  </AppLayout>
</template>