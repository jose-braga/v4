import axios, { type AxiosError } from 'axios'
import type { ApiError } from './types'

export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
    withCredentials: true, // sends/receives cookies cross-origin
    timeout: 10_000, // 10 seconds
})

// --- 401 handling without a circular import ---
let onUnauthorized: (() => void) | null = null
export function registerUnauthorizedHandler(handler: () => void) {
    onUnauthorized = handler
}

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const normalized: ApiError = normalizeError(error)

        if (normalized.status === 401) {
            onUnauthorized?.()
        }
        return Promise.reject(normalized)
    }
)

function normalizeError(error: AxiosError): ApiError {
    if (!error.response) {
        // Network error, timeout, CORS failure, server unreachable, etc.
        return { status: null, message: 'Network error — please check your connection.' }
    }

    const { status, data } = error.response
    const body = data as any

    return {
        status,
        message: body?.message ?? defaultMessageFor(status),
        fieldErrors: body?.errors, // adjust to match your backend's validation error shape
    }
}

function defaultMessageFor(status: number): string {
    switch (status) {
        case 400: return 'Invalid request.'
        case 401: return 'You need to log in.'
        case 403: return 'You don\'t have permission to do that.'
        case 404: return 'Not found.'
        case 422: return 'Some fields are invalid.'
        default: return status >= 500 ? 'Server error — please try again later.' : 'Something went wrong.'
    }
}