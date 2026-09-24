<template>
    <v-form @submit.prevent="() => onSubmit()">
        <v-text-field
            v-model="username"
            label="Username"
            outlined
            :readonly="!!prefillUsername"
            :error-messages="usernameErrors"
        ></v-text-field>
        <v-text-field
            v-model="oldPassword"
            label="Old Password"
            type="password"
            outlined
            :error-messages="oldPasswordErrors"
        ></v-text-field>
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

        <v-container>
            <v-row>
                <v-col cols="12">
                    <v-btn
                        type="submit"
                        color="primary"
                        size="large"
                        class="text-title-large"
                        block
                        :loading="submitting"
                    >
                        Change Password
                    </v-btn>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="12" class="text-center">
                    <v-btn variant="text" @click="emit('cancel')">
                       {{ cancelLabel }}
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </v-form>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'

//const authStore = useAuthStore()
const props = withDefaults(defineProps<{
    prefillUsername?: string
    cancelLabel?: string
    error?: string
}>(), {
    cancelLabel: 'Cancel',
    error: ''
})

const emit = defineEmits<{
    submit: [payload: { username: string; oldPassword: string; newPassword: string; confirmPassword: string }]
    cancel: []
}>()

const changePasswordSchema = z
    .object({
        username: z.string().min(1, 'Username is required'),
        oldPassword: z.string().min(1, 'Old password is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string().min(1, 'Please confirm your new password'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })

const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(changePasswordSchema),
    initialValues: {
        username: props.prefillUsername ?? '',
    },
})

const { value: username, errorMessage: usernameError } = useField<string>('username')
const { value: oldPassword, errorMessage: oldPasswordError } = useField<string>('oldPassword')
const { value: newPassword, errorMessage: newPasswordError } = useField<string>('newPassword')
const { value: confirmPassword, errorMessage: confirmPasswordError } = useField<string>('confirmPassword')

const usernameErrors = computed(() => (usernameError.value ? [usernameError.value] : []))
const oldPasswordErrors = computed(() => (oldPasswordError.value ? [oldPasswordError.value] : []))
const newPasswordErrors = computed(() => (newPasswordError.value ? [newPasswordError.value] : []))
const confirmPasswordErrors = computed(() => (confirmPasswordError.value ? [confirmPasswordError.value] : []))
const submitting = computed(() => isSubmitting.value)

const onSubmit = handleSubmit( (values) => {
    emit('submit', values)
})

</script>

<style scoped>
</style>