<template>
  <v-app>
    <NavigationDrawer />
    <UpperToolbar />
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import UpperToolbar from '@/components/UpperToolbar.vue'
  import NavigationDrawer from '@/components/NavigationDrawer.vue'
</script>
