// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin,
    logout as apiLogout,
    changePassword as apiChangePassword,
    fetchCurrentUser } from '@/api/auth'
import type { User } from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const isAuthenticated = computed(() => user.value !== null)

    async function login(payload: { username: string; password: string }) {
        user.value = await apiLogin(payload)
    }

    async function logout() {
        await apiLogout()
        user.value = null
    }

    async function changePassword(payload: { username: string; oldPassword: string; newPassword: string; confirmPassword: string }) {
        user.value = await apiChangePassword(payload)
    }

    async function checkAuth() {
        try {
            user.value = await fetchCurrentUser()
        } catch {
            user.value = null
        }
    }

    return { user, isAuthenticated, login, logout, changePassword, checkAuth }
})