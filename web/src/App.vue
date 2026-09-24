<template>
  <v-app>
    <template v-if="!route.meta.standalone">
      <NavigationDrawer />
      <UpperToolbar />
    </template>
    <v-main>
      <v-alert
        v-if="!authStore.isAuthenticated && !route.meta.public"
        type="info"
        variant="tonal"
        density="comfortable"
        class="ma-4"
      >
        Please login first by clicking on the login icon
        <v-icon variant="text"color="green" icon="mdi-login"></v-icon>
        above.
      </v-alert>
      <router-view v-else />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { useRoute } from 'vue-router'
  import UpperToolbar from '@/components/UpperToolbar.vue'
  import NavigationDrawer from '@/components/NavigationDrawer.vue'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const route = useRoute()
</script>
