import { apiClient } from './client'

export interface LookupItem {
    id: number
    name: string
    code?: string
}

export async function fetchLookup(name: string): Promise<LookupItem[]> {
    const { data } = await apiClient.get<LookupItem[]>(`/api/lookups/${name}`)
    return data
}