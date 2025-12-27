import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config';
import { definePreset } from '@primeuix/themes';
import Nora from '@primeuix/themes/nora';
import 'primeicons/primeicons.css'; 
import router from './router';
import { useSessionStore } from "@/stores/useSessionStore";
import { useThemeStore } from "@/stores/useThemeStore";

const pinia = createPinia()
const app = createApp(App)

const HomeBones = definePreset(Nora, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        },
    }
});

app.use(PrimeVue, {
    theme: {
        preset: HomeBones,
        options: {
            darkModeSelector: '.dark',
        }
    }
});

app.use(pinia)
app.use(router)
useSessionStore(pinia).init();
useThemeStore(pinia).init();

app.mount('#app')
