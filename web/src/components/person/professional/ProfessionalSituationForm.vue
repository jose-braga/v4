<template>
    <v-form @submit.prevent="() => onSubmit()">
        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No professional situations yet. Use the button below to add one.
        </p>

        <v-expansion-panels v-model="openPanels" multiple>
            <v-expansion-panel v-for="(field, i) in fields" :key="field.key" :value="field.key">
                <v-expansion-panel-title>
                    <div class="d-flex align-center flex-wrap ga-2">
                        <v-chip size="small" label :color="isCurrent(field.value) ? 'success' : undefined">
                            {{ isCurrent(field.value) ? 'Current' : 'Past' }}
                        </v-chip>
                        <span class="font-weight-medium">{{ summary(field.value) }}</span>
                        <v-chip v-if="field.value.is_fellowship" size="small" label variant="outlined">Fellowship</v-chip>
                        <v-icon v-if="rowHasErrors(i)" color="error" icon="mdi-alert-circle" />
                    </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                    <v-row dense class="mt-1">
                        <v-col cols="12" md="5">
                            <v-select
                                v-model="field.value.situation_id"
                                :items="situationItems" item-title="title" item-value="id"
                                label="Situation"
                                :error-messages="errAt(`jobs[${i}].situation_id`)"
                                @update:model-value="field.value.category_situation_id = null"
                            />
                        </v-col>
                        <v-col cols="12" md="7">
                            <v-select
                                v-model="field.value.category_situation_id"
                                :items="categoryItems(field.value)" item-title="title" item-value="id"
                                label="Category"
                                :disabled="!field.value.situation_id"
                                :error-messages="errAt(`jobs[${i}].category_situation_id`)"
                            />
                        </v-col>

                        <v-col cols="12" md="10">
                            <v-text-field v-model="field.value.organization" label="Contract institution"
                                :error-messages="errAt(`jobs[${i}].organization`)" />
                        </v-col>
                        <v-col cols="4" md="2">
                            <v-text-field v-model.number="field.value.dedication" label="Dedication"
                                type="number" suffix="%" min="0" max="100"
                                :error-messages="errAt(`jobs[${i}].dedication`)" />
                        </v-col>
                        <v-col cols="6" md="4">
                            <v-date-input v-model="field.value.valid_from" label="Started"
                                :picker-props="{ color: 'primary' }"
                                input-format="yyyy-mm-dd" clearable />
                        </v-col>
                        <v-col cols="6" md="4">
                            <v-date-input v-model="field.value.valid_until" label="Ended"
                                :picker-props="{ color: 'primary' }"
                                input-format="yyyy-mm-dd" clearable
                                :error-messages="errAt(`jobs[${i}].valid_until`)" />
                        </v-col>
                        <v-col cols="12" md="4" class="d-flex align-center">
                            <v-switch v-model="field.value.is_fellowship" label="Fellowship"
                                color="primary" hide-details />
                        </v-col>
                        <v-col cols="12" md="5">
                            <v-autocomplete v-model="field.value.funding_agency_id"
                                :items="fundingAgencies" item-title="name" item-value="id"
                                label="Funding agency" clearable />
                        </v-col>
                        <v-col cols="12" md="5">
                            <v-autocomplete v-model="field.value.management_entity_id"
                                :items="managementEntities" item-title="name" item-value="id"
                                label="Management entity" clearable />
                        </v-col>

                        <v-col cols="12">
                            <v-textarea v-model="field.value.other_data" label="Other information"
                                hint="E.g. fellowship or contract reference, or other details"
                                persistent-hint auto-grow rows="2" counter="1000"
                                :error-messages="errAt(`jobs[${i}].other_data`)" />
                        </v-col>
                    </v-row>

                    <v-divider class="my-4" />
                    <v-btn color="error" variant="text" prepend-icon="mdi-delete" @click="remove(i)">
                        Remove this professional situation
                    </v-btn>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <div class="d-flex justify-space-between align-center mt-4">
            <v-btn variant="outlined" prepend-icon="mdi-plus" @click="addJob">Add professional situation</v-btn>
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
                <v-btn type="submit" color="primary"
                    :loading="submitting"
                    :disabled="!meta.dirty">Update
                </v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useFieldArray, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useLookup } from '@/composables/useLookup'
import { toIsoDateString, fromIsoDateString } from '@/utils/date'

// ---- Payload ---------------------------------------------------------------
export interface Job {
    id?: number
    situation_id?: number | null
    category_situation_id: number
    organization: string | null
    dedication: number | null
    valid_from: string | null
    valid_until: string | null
    funding_agency_id: number | null
    management_entity_id: number | null
    is_fellowship: boolean
    other_data: string | null
}
export interface JobsPayload { jobs: Job[] }

const props = withDefaults(defineProps<{
    initialValues?: JobsPayload
    error?: string
    success?: string
}>(), { error: '', success: '' })

const emit = defineEmits<{ submit: [payload: JobsPayload] }>()

// ---- Lookups ---------------------------------------------------------------
interface Pair { id: number; situation_id: number; name: string; visible: number | boolean; sort_order: number }
interface Situation { id: number; name: string; visible: number | boolean; sort_order: number }

const { items: situations } = useLookup('situations')
const { items: pairItems } = useLookup('situation-categories')
const { items: managementEntities } = useLookup('management-entities')
const { items: fundingAgencies } = useLookup('funding-agencies')
function withOldLabel<T extends { name: string; visible: number | boolean; sort_order: number }>(list: T[]) {
    return [...list]
        .sort((a, b) =>
            Number(!!b.visible) - Number(!!a.visible)
            || a.sort_order - b.sort_order
            || a.name.localeCompare(b.name))
        .map((x) => ({ ...x, title: x.visible ? x.name : `(old) ${x.name}` }))
}

const pairs = computed(() => pairItems.value as Pair[])
const situationItems = computed(() => withOldLabel(situations.value as Situation[]))

// ---- Form-side type --------------------------------------------------------
interface JobForm {
    id?: number
    situation_id: number | null
    category_situation_id: number | null
    organization: string | null
    dedication: number | string | null     // '' while the field is cleared
    valid_from: Date | null
    valid_until: Date | null
    funding_agency_id: number | null
    management_entity_id: number | null
    is_fellowship: boolean
    other_data: string | null
}

// ---- Schema ----------------------------------------------------------------
const rowSchema = z.object({
    id: z.number().optional(),
    situation_id: z.number({ required_error: 'Select a situation', invalid_type_error: 'Select a situation' }),
    category_situation_id: z.number({ required_error: 'Select a category', invalid_type_error: 'Select a category' }),
    organization: z.string().max(200).nullable(),
    dedication: z.preprocess(
        (v) => (v === '' || v === undefined ? null : v),
        z.number({ invalid_type_error: 'Enter a number' }).int().min(0).max(100).nullable(),
    ),
    valid_from: z.date().nullable(),
    valid_until: z.date().nullable(),
    funding_agency_id: z.number().nullable(),
    management_entity_id: z.number().nullable(),
    is_fellowship: z.boolean(),
    other_data: z.string().max(1000).nullable(),
}).refine(
    (r) => !r.valid_from || !r.valid_until || r.valid_until >= r.valid_from,
    { message: 'End date must not be before the start date', path: ['valid_until'] },
)

const schema = z.object({ jobs: z.array(rowSchema) })

// ---- Conversions -----------------------------------------------------------
function toFormValues(p?: JobsPayload): { jobs: JobForm[] } {
    const sorted = [...(p?.jobs ?? [])].sort(
        // current first (no end date), then newest start first
        (a, b) => Number(!!a.valid_until) - Number(!!b.valid_until) || (b.valid_from ?? '').localeCompare(a.valid_from ?? '')
    )
    return {
        jobs: sorted.map((j) => ({
            id: j.id,
            situation_id: j.situation_id ?? null,
            category_situation_id: j.category_situation_id,
            organization: j.organization,
            dedication: j.dedication,
            valid_from: fromIsoDateString(j.valid_from),
            valid_until: fromIsoDateString(j.valid_until),
            funding_agency_id: j.funding_agency_id,
            management_entity_id: j.management_entity_id,
            is_fellowship: !!j.is_fellowship,           // MySQL BOOL arrives as 0/1
            other_data: j.other_data,
        })),
    }
}
// freshly added rows hold nulls the schema would reject: cast once, validation covers it
const asFormValues = (p?: JobsPayload) => toFormValues(p) as unknown as z.input<typeof schema>

const iso = (d: Date | null) => (d ? toIsoDateString(d) : null)
const txt = (s: string | null) => s?.trim() || null

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm, setFieldValue } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: asFormValues(props.initialValues),
})
const { fields, push, remove, replace } = useFieldArray<JobForm>('jobs')

const openPanels = ref<(string | number)[]>([])
const submitting = computed(() => isSubmitting.value)

function errAt(path: string) {
    const msg = (errors.value as Record<string, string | undefined>)[path]
    return msg ? [msg] : []
}
function rowHasErrors(i: number) {
    return Object.keys(errors.value).some((k) => k.startsWith(`jobs[${i}].`))
}

// categories of the chosen situation: visible ones, plus the one already saved
function categoryItems(j: JobForm) {
    return withOldLabel(pairs.value.filter((p) => p.situation_id === j.situation_id))
}
function isCurrent(j: JobForm) {
    return !j.valid_until || j.valid_until >= new Date()
}
function summary(j: JobForm) {
    const situation = situations.value.find((s: { id: number }) => s.id === j.situation_id)?.name
    const category = pairs.value.find((p) => p.id === j.category_situation_id)?.name
    const years = j.valid_from || j.valid_until
        ? `${j.valid_from?.getFullYear() ?? '?'}–${j.valid_until?.getFullYear() ?? 'present'}`
        : ''
    const dedication = typeof j.dedication === 'number' ? `${j.dedication}%` : ''
    return [situation, category !== situation ? category : null, j.organization, years, dedication]
        .filter(Boolean).join(' · ') || 'New professional situation'
}

function addJob() {
    push({
        situation_id: null, category_situation_id: null, organization: null, dedication: null,
        valid_from: null, valid_until: null,
        funding_agency_id: null, management_entity_id: null, is_fellowship: false, other_data: null,
    })
    openPanels.value = [...openPanels.value, fields.value[fields.value.length - 1].key]
}

watch(
    () => props.initialValues,
    (v) => {
        resetForm({ values: asFormValues(v) })
        replace(toFormValues(v).jobs)
    },
)

const onSubmit = handleSubmit(
    (v) => {
        emit('submit', {
            jobs: v.jobs.map((j) => ({
                ...(j.id !== undefined ? { id: j.id } : {}),
                category_situation_id: j.category_situation_id,
                organization: txt(j.organization),
                dedication: typeof j.dedication === 'number' ? j.dedication : null,
                valid_from: iso(j.valid_from),
                valid_until: iso(j.valid_until),
                funding_agency_id: j.funding_agency_id,
                management_entity_id: j.management_entity_id,
                is_fellowship: j.is_fellowship,
                other_data: txt(j.other_data),
            })),
        })
    },
    // invalid: open every panel that contains an error
    ({ errors: errs }) => {
        const bad = new Set(
            Object.keys(errs)
                .map((k) => /^jobs\[(\d+)\]/.exec(k)?.[1])
                .filter((n): n is string => n !== undefined)
                .map(Number),
        )
        const keys = fields.value.filter((_, i) => bad.has(i)).map((f) => f.key)
        openPanels.value = [...new Set([...openPanels.value, ...keys])]
    },
)
</script>