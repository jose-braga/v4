import { ref } from 'vue'
import { fetchLookup, type LookupItem } from '@/api/lookups'
import type { ApiError } from '@/api/types'

// Module-level cache: shared by every component that asks for the same lookup.
// We cache the *promise*, so simultaneous requests share one network call.
const cache = new Map<string, Promise<LookupItem[]>>()

export function useLookup(name: string) {
    const items = ref<LookupItem[]>([])
    const loading = ref(true)
    const error = ref('')

    let promise = cache.get(name)
    if (!promise) {
        promise = fetchLookup(name)
        cache.set(name, promise)
        promise.catch(() => cache.delete(name)) // failed? let the next caller retry
    }

    promise
        .then((result) => { items.value = result })
        .catch((err) => { error.value = (err as ApiError).message })
        .finally(() => { loading.value = false })

    return { items, loading, error }
}