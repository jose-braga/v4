<template>
    <v-form @submit.prevent="() => onSubmit()">
        <v-text-field
            v-model="username"
            label="Username"
            outlined
            :error-messages="usernameErrors"
        ></v-text-field>
        <v-text-field
            v-model="password"
            label="Password"
            type="password"
            outlined
            :error-messages="passwordErrors"
        ></v-text-field>

        <v-alert v-if="formError" type="error" density="compact" class="mb-4">
            {{ formError }}
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
                        Login
                    </v-btn>
                </v-col>
            </v-row>
            <v-row>
                <v-col cols="6" class="text-center">
                    <v-btn color="primary" @click="emit('showChangePassword')">
                        Change Password
                    </v-btn>
                </v-col>
                <v-col cols="6" class="text-center">
                    <v-btn color="red" @click="emit('showRecover')">
                        Recover Password
                    </v-btn>
                </v-col>
            </v-row>
        </v-container>
    </v-form>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useField, useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'
import type { ApiError } from '@/api/types'

const usernameErrors = computed(() => (usernameError.value ? [usernameError.value] : []))
const passwordErrors = computed(() => (passwordError.value ? [passwordError.value] : []))
const submitting = computed(() => isSubmitting.value)

const loginSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(1, 'Password is required'),
})

const emit = defineEmits<{
    showChangePassword: []
    showRecover: []
}>()

const authStore = useAuthStore()
const formError = ref('')


const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(loginSchema),
})


const { value: username, errorMessage: usernameError } = useField<string>('username')
const { value: password, errorMessage: passwordError } = useField<string>('password')

const onSubmit = handleSubmit(async (values) => {
    formError.value = ''
    try {
        await authStore.login(values)
    } catch (err) {
        const apiError = err as ApiError
        formError.value = apiError.message
    }
})
</script>

<style scoped>
</style>