<template>
    <v-card>
        <v-card-title>Workplace</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <WorkPlacesForm
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
import WorkPlacesForm from './WorkPlacesForm.vue'
import type { WorkplacePayload } from './WorkPlacesForm.vue'
import { fetchWorkplaces, updateWorkplaces } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<WorkplacePayload>(
    () => fetchWorkplaces(personId.value),
    (payload) => updateWorkplaces(personId.value, payload)
)

async function handleSubmit(payload: WorkplacePayload) {
    await submit(payload)
}
</script>