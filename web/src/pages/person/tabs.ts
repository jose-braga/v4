export const personTabs = [
    { key: 'personal',                 label: 'Personal' },
    { key: 'professional-academic',    label: 'Professional/Academic' },
    //{ key: 'institutional-scientific', label: 'Institutional/Scientific' },
] as const

export type PersonTabKey = typeof personTabs[number]['key']