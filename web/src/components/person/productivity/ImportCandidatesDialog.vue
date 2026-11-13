<template>
    <v-dialog v-model="open" max-width="1100" scrollable>
        <v-card>
            <v-card-title class="d-flex align-center">
                {{ cfg.title }}
                <v-chip v-if="identifier" size="small" class="ml-3" :prepend-icon="cfg.icon">{{ identifier }}</v-chip>
            </v-card-title>

            <v-card-text>
                <v-progress-linear v-if="loading" indeterminate class="mb-4" />
                <div v-if="loading" class="text-medium-emphasis">{{ cfg.loading }}</div>

                <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-3">{{ error }}</v-alert>

                <v-alert v-if="loaded && !identifier" type="info" variant="tonal">{{ cfg.missing }}</v-alert>

                <template v-if="loaded && identifier">
                    <v-row dense class="align-center mb-2">
                        <v-col cols="12" md="7" class="text-medium-emphasis">
                            {{ items.length }} new publication(s) found.
                            {{ alreadyInDb }} already in the database and hidden;
                            {{ excludedByType }} of other types ignored<template v-if="excludedText"> ({{ excludedText }})</template>.
                        </v-col>
                        <v-col cols="12" md="5">
                            <v-select v-model="authorTypeId" :items="authorTypes" item-title="name" item-value="id"
                                      label="Add as (optional)" clearable density="compact" hide-details />
                        </v-col>
                    </v-row>

                    <div v-if="!items.length" class="text-medium-emphasis mt-4">{{ cfg.none }}</div>

                    <v-list v-else lines="three">
                        <v-list-item v-for="c in items" :key="c.source_id" class="px-0">
                            <div class="d-flex flex-wrap ga-4 align-start">
                                <div class="flex-grow-1" style="min-width: 260px; flex-basis: 0">
                                    <div class="text-body-1 font-weight-medium text-wrap">
                                        {{ c.title || '(no title)' }}
                                    </div>
                                    <div class="text-body-2 text-medium-emphasis">
                                        {{ c.authors_raw || 'No authors found' }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis mt-1">
                                        {{ [c.journal_name, c.year].filter(Boolean).join(' · ') }}
                                        <a v-if="c.doi" :href="`https://doi.org/${c.doi}`" target="_blank"
                                           rel="noopener noreferrer" class="ml-2">{{ c.doi }}</a>
                                    </div>

                                    <div class="mt-2 d-flex flex-wrap ga-1">
                                        <v-chip v-if="missing(c).length" size="x-small" color="error" variant="flat"
                                                prepend-icon="mdi-alert-circle-outline">
                                            Incomplete: {{ missing(c).join(', ') }}
                                        </v-chip>
                                        <v-chip v-if="c.journal_id" size="x-small" color="success" variant="tonal">
                                            Journal found in database
                                        </v-chip>
                                        <v-chip v-else-if="c.journal_name" size="x-small" color="warning" variant="tonal">
                                            New journal will be created
                                        </v-chip>
                                        <v-chip v-if="c.detail_failed" size="x-small" color="warning" variant="tonal">
                                            Details unavailable
                                        </v-chip>
                                    </div>
                                </div>

                                <div class="d-flex ga-2">
                                    <v-btn size="small" variant="text" prepend-icon="mdi-pencil-outline"
                                           @click="edit(c)">Edit</v-btn>
                                    <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus"
                                           :loading="adding.has(c.source_id)" :disabled="missing(c).length > 0"
                                           :title="missing(c).length ? 'Edit the publication to complete it first' : ''"
                                           @click="add(c)">Add</v-btn>
                                </div>
                            </div>
                            <v-divider class="mt-3" />
                        </v-list-item>
                    </v-list>
                </template>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="open = false">Close</v-btn>
            </v-card-actions>
        </v-card>

        <ImportCandidateEditDialog v-model="editOpen" :candidate="editing" @save="onEdited" />
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
    fetchImportCandidates,
    importCandidate,
    type ImportCandidate,
    type ImportSource,
    type PersonPublication,
} from '@/api/person'
import { useLookup } from '@/composables/useLookup'
import { useTargetPersonId } from '@/composables/useTargetPersonId'
import ImportCandidateEditDialog from './ImportCandidateEditDialog.vue'

const props = defineProps<{ source: ImportSource }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ added: [row: PersonPublication] }>()

const SOURCES = {
    orcid: {
        title: 'Import from ORCID',
        icon: 'mdi-identifier',
        loading: 'Reading your ORCID record and checking it against the database. This can take a few seconds.',
        missing: 'No ORCID is registered in your researcher information. Add it there first.',
        none: 'Nothing new to import from ORCID.',
    },
    pure: {
        title: 'Import from the institutional repository (PURE)',
        icon: 'mdi-bank-outline',
        loading: 'Reading your research outputs from PURE and checking them against the database.',
        missing: 'No PURE ID is registered in your researcher information. Add it there first.',
        none: 'Nothing new to import from PURE.',
    },
} as const
const cfg = computed(() => SOURCES[props.source])

const personId = useTargetPersonId()
const { items: authorTypes } = useLookup('author-types')
const authorTypeId = ref<number | null>(null)

const loading = ref(false)
const error = ref('')
const identifier = ref<string | null>(null)
const loaded = ref(false)
const items = ref<ImportCandidate[]>([])
const alreadyInDb = ref(0)
const excludedByType = ref(0)
const excludedTypes = ref<Record<string, number>>({})
const adding = ref(new Set<string>())

const editOpen = ref(false)
const editing = ref<ImportCandidate | null>(null)

watch(open, (isOpen) => {
    if (isOpen) load()
})

async function load() {
    loading.value = true
    loaded.value = false
    error.value = ''
    items.value = []
    try {
        const r = await fetchImportCandidates(personId.value, props.source)
        identifier.value = r.identifier
        items.value = r.items
        alreadyInDb.value = r.already_in_database
        excludedByType.value = r.excluded_by_type ?? 0
        excludedTypes.value = r.excluded_types ?? {}
        loaded.value = true
    } catch (err) {
        error.value = (err as { message?: string }).message ?? 'Could not load publications'
    } finally {
        loading.value = false
    }
}

// minimal information required before a publication can be added
function missing(c: ImportCandidate): string[] {
    const m: string[] = []
    if (!c.title?.trim()) m.push('title')
    if (!c.authors_raw?.trim()) m.push('authors')
    if (!c.journal_id && !c.journal_name?.trim()) m.push('journal')
    if (!c.year) m.push('year')
    return m
}

function edit(c: ImportCandidate) {
    editing.value = c
    editOpen.value = true
}
function onEdited(updated: ImportCandidate) {
    const i = items.value.findIndex((x) => x.source_id === updated.source_id)
    if (i >= 0) items.value[i] = updated
}

async function add(c: ImportCandidate) {
    if (missing(c).length || adding.value.has(c.source_id)) return
    adding.value.add(c.source_id)
    error.value = ''
    try {
        const row = await importCandidate(personId.value, props.source, c, authorTypeId.value)
        items.value = items.value.filter((x) => x.source_id !== c.source_id)
        emit('added', row)
    } catch (err) {
        error.value = (err as { message?: string }).message ?? 'Could not add the publication'
    } finally {
        adding.value.delete(c.source_id)
    }
}

const excludedText = computed(() =>
    Object.entries(excludedTypes.value).map(([t, n]) => `${t} ×${n}`).join(', '))
</script>

