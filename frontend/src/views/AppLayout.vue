<script setup lang="ts">
import AppNavbar from "@/components/AppNavbar.vue";
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-surface-50">
    <AppNavbar />
    <main class="flex-1 w-full overflow-y-auto">
      <div class="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <slot />
      </div>
    </main>
  </div>  
</template>
