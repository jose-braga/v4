// src/api/person.ts
import { apiClient } from './client'
import type { CoreInformationPayload } from '@/components/person/personal/CoreInformationForm.vue'
import type { DataVisibilityPayload } from '@/components/person/personal/DataVisibilityForm.vue'
import type { PersonPhoto } from '@/components/person/personal/PhotoForm.vue'


export async function fetchDataVisibility(personId: string): Promise<DataVisibilityPayload> {
    const { data } = await apiClient.get<DataVisibilityPayload>(`/api/people/${personId}/data-visibility`)
    return data
}

export async function fetchCoreInformation(personId: string): Promise<CoreInformationPayload> {
    const { data } = await apiClient.get<CoreInformationPayload>(`/api/people/${personId}/core-information`)
    return data
}

export async function updateDataVisibility(personId: string, payload: DataVisibilityPayload): Promise<DataVisibilityPayload> {
    const { data } = await apiClient.put<DataVisibilityPayload>(`/api/people/${personId}/data-visibility`, payload)
    return data
}

export async function updateCoreInformation(personId: string, payload: CoreInformationPayload): Promise<CoreInformationPayload> {
    const { data } = await apiClient.put<CoreInformationPayload>(`/api/people/${personId}/core-information`, payload)
    return data
}

export async function fetchPhoto(personId: string): Promise<PersonPhoto> {
    const { data } = await apiClient.get<PersonPhoto>(`/api/people/${personId}/photo`)
    return data
}

export async function uploadPhoto(personId: string, blob: Blob): Promise<PersonPhoto> {
    const formData = new FormData()
    formData.append('photo', blob, 'photo.jpg')
    // Don't set a Content-Type header manually — axios/the browser generates
    // the multipart boundary automatically when the body is a FormData.
    const { data } = await apiClient.post<PersonPhoto>(`/api/people/${personId}/photo`, formData)
    return data
}