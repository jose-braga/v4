<template>
    <v-form @submit.prevent="() => onSubmit()">

        <v-row>
            <v-col cols="12" md="12">
                <v-text-field
                    v-model="address"
                    label="Address"
                    outlined
                    :error-messages="addressErrors"
                ></v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" md="4">
                <v-text-field
                    v-model="postal_code"
                    label="Postal Code"
                    outlined
                    :error-messages="postal_codeErrors"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="8">
                <v-text-field
                    v-model="city"
                    label="City"
                    outlined
                    :error-messages="cityErrors"
                ></v-text-field>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="phone"
                    label="Personal Phone"
                    outlined
                    :error-messages="phoneErrors"
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="email"
                    label="Personal Email"
                    outlined
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

export interface PersonalContactsPayload {
    address: string
    postal_code: string
    city: string
    phone: string
    email: string
}

const props = withDefaults(defineProps<{
    initialValues?: Partial<PersonalContactsPayload>
    error?: string
    success?: string
}>(), {
    error: '',
    success: '',
})

const emit = defineEmits<{
    submit: [payload: PersonalContactsPayload]
}>()


const personalContactsSchema = z.object({
    address: z.string().max(150, 'Limit address to 150 characters.'),
    postal_code: z.string().max(8, 'Max 8 characters.'),
    city: z.string().max(50, 'Max 8 characters.'),
    phone: z.string().max(150, 'Max 8 characters.'),
    email: z.string().trim().email('Enter a valid email address'),
})

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(personalContactsSchema),
    initialValues: {
        address: props.initialValues?.address ?? '',
        postal_code: props.initialValues?.postal_code ?? '',
        city: props.initialValues?.city ?? '',
        phone: props.initialValues?.phone ?? '',
        email: props.initialValues?.email ?? '',
    },
})

const { value: address, errorMessage: addressError } = useField<string>('address')
const { value: postal_code, errorMessage: postal_codeError } = useField<string>('postal_code')
const { value: city, errorMessage: cityError } = useField<string>('city')
const { value: phone, errorMessage: phoneError } = useField<string>('phone')
const { value: email, errorMessage: emailError } = useField<string>('email')

const addressErrors = computed(() => (addressError.value ? [addressError.value] : []))
const postal_codeErrors = computed(() => (postal_codeError.value ? [postal_codeError.value] : []))
const cityErrors = computed(() => (cityError.value ? [cityError.value] : []))
const phoneErrors = computed(() => (phoneError.value ? [phoneError.value] : []))
const emailErrors = computed(() => (emailError.value ? [emailError.value] : []))

const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit((values) => {
    emit('submit', {
        ...values,
    } as PersonalContactsPayload)
})
</script>

<style scoped>
</style>