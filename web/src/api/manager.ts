import { apiClient } from './client'
import type { ManagedUnit } from '@/stores/manager'

export interface LabHistoryEntry {
    id: number
    person_id: string
    lab_id: number
    lab_position_id: number | null
    valid_from: string | null
    valid_until: string | null
    lab_name: string
    lab_short_name: string | null
    lab_started: string | null
    lab_finished: string | null
    lab_position_name_en: string | null
    lab_position_name_pt: string | null
    group_id: number | null
    group_name: string | null
    group_short_name: string | null
    dedication: number | null // assumed column, see above
    sort_order: number | null
}

export interface TechnicianEntry {
    id: number
    person_id: string
    technician_office_id: number
    technician_position_id: number | null
    valid_from: string | null
    valid_until: string | null
    technician_office_name_en: string
    technician_office_started: string | null
    technician_office_finished: string | null
    technician_position_name_en: string | null
    technician_position_name_pt: string | null
    sort_order: number | null
}

export interface ScienceManagerEntry {
    id: number
    person_id: string
    science_manager_office_id: number
    science_manager_position_id: number | null
    valid_from: string | null
    valid_until: string | null
    science_manager_office_name_en: string
    science_manager_office_started: string | null
    science_manager_office_finished: string | null
    science_manager_position_name_en: string | null
    science_manager_position_name_pt: string | null
    sort_order: number | null
}

export interface AdministrativeEntry {
    id: number
    person_id: string
    administrative_office_id: number
    administrative_position_id: number | null
    valid_from: string | null
    valid_until: string | null
    administrative_office_name_en: string
    administrative_office_started: string | null
    administrative_office_finished: string | null
    administrative_position_name_en: string | null
    administrative_position_name_pt: string | null
    sort_order: number | null
}

export interface EmailEntry {
    id: number
    person_id: string
    email: string
}

export interface PoleEntry {
    id: number
    person_id: string
    city_id: number
    city: string | null
}

export interface CostCenterEntry {
    id: number
    person_id: string
    cost_center_id: number
    name: string
    short_name: string | null
}

export interface ResearcherDetails {
    id: number
    person_id: string
    ciencia_id: string | null
    [key: string]: unknown // `researchers_info.*` — not every column is referenced in the query, so this covers the rest
}

export interface UnitMember {
    person_id: string
    user_id: string | null
    name: string
    colloquial_name: string | null
    researcher_details: ResearcherDetails[]
    history: LabHistoryEntry[]
    technician_data: TechnicianEntry[]
    science_manager_data: ScienceManagerEntry[]
    administrative_data: AdministrativeEntry[]
    email: EmailEntry[]
    personal_email: EmailEntry[]
    pole: PoleEntry[]
    cost_center: CostCenterEntry[]
}

interface UnitMembersResponse {
    status: string
    statusCode: number
    count: number
    pageSize: number | undefined
    offset: number
    pageCount: number
    result: UnitMember[]
}

export async function fetchManagedUnits(): Promise<ManagedUnit[]> {
    const { data } = await apiClient.get(
        `/api/managers/units`
    )
    return data
}

export async function fetchUnitMembers(
    userId: string,
    unitId: string,
    past = false
): Promise<UnitMember[]> {
    const path = past ? 'past-members' : 'members'
    const { data } = await apiClient.get<UnitMembersResponse>(
        `/api/managers/${userId}/units/${unitId}/${path}`
    )
    return data.result // unwrap { status, count, ..., result }
}