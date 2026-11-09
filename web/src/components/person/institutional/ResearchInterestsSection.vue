<template>
    <v-card>
        <v-card-title>Research Interests</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <ResearchInterestsForm
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
import ResearchInterestsForm from './ResearchInterestsForm.vue'
import type { ResearchInterestsPayload } from './ResearchInterestsForm.vue'
import { fetchResearchInterests, updateResearchInterests } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<ResearchInterestsPayload>(
    () => fetchResearchInterests(personId.value),
    (payload) => updateResearchInterests(personId.value, payload)
)

async function handleSubmit(payload: ResearchInterestsPayload) {
    await submit(payload)
}

</script>