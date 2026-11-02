<template>
    <v-expansion-panel>
        <v-expansion-panel-title>
            <span class="accordion-title">Personal URLs</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <PersonalUrlsForm
                v-else
                :initial-values="data ?? undefined"
                :error="error"
                :success="success"
                @submit="handleSubmit"
            />
        </v-expansion-panel-text>
    </v-expansion-panel>

</template>

<script lang="ts" setup>
import PersonalUrlsForm from './PersonalUrlsForm.vue'
import type { PersonalUrlsPayload } from './PersonalUrlsForm.vue'
import { fetchPersonalUrls, updatePersonalUrls } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<PersonalUrlsPayload>(
    () => fetchPersonalUrls(personId.value),
    (payload) => updatePersonalUrls(personId.value, payload)
)

async function handleSubmit(payload: PersonalUrlsPayload) {
    await submit(payload)
}
</script>

<style scoped>
.accordion-title {
    font-size: large;
}
</style>