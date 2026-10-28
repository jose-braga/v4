<template>
    <v-card>
        <v-card-title>Professional Situation</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <ProfessionalSituationForm
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
import ProfessionalSituationForm from './ProfessionalSituationForm.vue'
import type { JobsPayload } from './ProfessionalSituationForm.vue'
import { fetchJobs, updateJobs } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<JobsPayload>(
    () => fetchJobs(personId.value),
    (payload) => updateJobs(personId.value, payload)
)

async function handleSubmit(payload: JobsPayload) {
    await submit(payload)
}

</script>