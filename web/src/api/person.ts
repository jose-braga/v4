// src/api/person.ts
import { apiClient } from './client'
import type { CoreInformationPayload } from '@/components/person/personal/CoreInformationForm.vue'
import type { DataVisibilityPayload } from '@/components/person/personal/DataVisibilityForm.vue'
import type { PersonPhoto } from '@/components/person/personal/PhotoForm.vue'
import type { AcademicAffiliation, AcademicAffiliationsPayload } from '@/components/person/professional/AcademicAffiliationsForm.vue'
import type { AcademicDegree, AcademicDegreesPayload } from '@/components/person/professional/AcademicDegreesForm.vue'
import type { WorkplacePayload } from '@/components/person/professional/WorkPlacesForm.vue'
import type { Job, JobsPayload } from '@/components/person/professional/ProfessionalSituationForm.vue'

// Person Personal
export async function fetchDataVisibility(personId: string): Promise<DataVisibilityPayload> {
    const { data } = await apiClient.get<DataVisibilityPayload>(`/api/people/${personId}/data-visibility`)
    return data
}

export async function updateDataVisibility(personId: string, payload: DataVisibilityPayload): Promise<DataVisibilityPayload> {
    const { data } = await apiClient.put<DataVisibilityPayload>(`/api/people/${personId}/data-visibility`, payload)
    return data
}

export async function fetchCoreInformation(personId: string): Promise<CoreInformationPayload> {
    const { data } = await apiClient.get<CoreInformationPayload>(`/api/people/${personId}/core-information`)
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

// Person Professional/Academic
export async function fetchAcademicAffiliations(personId: number | string): Promise<AcademicAffiliationsPayload> {
    const { data } = await apiClient.get<AcademicAffiliation[]>(`/api/people/${personId}/academic-affiliations`)
    return { affiliations: data }
}

export async function updateAcademicAffiliations(personId: string, payload: AcademicAffiliationsPayload): Promise<AcademicAffiliationsPayload> {
    const { data } = await apiClient.put<AcademicAffiliation[]>(`/api/people/${personId}/academic-affiliations`, payload)
    return { affiliations: data }
}

// Person Professional/Workplaces
export async function fetchWorkplaces(personId: number | string): Promise<WorkplacePayload> {
    const { data } = await apiClient.get<WorkplacePayload>(`/api/people/${personId}/workplaces`)
    return data
}

export async function updateWorkplaces(personId: string, payload: WorkplacePayload): Promise<WorkplacePayload> {
    const { data } = await apiClient.put<WorkplacePayload>(`/api/people/${personId}/workplaces`, payload)
    return data
}

// Person Professional/Degrees
export async function fetchAcademicDegrees(personId: number | string): Promise<AcademicDegreesPayload> {
    const { data } = await apiClient.get<AcademicDegree[]>(`/api/people/${personId}/academic-degrees`)
    return { degrees: data }
}

export async function updateAcademicDegrees(personId: string, payload: AcademicDegreesPayload): Promise<AcademicDegreesPayload> {
    const { data } = await apiClient.put<AcademicDegree[]>(`/api/people/${personId}/academic-degrees`, payload)
    return { degrees: data }
}

// Person Professional/Jobs
export async function fetchJobs(personId: number | string): Promise<JobsPayload> {
    const { data } = await apiClient.get<Job[]>(`/api/people/${personId}/jobs`)
    return { jobs: data }
}

export async function updateJobs(personId: string, payload: JobsPayload): Promise<JobsPayload> {
    const { data } = await apiClient.put<Job[]>(`/api/people/${personId}/jobs`, payload)
    return { jobs: data }
}

