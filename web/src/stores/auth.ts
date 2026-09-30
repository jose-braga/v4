// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
    login as apiLogin,
    logout as apiLogout,
    changePassword as apiChangePassword,
    refreshSession as apiRefreshSession,
    fetchCurrentUser
} from '@/api/auth'
import type { User } from '@/api/auth'

const WARNING_LEAD_MS = 60 * 60 * 1000 // warn 1 hour before expiry

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null)
    const isAuthenticated = computed(() => user.value !== null)
    const sessionWarning = ref(false)

    let warningTimer: ReturnType<typeof setTimeout> | null = null

    function clearSessionWarning() {
        if (warningTimer) {
            clearTimeout(warningTimer)
            warningTimer = null
        }
        sessionWarning.value = false
    }

    function scheduleSessionWarning() {
        clearSessionWarning()

        const expiresAt = user.value?.sessionExpiresAt
        if (!expiresAt) return

        const msUntilWarning = expiresAt - Date.now() - WARNING_LEAD_MS
        if (msUntilWarning <= 0) {
            sessionWarning.value = true // already within the warning window
            return
        }
        warningTimer = setTimeout(() => {
            sessionWarning.value = true
        }, msUntilWarning)
    }

    async function login(payload: { username: string; password: string }) {
        user.value = await apiLogin(payload)
        scheduleSessionWarning()
    }

    async function logout() {
        await apiLogout()
        user.value = null
        clearSessionWarning()
    }

    async function changePassword(payload: { username: string; oldPassword: string; newPassword: string; confirmPassword: string }) {
        user.value = await apiChangePassword(payload)
        scheduleSessionWarning()
    }

    async function refreshSession() {
        user.value = await apiRefreshSession()
        scheduleSessionWarning()
    }

    async function checkAuth() {
        try {
            user.value = await fetchCurrentUser()
            scheduleSessionWarning()
        } catch {
            user.value = null
            clearSessionWarning()
        }
    }

    function updateUserPhoto(photoUrl: string) {
        if (user.value) {
            // Append cacheBust query param so the browser reloads the new image immediately
            const cacheBust = Date.now()
            const separator = photoUrl.includes('?') ? '&' : '?'
            user.value.photo_url = `${photoUrl}${separator}v=${cacheBust}`
        }
    }

    return { user, isAuthenticated, sessionWarning,
        login, logout, changePassword, refreshSession, checkAuth,
        updateUserPhoto, }
})