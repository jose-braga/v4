<template>
    <v-dialog v-model="open" max-width="900" scrollable>
        <v-card v-if="form">
            <v-card-title>Edit before adding</v-card-title>
            <v-card-text>
                <v-row dense>
                    <v-col cols="12">
                        <v-text-field v-model="form.title" label="Title *" counter="400" maxlength="400" />
                    </v-col>
                    <v-col cols="12">
                        <v-textarea v-model="form.authors_raw" label="Authors *" rows="3" auto-grow
                                    hint="Separate authors with ;  (e.g. Braga, J; Silva, M)" persistent-hint />
                    </v-col>
                    <v-col cols="12" sm="7">
                        <v-autocomplete :model-value="form.journal_id" :items="journalItems"
                                        item-title="name" item-value="id" label="Existing journal" clearable no-filter
                                        :loading="journalLoading" hint="Type to search the journals already in the database"
                                        persistent-hint @update:search="onJournalSearch"
                                        @update:model-value="onJournalPicked">
                            <template #item="{ props: itemProps, item }">
                                <v-list-item v-bind="itemProps"
                                             :subtitle="[item.publisher, item.issn].filter(Boolean).join(' · ')" />
                            </template>
                        </v-autocomplete>
                    </v-col>
                    <v-col cols="12" sm="5">
                        <v-text-field v-model="form.journal_name" label="Journal name *" :disabled="!!form.journal_id"
                                      maxlength="200"
                                      hint="No existing journal selected: a new journal with this name will be created"
                                      persistent-hint />
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-text-field v-model="form.year" type="number" label="Year *" />
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-text-field v-model="form.publication_date" label="Publication date" maxlength="45" />
                    </v-col>
                    <v-col cols="4" sm="2">
                        <v-text-field v-model="form.volume" label="Volume" maxlength="30" />
                    </v-col>
                    <v-col cols="4" sm="2">
                        <v-text-field v-model="form.page_start" label="First page" maxlength="20" />
                    </v-col>
                    <v-col cols="4" sm="2">
                        <v-text-field v-model="form.page_end" label="Last page" maxlength="20" />
                    </v-col>
                    <v-col cols="12" sm="6">
                        <v-text-field v-model="form.doi" label="DOI" maxlength="100" />
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-text-field v-model="form.wos" label="WoS" maxlength="20" />
                    </v-col>
                    <v-col cols="6" sm="3">
                        <v-text-field v-model="form.pubmed_id" label="PubMed ID" maxlength="10" />
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="text" @click="open = false">Cancel</v-btn>
                <v-btn color="primary" variant="flat" @click="save">Done</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { searchJournals, type JournalOption, type ImportCandidate } from '@/api/person'

const props = defineProps<{ candidate: ImportCandidate | null }>()
const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ save: [candidate: ImportCandidate] }>()

const form = ref<ImportCandidate | null>(null)
const journalItems = ref<JournalOption[]>([])
const journalLoading = ref(false)
let timer: number | undefined

watch(
    () => [open.value, props.candidate] as const,
    ([isOpen, c]) => {
        if (!isOpen || !c) return
        form.value = { ...c }
        journalItems.value = c.journal_id ? [{ id: c.journal_id, name: c.journal_name ?? '' }] : []
    },
    { immediate: true }
)

function onJournalSearch(q: string | null) {
    clearTimeout(timer)
    timer = window.setTimeout(async () => {
        journalLoading.value = true
        try {
            const found = await searchJournals(q ?? '')
            const sel = form.value?.journal_id
            const keep = sel ? journalItems.value.filter((j) => j.id === sel && !found.some((f) => f.id === sel)) : []
            journalItems.value = [...keep, ...found]
        } finally {
            journalLoading.value = false
        }
    }, 300)
}

function onJournalPicked(id: number | null) {
    if (!form.value) return
    form.value.journal_id = id
    const j = journalItems.value.find((x) => x.id === id)
    if (j) form.value.journal_name = j.name
}

const num = (v: unknown) => (v === '' || v == null ? null : Number(v))

function save() {
    if (!form.value) return
    emit('save', { ...form.value, year: num(form.value.year) })
    open.value = false
}
</script>