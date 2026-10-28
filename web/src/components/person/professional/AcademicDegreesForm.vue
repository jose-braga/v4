<template>
    <v-form @submit.prevent="() => onSubmit()">

        <p v-if="fields.length === 0" class="text-medium-emphasis mb-4">
            No degrees yet. Use the button below to add one.
        </p>

        <v-expansion-panels v-model="openPanels" multiple>
            <v-expansion-panel v-for="(field, i) in fields" :key="field.key" :value="field.key">
                <v-expansion-panel-title>
                    <div class="d-flex align-center flex-wrap ga-2">
                        <v-chip size="small" label :color="field.value.end ? undefined : 'success'">
                            {{ field.value.end ? 'Finished' : 'Ongoing' }}
                        </v-chip>
                        <span class="font-weight-medium">{{ summary(field.value) }}</span>
                        <v-icon v-if="rowHasErrors(i)" color="error" icon="mdi-alert-circle" />
                    </div>
                </v-expansion-panel-title>

                <v-expansion-panel-text>
                    <v-row dense class="mt-1">
                        <v-col cols="12" md="4">
                            <v-select
                                v-model="field.value.degree_id"
                                :items="degreeItems" item-title="name" item-value="id"
                                label="Degree"
                                :error-messages="errAt(`degrees[${i}].degree_id`)"
                            />
                        </v-col>
                        <v-col cols="12" md="8">
                            <v-text-field v-model="field.value.program" label="Programme"
                                :error-messages="errAt(`degrees[${i}].program`)" />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="field.value.institution" label="Institution"
                                :error-messages="errAt(`degrees[${i}].institution`)" />
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-text-field v-model="field.value.area" label="Area of study"
                                :error-messages="errAt(`degrees[${i}].area`)" />
                        </v-col>
                        <v-col cols="12">
                            <v-text-field v-model="field.value.title" label="Thesis title"
                                :error-messages="errAt(`degrees[${i}].title`)" />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-date-input v-model="field.value.start" label="Started"
                                input-format="yyyy-mm-dd" clearable :picker-props="{ color: 'primary' }"/>
                        </v-col>
                        <v-col v-if="!field.value.end" cols="12" md="4">
                            <v-date-input v-model="field.value.estimate_end" label="Expected end"
                                :picker-props="{ color: 'primary' }"
                                input-format="yyyy-mm-dd" clearable />
                        </v-col>
                        <v-col cols="12" md="4">
                            <v-date-input v-model="field.value.end" label="Ended"
                                input-format="yyyy-mm-dd" clearable :picker-props="{ color: 'primary' }"
                                hint="Empty if ongoing" persistent-hint
                                :error-messages="errAt(`degrees[${i}].end`)" />
                        </v-col>
                    </v-row>

                    <!-- Internal supervisors -->
                    <div class="text-subtitle-2 mt-4 mb-2">LAQV/UCIBIO supervisors</div>
                    <v-sheet v-for="(_, j) in field.value.supervisors" :key="`s${j}`" border rounded class="pa-3 mb-2">
                        <v-row dense align="start">
                            <v-col cols="12" md="3">
                                <v-select v-model="field.value.supervisors[j].supervisor_type_id"
                                    :items="typeItems" item-title="name" item-value="id" label="Type"
                                    :error-messages="errAt(`degrees[${i}].supervisors[${j}].supervisor_type_id`)" />
                            </v-col>
                            <v-col cols="12" md="8">
                                <v-autocomplete v-model="field.value.supervisors[j].supervisor_id"
                                    :items="peopleItems" item-title="name" item-value="id" label="Supervisor"
                                    :error-messages="errAt(`degrees[${i}].supervisors[${j}].supervisor_id`)" />
                            </v-col>
                        </v-row>
                        <v-row dense align="start">
                            <v-col cols="6" md="4">
                                <v-date-input v-model="field.value.supervisors[j].valid_from" label="From"
                                    input-format="yyyy-mm-dd" clearable :picker-props="{ color: 'primary' }" />
                            </v-col>
                            <v-col cols="6" md="4">
                                <v-date-input v-model="field.value.supervisors[j].valid_until" label="Until"
                                    input-format="yyyy-mm-dd" clearable :picker-props="{ color: 'primary' }"
                                    :error-messages="errAt(`degrees[${i}].supervisors[${j}].valid_until`)" />
                            </v-col>
                            <v-col cols="12" md="1" class="d-flex justify-end">
                                <v-btn icon="mdi-delete" color="error" variant="text"
                                    @click="removeSupervisor(i, 'supervisors', j)" />
                            </v-col>
                        </v-row>
                    </v-sheet>
                    <v-btn size="small" variant="outlined" prepend-icon="mdi-plus"
                        @click="addSupervisor(i, 'supervisors')">Add supervisor</v-btn>

                    <!-- External supervisors -->
                    <div class="text-subtitle-2 mt-6 mb-2">Supervisors, other institutions</div>
                    <v-sheet v-for="(_, j) in field.value.external_supervisors" :key="`e${j}`" border rounded class="pa-3 mb-2">
                        <v-row dense align="start">
                            <v-col cols="12" md="3">
                                <v-select v-model="field.value.external_supervisors[j].supervisor_type_id"
                                    :items="typeItems" item-title="name" item-value="id" label="Type"
                                    :error-messages="errAt(`degrees[${i}].external_supervisors[${j}].supervisor_type_id`)" />
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-text-field v-model="field.value.external_supervisors[j].colloquial_name" label="Name"
                                    :error-messages="errAt(`degrees[${i}].external_supervisors[${j}].colloquial_name`)" />
                            </v-col>
                            <v-col cols="12" md="4">
                                <v-text-field v-model="field.value.external_supervisors[j].organization" label="Organization"
                                    :error-messages="errAt(`degrees[${i}].external_supervisors[${j}].organization`)" />
                            </v-col>
                            <v-col cols="12" md="1" class="d-flex justify-end">
                                <v-btn icon="mdi-delete" color="error" variant="text"
                                    @click="removeSupervisor(i, 'external_supervisors', j)" />
                            </v-col>
                            <v-col cols="6" md="4">
                                <v-date-input v-model="field.value.external_supervisors[j].valid_from" label="From"
                                    :picker-props="{ color: 'primary' }"
                                    input-format="yyyy-mm-dd" clearable />
                            </v-col>
                            <v-col cols="6" md="4">
                                <v-date-input v-model="field.value.external_supervisors[j].valid_until" label="Until"
                                    :picker-props="{ color: 'primary' }"
                                    input-format="yyyy-mm-dd" clearable
                                    :error-messages="errAt(`degrees[${i}].external_supervisors[${j}].valid_until`)" />
                            </v-col>
                        </v-row>
                    </v-sheet>
                    <v-btn size="small" variant="outlined" prepend-icon="mdi-plus"
                        @click="addSupervisor(i, 'external_supervisors')">Add supervisor</v-btn>

                    <v-divider class="my-4" />
                    <v-btn color="error" variant="text" prepend-icon="mdi-delete" @click="removeDegree(i)">
                        Remove degree
                    </v-btn>
                </v-expansion-panel-text>
            </v-expansion-panel>
        </v-expansion-panels>

        <div class="d-flex justify-space-between align-center mt-4">
            <v-btn variant="outlined" prepend-icon="mdi-plus" @click="addDegree">Add a degree</v-btn>
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
export interface DegreeSupervisor {
    id?: number
    supervisor_type_id: number
    supervisor_id: number
    valid_from: string | null
    valid_until: string | null
}
export interface DegreeExternalSupervisor {
    id?: number
    supervisor_type_id: number
    colloquial_name: string
    organization: string | null
    valid_from: string | null
    valid_until: string | null
}
export interface AcademicDegree {
    id?: number
    degree_id: number
    program: string | null
    area: string | null
    institution: string | null
    title: string | null
    start: string | null
    estimate_end: string | null
    end: string | null
    supervisors: DegreeSupervisor[]
    external_supervisors: DegreeExternalSupervisor[]
}
export interface AcademicDegreesPayload {
    degrees: AcademicDegree[]
}

const props = withDefaults(defineProps<{
    initialValues?: AcademicDegreesPayload
    error?: string
    success?: string
}>(), { error: '', success: '' })

const emit = defineEmits<{ submit: [payload: AcademicDegreesPayload] }>()

// ---- Lookups ---------------------------------------------------------------
const { items: degreeItems } = useLookup('academic-degrees')
const { items: typeItems } = useLookup('supervisor-types')
const { items: peopleItems } = useLookup('people')

// ---- Form-side types (Dates instead of strings) ----------------------------
interface SupervisorForm {
    id?: number
    supervisor_type_id: number | null
    supervisor_id: number | null
    valid_from: Date | null
    valid_until: Date | null
}
interface ExternalSupervisorForm {
    id?: number
    supervisor_type_id: number | null
    colloquial_name: string
    organization: string | null
    valid_from: Date | null
    valid_until: Date | null
}
interface DegreeForm {
    id?: number
    degree_id: number | null
    program: string | null
    area: string | null
    institution: string | null
    title: string | null
    start: Date | null
    estimate_end: Date | null
    end: Date | null
    supervisors: SupervisorForm[]
    external_supervisors: ExternalSupervisorForm[]
}
type SupervisorKind = 'supervisors' | 'external_supervisors'

// ---- Schema ----------------------------------------------------------------
const typeId = z.number({ required_error: 'Select a type', invalid_type_error: 'Select a type' })
const endAfterStart = (r: { valid_from: Date | null; valid_until: Date | null }) =>
    !r.valid_from || !r.valid_until || r.valid_until >= r.valid_from
const endMsg = { message: 'Must not be before the start', path: ['valid_until'] }

const supervisorSchema = z.object({
    id: z.number().optional(),
    supervisor_type_id: typeId,
    supervisor_id: z.number({ required_error: 'Select a person', invalid_type_error: 'Select a person' }),
    valid_from: z.date().nullable(),
    valid_until: z.date().nullable(),
}).refine(endAfterStart, endMsg)

const externalSupervisorSchema = z.object({
    id: z.number().optional(),
    supervisor_type_id: typeId,
    colloquial_name: z.string().trim().min(1, 'Name is required').max(100),
    organization: z.string().max(100).nullable(),
    valid_from: z.date().nullable(),
    valid_until: z.date().nullable(),
}).refine(endAfterStart, endMsg)

const degreeSchema = z.object({
    id: z.number().optional(),
    degree_id: z.number({ required_error: 'Select a degree', invalid_type_error: 'Select a degree' }),
    program: z.string().max(100).nullable(),
    area: z.string().max(100).nullable(),
    institution: z.string().max(100).nullable(),
    title: z.string().max(300).nullable(),
    start: z.date().nullable(),
    estimate_end: z.date().nullable(),
    end: z.date().nullable(),
    supervisors: z.array(supervisorSchema),
    external_supervisors: z.array(externalSupervisorSchema),
}).refine((d) => !d.start || !d.end || d.end >= d.start,
    { message: 'End date must not be before the start date', path: ['end'] })

const schema = z.object({ degrees: z.array(degreeSchema) })

// ---- Conversions -----------------------------------------------------------
function toFormValues(p?: AcademicDegreesPayload): { degrees: DegreeForm[] } {
    const sorted = [...(p?.degrees ?? [])].sort(
        // ongoing first, then newest start first
        (a, b) => Number(!!a.end) - Number(!!b.end) || (b.start ?? '').localeCompare(a.start ?? '')
    )
    return {
        degrees: sorted.map((d) => ({
            id: d.id,
            degree_id: d.degree_id,
            program: d.program,
            area: d.area,
            institution: d.institution,
            title: d.title,
            start: fromIsoDateString(d.start),
            estimate_end: fromIsoDateString(d.estimate_end),
            end: fromIsoDateString(d.end),
            supervisors: (d.supervisors ?? []).map((s) => ({
                ...s,
                valid_from: fromIsoDateString(s.valid_from),
                valid_until: fromIsoDateString(s.valid_until),
            })),
            external_supervisors: (d.external_supervisors ?? []).map((s) => ({
                ...s,
                valid_from: fromIsoDateString(s.valid_from),
                valid_until: fromIsoDateString(s.valid_until),
            })),
        })),
    }
}
// vee-validate types the form values from the schema (degree_id: number), but a
// freshly added row legitimately has null until the user picks one. Validation
// still guarantees a number by the time onSubmit runs.
const asFormValues = (p?: AcademicDegreesPayload) =>
    toFormValues(p) as unknown as z.input<typeof schema>

const iso = (d: Date | null) => (d ? toIsoDateString(d) : null)
const txt = (s: string | null) => s?.trim() || null     // '' -> null

// ---- Form ------------------------------------------------------------------
const { handleSubmit, isSubmitting, errors, meta, resetForm, values, setFieldValue } = useForm({
    validationSchema: toTypedSchema(schema),
    initialValues: asFormValues(props.initialValues),
})

const { fields, push, remove, replace } = useFieldArray<DegreeForm>('degrees')

const openPanels = ref<(string | number)[]>([])
const submitting = computed(() => isSubmitting.value)

function errAt(path: string) {
    const msg = (errors.value as Record<string, string | undefined>)[path]
    return msg ? [msg] : []
}
function rowHasErrors(i: number) {
    return Object.keys(errors.value).some((k) => k.startsWith(`degrees[${i}].`))
}

function summary(d: DegreeForm) {
    const degree = degreeItems.value.find((x: { id: number }) => x.id === d.degree_id)?.name
    const years = d.start || d.end
        ? `${d.start?.getFullYear() ?? '?'}–${d.end?.getFullYear() ?? 'present'}`
        : ''
    return [degree, d.area, years].filter(Boolean).join(' · ') || 'New degree'
}

function addDegree() {
    push({
        degree_id: null, program: null, area: null, institution: null, title: null,
        start: null, estimate_end: null, end: null,
        supervisors: [], external_supervisors: [],
    })
    openPanels.value = [...openPanels.value, fields.value[fields.value.length - 1].key]
}
function removeDegree(i: number) {
    remove(i)
}

// Nested lists are updated through setFieldValue so vee-validate sees the change.
function currentList(i: number, kind: SupervisorKind): unknown[] {
    return ((values.degrees?.[i] as DegreeForm | undefined)?.[kind] ?? []) as unknown[]
}
function addSupervisor(i: number, kind: SupervisorKind) {
    const blank = kind === 'supervisors'
        ? { supervisor_type_id: null, supervisor_id: null, valid_from: null, valid_until: null }
        : { supervisor_type_id: null, colloquial_name: '', organization: null, valid_from: null, valid_until: null }
    setFieldValue(`degrees[${i}].${kind}` as never, [...currentList(i, kind), blank] as never)
}
function removeSupervisor(i: number, kind: SupervisorKind, j: number) {
    setFieldValue(
        `degrees[${i}].${kind}` as never,
        currentList(i, kind).filter((_, k) => k !== j) as never,
    )
}

// Parent hands us the saved data after a successful save (new rows have ids).
watch(
    () => props.initialValues,
    (v) => {
        const next = asFormValues(v)
        resetForm({ values: next })
        replace(next.degrees)
    },
)

const onSubmit = handleSubmit(
    (v) => {
        emit('submit', {
            degrees: v.degrees.map((d) => ({
                ...(d.id !== undefined ? { id: d.id } : {}),
                degree_id: d.degree_id,
                program: txt(d.program),
                area: txt(d.area),
                institution: txt(d.institution),
                title: txt(d.title),
                start: iso(d.start),
                estimate_end: d.end ? null : iso(d.estimate_end),   // meaningless once finished
                end: iso(d.end),
                supervisors: d.supervisors.map((s) => ({
                    ...(s.id !== undefined ? { id: s.id } : {}),
                    supervisor_type_id: s.supervisor_type_id,
                    supervisor_id: s.supervisor_id,
                    valid_from: iso(s.valid_from),
                    valid_until: iso(s.valid_until),
                })),
                external_supervisors: d.external_supervisors.map((s) => ({
                    ...(s.id !== undefined ? { id: s.id } : {}),
                    supervisor_type_id: s.supervisor_type_id,
                    colloquial_name: s.colloquial_name.trim(),
                    organization: txt(s.organization),
                    valid_from: iso(s.valid_from),
                    valid_until: iso(s.valid_until),
                })),
            })),
        })
    },
    // invalid: open every panel that contains an error
    ({ errors: errs }) => {
        const bad = new Set(
            Object.keys(errs)
                .map((k) => /^degrees\[(\d+)\]/.exec(k)?.[1])
                .filter((n): n is string => n !== undefined)
                .map(Number),
        )
        const keys = fields.value.filter((_, i) => bad.has(i)).map((f) => f.key)
        openPanels.value = [...new Set([...openPanels.value, ...keys])]
    },
)
</script>