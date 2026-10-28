import type { User } from '@/api/auth'

export const selfOnlyTabs = [
    { key: 'warehouse', label: 'Warehouse', feature: 'warehouse' },
    { key: 'spaces',    label: 'Spaces',    feature: 'spaces' },
] as const

export function visibleSelfTabs(user: User | null) {
    return selfOnlyTabs.filter((t) => user?.features?.includes(t.feature))
}