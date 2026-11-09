<template>
    <v-form @submit.prevent="() => onSubmit()">
        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No offices or facilities yet. Use the button below to add one.
        </p>

        <v-card v-for="(field, i) in fields" :key="field.key" variant="outlined" class="mb-4 pa-4">
            <div class="d-flex align-center mb-2">
                <v-chip v-if="field.value.kind" size="small" label variant="outlined">
                    {{ officeKindLabels[field.value.kind] }}
                </v-chip>
                <v-chip size="small" label class="ml-2" :color="isCurrent(field.value.valid_until) ? 'success' : undefined">
                    {{ isCurrent(field.value.valid_until) ? 'Current' : 'Past' }}
                </v-chip>
                <v-icon v-if="rowHasErrors(i)" color="error" icon="mdi-alert-circle" class="ml-2" />
                <v-spacer />
                <v-btn icon="mdi-delete" variant="text" color="error" aria-label="Remove this affiliation"
                    @click="remove(i)" />
            </div>

            <v-row dense>
                <v-col cols="12" md="4">
                    <v-select
                        v-model="field.value.kind"
                        :items="kindItems" item-title="title" item-value="value" label="Type"
                        :disabled="field.value.id !== undefined"
                        :error-messages="errAt(`offices[${i}].kind`)"
                        @update:model-value="field.value.office_id = null; field.value.position_id = null"
                    />
                </v-col>
                <v-col cols="12" md="4">
                    <v-select
                        v-model="field.value.office_id"
                        :items="officeItems(field.value.kind)" item-title="name" item-value="id" label="Office"
                        :disabled="!field.value.kind"
                        :error-messages="errAt(`offices[${i}].office_id`)"
                    />
                </v-col>
                <v-col cols="12" md="4">
                    <v-select
                        v-model="field.value.position_id"
                        :items="positionItems(field.value.kind)" item-title="name" item-value="id" label="Position"
                        :disabled="!field.value.kind" clearable
                        :error-messages="errAt(`offices[${i}].position_id`)"
                    />
                </v-col>
                <v-col cols="12" md="4">
                    <v-select
                        v-model="field.value.unit_id"
                        :items="units" item-title="name" item-value="id" label="Unit"
                        :error-messages="errAt(`offices[${i}].unit_id`)"
                    />
                </v-col>
                <v-col cols="4" md="2">
                    <v-text-field v-model.number="field.value.dedication" label="Dedication"
                        type="number" suffix="%" min="0" max="100"
                        :error-messages="errAt(`offices[${i}].dedication`)" />
                </v-col>
                <v-col cols="4" md="3">
                    <v-date-input v-model="field.value.valid_from" label="From"
                        :picker-props="{ color: 'primary' }" input-format="yyyy-mm-dd" clearable />
                </v-col>
                <v-col cols="4" md="3">
                    <v-date-input v-model="field.value.valid_until" label="Until"
                        :picker-props="{ color: 'primary' }" input-format="yyyy-mm-dd" clearable
                        :error-messages="errAt(`offices[${i}].valid_until`)" />
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
import { officeKindLabels, type OfficeAffiliation, type OfficeKind } from '@/api/person'

// ---- Payload ---------------------------------------------------------------
export interface OfficePayload {
    id?: number                  // unique only within its kind's table
    kind: OfficeKind
    office_id: number
    position_id: number | null
    unit_id: number
    dedication: number | null
    valid_from: string | null
    valid_until: string | null
}
export interface OfficesPayload { offices: OfficePayload[] }

const props = withDefaults(defineProps<{
    offices?: OfficeAffiliation[]
    error?: string
    success?: string
}>(), { offices: () => [], error: '', success: '' })

const emit = defineEmits<{ submit: [payload: OfficesPayload] }>()

// ---- Lookups ---------------------------------------------------------------
const { items: units } = useLookup('units')
const lookups = {
    technician: { offices: useLookup('technician-offices').items, positions: useLookup('technician-positions').items },
    science_manager: { offices: useLookup('science-manager-offices').items, positions: useLookup('science-manager-positions').items },
    administrative: { offices: useLookup('administrative-offices').items, positions: useLookup('administrative-positions').items },
}
const officeItems = (k: OfficeKind | null) => (k ? lookups[k].offices.value : [])
const positionItems = (k: OfficeKind | null) => (k ? lookups[k].positions.value : [])
const kindItems = (Object.keys(officeKindLabels) as OfficeKind[]).map((k) => ({ value: k, title: officeKindLabels[k] }))

// ---- Form-side type --------------------------------------------------------
interface OfficeForm {
    id?: number
    kind: OfficeKind | null
    office_id: number | null
    position_id: number | null
    unit_id: number | null
    dedication: number | string | null      // '' while the field is cleared
    valid_from: Date | null
    valid_until: Date | null
}

// ---- Schema ----------------------------------------------------------------
const need = (msg: string) => z.number({ required_error: msg, invalid_type_error: msg })

const rowSchema = z.object({
    id: z.number().optional(),
    kind: z.enum(['technician', 'science_manager', 'administrative'], {
        errorMap: () => ({ message: 'Select a type' }),
    }),
    office_id: need('Select an office'),
    position_id: z.number().nullable(),
    unit_id: need('Select a unit'),
    dedication: z.preprocess(
        (v) => (v === '' || v === undefined ? null : v),
        z.number({ invalid_type_error: 'Enter a number' }).int().min(0).max(100).nullable(),
    ),
    valid_from: z.date().nullable(),
    valid_until: z.date().nullable(),
}).refine(
    (r) => !r.valid_from || !r.valid_until || r.valid_until >= r.valid_from,
    { message: 'End date must not be before the start date', path: ['valid_until'] },
)
const schema = z.object({ offices: z.array(rowSchema) })

// ---- Conversions -----------------------------------------------------------
function toFormValues(rows: OfficeAffiliation[]): { offices: OfficeForm[] } {
    return {
        offices: rows.map((r) => ({
            id: r.id,
            kind: r.kind,
            office_id: r.office_id,
            position_id: r.position_id,
            unit_id: r.unit_id,
            dedication: r.dedication,
            valid_from: fromIsoDateString(r.valid_from),
            valid_until: fromIsoDateString(r.valid_until),
        })),
    }
}
const asFormValues = (rows: OfficeAffiliation[]) => toFormValues(rows) as unknown as z.input<typeof schema>
const iso = (d: Date | null) => (d ? toIsoDateString(d) : null)

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: asFormValues(props.offices),
})
const { fields, push, remove, replace } = useFieldArray<OfficeForm>('offices')
const submitting = computed(() => isSubmitting.value)

function errAt(path: string) {
    const msg = (errors.value as Record<string, string | undefined>)[path]
    return msg ? [msg] : []
}
const rowHasErrors = (i: number) => Object.keys(errors.value).some((k) => k.startsWith(`offices[${i}].`))


function addRow() {
    push({ kind: null, office_id: null, position_id: null, unit_id: null, dedication: null, valid_from: null, valid_until: null })
}

watch(
    () => props.offices,
    (rows) => {
        resetForm({ values: asFormValues(rows) })
        replace(toFormValues(rows).offices)
    },
)

const onSubmit = handleSubmit((v) => {
    emit('submit', {
        offices: v.offices.map((r) => ({
            ...(r.id !== undefined ? { id: r.id } : {}),
            kind: r.kind,
            office_id: r.office_id,
            position_id: r.position_id,
            unit_id: r.unit_id,
            dedication: typeof r.dedication === 'number' ? r.dedication : null,
            valid_from: iso(r.valid_from),
            valid_until: iso(r.valid_until),
        })),
    })
})
</script>