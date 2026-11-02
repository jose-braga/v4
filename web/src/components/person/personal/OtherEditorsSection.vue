<template>
    <v-expansion-panel>
        <v-expansion-panel-title>
            <span class="accordion-title">Editors of your data</span>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <OtherEditorsForm
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
import OtherEditorsForm from './OtherEditorsForm.vue'
import type { OtherEditorsPayload } from './OtherEditorsForm.vue'
import { fetchOtherEditors, updateOtherEditors } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const personId = useTargetPersonId()

const { data, loading, error, success, submit } = useEditableSection<OtherEditorsPayload>(
    () => fetchOtherEditors(personId.value),
    (payload) => updateOtherEditors(personId.value, payload)
)

async function handleSubmit(payload: OtherEditorsPayload) {
    await submit(payload)
}
</script>

<style scoped>
.accordion-title {
    font-size: large;
}
</style>