<template>
    <v-card>
        <v-card-title>Academic Degrees</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <AcademicDegreesForm
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
import AcademicDegreesForm from './AcademicDegreesForm.vue'
import type { AcademicDegreesPayload } from './AcademicDegreesForm.vue'
import { fetchAcademicDegrees, updateAcademicDegrees } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<AcademicDegreesPayload>(
    () => fetchAcademicDegrees(personId.value),
    (payload) => updateAcademicDegrees(personId.value, payload)
)

async function handleSubmit(payload: AcademicDegreesPayload) {
    await submit(payload)
}


</script>