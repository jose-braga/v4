<template>
    <div v-if="managerStore.loading" class="d-flex justify-center pa-6">
        <v-progress-circular indeterminate></v-progress-circular>
    </div>
    <v-alert v-else-if="managerStore.error" type="error" density="compact" class="ma-4">
        {{ managerStore.error }}
    </v-alert>
    <v-alert v-else-if="managerStore.units.length === 0" type="info" density="compact" class="ma-4">
        You don't currently manage any research units.
    </v-alert>
    <template v-else>
        <v-tabs :model-value="route.path" color="primary" class="px-3">
            <v-tab
                v-for="unit in managerStore.units"
                :key="unit.id"
                :to="`/manager/units/${unit.slug}`"
                :value="`/manager/units/${unit.slug}`"
            >
                {{ unit.name }}
            </v-tab>
        </v-tabs>
        <router-view></router-view>
    </template>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useManagerStore } from '@/stores/manager'

const route = useRoute()
const router = useRouter()
const managerStore = useManagerStore()

onMounted(async () => {
    await managerStore.loadUnits()
    if (!route.params.unitSlug && managerStore.units.length > 0) {
        router.replace(`/manager/units/${managerStore.units[0].slug}`)
    }
})
</script>