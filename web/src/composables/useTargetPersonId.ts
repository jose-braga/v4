import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const PERSON_ID_KEY: InjectionKey<ComputedRef<string>> = Symbol('targetPersonId')

// A container (the manager's edit dialog) calls this to say
// "everything below me edits this person".
export function provideTargetPersonId(getId: () => string) {
    provide(PERSON_ID_KEY, computed(getId))
}

export function useTargetPersonId() {
    const injected = inject(PERSON_ID_KEY, null)
    const route = useRoute()
    const authStore = useAuthStore()

    return computed(() => {
        if (injected) return injected.value                       // inside the dialog
        const fromRoute = route.params.personId                   // future /person-on-behalf/:personId
        if (typeof fromRoute === 'string' && fromRoute) return fromRoute
        return String(authStore.user!.person_id)                  // Myself
    })
}

export function useIsOnBehalf() {
    const targetId = useTargetPersonId()
    const authStore = useAuthStore()
    return computed(() => targetId.value !== String(authStore.user?.person_id))
}