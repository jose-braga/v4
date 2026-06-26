<template>
    <v-navigation-drawer v-model="layoutStore.isDrawerOpen">
        <v-list nav
            color="primary"
            :selected="[activeItem]"
        >
            <v-list-item v-for="(item,i) in items"
                :key="i"
                :to="item.to"
                :value="item.to"
                :title="item.title"
                :append-icon="item.icon"
            >
            </v-list-item>
        </v-list>

    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'

const layoutStore = useLayoutStore()
const route = useRoute()

const items = [
    { title: 'Myself', icon: 'mdi-account', to: '/person' },
    { title: 'On Behalf', icon: 'mdi-account-switch', to: '/person-on-behalf' },
]

const activeItem = computed(() => {
  // Pick the item whose `to` is a prefix of the current path
  const match = items.find(
    (item) => route.path === item.to || route.path.startsWith(item.to + '/')
  )
  return match?.to ?? ''
})

</script>

<style scoped>
:deep(.v-list-item-title) {
    font-size: 1rem;
}
</style>