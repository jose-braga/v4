<template>
    <v-card>
        <v-card-title>Core Information</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <CoreInformationForm
                v-else
                :initial-values="data ?? undefined"
                :error="error"
                :success="success"
                @submit="handleSubmit"
            />
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import CoreInformationForm from './CoreInformationForm.vue'
import type { CoreInformationPayload } from './CoreInformationForm.vue'
import { fetchCoreInformation, updateCoreInformation } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'

const authStore = useAuthStore()
const personId = computed(() => authStore.user!.person_id)

const { data, loading, error, success, submit } = useEditableSection<CoreInformationPayload>(
    () => fetchCoreInformation(personId.value),
    (payload) => updateCoreInformation(personId.value, payload)
)

async function handleSubmit(payload: CoreInformationPayload) {
    await submit(payload)
}
</script>

<style scoped>
</style>