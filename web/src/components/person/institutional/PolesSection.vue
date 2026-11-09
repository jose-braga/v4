<template>
    <v-card>
        <v-card-title>Pole Affiliations</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <PolesForm
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
import PolesForm from './PolesForm.vue'
import type { PolesPayload } from './PolesForm.vue'
import { fetchPoles, updatePoles } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<PolesPayload>(
    () => fetchPoles(personId.value),
    (payload) => updatePoles(personId.value, payload)
)

async function handleSubmit(payload: PolesPayload) {
    await submit(payload)
}

</script>