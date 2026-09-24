<template>
    <v-card min-width="300">
        <v-card-title>
            <span v-if="view === 'login'">Login</span>
            <span v-else-if="view === 'changePassword'">Change Password</span>
            <span v-else-if="view === 'recover'">Recover Password</span>
        </v-card-title>

        <v-card-text>
            <LoginForm
                v-if="view === 'login'"
                @show-change-password="view = 'changePassword'"
                @show-recover="showRecover"
            />
            <ChangePasswordForm
                v-else-if="view === 'changePassword'"
                :error="changePasswordError"
                @cancel="view = 'login'"
                cancel-label="Back to Login"
                @submit="handleChangePassword"
            />
            <RecoverPasswordForm
                v-else-if="view === 'recover'"
                :error="recoverError"
                :success="recoverSuccess"
                @submit="handleRecover"
                @cancel="view = 'login'"
            />
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoginForm from './LoginForm.vue'
import ChangePasswordForm from './ChangePasswordForm.vue'
import RecoverPasswordForm from './RecoverPasswordForm.vue'
import { useAuthStore } from '@/stores/auth'
import { requestPasswordReset } from '@/api/auth'
import type { ApiError } from '@/api/types'

type View = 'login' | 'changePassword' | 'recover'


const authStore = useAuthStore()

const changePasswordError = ref('')
const recoverError = ref('')
const recoverSuccess = ref('')
const view = ref<View>('login')

async function handleChangePassword(payload: {
    username: string
    oldPassword: string
    newPassword: string
    confirmPassword: string
}) {
    changePasswordError.value = ''
    try {
        await authStore.changePassword(payload)
        view.value = 'login'
    } catch (err) {
        const apiError = err as ApiError
        changePasswordError.value = apiError.message
    }
}

async function handleRecover(payload: { emailOrUsername: string }) {
    recoverError.value = ''
    try {
        const result = await requestPasswordReset(payload)
        recoverSuccess.value = result.message
    } catch (err) {
        const apiError = err as ApiError
        recoverError.value = apiError.message
    }
}

function showRecover() {
    recoverError.value = ''
    recoverSuccess.value = ''
    view.value = 'recover'
}

</script>

<style scoped>
</style>