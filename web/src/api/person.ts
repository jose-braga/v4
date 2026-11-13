// src/api/person.ts
import { apiClient } from './client'
import type { CoreInformationPayload } from '@/components/person/personal/CoreInformationForm.vue'
import type { DataVisibilityPayload } from '@/components/person/personal/DataVisibilityForm.vue'
import type { PersonPhoto } from '@/components/person/personal/PhotoForm.vue'
import type { ShortCvPayload } from '@/components/person/personal/ShortCvForm.vue'
import type { PersonalContactsPayload } from '@/components/person/personal/PersonalContactsForm.vue'
import type { PersonalUrl, PersonalUrlsPayload } from '@/components/person/personal/PersonalUrlsForm.vue'
import type { OtherEditor, OtherEditorsPayload } from '@/components/person/personal/OtherEditorsForm.vue'
import type { EmergencyContact, EmergencyContactsPayload } from '@/components/person/personal/EmergencyContactsForm.vue'
import type { AcademicAffiliation, AcademicAffiliationsPayload } from '@/components/person/professional/AcademicAffiliationsForm.vue'
import type { AcademicDegree, AcademicDegreesPayload } from '@/components/person/professional/AcademicDegreesForm.vue'
import type { WorkplacePayload } from '@/components/person/professional/WorkPlacesForm.vue'
import type { Job, JobsPayload } from '@/components/person/professional/ProfessionalSituationForm.vue'
import type { LabsPayload } from '@/components/person/institutional/LabPositionsForm.vue'
import type { OfficesPayload } from '@/components/person/institutional/OfficeAffiliationsForm.vue'
import type { Pole, PolesPayload } from '@/components/person/institutional/PolesForm.vue'
import type { Supervisor, SupervisorsPayload } from '@/components/person/institutional/SupervisorsForm.vue'
import type { ResearcherInfoPayload } from '@/components/person/institutional/ResearcherInfoForm.vue'
import type { ContactPayload } from '@/components/person/institutional/ContactForm.vue'
import type { ResearchInterest, ResearchInterestsPayload } from '@/components/person/institutional/ResearchInterestsForm.vue'
import type { AuthorName, AuthorNamesPayload } from '@/components/person/productivity/AuthorNamesForm.vue'
import type { PublicationUpdatePayload } from '@/components/person/productivity/PublicationEditDialog.vue'

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

// Person Personal ShortCV
export async function fetchShortCv(personId: number | string): Promise<ShortCvPayload> {
    const { data } = await apiClient.get<ShortCvPayload>(`/api/people/${personId}/short-cv`)
    return data
}

export async function updateShortCv(personId: string, payload: ShortCvPayload): Promise<ShortCvPayload> {
    const { data } = await apiClient.put<ShortCvPayload>(`/api/people/${personId}/short-cv`, payload)
    return data
}

// Person Personal URLs
export async function fetchPersonalUrls(personId: number | string): Promise<PersonalUrlsPayload> {
    const { data } = await apiClient.get<PersonalUrl[]>(`/api/people/${personId}/personal-urls`)
    return {urls: data}
}

export async function updatePersonalUrls(personId: string, payload: PersonalUrlsPayload): Promise<PersonalUrlsPayload> {
    const { data } = await apiClient.put<PersonalUrl[]>(`/api/people/${personId}/personal-urls`, payload)
    return {urls: data}
}

// Person Personal Contacts
export async function fetchPersonalContacts(personId: string): Promise<PersonalContactsPayload> {
    const { data } = await apiClient.get<PersonalContactsPayload>(`/api/people/${personId}/personal-contacts`)
    return data
}

export async function updatePersonalContacts(personId: string, payload: PersonalContactsPayload): Promise<PersonalContactsPayload> {
    const { data } = await apiClient.put<PersonalContactsPayload>(`/api/people/${personId}/personal-contacts`, payload)
    return data
}

// Person Emergency Contacts
export async function fetchEmergencyContacts(personId: number | string): Promise<EmergencyContactsPayload> {
    const { data } = await apiClient.get<EmergencyContact[]>(`/api/people/${personId}/emergency-contacts`)
    return {contacts: data}
}

export async function updateEmergencyContacts(personId: string, payload: EmergencyContactsPayload): Promise<EmergencyContactsPayload> {
    const { data } = await apiClient.put<EmergencyContact[]>(`/api/people/${personId}/emergency-contacts`, payload)
    return {contacts: data}
}

// Person Other Editors
export async function fetchOtherEditors(personId: number | string): Promise<OtherEditorsPayload> {
    const { data } = await apiClient.get<OtherEditor[]>(`/api/people/${personId}/other-editors`)
    return { editors: data }
}

export async function updateOtherEditors(personId: string, payload: OtherEditorsPayload): Promise<OtherEditorsPayload> {
    const { data } = await apiClient.put<OtherEditor[]>(`/api/people/${personId}/other-editors`, payload)
    return { editors: data }
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


// Person Institutional Affiliations

export async function fetchPoles(personId: number | string): Promise<PolesPayload> {
    const { data } = await apiClient.get<Pole[]>(`/api/people/${personId}/poles`)
    return { poles: data }
}

export async function updatePoles(personId: string, payload: PolesPayload): Promise<PolesPayload> {
    const { data } = await apiClient.put<Pole[]>(`/api/people/${personId}/poles`, payload)
    return { poles: data }
}

export interface LabRow {
    id: number
    lab_id: number
    lab_name: string
    lab_position_id: number
    lab_position_name: string | null
    group_id: number | null
    group_name: string | null
    unit_id: number | null
    unit_name: string | null
    dedication: number | null
    valid_from: string | null
    valid_until: string | null
    integrated: boolean
    pluriannual: boolean
    nuclearCV: boolean
}

export type OfficeKind = 'technician' | 'science_manager' | 'administrative'

export const officeKindLabels: Record<OfficeKind, string> = {
    technician: 'Technician',
    science_manager: 'Science management',
    administrative: 'Administrative',
}
export interface InstitutionalAffiliations {
    labs: LabRow[]
    offices: OfficeAffiliation[]
    editable: boolean
}
export interface OfficeAffiliation {
    id: number
    kind: OfficeKind
    office_id: number | null
    office: string | null
    position_id: number | null
    position: string | null
    unit_id: number | null
    unit: string | null
    dedication: number | null
    valid_from: string | null
    valid_until: string | null
}

const OFFICE_FIELDS: Record<OfficeKind, { raw: string; office_id: string; office: string; position_id: string; position: string }> = {
    technician:      { raw: 'technician_data',       office_id: 'technician_office_id',      office: 'technician_office_name',      position_id: 'technician_position_id',      position: 'technician_position_name' },
    science_manager: { raw: 'science_manager_data',  office_id: 'science_manager_office_id', office: 'science_manager_office_name', position_id: 'science_manager_position_id', position: 'science_manager_position_name' },
    administrative:  { raw: 'administrative_data',   office_id: 'administrative_office_id',  office: 'administrative_office_name',  position_id: 'administrative_position_id',  position: 'administrative_position_name' },
}


function toInstitutional(raw: any): InstitutionalAffiliations {
    const offices = (Object.keys(OFFICE_FIELDS) as OfficeKind[]).flatMap((kind) => {
        const f = OFFICE_FIELDS[kind]
        return (raw[f.raw] as any[]).map((r): OfficeAffiliation => ({
            id: r.id, kind,
            office_id: r[f.office_id] ?? null, office: r[f.office] ?? null,
            position_id: r[f.position_id] ?? null, position: r[f.position] ?? null,
            unit_id: r.unit_id ?? null, unit: r.unit_name ?? null,
            dedication: r.dedication ?? null, valid_from: r.valid_from ?? null, valid_until: r.valid_until ?? null,
        }))
    })
    return {
        labs: raw.lab_data.map((r: any) => ({
            ...r, integrated: !!r.integrated, pluriannual: !!r.pluriannual, nuclearCV: !!r.nuclearCV,
        })),
        offices,
        editable: !!raw.editable,
    }
}
export async function fetchInstitutionalAffiliations(personId: number) {
    const { data } = await apiClient.get(`/api/people/${personId}/institutional-affiliations`)   // adjust the path/instance
    return toInstitutional(data)
}

// the PUT should answer with the same body as the GET, so the form can reload from it
export async function updateLabs(personId: number, payload: LabsPayload) {
    const { data } = await apiClient.put(`/api/people/${personId}/institutional-affiliations/labs`, payload)
    return toInstitutional(data)
}

export async function updateOffices(personId: number, payload: OfficesPayload) {
    const { data } = await apiClient.put(`/api/people/${personId}/institutional-affiliations/offices`, payload)
    return toInstitutional(data)
}

// Person Institutional Supervisors

export async function fetchSupervisors(personId: number | string): Promise<SupervisorsPayload> {
    const { data } = await apiClient.get<Supervisor[]>(`/api/people/${personId}/supervisors`)
    return { supervisors: data }
}

export async function updateSupervisors(personId: string, payload: SupervisorsPayload): Promise<SupervisorsPayload> {
    const { data } = await apiClient.put<Supervisor[]>(`/api/people/${personId}/supervisors`, payload)
    return { supervisors: data }
}

// Person Institutional/Researcher Info
export async function fetchResearcherInfo(personId: number | string): Promise<ResearcherInfoPayload> {
    const { data } = await apiClient.get<ResearcherInfoPayload>(`/api/people/${personId}/researcher-info`)
    return data
}

export async function updateResearcherInfo(personId: string, payload: ResearcherInfoPayload): Promise<ResearcherInfoPayload> {
    const { data } = await apiClient.put<ResearcherInfoPayload>(`/api/people/${personId}/researcher-info`, payload)
    return data
}

// Person Institutional/Contact
export async function fetchContact(personId: number | string): Promise<ContactPayload> {
    const { data } = await apiClient.get<ContactPayload>(`/api/people/${personId}/contacts`)
    return data
}

export async function updateContact(personId: string, payload: ContactPayload): Promise<ContactPayload> {
    const { data } = await apiClient.put<ContactPayload>(`/api/people/${personId}/contacts`, payload)
    return data
}

// Person Institutional/Research Interests
export async function fetchResearchInterests(personId: number | string): Promise<ResearchInterestsPayload> {
    const { data } = await apiClient.get<ResearchInterest[]>(`/api/people/${personId}/research-interests`)
    return { research_interests: data }
}

export async function updateResearchInterests(personId: string, payload: ResearchInterestsPayload): Promise<ResearchInterestsPayload> {
    const { data } = await apiClient.put<ResearchInterest[]>(`/api/people/${personId}/research-interests`, payload)
    return { research_interests: data }
}

// Person Productivity/Publications
export async function fetchAuthorNames(personId: number | string): Promise<AuthorNamesPayload> {
    const { data } = await apiClient.get<AuthorName[]>(`/api/people/${personId}/author-names`)
    return { author_names: data }
}

export async function updateAuthorNames(personId: string, payload: AuthorNamesPayload): Promise<AuthorNamesPayload> {
    const { data } = await apiClient.put<AuthorName[]>(`/api/people/${personId}/author-names`, payload)
    return { author_names: data }
}

export interface PersonPublication {
    id: number
    publication_id: number
    author_type_id: number | null
    position: number | null
    public: 0 | 1
    selected: 0 | 1
    selected_rank: number | null
    in_institutional_repository: 0 | 1
    title: string
    authors_raw: string | null
    number_authors: number | null
    journal_id: number | null
    journal: string | null
    journal_short_name: string | null
    publication_type_id: number | null
    volume: string | null
    page_start: string | null
    page_end: string | null
    doi: string | null
    wos: string | null
    pubmed_id: string | null
    publication_date: string | null
    year: number | null
    citations: number | null
}

export interface JournalOption {
    id: number
    name: string
    short_name?: string | null
    publisher?: string | null
    issn?: string | null
    eissn?: string | null
}

export async function fetchPersonPublications(personId: string): Promise<PersonPublication[]> {
    const { data } = await apiClient.get(`/api/people/${personId}/publications`)
    return data
}

export async function updatePersonPublication(
    personId: string,
    publicationId: number,
    payload: PublicationUpdatePayload
): Promise<PersonPublication> {
    const { data } = await apiClient.put(`/api/people/${personId}/publications/${publicationId}`, payload)
    return data
}

export async function dissociatePublication(personId: string, publicationId: number): Promise<void> {
    await apiClient.delete(`/api/people/${personId}/publications/${publicationId}`)
}

export async function searchJournals(q: string): Promise<JournalOption[]> {
    const { data } = await apiClient.get('/api/people/journals/search', { params: { q } })
    return data
}

export interface PublicationSearchResult {
    publication_id: number
    title: string
    authors_raw: string | null
    year: number | null
    doi: string | null
    journal: string | null
    journal_short_name: string | null
}

export async function searchPublications(personId: string, q: string): Promise<PublicationSearchResult[]> {
    const { data } = await apiClient.get(`/api/people/${personId}/publications/search`, { params: { q } })
    return data
}

export async function addPersonPublication(
    personId: string,
    publicationId: number,
    authorTypeId: number | null
): Promise<PersonPublication> {
    const { data } = await apiClient.post(`/api/people/${personId}/publications/${publicationId}`, {
        author_type_id: authorTypeId,
    })
    return data
}

export type ImportSource = 'orcid' | 'pure'

export interface ImportCandidate {
    source_id: string
    title: string | null
    authors_raw: string | null
    journal_name: string | null
    journal_id: number | null
    issn: string | null
    year: number | null
    publication_date: string | null
    volume: string | null
    page_start: string | null
    page_end: string | null
    doi: string | null
    pubmed_id: string | null
    wos: string | null
    work_type: string | null
    detail_failed?: boolean
}

export interface ImportCandidatesResponse {
    identifier: string | null
    items: ImportCandidate[]
    total: number
    already_in_database: number
    excluded_by_type?: number
    excluded_types?: Record<string, number>
}

export async function fetchImportCandidates(personId: string, source: ImportSource): Promise<ImportCandidatesResponse> {
    const { data } = await apiClient.get(`/api/people/${personId}/publications/${source}/candidates`)
    return data
}

export async function importCandidate(
    personId: string,
    source: ImportSource,
    publication: ImportCandidate,
    authorTypeId: number | null
): Promise<PersonPublication> {
    const { data } = await apiClient.post(`/api/people/${personId}/publications/${source}/import`, {
        publication,
        author_type_id: authorTypeId,
    })
    return data
}