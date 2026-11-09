<template>
    <v-card>
        <v-card-title>Responsibles/Supervisors</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <SupervisorsForm
                v-else
                :initial-values="data ?? undefined"
                :error="error"
                :success="success"
                @submit="handleSubmit"
            />
        </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
import SupervisorsForm from './SupervisorsForm.vue'
import type { SupervisorsPayload } from './SupervisorsForm.vue'
import { fetchSupervisors, updateSupervisors } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<SupervisorsPayload>(
    () => fetchSupervisors(personId.value),
    (payload) => updateSupervisors(personId.value, payload)
)

async function handleSubmit(payload: SupervisorsPayload) {
    await submit(payload)
}

</script>