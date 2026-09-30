// composables/useEditableSection.ts
import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import type { ApiError } from '@/api/types'

export function useEditableSection<TData, TInput = TData>(
    fetcher: () => Promise<TData>,
    updater: (payload: TInput) => Promise<TData | void>,
    autoDismissMs: number = 3000 // Configurable timeout duration (default: 5s)
) {
    const data = ref<TData | null>(null) as Ref<TData | null>
    const loading = ref(true)
    const submitting = ref(false)
    const error = ref('')
    const success = ref('')

    let errorTimer: ReturnType<typeof setTimeout> | null = null
    let successTimer: ReturnType<typeof setTimeout> | null = null

    function clearErrorTimer() {
        if (errorTimer) {
            clearTimeout(errorTimer)
            errorTimer = null
        }
    }

    function clearSuccessTimer() {
        if (successTimer) {
            clearTimeout(successTimer)
            successTimer = null
        }
    }

    function setError(msg: string) {
        clearErrorTimer()
        error.value = msg
        if (msg && autoDismissMs > 0) {
            errorTimer = setTimeout(() => {
                error.value = ''
            }, autoDismissMs)
        }
    }

    function setSuccess(msg: string) {
        clearSuccessTimer()
        success.value = msg
        if (msg && autoDismissMs > 0) {
            successTimer = setTimeout(() => {
                success.value = ''
            }, autoDismissMs)
        }
    }

    async function load() {
        loading.value = true
        error.value = ''
        try {
            data.value = await fetcher()
        } catch (err) {
            setError((err as ApiError).message)
        } finally {
            loading.value = false
        }
    }

    async function submit(payload: TInput) {
        submitting.value = true
        setError('')
        setSuccess('')
        try {
            const result = await updater(payload)
            if (result) data.value = result
            setSuccess('Saved successfully.')
        } catch (err) {
            setError((err as ApiError).message)
        } finally {
            submitting.value = false
        }
    }
    onUnmounted(() => {
        clearErrorTimer()
        clearSuccessTimer()
    })

    onMounted(load)

    return { data, loading, submitting, error, success, submit }
}