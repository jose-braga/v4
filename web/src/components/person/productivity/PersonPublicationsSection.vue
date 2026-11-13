
<template>
    <v-card>
        <v-card-title class="d-flex align-center">
            Publications
            <v-chip size="small" class="ml-2">{{ count }}</v-chip>
        </v-card-title>
        <v-card-text class="mt-4">

            <v-row class="align-center">
                To add:
                <v-menu>
                    <template #activator="{ props: menuProps }">
                        <v-btn v-bind="menuProps" color="primary" variant="tonal"
                            class="mr-3"
                            prepend-icon="mdi-download-outline" append-icon="mdi-menu-down">Import</v-btn>
                    </template>
                    <v-list density="compact">
                        <v-list-item prepend-icon="mdi-identifier"
                            title="From ORCID"
                            @click="openImport('orcid')" />
                        <v-list-item prepend-icon="mdi-bank-outline"
                            title="From repository (PURE@FCT)"
                            @click="openImport('pure')" />
                    </v-list>
                </v-menu>

                <v-btn color="primary" variant="tonal"
                    prepend-icon="mdi-plus"
                    class="mr-6"
                    @click="searchOpen = true">Claim from DB</v-btn>

            </v-row>
        </v-card-text>
        <v-card-text>
            <v-text-field v-model="search" density="compact" variant="outlined" hide-details clearable
                        prepend-inner-icon="mdi-magnify" label="Search"  />
        </v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mx-4 mb-4">{{ error }}</v-alert>

        <v-data-table :headers="headers" :items="items" :search="search" :loading="loading"
                      item-value="publication_id" :items-per-page="25" density="compact" hover
                      :sort-by="[{ key: 'year', order: 'desc' }]">
            <template #item.title="{ item }">
                <div class="text-wrap py-2" >
                    {{ item.title }}
                </div>
            </template>

            <template #item.authors_raw="{ item }">
                <div class="authors-clamp text-medium-emphasis" :title="item.authors_raw ?? ''">
                    {{ item.authors_raw }}
                </div>
            </template>

            <template #item.journal="{ item }">
                <span :title="item.journal ?? ''">{{ item.journal_short_name || item.journal }}</span>
            </template>

            <template #item.actions="{ item }">
                <v-btn :icon="item.public ? 'mdi-eye' : 'mdi-eye-off-outline'" size="small" variant="text"
                       :color="item.public ? 'primary' : undefined"
                       :disabled="busy.has(item.publication_id)"
                       :title="item.public ? 'Visible in the public API (click to hide)' : 'Hidden from the public API (click to show)'"
                       @click="toggle(item, 'public')" />
                <v-btn :icon="item.selected ? 'mdi-star' : 'mdi-star-outline'" size="small" variant="text"
                       :color="item.selected ? 'warning' : undefined"
                       :disabled="busy.has(item.publication_id)"
                       :title="item.selected ? 'Highlighted (click to remove)' : 'Highlight this publication'"
                       @click="toggle(item, 'selected')" />
                <v-btn icon="mdi-pencil-outline" size="small" variant="text" title="Edit" @click="edit(item)" />
                <v-btn icon="mdi-link-off" size="small" variant="text" color="error"
                       title="Remove from this person" @click="askDissociate(item)" />
            </template>

            <template #no-data>No publications found.</template>
        </v-data-table>

        <ImportCandidatesDialog v-model="importOpen" :source="importSource" @added="onAdded" />
        <PublicationEditDialog v-model="editOpen" :publication="editing" @saved="onSaved" />
        <PublicationSearchDialog v-model="searchOpen" @added="onAdded" />

        <v-dialog v-model="confirmOpen" max-width="480">
            <v-card>
                <v-card-title>Remove publication?</v-card-title>
                <v-card-text>
                    <p class="mb-2 font-italic">{{ toRemove?.title }}</p>
                    This only removes the association with this person. The publication stays in the
                    system for its other authors.
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" :disabled="removing" @click="confirmOpen = false">Cancel</v-btn>
                    <v-btn color="error" variant="flat" :loading="removing" @click="doDissociate">Remove</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-snackbar v-model="snack.show" :color="snack.color" timeout="3500">{{ snack.text }}</v-snackbar>
    </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useGoTo } from 'vuetify'
import {
    dissociatePublication,
    fetchPersonPublications,
    updatePersonPublication,
    type PersonPublication,
    type ImportSource
} from '@/api/person'
import { useTargetPersonId } from '@/composables/useTargetPersonId'
import PublicationEditDialog from './PublicationEditDialog.vue'
import PublicationSearchDialog from './PublicationSearchDialog.vue'
import ImportCandidatesDialog from './ImportCandidatesDialog.vue'

const personId = useTargetPersonId()

const items = ref<PersonPublication[]>([])
const loading = ref(true)
const error = ref('')
const search = ref('')
const goTo = useGoTo()
const importOpen = ref(false)
const importSource = ref<ImportSource>('orcid')
    function openImport(s: ImportSource) {
    importSource.value = s
    importOpen.value = true
}

const searchOpen = ref(false)
function onAdded(row: PersonPublication) {
    items.value.unshift(row)
    notify('Publication added', 'success')
}

const headers = [
    { title: 'Title', key: 'title' },
    { title: 'Authors', key: 'authors_raw', sortable: false },
    { title: 'Journal', key: 'journal' },
    { title: 'Year', key: 'year' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const, },
]

onMounted(async () => {
    try {
        items.value = await fetchPersonPublications(personId.value)
    } catch (err) {
        error.value = (err as { message?: string }).message ?? 'Could not load publications'
    } finally {
        loading.value = false
    }
})

// ---- snackbar ----
const snack = ref({ show: false, text: '', color: 'error' })
const notify = (text: string, color = 'error') => (snack.value = { show: true, text, color })

// ---- public / highlight toggles (optimistic) ----
const busy = ref(new Set<number>())

async function toggle(item: PersonPublication, field: 'public' | 'selected') {
    if (busy.value.has(item.publication_id)) return
    const previous = item[field]
    const next: 0 | 1 = previous ? 0 : 1
    item[field] = next
    busy.value.add(item.publication_id)
    try {
        await updatePersonPublication(personId.value, item.publication_id, { link: { [field]: next } })
    } catch (err) {
        item[field] = previous
        notify((err as { message?: string }).message ?? 'Could not save')
    } finally {
        busy.value.delete(item.publication_id)
    }
}

// ---- edit ----
const editOpen = ref(false)
const editing = ref<PersonPublication | null>(null)

function edit(item: PersonPublication) {
    editing.value = item
    editOpen.value = true
}
function onSaved(row: PersonPublication) {
    const i = items.value.findIndex((p) => p.publication_id === row.publication_id)
    if (i >= 0) items.value[i] = row
    notify('Publication updated', 'success')
}

// ---- dissociate ----
const confirmOpen = ref(false)
const toRemove = ref<PersonPublication | null>(null)
const removing = ref(false)

function askDissociate(item: PersonPublication) {
    toRemove.value = item
    confirmOpen.value = true
}
async function doDissociate() {
    if (!toRemove.value) return
    const id = toRemove.value.publication_id
    removing.value = true
    try {
        await dissociatePublication(personId.value, id)
        items.value = items.value.filter((p) => p.publication_id !== id)
        confirmOpen.value = false
        notify('Publication removed from this person', 'success')
    } catch (err) {
        notify((err as { message?: string }).message ?? 'Could not remove')
    } finally {
        removing.value = false
    }
}

const count = computed(() => items.value.length)
</script>

<style scoped>
.authors-clamp {
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    /*min-width: 200px;
    max-width: 420px;*/
}

</style>