<template>
    <v-expansion-panel>
        <v-expansion-panel-title>
            <span class="accordion-title">Emergency Contacts</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <EmergencyContactsForm
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
import EmergencyContactsForm from './EmergencyContactsForm.vue'
import type { EmergencyContactsPayload } from './EmergencyContactsForm.vue'
import { fetchEmergencyContacts, updateEmergencyContacts } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<EmergencyContactsPayload>(
    () => fetchEmergencyContacts(personId.value),
    (payload) => updateEmergencyContacts(personId.value, payload)
)

async function handleSubmit(payload: EmergencyContactsPayload) {
    await submit(payload)
}
</script>

<style scoped>
.accordion-title {
    font-size: large;
}
</style>