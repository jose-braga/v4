<template>
    <div v-if="managerStore.loading" class="d-flex justify-center pa-6">
        <v-progress-circular indeterminate></v-progress-circular>
    </div>
    <v-alert v-else-if="managerStore.error" type="error" density="compact" class="ma-4">
        {{ managerStore.error }}
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
            <v-divider v-if="managerStore.units.length" vertical class="mx-2" />

            <v-tab v-for="t in toolTabs" :key="t.to" :to="t.to" :value="t.to" :prepend-icon="t.icon">
                {{ t.label }}
            </v-tab>
        </v-tabs>
        <v-alert
            v-if="managerStore.units.length === 0 && route.path.startsWith('/manager/units')"
            type="info" density="compact" class="ma-4"
        >
            You don't currently manage any research units.
        </v-alert>
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

const toolTabs = [
    { label: 'Unassigned', to: '/manager/unassigned', icon: 'mdi-account-question' },
    { label: 'Validate', to: '/manager/validate', icon: 'mdi-account-check' },
    { label: 'Export',   to: '/manager/export',   icon: 'mdi-file-excel' },
]

onMounted(async () => {
    await managerStore.loadUnits()
    // only redirect from the bare /manager URL
    if (route.path.replace(/\/$/, '') === '/manager') {
        router.replace(
            managerStore.units.length
                ? `/manager/units/${managerStore.units[0].slug}`
                : '/manager/validate',
        )
    }
})
</script>