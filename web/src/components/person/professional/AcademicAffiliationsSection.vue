<template>
    <v-card>
        <v-card-title>Academic Affiliations</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <AcademicAffiliationsForm
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
import AcademicAffiliationsForm from './AcademicAffiliationsForm.vue'
import type { AcademicAffiliationsPayload } from './AcademicAffiliationsForm.vue'
import { fetchAcademicAffiliations, updateAcademicAffiliations } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<AcademicAffiliationsPayload>(
    () => fetchAcademicAffiliations(personId.value),
    (payload) => updateAcademicAffiliations(personId.value, payload)
)

async function handleSubmit(payload: AcademicAffiliationsPayload) {
    await submit(payload)
}

</script>