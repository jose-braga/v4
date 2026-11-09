<template>
    <v-card>
        <v-card-title>Institutional Contacts</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <ContactForm
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
import ContactForm from './ContactForm.vue'
import type { ContactPayload } from './ContactForm.vue'
import { fetchContact, updateContact } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<ContactPayload>(
    () => fetchContact(personId.value),
    (payload) => updateContact(personId.value, payload)
)

async function handleSubmit(payload: ContactPayload) {
    await submit(payload)
}
</script>