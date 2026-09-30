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
    <v-snackbar
        v-model="authStore.sessionWarning"
        color="warning"
        timeout="-1"
        location="top right"
    >
        Your session will expire soon.
        <template v-slot:actions>
            <v-btn variant="text" @click="handleStayLoggedIn">Stay logged in</v-btn>
            <v-btn variant="text" @click="authStore.sessionWarning = false">Dismiss</v-btn>
        </template>
    </v-snackbar>
  </v-app>
</template>

<script lang="ts" setup>
  import { useRoute } from 'vue-router'
  import UpperToolbar from '@/components/UpperToolbar.vue'
  import NavigationDrawer from '@/components/NavigationDrawer.vue'
  import { useAuthStore } from '@/stores/auth'

  const authStore = useAuthStore()
  const route = useRoute()
  async function handleStayLoggedIn() {
      await authStore.refreshSession()
  }
</script>
