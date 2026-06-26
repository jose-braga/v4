<template>
    <v-app-bar
      class="border-bottom px-3"
      color="white"
    >
      <v-app-bar-nav-icon @click="layoutStore.toggleDrawer()"></v-app-bar-nav-icon>
      <v-app-bar-title>{{ pageTitle }}</v-app-bar-title>
      <v-tooltip text="Report bug or make suggestions" location="bottom">
        <template v-slot:activator="{ props }">
          <v-icon-btn icon="mdi-bug" variant="text" color="grey" v-bind="props"></v-icon-btn>
        </template>
      </v-tooltip>
      <v-tooltip v-if="!loggedIn" text="Login" location="bottom">
        <template v-slot:activator="{ props }">
          <v-icon-btn icon="mdi-login" variant="text" color="green" v-bind="props"></v-icon-btn>
        </template>
      </v-tooltip>
      <v-tooltip v-if="loggedIn" text="Logout" location="bottom">
        <template v-slot:activator="{ props }">
          <v-icon-btn icon="mdi-logout" variant="text" color="red" v-bind="props"></v-icon-btn>
        </template>
      </v-tooltip>
      <v-tooltip text="Help about this page" location="bottom">
        <template v-slot:activator="{ props }">
          <v-icon-btn id="help-icon"
              icon="mdi-help"
              variant="text" color="blue"
              v-bind="props"
            ></v-icon-btn>
        </template>
      </v-tooltip>

    </v-app-bar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'

const layoutStore = useLayoutStore()
const route = useRoute()
const loggedIn = false

const pageTitle = computed(() => { return route.meta.title ?? '' })

</script>

<style scoped>
#help-icon :deep(.v-icon) {
    animation-duration: 3s;
    animation-name: help-highlight;
    animation-iteration-count: infinite;
    animation-direction: normal;
}
@keyframes help-highlight {
  from {
    font-size: 24px;
  }

  10% {
    font-size: 35px;
  }

  20% {
    font-size: 24px;
  }

  to {
    font-size: 24px;
  }
}
</style>