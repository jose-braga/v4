// NOTES: It’s the same timer logic as in useEditableSection.
// You can make that composable use this one later, to remove the duplication.
// It works as it is.
// composables/useFlashMessages.ts
import { ref, onUnmounted } from 'vue'

function makeFlash(autoDismissMs: number) {
    const text = ref('')
    let timer: ReturnType<typeof setTimeout> | null = null

    function clear() {
        if (timer) {
            clearTimeout(timer)
            timer = null
        }
    }
    function set(msg: string) {
        clear()
        text.value = msg
        if (msg && autoDismissMs > 0) {
            timer = setTimeout(() => { text.value = '' }, autoDismissMs)
        }
    }
    return { text, set, clear }
}

// an error and a success message that disappear on their own
export function useFlashMessages(autoDismissMs: number = 3000) {
    const err = makeFlash(autoDismissMs)
    const ok = makeFlash(autoDismissMs)
    onUnmounted(() => {
        err.clear()
        ok.clear()
    })
    return { error: err.text, success: ok.text, setError: err.set, setSuccess: ok.set }
}