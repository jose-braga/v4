<template>
    <v-tabs :model-value="route.path" color="primary" class="px-3">
        <v-tab
            v-for="t in tabs"
            :key="t.key"
            :to="`/person/${t.key}`"
            :value="`/person/${t.key}`"
        >
            {{ t.label }}
        </v-tab>
    </v-tabs>
    <router-view></router-view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { personTabs } from '@/pages/person/tabs'
import { useAuthStore } from '@/stores/auth'
import { visibleSelfTabs } from '@/pages/person/selfTabs'

const authStore = useAuthStore()
const tabs = computed(() => [...personTabs, ...visibleSelfTabs(authStore.user)])

const route = useRoute()
</script>