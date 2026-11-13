<template>
    <v-dialog v-model="open" max-width="900" scrollable>
        <v-card>
            <v-card-title class="text-wrap">Edit publication</v-card-title>

            <v-card-text>
                <form id="publication-form" @submit.prevent="onSubmit">
                    <div class="text-subtitle-1 mb-2">My association</div>
                    <v-row dense>
                        <v-col cols="12" sm="6">
                            <v-select v-model="f.author_type_id.value" :items="authorTypeItems"
                                      label="Author type" clearable :error-messages="errors.author_type_id" />
                        </v-col>
                        <v-col cols="6" sm="3">
                            <v-text-field v-model="f.position.value" type="number" label="Position"
                                          :error-messages="errors.position" />
                        </v-col>
                        <v-col cols="6" sm="3">
                            <v-text-field v-model="f.selected_rank.value" type="number" label="Selected rank"
                                          :error-messages="errors.selected_rank" />
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-switch v-model="f.public.value" :true-value="1" :false-value="0"
                                      label="Public" color="primary" hide-details />
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-switch v-model="f.selected.value" :true-value="1" :false-value="0"
                                      label="Highlighted" color="primary" hide-details />
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-switch v-model="f.in_institutional_repository.value" :true-value="1" :false-value="0"
                                      label="In institutional repository" color="primary" hide-details />
                        </v-col>
                    </v-row>

                    <v-divider class="my-4" />

                    <div class="text-subtitle-1 mb-1">Publication details</div>
                    <v-alert type="warning" variant="tonal" density="compact" class="mb-3">
                        These fields are shared with all co-authors of this publication.
                    </v-alert>

                    <v-row dense>
                        <v-col cols="12">
                            <v-text-field v-model="f.title.value" label="Title" :error-messages="errors.title" />
                        </v-col>
                        <v-col cols="12" sm="8">
                            <v-autocomplete v-model="f.journal_id.value" :items="journalItems"
                                            item-title="name" item-value="id" label="Journal"
                                            clearable no-filter :loading="journalLoading"
                                            hint="Type to search by name, abbreviation or ISSN"
                                            @update:search="onJournalSearch">
                                <template #item="{ props: itemProps, item }">
                                    <v-list-item v-bind="itemProps"
                                                 :subtitle="[item.publisher, item.issn].filter(Boolean).join(' · ')" />
                                </template>
                            </v-autocomplete>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-select v-model="f.publication_type_id.value" :items="publicationTypeItems"
                                      label="Publication type" clearable />
                        </v-col>
                        <v-col cols="12">
                            <v-textarea v-model="f.authors_raw.value" label="Authors" rows="3" auto-grow
                                        :error-messages="errors.authors_raw" />
                        </v-col>
                        <v-col cols="6" sm="3">
                            <v-text-field v-model="f.number_authors.value" type="number" label="Number of authors"
                                          :error-messages="errors.number_authors" />
                        </v-col>
                        <v-col cols="6" sm="3">
                            <v-text-field v-model="f.year.value" type="number" label="Year"
                                          :error-messages="errors.year" />
                        </v-col>
                        <v-col cols="12" sm="6">
                            <v-text-field v-model="f.publication_date.value" label="Publication date"
                                          :error-messages="errors.publication_date" />
                        </v-col>
                        <v-col cols="4" sm="3">
                            <v-text-field v-model="f.volume.value" label="Volume" :error-messages="errors.volume" />
                        </v-col>
                        <v-col cols="4" sm="3">
                            <v-text-field v-model="f.page_start.value" label="First page"
                                          :error-messages="errors.page_start" />
                        </v-col>
                        <v-col cols="4" sm="3">
                            <v-text-field v-model="f.page_end.value" label="Last page"
                                          :error-messages="errors.page_end" />
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-text-field v-model="f.doi.value" label="DOI" :error-messages="errors.doi" />
                        </v-col>
                        <v-col cols="6" sm="4">
                            <v-text-field v-model="f.wos.value" label="WoS" :error-messages="errors.wos" />
                        </v-col>
                        <v-col cols="6" sm="4">
                            <v-text-field v-model="f.pubmed_id.value" label="PubMed ID"
                                          :error-messages="errors.pubmed_id" />
                        </v-col>
                    </v-row>
                </form>
            </v-card-text>
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" :disabled="saving" @click="open = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" :loading="saving" :disabled="!meta.dirty"
                    @click="onSubmit">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import type { ApiError } from '@/api/types' // adapt
import { searchJournals, updatePersonPublication, type JournalOption, type PersonPublication } from '@/api/person'
import { useLookup } from '@/composables/useLookup'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

export interface PublicationLink {
    author_type_id: number | null
    position: number | null
    public: 0 | 1
    selected: 0 | 1
    selected_rank: number | null
    in_institutional_repository: 0 | 1
}
export interface PublicationDetails {
    title: string
    authors_raw: string | null
    number_authors: number | null
    journal_id: number | null
    publication_type_id: number | null
    volume: string | null
    page_start: string | null
    page_end: string | null
    doi: string | null
    wos: string | null
    pubmed_id: string | null
    publication_date: string | null
    year: number | null
}
export interface PublicationUpdatePayload {
    link?: Partial<PublicationLink>
    details?: Partial<PublicationDetails>
}


const props = defineProps<{ publication: PersonPublication | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ saved: [row: PersonPublication] }>()

const personId = useTargetPersonId()

// ---- lookups ---------------------------------------------------------------
const { items: authorTypes } = useLookup('author-types')
const { items: publicationTypes } = useLookup('publication-types')

const authorTypeItems = computed(() =>
    authorTypes.value.map((t) => ({ value: t.id, title: t.name })))
const publicationTypeItems = computed(() =>
    publicationTypes.value.map((t) => ({ value: t.id, title: t.name })))

// ---- state (declared before the watch that uses it) -------------------------
const saving = ref(false)
const error = ref('')
const journalItems = ref<JournalOption[]>([])
const journalLoading = ref(false)

// ---- form ------------------------------------------------------------------
const optInt = z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().nullable()
)
const optStr = (max: number) =>
    z.preprocess(
        (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
        z.string().trim().max(max).nullable()
    )
const flag = z.preprocess((v) => (v ? 1 : 0), z.union([z.literal(0), z.literal(1)]))

const schema = toTypedSchema(
    z.object({
        author_type_id: optInt,
        position: optInt,
        public: flag,
        selected: flag,
        selected_rank: optInt,
        in_institutional_repository: flag,
        title: z.string().trim().min(1, 'Required').max(400),
        authors_raw: optStr(10000),
        number_authors: optInt,
        journal_id: optInt,
        publication_type_id: optInt,
        volume: optStr(30),
        page_start: optStr(20),
        page_end: optStr(20),
        doi: optStr(100),
        wos: optStr(20),
        pubmed_id: optStr(10),
        publication_date: optStr(45),
        year: optInt,
    })
)

const { handleSubmit, resetForm, defineField, errors, meta } = useForm({ validationSchema: schema })

const f = {
    author_type_id: defineField('author_type_id')[0],
    position: defineField('position')[0],
    public: defineField('public')[0],
    selected: defineField('selected')[0],
    selected_rank: defineField('selected_rank')[0],
    in_institutional_repository: defineField('in_institutional_repository')[0],
    title: defineField('title')[0],
    authors_raw: defineField('authors_raw')[0],
    number_authors: defineField('number_authors')[0],
    journal_id: defineField('journal_id')[0],
    publication_type_id: defineField('publication_type_id')[0],
    volume: defineField('volume')[0],
    page_start: defineField('page_start')[0],
    page_end: defineField('page_end')[0],
    doi: defineField('doi')[0],
    wos: defineField('wos')[0],
    pubmed_id: defineField('pubmed_id')[0],
    publication_date: defineField('publication_date')[0],
    year: defineField('year')[0],
}

// ---- journal autocomplete (server-side search) ------------------------------
let journalTimer: number | undefined

const currentJournal = (): JournalOption[] =>
    props.publication?.journal_id
        ? [{ id: props.publication.journal_id, name: props.publication.journal ?? '' }]
        : []

// keep the selected journal in the list even if the search no longer returns it
function withSelected(results: JournalOption[]) {
    const id = f.journal_id.value as number | null
    if (id == null || results.some((j) => j.id === id)) return results
    const known = journalItems.value.find((j) => j.id === id) ?? currentJournal()[0]
    return known ? [known, ...results] : results
}

function onJournalSearch(q: string | null) {
    clearTimeout(journalTimer)
    journalTimer = window.setTimeout(async () => {
        journalLoading.value = true
        try {
            journalItems.value = withSelected(await searchJournals(q ?? ''))
        } finally {
            journalLoading.value = false
        }
    }, 300)
}

// ---- reset when opened ------------------------------------------------------
watch(
    () => [open.value, props.publication] as const,
    ([isOpen, pub]) => {
        if (!isOpen || !pub) return
        error.value = ''
        resetForm({ values: { ...pub } as any })
        journalItems.value = currentJournal()
    },
    { immediate: true }
)

// ---- submit -----------------------------------------------------------------
const onSubmit = handleSubmit(
    async (v) => {
        if (!props.publication) return
        saving.value = true
        error.value = ''
        try {
            const payload: PublicationUpdatePayload = {
                link: {
                    author_type_id: v.author_type_id,
                    position: v.position,
                    public: v.public,
                    selected: v.selected,
                    selected_rank: v.selected_rank,
                    in_institutional_repository: v.in_institutional_repository,
                },
                details: {
                    title: v.title,
                    authors_raw: v.authors_raw,
                    number_authors: v.number_authors,
                    journal_id: v.journal_id,
                    publication_type_id: v.publication_type_id,
                    volume: v.volume,
                    page_start: v.page_start,
                    page_end: v.page_end,
                    doi: v.doi,
                    wos: v.wos,
                    pubmed_id: v.pubmed_id,
                    publication_date: v.publication_date,
                    year: v.year,
                },
            }
            const row = await updatePersonPublication(personId.value, props.publication.publication_id, payload)
            emit('saved', row)
            open.value = false
        } catch (err) {
            error.value = (err as ApiError).message
        } finally {
            saving.value = false
        }
    },
    // called instead of the handler above when validation fails
    ({ errors: invalid }) => {
        error.value =
            'Please fix: ' +
            Object.entries(invalid)
                .map(([field, message]) => `${field} (${message})`)
                .join('; ')
    }
)
</script>

