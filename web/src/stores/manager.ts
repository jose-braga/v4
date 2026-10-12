import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchManagedUnits } from '@/api/manager'
import type { ApiError } from '@/api/types'

export interface ManagedUnit {
    id: string
    slug: string
    name: string
}

export const useManagerStore = defineStore('manager', () => {
    const units = ref<ManagedUnit[]>([])
    const loading = ref(true)
    const error = ref('')
    let loaded = false

    async function loadUnits() {
        if (loaded) return // tabs and the members page both trigger this on mount
        loading.value = true
        error.value = ''
        try {
            units.value = await fetchManagedUnits()
            loaded = true
        } catch (err) {
            error.value = (err as ApiError).message
        } finally {
            loading.value = false
        }
    }

    return { units, loading, error, loadUnits }
})