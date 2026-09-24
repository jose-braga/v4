<template>
    <v-container class="d-flex justify-center" style="margin-top: 64px">
        <v-card min-width="360" max-width="420">
            <v-card-title>Reset Password</v-card-title>
            <v-card-text>
                <div v-if="!token">
                    <v-alert type="error" density="comfortable">
                        This reset link is missing its token. Please use the link from your email, or request a new one.
                    </v-alert>
                </div>

                <div v-else-if="success">
                    <v-alert type="success" density="comfortable" class="mb-4">
                        {{ success }}
                    </v-alert>
                    <v-btn color="primary" block @click="router.push('/')">
                        Go to homepage
                    </v-btn>
                </div>

                <v-form v-else @submit.prevent="() => onSubmit()">
                    <v-text-field
                        v-model="newPassword"
                        label="New Password"
                        type="password"
                        outlined
                        :error-messages="newPasswordErrors"
                    ></v-text-field>
                    <v-text-field
                        v-model="confirmPassword"
                        label="Confirm New Password"
                        type="password"
                        outlined
                        :error-messages="confirmPasswordErrors"
                    ></v-text-field>

                    <v-alert v-if="error" type="error" density="compact" class="mb-4">
                        {{ error }}
                    </v-alert>

                    <v-btn
                        type="submit"
                        color="primary"
                        size="large"
                        block
                        :loading="submitting"
                    >
                        Reset Password
                    </v-btn>
                </v-form>
            </v-card-text>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { resetPassword } from '@/api/auth'
import type { ApiError } from '@/api/types'

const route = useRoute()
const router = useRouter()

const token = computed(() => {
    const raw = route.query.token
    return typeof raw === 'string' ? raw : ''
})

const error = ref('')
const success = ref('')

const resetSchema = z
    .object({
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(resetSchema),
})

const { value: newPassword, errorMessage: newPasswordError } = useField<string>('newPassword')
const { value: confirmPassword, errorMessage: confirmPasswordError } = useField<string>('confirmPassword')

const newPasswordErrors = computed(() => (newPasswordError.value ? [newPasswordError.value] : []))
const confirmPasswordErrors = computed(() => (confirmPasswordError.value ? [confirmPasswordError.value] : []))
const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit(async (values) => {
    error.value = ''
    try {
        const result = await resetPassword({
            token: token.value,
            newPassword: values.newPassword,
            confirmPassword: values.confirmPassword,
        })
        success.value = result.message
    } catch (err) {
        const apiError = err as ApiError
        error.value = apiError.message
    }
})
</script>

<style scoped>
</style>