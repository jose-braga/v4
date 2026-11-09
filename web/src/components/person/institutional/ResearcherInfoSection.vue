<template>
    <v-card>
        <v-card-title>Scientific IDs</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <ResearcherInfoForm
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
import ResearcherInfoForm from './ResearcherInfoForm.vue'
import type { ResearcherInfoPayload } from './ResearcherInfoForm.vue'
import { fetchResearcherInfo, updateResearcherInfo } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<ResearcherInfoPayload>(
    () => fetchResearcherInfo(personId.value),
    (payload) => updateResearcherInfo(personId.value, payload)
)

async function handleSubmit(payload: ResearcherInfoPayload) {
    await submit(payload)
}
</script>