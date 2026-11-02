<template>
    <v-expansion-panel>
        <v-expansion-panel-title>
            <span class="accordion-title">Personal Contacts</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <PersonalContactsForm
                v-else
                :initial-values="data ?? undefined"
                :error="error"
                :success="success"
                @submit="handleSubmit"
            />
        </v-expansion-panel-text>
    </v-expansion-panel>
</template>

<script setup lang="ts">
import PersonalContactsForm from './PersonalContactsForm.vue'
import type { PersonalContactsPayload } from './PersonalContactsForm.vue'
import { fetchPersonalContacts, updatePersonalContacts } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<PersonalContactsPayload>(
    () => fetchPersonalContacts(personId.value),
    (payload) => updatePersonalContacts(personId.value, payload)
)

async function handleSubmit(payload: PersonalContactsPayload) {
    await submit(payload)
}
</script>

<style scoped>
.accordion-title {
    font-size: large;
}
</style>