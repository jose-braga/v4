<!-- DataVisibilityForm.vue -->
<template>
    <v-row class="justify-center">
        <v-col cols="6">
            <v-switch
                :model-value="visibility"
                label="Make my profile visible"
                color="primary"
                true-icon="mdi-check"
                false-icon="mdi-close"
                hide-details
                :loading="saving"
                :disabled="saving"
                @update:model-value="onToggle"
            ></v-switch>
        </v-col>
    </v-row>
    <v-alert v-if="error" type="error" density="compact" class="mb-4">
        {{ error }}
    </v-alert>
    <v-alert v-if="success" type="success" density="compact" class="mb-4">
        {{ success }}
    </v-alert>
</template>

<script setup lang="ts">
export interface DataVisibilityPayload {
    visibility: boolean
}

defineProps<{
    visibility: boolean
    saving?: boolean
    error?: string
    success?: string
}>()

const emit = defineEmits<{
    change: [payload: DataVisibilityPayload]
}>()

function onToggle(value: unknown) {
    emit('change', { visibility: value === true })
}
</script>