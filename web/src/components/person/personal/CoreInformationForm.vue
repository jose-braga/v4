<template>
    <v-form @submit.prevent="() => onSubmit()">
        <v-text-field
            v-model="name"
            label="Full Name"
            outlined
            :error-messages="nameErrors"
        ></v-text-field>

        <v-text-field
            v-model="colloquial_name"
            label="Display Name"
            hint="This is the name that will be displayed to others"
            persistent-hint
            outlined
            class="mb-4"
            :error-messages="colloquial_nameErrors"
        ></v-text-field>

        <v-row>
            <v-col cols="12" md="4">
                <v-select
                    v-model="gender"
                    :items="genderOptions"
                    label="Gender"
                    outlined
                    :error-messages="genderErrors"
                ></v-select>
            </v-col>
            <v-col cols="12" md="4">
                <v-date-input
                    v-model="birth_date"
                    label="Birth date"
                    :picker-props="{ color: 'primary' }"
                    input-format="yyyy-mm-dd"
                    :error-messages="birth_dateErrors"
                ></v-date-input>
            </v-col>
            <v-col cols="12" md="4">

                <v-autocomplete
                    v-model="nationalities"
                    :items="countries"
                    item-title="name"
                    item-value="id"
                    label="Nationalities"
                    outlined
                    multiple
                    chips
                    closable-chips
                    :loading="countriesLoading"
                     :error-messages="nationalitiesErrors"
                ></v-autocomplete>
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
import { toIsoDateString } from '@/utils/date'
import { useLookup } from '@/composables/useLookup'

export interface CoreInformationPayload {
    name: string
    colloquial_name: string
    gender: 'M' | 'F' | 'O'
    birth_date: string // ISO yyyy-mm-dd
    nationalities: number[]
}

const props = withDefaults(defineProps<{
    initialValues?: Partial<CoreInformationPayload>
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const emit = defineEmits<{
    submit: [payload: CoreInformationPayload]
}>()

const { items: countries, loading: countriesLoading } = useLookup('countries')

const genderOptions = [
    { title: 'Male', value: 'M' },
    { title: 'Female', value: 'F' },
    { title: 'Other', value: 'O' },
]

const coreInfoSchema = z.object({
    name: z.string()
        .min(1, 'Full name is required')
        .refine(
            (v) => v.trim().split(/\s+/).length >= 2,
            'Please enter at least a name and surname'
        ),
    colloquial_name: z
        .string()
        .min(1, 'Display name is required')
        .refine(
            (v) => v.trim().split(/\s+/).length >= 2,
            'Please enter at least a name and surname'
        ),
    gender: z.enum(['M', 'F', 'O'], {
        errorMap: () => ({ message: 'Please select a gender' }),
    }),
    birth_date: z
        .date({
            required_error: 'Birth date is required',
            invalid_type_error: 'Please enter a valid birth date',
        }),
    nationalities: z.array(z.number()).default([]),
})

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(coreInfoSchema),
    initialValues: {
        name: props.initialValues?.name ?? '',
        colloquial_name: props.initialValues?.colloquial_name ?? '',
        gender: props.initialValues?.gender,
        birth_date: props.initialValues?.birth_date ? new Date(props.initialValues.birth_date) : undefined,
        nationalities: props.initialValues?.nationalities,
    },
})

const { value: name, errorMessage: nameError } = useField<string>('name')
const { value: colloquial_name, errorMessage: colloquial_nameError } = useField<string>('colloquial_name')
const { value: gender, errorMessage: genderError } = useField<string>('gender')
const { value: birth_date, errorMessage: birth_dateError } = useField<Date | undefined>('birth_date')
const { value: nationalities, errorMessage: nationalitiesError } = useField<number[]>('nationalities')

const nameErrors = computed(() => (nameError.value ? [nameError.value] : []))
const colloquial_nameErrors = computed(() => (colloquial_nameError.value ? [colloquial_nameError.value] : []))
const genderErrors = computed(() => (genderError.value ? [genderError.value] : []))
const birth_dateErrors = computed(() => (birth_dateError.value ? [birth_dateError.value] : []))
const nationalitiesErrors = computed(() => (nationalitiesError.value ? [nationalitiesError.value] : []))

const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        ...values,
        birth_date: values.birth_date ? toIsoDateString(values.birth_date) : '',
    } as CoreInformationPayload)
})
</script>

<style scoped>
</style>