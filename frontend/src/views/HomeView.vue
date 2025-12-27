<script setup lang="ts">
import AppLayout from '@/views/AppLayout.vue';
import { Button } from 'primevue';

</script>

<template>
  <AppLayout>
    <div class="space-y-4">
      <h1 class="text-2xl font-bold sm:text-3xl md:text-4xl text-surface-900">Welcome to HomeBones!</h1>
      <p class="text-base text-surface-600 sm:text-lg">Your smart home management system</p>
      <Button label="Get Started" icon="pi pi-home" class="mt-6" />
    </div>
  </AppLayout>
</template>