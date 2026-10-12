// src/utils/affiliations.ts
import type { UnitMember } from '@/api/manager'

export type AffiliationKind = 'lab' | 'technician' | 'science_manager' | 'administrative'

export interface Affiliation {
    key: string
    kind: AffiliationKind
    labId: number | null
    label: string
    labShortName: string | null
    groupName: string | null
    position: string | null
    validFrom: string | null
    validUntil: string | null
    dedication: number | null
    active: boolean
    sortOrder: number | null
    past: boolean
}

// DATE columns arrive as ISO strings; the first 10 chars are the calendar day.
const toDay = (v: string | null) => (v ? v.slice(0, 10) : null)

// Built from local getters on purpose (toISOString() would shift the day via UTC).
function localToday(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Base = Omit<Affiliation, 'key' | 'kind' | 'validFrom' | 'validUntil' | 'active' | 'past'>

export function buildAffiliations(member: UnitMember): Affiliation[] {
    const today = localToday()

    const make = (
        kind: AffiliationKind, id: number, base: Base,
        from: string | null, until: string | null
    ): Affiliation => {
        const validFrom = toDay(from)
        const validUntil = toDay(until)
        const active = (!validFrom || validFrom <= today) && (!validUntil || validUntil >= today)
        const past = !!validUntil && validUntil < today
        return { key: `${kind}-${id}`, kind, ...base, validFrom, validUntil, active, past }
    }

    const all: Affiliation[] = [
        ...member.history.map((h) => make('lab', h.id, {
            labId: h.lab_id, label: h.lab_name, labShortName: h.lab_short_name,
            groupName: h.group_name, position: h.lab_position_name_en, dedication: h.dedication,
            sortOrder: h.sort_order,
        }, h.valid_from, h.valid_until)),
        ...member.technician_data.map((t) => make('technician', t.id, {
            labId: null, label: t.technician_office_name_en, labShortName: null,
            groupName: null, position: t.technician_position_name_en, dedication: null,
            sortOrder: null,
        }, t.valid_from, t.valid_until)),
        ...member.science_manager_data.map((s) => make('science_manager', s.id, {
            labId: null, label: s.science_manager_office_name_en, labShortName: null,
            groupName: null, position: s.science_manager_position_name_en, dedication: null,
            sortOrder: null,
        }, s.valid_from, s.valid_until)),
        ...member.administrative_data.map((a) => make('administrative', a.id, {
            labId: null, label: a.administrative_office_name_en, labShortName: null,
            groupName: null, position: a.administrative_position_name_en, dedication: null,
            sortOrder: null,
        }, a.valid_from, a.valid_until)),
    ]

    return all.sort((a, b) => Number(b.active) - Number(a.active)) // active first
}