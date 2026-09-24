import { apiClient } from './client'

export interface LoginPayload {
    username: string
    password: string
}

export interface LoginPayload {
    username: string
    password: string
}
export interface ChangePasswordPayload {
    username: string
    oldPassword: string
    newPassword: string
    confirmPassword: string
}

export interface ResetPasswordPayload {
    token: string
    newPassword: string
    confirmPassword: string
}

export interface User {
    id: string,
    username: string,
    person_id: string,
    photo_url?: string | null
}

export async function login(payload: LoginPayload): Promise<User> {
    const { data } = await apiClient.post<User>('api/auth/login', payload)
    return data
}

export async function logout(): Promise<void> {
    await apiClient.post('api/auth/logout')
}

export async function changePassword(payload: ChangePasswordPayload): Promise<User> {
    const { data } = await apiClient.post<User>('api/auth/change-password', payload)
    return data
}

export async function fetchCurrentUser(): Promise<User> {
    const { data } = await apiClient.get<User>('api/auth/me')
    return data
}

export async function requestPasswordReset(payload: { emailOrUsername: string }): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('api/auth/request-password-reset', payload)
    return data
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>('api/auth/reset-password', payload)
    return data
}