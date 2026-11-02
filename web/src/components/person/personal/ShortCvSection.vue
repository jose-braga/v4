<template>
    <v-card>
        <v-card-title>Short CV</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <ShortCvForm
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
import ShortCvForm from './ShortCvForm.vue'
import type { ShortCvPayload } from './ShortCvForm.vue'
import { fetchShortCv, updateShortCv } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<ShortCvPayload>(
    () => fetchShortCv(personId.value),
    (payload) => updateShortCv(personId.value, payload)
)

async function handleSubmit(payload: ShortCvPayload) {
    await submit(payload)
}
</script>