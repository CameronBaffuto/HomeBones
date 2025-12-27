<script setup lang="ts">
import AppNavbar from "@/components/AppNavbar.vue";
</script>

<template>
  <div class="min-h-screen">
    <AppNavbar />
    <main class="flex-1 overflow-auto flex flex-col items-center justify-center pt-20 pb-15">
        <slot />
    </main>
  </div>  
</template>
