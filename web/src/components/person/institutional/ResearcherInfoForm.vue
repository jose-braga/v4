<template>
    <v-form @submit.prevent="() => onSubmit()" class="mt-4">
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="ciencia_id"
                    label="Ciência ID"
                    :error-messages="ciencia_idErrors"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="ORCID"
                    label="ORCID"
                    :error-messages="ORCIDErrors"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
                <v-text-field
                    v-model="researcherID"
                    label="ResearcherID"
                    :error-messages="researcherIDErrors"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
                <v-text-field
                    v-model="scopusID"
                    label="Scopus ID"
                    :error-messages="scopusIDErrors"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="4">
                <v-text-field
                    v-model="pure_id"
                    type="text"
                    label="PURE ID (NOVA FCT)"
                    :error-messages="pure_idErrors"
                ></v-text-field>
            </v-col>
        </v-row>
        <v-row>
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
                >
                    Update
                </v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

export interface ResearcherInfoPayload {
    ciencia_id: string | null
    ORCID: string | null
    researcherID: string | null
    scopusID: string | null
    //institutional_repository_id: string | null
    pure_id: number | null
}

const emit = defineEmits<{
    submit: [payload: ResearcherInfoPayload]
}>()


const props = withDefaults(defineProps<{
    initialValues?: ResearcherInfoPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})
const pureIdSchema = z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? null : Number(val)),
    z.number({ invalid_type_error: 'Must be a valid number' })
     .int('Must be an integer')
     .nullable()
)
const researcherInfoSchema = z
    .object({
        ciencia_id: z.string().max(14,'Exactly 14 characters long').min(14,'Exactly 14 characters long'),
        ORCID: z.string().max(19,'Exactly 19 characters long').min(19,'Exactly 19 characters long'),
        researcherID: z.string().max(11,'At most 11 characters'),
        scopusID: z.string().max(10,'At most 10 characters'),
        //institutional_repository_id: z.string().max(200,'At most 200 characters'),
        pure_id: pureIdSchema,
    })

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(researcherInfoSchema),
    initialValues: {
        ciencia_id: props.initialValues?.ciencia_id ?? '',
        ORCID: props.initialValues?.ORCID ?? '',
        researcherID: props.initialValues?.researcherID ?? '',
        scopusID: props.initialValues?.scopusID ?? '',
        //institutional_repository_id: props.initialValues?.institutional_repository_id ?? '',
        pure_id: props.initialValues?.pure_id ?? null,
    },
})

const { value: ciencia_id, errorMessage: cienciaIdError } = useField<string>('ciencia_id')
const { value: ORCID, errorMessage: orcidError } = useField<string>('ORCID')
const { value: researcherID, errorMessage: researcherIdError } = useField<string>('researcherID')
const { value: scopusID, errorMessage: scopusIdError } = useField<string>('scopusID')
const { value: pure_id, errorMessage: pureIdError } = useField<number | null>('pure_id')

const ciencia_idErrors = computed(() => (cienciaIdError.value ? [cienciaIdError.value] : []))
const ORCIDErrors = computed(() => (orcidError.value ? [orcidError.value] : []))
const researcherIDErrors = computed(() => (researcherIdError.value ? [researcherIdError.value] : []))
const scopusIDErrors = computed(() => (scopusIdError.value ? [scopusIdError.value] : []))
const pure_idErrors = computed(() => (pureIdError.value ? [pureIdError.value] : []))

const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        ...values,
    } as ResearcherInfoPayload)
})

</script>