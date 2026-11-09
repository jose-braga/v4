<template>
    <v-card>
        <v-card-title>Author names</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <AuthorNamesForm
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
import AuthorNamesForm from './AuthorNamesForm.vue'
import type { AuthorNamesPayload } from './AuthorNamesForm.vue'
import { fetchAuthorNames, updateAuthorNames } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<AuthorNamesPayload>(
    () => fetchAuthorNames(personId.value),
    (payload) => updateAuthorNames(personId.value, payload),
)

async function handleSubmit(payload: AuthorNamesPayload) {
    await submit(payload)
}
</script>