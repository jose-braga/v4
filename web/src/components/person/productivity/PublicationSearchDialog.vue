<template>
    <v-dialog v-model="open" max-width="1000" scrollable>
        <v-card>
            <v-card-title>Add an existing publication</v-card-title>

            <v-card-text>
                <v-row>
                    <v-col cols="12" md="8">
                        <v-text-field v-model="query" autofocus clearable label="Search titles and authors"
                                      prepend-inner-icon="mdi-magnify" :loading="loading"
                                      hint='Words match the start of a word. Use quotes for an exact name, e.g. dep "Braga, J"'
                                      persistent-hint />
                    </v-col>
                    <v-col cols="12" md="4">
                        <v-select v-model="authorTypeId"
                            :items="authorTypes" item-title="name" item-value="id"
                            label="Add as (optional)" clearable
                            hint="Author type for the publications you add; you can set it later" persistent-hint />
                    </v-col>
                </v-row>

                <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mt-3">{{ error }}</v-alert>

                <v-list v-if="results.length" lines="three" class="mt-2">
                    <v-list-item v-for="r in results" :key="r.publication_id">
                        <v-list-item-title class="text-wrap">{{ r.title }}</v-list-item-title>
                        <div class="authors-clamp text-body-2 text-medium-emphasis">{{ r.authors_raw }}</div>
                        <div class="text-caption text-medium-emphasis">
                            {{ [r.journal_short_name || r.journal, r.year].filter(Boolean).join(' · ') }}
                        </div>
                        <template #append>
                            <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus"
                                   :loading="adding.has(r.publication_id)"
                                   @click="add(r)">Add</v-btn>
                        </template>
                    </v-list-item>
                </v-list>

                <div v-else-if="searched && !loading" class="text-medium-emphasis mt-4">
                    No matching publications that are not already in your list.
                </div>

                <div v-if="results.length === 50" class="text-caption text-medium-emphasis mt-2">
                    Showing the first 50 results. Refine your search to narrow them down.
                </div>
            </v-card-text>

            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="open = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
    addPersonPublication,
    searchPublications,
    type PersonPublication,
    type PublicationSearchResult,
} from '@/api/person'
import { useLookup } from '@/composables/useLookup'
import { useTargetPersonId } from '@/composables/useTargetPersonId'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ added: [row: PersonPublication] }>()

const personId = useTargetPersonId()

const { items: authorTypes } = useLookup('author-types')
const authorTypeId = ref<number | null>(null)

const query = ref('')
const results = ref<PublicationSearchResult[]>([])
const searched = ref(false)
const loading = ref(false)
const error = ref('')
const adding = ref(new Set<number>())

// reset every time the dialog opens
watch(open, (isOpen) => {
    if (!isOpen) return
    query.value = ''
    results.value = []
    searched.value = false
    error.value = ''
})

// debounced search; `seq` discards out-of-order responses
let timer: number | undefined
let seq = 0

watch(query, (q) => {
    clearTimeout(timer)
    if (!q || !q.trim()) {
        seq++
        results.value = []
        searched.value = false
        loading.value = false
        return
    }
    timer = window.setTimeout(run, 400)
})

async function run() {
    const mine = ++seq
    loading.value = true
    error.value = ''
    try {
        const r = await searchPublications(personId.value, query.value)
        if (mine !== seq) return
        results.value = r
        searched.value = true
    } catch (err) {
        if (mine === seq) error.value = (err as { message?: string }).message ?? 'Search failed'
    } finally {
        if (mine === seq) loading.value = false
    }
}

async function add(r: PublicationSearchResult) {
    if (adding.value.has(r.publication_id)) return
    adding.value.add(r.publication_id)
    error.value = ''
    try {
        const row = await addPersonPublication(personId.value, r.publication_id, authorTypeId.value)
        results.value = results.value.filter((x) => x.publication_id !== r.publication_id)
        emit('added', row)
    } catch (err) {
        error.value = (err as { message?: string }).message ?? 'Could not add the publication'
    } finally {
        adding.value.delete(r.publication_id)
    }
}
</script>

<style scoped>
.authors-clamp {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>