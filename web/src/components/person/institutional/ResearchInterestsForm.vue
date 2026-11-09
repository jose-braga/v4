<template>
    <v-form @submit.prevent="() => onSubmit()" class="mt-4">
        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No research interests defined yet. Use the button below to add one.
        </p>

        <v-row v-for="(field, i) in fields" :key="field.key" dense align="start">
            <v-col cols="12" md="9">
                <v-text-field
                    v-model="field.value.research_interest"
                    :label="`Research interest ${i + 1}`"
                    counter="250"
                    :error-messages="fieldErrors(i, 'research_interest')"
                />
            </v-col>

            <v-col cols="12" md="3" class="d-flex justify-end ga-1 pt-md-3">
                <v-tooltip text="Move up" location="top">
                    <template #activator="{ props: tip }">
                        <v-btn
                            v-bind="tip"
                            icon="mdi-chevron-up"
                            variant="text"
                            :disabled="i === 0"
                            aria-label="Move up"
                            @click="move(i, i - 1)"
                        />
                    </template>
                </v-tooltip>
                <v-tooltip text="Move down" location="top">
                    <template #activator="{ props: tip }">
                        <v-btn
                            v-bind="tip"
                            icon="mdi-chevron-down"
                            variant="text"
                            :disabled="i === fields.length - 1"
                            aria-label="Move down"
                            @click="move(i, i + 1)"
                        />
                    </template>
                </v-tooltip>
                <v-tooltip text="Remove this research interest" location="top">
                    <template #activator="{ props: tip }">
                        <v-btn
                            v-bind="tip"
                            icon="mdi-delete"
                            color="error"
                            variant="text"
                            aria-label="Remove this research interest"
                            @click="remove(i)"
                        />
                    </template>
                </v-tooltip>
            </v-col>
        </v-row>

        <div class="d-flex justify-space-between align-center mt-4">
            <v-btn variant="outlined" prepend-icon="mdi-plus" @click="addRow">
                Add a research interest
            </v-btn>
        </div>

        <v-row class="mt-6">
            <v-col cols="12" md="10">
                <v-alert v-if="error" type="error" density="compact" class="mb-4">
                    {{ error }}
                </v-alert>
                <v-alert v-if="success" type="success" density="compact" class="mb-4">
                    {{ success }}
                </v-alert>
            </v-col>
            <v-col cols="12" md="2" class="d-flex justify-end">
                <v-btn
                    type="submit"
                    color="primary"
                    :loading="submitting"
                    :disabled="!meta.dirty"
                >
                    Update
                </v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useFieldArray, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

// ---- Payload ---------------------------------------------------------------
export interface ResearchInterest {
    id?: number                // present for saved rows, absent for rows added in the UI
    research_interest: string
    sort_order?: number        // position in the list, set from the order on screen when saving
}

export interface ResearchInterestsPayload {
    research_interests: ResearchInterest[]
}

const props = withDefaults(defineProps<{
    initialValues?: ResearchInterestsPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const emit = defineEmits<{
    submit: [payload: ResearchInterestsPayload]
}>()

// ---- Schema ----------------------------------------------------------------
const rowSchema = z.object({
    id: z.number().optional(),
    research_interest: z.string().trim()
        .min(1, 'Enter a research interest')
        .max(250, 'At most 250 characters long'),
})

const researchInterestsSchema = z.object({ research_interests: z.array(rowSchema) })

// ---- Conversions -----------------------------------------------------------
// The list on screen follows the saved order; sort_order itself is not edited,
// it is recalculated from the position when the form is submitted.
function toFormValues(p?: ResearchInterestsPayload) {
    const sorted = [...(p?.research_interests ?? [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
    )
    return {
        research_interests: sorted.map((a) => ({
            id: a.id,
            research_interest: a.research_interest,
        })),
    }
}

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(researchInterestsSchema),
    initialValues: toFormValues(props.initialValues),
})

const { fields, push, remove, replace, move } = useFieldArray<{
    id?: number
    research_interest: string
}>('research_interests')

function addRow() {
    push({ research_interest: '' })
}

function fieldErrors(index: number, name: string) {
    const msg = errors.value[`research_interests[${index}].${name}` as keyof typeof errors.value]
    return msg ? [msg] : []
}

const submitting = computed(() => isSubmitting.value)

// After a successful save the parent hands us the saved data (new rows now
// have ids): reset so the form is "clean" again and Update goes back to disabled.
watch(
    () => props.initialValues,
    (v) => {
        resetForm({ values: toFormValues(v) })
        replace(toFormValues(v).research_interests)
    },
)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        research_interests: values.research_interests.map((a, index) => ({
            ...(a.id !== undefined ? { id: a.id } : {}),
            research_interest: a.research_interest,
            sort_order: index + 1,                 // the order on screen becomes the saved order
        })),
    })
})
</script>