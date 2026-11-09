<template>
    <v-form @submit.prevent="() => onSubmit()">
        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No lab positions yet. Use the button below to add one.
        </p>

        <v-card v-for="(field, i) in fields" :key="field.key" variant="outlined" class="mb-4 pa-4">
            <div class="d-flex align-center mb-2">
                <v-chip size="small" label :color="isCurrent(field.value.valid_until) ? 'success' : undefined">
                    {{ isCurrent(field.value.valid_until) ? 'Current' : 'Past' }}
                </v-chip>
                <v-icon v-if="rowHasErrors(i)" color="error" icon="mdi-alert-circle" class="ml-2" />
                <v-spacer />
                <v-btn icon="mdi-delete" variant="text" color="error" aria-label="Remove this affiliation"
                    @click="remove(i)" />
            </div>

            <v-row dense>
                <v-col cols="12" md="7">
                    <v-autocomplete
                        v-model="field.value.lab_id"
                        :items="labs" item-title="name" item-value="id" label="Lab"
                        :loading="labsLoading"
                        :error-messages="errAt(`labs[${i}].lab_id`)"
                    />
                </v-col>
                <v-col cols="12" md="5">
                    <v-select
                        v-model="field.value.lab_position_id"
                        :items="positions" item-title="name" item-value="id" label="Position"
                        :error-messages="errAt(`labs[${i}].lab_position_id`)"
                    />
                </v-col>
                <v-col cols="4" md="3">
                    <v-text-field v-model.number="field.value.dedication" label="Dedication"
                        type="number" suffix="%" min="0" max="100"
                        :error-messages="errAt(`labs[${i}].dedication`)" />
                </v-col>
                <v-col cols="4" md="4">
                    <v-date-input v-model="field.value.valid_from" label="From"
                        :picker-props="{ color: 'primary' }" input-format="yyyy-mm-dd" clearable />
                </v-col>
                <v-col cols="4" md="4">
                    <v-date-input v-model="field.value.valid_until" label="Until"
                        :picker-props="{ color: 'primary' }" input-format="yyyy-mm-dd" clearable
                        :error-messages="errAt(`labs[${i}].valid_until`)" />
                </v-col>
                <v-col cols="12" class="d-flex flex-wrap ga-4">
                    <v-checkbox v-model="field.value.integrated" label="Integrated" density="compact" hide-details />
                    <v-checkbox v-model="field.value.nuclearCV" label="Nuclear CV" density="compact" hide-details />
                    <v-checkbox v-model="field.value.pluriannual" label="Pluriannual" density="compact" hide-details />
                </v-col>
            </v-row>
        </v-card>

        <v-btn variant="outlined" prepend-icon="mdi-plus" @click="addRow">Add an affiliation</v-btn>

        <v-row class="mt-6">
            <v-col cols="12" md="10">
                <v-alert v-if="error" type="error" density="compact" class="mb-4">{{ error }}</v-alert>
                <v-alert v-if="success" type="success" density="compact" class="mb-4">{{ success }}</v-alert>
            </v-col>
            <v-col cols="12" md="2" class="d-flex justify-end">
                <v-btn type="submit" color="primary" :loading="submitting" :disabled="!meta.dirty">Update</v-btn>
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
import { toIsoDateString, fromIsoDateString, isCurrent } from '@/utils/date'
import type { LabRow } from '@/api/person'

const props = withDefaults(defineProps<{
    labs?: LabRow[]
    error?: string
    success?: string
}>(), { labs: () => [], error: '', success: '' })

const emit = defineEmits<{ submit: [payload: LabsPayload] }>()

const { items: labs, loading: labsLoading } = useLookup('labs')
const { items: positions } = useLookup('lab-positions')
// ---- Payload ---------------------------------------------------------------
export interface LabPayload {
    id?: number
    lab_id: number
    lab_position_id: number
    dedication: number | null
    valid_from: string | null
    valid_until: string | null
    integrated: boolean
    pluriannual: boolean
    nuclearCV: boolean
}
export interface LabsPayload { labs: LabPayload[] }


// ---- Form-side type --------------------------------------------------------
interface LabForm {
    id?: number
    lab_id: number | null
    lab_position_id: number | null
    dedication: number | string | null      // '' while the field is cleared
    valid_from: Date | null
    valid_until: Date | null
    integrated: boolean
    pluriannual: boolean
    nuclearCV: boolean
}

// ---- Schema ----------------------------------------------------------------
const need = (msg: string) => z.number({ required_error: msg, invalid_type_error: msg })

const rowSchema = z.object({
    id: z.number().optional(),
    lab_id: need('Select a lab'),
    lab_position_id: need('Select a position'),
    dedication: z.preprocess(
        (v) => (v === '' || v === undefined ? null : v),
        z.number({ invalid_type_error: 'Enter a number' }).int().min(0).max(100).nullable(),
    ),
    valid_from: z.date().nullable(),
    valid_until: z.date().nullable(),
    integrated: z.boolean(),
    pluriannual: z.boolean(),
    nuclearCV: z.boolean(),
}).refine(
    (r) => !r.valid_from || !r.valid_until || r.valid_until >= r.valid_from,
    { message: 'End date must not be before the start date', path: ['valid_until'] },
)
const schema = z.object({ labs: z.array(rowSchema) })

// ---- Conversions -----------------------------------------------------------
function toFormValues(rows: LabRow[]): { labs: LabForm[] } {
    return {
        labs: rows.map((r) => ({
            id: r.id,
            lab_id: r.lab_id,
            lab_position_id: r.lab_position_id,
            dedication: r.dedication,
            valid_from: fromIsoDateString(r.valid_from),
            valid_until: fromIsoDateString(r.valid_until),
            integrated: r.integrated,
            pluriannual: r.pluriannual,
            nuclearCV: r.nuclearCV,
        })),
    }
}
const asFormValues = (rows: LabRow[]) => toFormValues(rows) as unknown as z.input<typeof schema>
const iso = (d: Date | null) => (d ? toIsoDateString(d) : null)

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: asFormValues(props.labs),
})
const { fields, push, remove, replace } = useFieldArray<LabForm>('labs')
const submitting = computed(() => isSubmitting.value)

function errAt(path: string) {
    const msg = (errors.value as Record<string, string | undefined>)[path]
    return msg ? [msg] : []
}
const rowHasErrors = (i: number) => Object.keys(errors.value).some((k) => k.startsWith(`labs[${i}].`))

function addRow() {
    push({
        lab_id: null, lab_position_id: null, dedication: null,
        valid_from: null, valid_until: null,
        integrated: false, pluriannual: false, nuclearCV: false,
    })
}

watch(
    () => props.labs,
    (rows) => {
        resetForm({ values: asFormValues(rows) })
        replace(toFormValues(rows).labs)
    },
)

const onSubmit = handleSubmit((v) => {
    emit('submit', {
        labs: v.labs.map((r) => ({
            ...(r.id !== undefined ? { id: r.id } : {}),
            lab_id: r.lab_id,
            lab_position_id: r.lab_position_id,
            dedication: typeof r.dedication === 'number' ? r.dedication : null,
            valid_from: iso(r.valid_from),
            valid_until: iso(r.valid_until),
            integrated: r.integrated,
            pluriannual: r.pluriannual,
            nuclearCV: r.nuclearCV,
        })),
    })
})
</script>