<template>
    <v-form @submit.prevent="() => onSubmit()" class="mt-4">
        <v-row>
            <v-col cols="12" md="4">
                <v-text-field
                    v-model="phone"
                    label="Phone"
                    :error-messages="phoneErrors"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="2">
                <v-text-field
                    v-model="extension"
                    label="Extension"
                    :error-messages="extensionErrors"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="email"
                    label="Email"
                    :error-messages="emailErrors"
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

export interface ContactPayload {
    phone: string | null
    extension: string | null
    email: string | null
}

const emit = defineEmits<{
    submit: [payload: ContactPayload]
}>()


const props = withDefaults(defineProps<{
    initialValues?: ContactPayload
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const researcherInfoSchema = z
    .object({
        phone: z.string().max(45,'At most 45 characters'),
        extension: z.string().max(10,'At most 10 characters'),
        email: z.string().email('Must be a valid email address'),
    })

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(researcherInfoSchema),
    initialValues: {
        phone: props.initialValues?.phone ?? '',
        extension: props.initialValues?.extension ?? '',
        email: props.initialValues?.email ?? '',
    },
})

const { value: phone, errorMessage: phoneError } = useField<string>('phone')
const { value: extension, errorMessage: extensionError } = useField<string>('extension')
const { value: email, errorMessage: emailError } = useField<string>('email')

const phoneErrors = computed(() => (phoneError.value ? [phoneError.value] : []))
const extensionErrors = computed(() => (extensionError.value ? [extensionError.value] : []))
const emailErrors = computed(() => (emailError.value ? [emailError.value] : []))

const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        ...values,
    } as ContactPayload)
})

</script>