<template>
    <v-form @submit.prevent="() => onSubmit()" class="mt-4">
        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No poles defined yet. Use the button below to add one.
        </p>

        <template v-for="(field, i) in fields" :key="field.key">
            <v-row dense align="start">
                <v-col cols="12" md="5">
                    <v-select
                        v-model="field.value.pole_id"
                        :items="poles"
                        item-title="name"
                        item-value="id"
                        label="Pole"
                        :loading="polesLoading"
                        :error-messages="fieldErrors(i, 'pole_id')"
                        :picker-props="{ color: 'primary' }"
                    />
                </v-col>
                <v-col cols="6" md="6" lg="4" xl="3">
                    <v-date-input
                        v-model="field.value.valid_from"
                        label="Started"
                        input-format="yyyy-mm-dd"
                        :error-messages="fieldErrors(i, 'valid_from')"
                    />
                </v-col>
                <v-col cols="6" md="6" lg="4" xl="3">
                    <v-date-input
                        v-model="field.value.valid_until"
                        label="Ended"
                        input-format="yyyy-mm-dd"
                        clearable
                        hint="Empty if ongoing"
                        persistent-hint
                        :error-messages="fieldErrors(i, 'valid_until')"
                    />
                </v-col>
                <v-col cols="12" md="1" class="d-flex justify-end">
                    <v-tooltip text="Remove this affiliation" location="top">
                        <template #activator="{ props: tip }">
                            <v-btn
                                v-bind="tip"
                                icon="mdi-delete"
                                color="error"
                                variant="text"
                                @click="remove(i)"
                            />
                        </template>
                    </v-tooltip>
                </v-col>
            </v-row>
            <v-divider v-if="i < fields.length - 1" class="my-3" />
        </template>

        <div class="d-flex justify-space-between align-center mt-4">
            <v-btn variant="outlined" prepend-icon="mdi-plus" @click="addRow">
                Add a pole affiliation
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
import { useLookup } from '@/composables/useLookup'
import { toIsoDateString, fromIsoDateString } from '@/utils/date'

export interface Pole {
    id?: number                // present for saved rows, absent for rows added in the UI
    pole_id: number            // id from the poles lookup
    valid_from: string | null        // 'yyyy-mm-dd'
    valid_until: string | null // null = still ongoing ("Ended" left empty)
}

export interface PolesPayload {
    poles: Pole[]
}

const props = withDefaults(defineProps<{
    initialValues?: PolesPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const emit = defineEmits<{
    submit: [payload: PolesPayload]
}>()
const { items: poles, loading: polesLoading } = useLookup('poles')

const rowSchema = z
    .object({
        id: z.number().optional(),
        pole_id: z.number({
            required_error: 'Select a pole',
            invalid_type_error: 'Select a pole',
        }),
        valid_from: z.date().nullable(),
        valid_until: z.date().nullable(),
    })
    .refine(
        (r) => !r.valid_from || !r.valid_until || r.valid_until >= r.valid_from,
        { message: 'End date must be after the start date', path: ['valid_until'] }
    )

const polesSchema = z.object({ poles: z.array(rowSchema) })

function toFormValues(p?: PolesPayload) {
    return {
        poles: (p?.poles ?? []).map((a) => ({
            id: a.id,
            pole_id: a.pole_id,
            valid_from: fromIsoDateString(a.valid_from),
            valid_until: fromIsoDateString(a.valid_until),
        })),
    }
}

const { handleSubmit, isSubmitting, errors, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(polesSchema),
    initialValues: toFormValues(props.initialValues),
})

const { fields, push, remove } = useFieldArray<{
    id?: number
    pole_id: number | null
    valid_from: Date | null
    valid_until: Date | null
}>('poles')

function addRow() {
    push({ pole_id: null, valid_from: null, valid_until: null })
}

function fieldErrors(index: number, name: string) {
    const msg = errors.value[`poles[${index}].${name}` as keyof typeof errors.value]
    return msg ? [msg] : []
}

const submitting = computed(() => isSubmitting.value)

// After a successful save the parent hands us the saved data (new rows now
// have ids): reset so the form is "clean" again and Update goes back to disabled.
watch(
    () => props.initialValues,
    (v) => resetForm({ values: toFormValues(v) }),
)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        poles: values.poles.map((a) => ({
            ...(a.id !== undefined ? { id: a.id } : {}),
            pole_id: a.pole_id,
            valid_from: a.valid_from ? toIsoDateString(a.valid_from) : null,
            valid_until: a.valid_until ? toIsoDateString(a.valid_until) : null,
        })),
    })
})
</script>