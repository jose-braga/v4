import type { UnitMember } from '@/api/manager'
import type { Affiliation } from './affiliations'


export type Mode = 'current' | 'past'

const inScope = (a: Affiliation, mode: Mode) => (mode === 'current' ? a.active : a.past)

// Lowercase and strip accents, so "jose" finds "José".
const fold = (s: unknown) =>
    String(s ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

export function tokenize(query: string | null): string[] {
    return fold(query).split(/\s+/).filter(Boolean)
}

// Every token must match somewhere, so "cat rod" finds "Catarina Roma Rodrigues".
// IDs match exactly, so typing "41" doesn't return 141 and 410.
export function matchesPerson(member: UnitMember, tokens: string[]): boolean {
    if (tokens.length === 0) return true
    const haystack = fold([
        member.name,
        member.colloquial_name,
        ...member.email.map((e) => e.email),
        ...member.personal_email.map((e) => e.email),
        ...member.researcher_details.map((r) => r.ciencia_id),
    ].join(' '))
    const id = String(member.person_id)
    return tokens.every((t) => t === id || haystack.includes(t))
}

// Only labs in scope for the current tab can match.
function labMatches(a: Affiliation, tokens: string[], mode: Mode): boolean {
    if ( !inScope(a, mode)) return false
    const haystack = fold(`${a.label} ${a.labShortName ?? ''}`)
    const id = a.labId == null ? null : String(a.labId)
    return tokens.every((t) => t === id || haystack.includes(t))
}

export function matchesLab(affiliations: Affiliation[], tokens: string[], mode: Mode): boolean {
    if (tokens.length === 0) return true
    return affiliations.some((a) => labMatches(a, tokens, mode))
}

export function prioritizeMatches(affiliations: Affiliation[], tokens: string[], mode: Mode): Affiliation[] {
    if (tokens.length === 0) return affiliations
    return [...affiliations].sort(
        (a, b) => Number(labMatches(b, tokens, mode)) - Number(labMatches(a, tokens, mode))
    )
}