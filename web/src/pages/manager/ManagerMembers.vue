<template>
    <v-container fluid>
    <v-card class="pa-4">
        <v-card-title class="d-flex align-center">
            Members
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="mode" density="compact" mandatory divided class="mr-4">
                <v-btn value="current" size="small">Current</v-btn>
                <v-btn value="past" size="small">Past</v-btn>
            </v-btn-toggle>
        </v-card-title>

        <v-row class="px-4">
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="personQuery"
                    label="Search people"
                    placeholder="Name, email, ID or Ciência ID"
                    prepend-inner-icon="mdi-magnify"
                    density="compact"
                    variant="outlined"
                    clearable
                    hide-details
                ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-text-field
                    v-model="labQuery"
                    label="Search labs/facilities/..."
                    placeholder="Lab name or ID"
                    prepend-inner-icon="mdi-magnify"
                    density="compact"
                    variant="outlined"
                    clearable
                    hide-details
                ></v-text-field>
            </v-col>
        </v-row>
        <div class="text-caption text-medium-emphasis px-4 pt-2">
            {{ filteredRows.length }} of {{ members.length }} members
        </div>

        <v-alert v-if="error" type="error" density="compact" class="mx-4 my-2">
            {{ error }}
        </v-alert>

        <v-data-table
            v-model:sort-by="sortBy"
            multi-sort
            :headers="headers"
            :items="filteredRows"
            :loading="loading"
            item-value="person_id"
            show-expand
        >
            <!-- chevron: its position comes from the 'data-table-expand' header -->
            <template #item.data-table-expand="{ item, internalItem, isExpanded, toggleExpand }">
                <v-btn
                    v-if="item.affiliations.length > 1"
                    :icon="isExpanded(internalItem) ? 'mdi-chevron-up' : 'mdi-chevron-down'"
                    variant="text"
                    size="small"
                    @click="toggleExpand(internalItem)"
                ></v-btn>
            </template>

            <template #item.positionOrder="{ item }">{{ item.position ?? '—' }}</template>

            <template #item.labName="{ item }">
                <template v-if="item.affiliations.length > 0">
                    <v-icon :icon="kindIcon[item.affiliations[0].kind]" size="small" class="mr-1"></v-icon>
                    {{ item.labName }}
                    <span v-if="item.affiliations.length > 1" class="text-caption text-medium-emphasis ml-1">
                        +{{ item.affiliations.length - 1 }}
                    </span>
                </template>
                <span v-else class="text-medium-emphasis">—</span>
            </template>

            <template #item.started="{ item }">{{ fmt(item.started) }}</template>
            <template #item.finished="{ item }">{{ fmt(item.finished) }}</template>
            <template #item.dedication="{ item }">{{ fmtDedication(item.dedication) }}</template>

            <template #item.actions="{ item }">
                <v-btn size="small" variant="text" color="primary" @click="openEdit(item.member)">
                    Edit
                </v-btn>
            </template>

            <template #expanded-row="{ columns, item }">
                <tr>
                    <td :colspan="columns.length" class="py-2">
                        <v-table density="compact">
                            <thead>
                                <tr>
                                    <th>Group</th>
                                    <th>Lab</th>
                                    <th>Position</th>
                                    <th>Started</th>
                                    <th>Finished</th>
                                    <th>Dedication</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="a in item.affiliations"
                                    :key="a.key"
                                    :class="{ 'text-medium-emphasis': !a.active }"
                                >
                                    <td>{{ a.groupName ?? '—' }}</td>
                                    <td>
                                        <v-icon :icon="kindIcon[a.kind]" size="small" class="mr-1"></v-icon>
                                        {{ a.label }}
                                    </td>
                                    <td>{{ a.position ?? '—' }}</td>
                                    <td>{{ fmt(a.validFrom) }}</td>
                                    <td>{{ fmt(a.validUntil) }}</td>
                                    <td>{{ fmtDedication(a.dedication) }}</td>
                                </tr>
                            </tbody>
                        </v-table>
                    </td>
                </tr>
            </template>
        </v-data-table>
    </v-card>
    </v-container>

    <MemberEditDialog v-model="editOpen" :member="editMember" />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useManagerStore } from '@/stores/manager'
import { useAuthStore } from '@/stores/auth'
import { fetchUnitMembers, type UnitMember } from '@/api/manager'
import { buildAffiliations, type AffiliationKind } from '@/utils/affiliations'
import { tokenize, matchesPerson, matchesLab, prioritizeMatches } from '@/utils/memberSearch'
import MemberEditDialog from '@/components/manager/MemberEditDialog.vue'
import type { ApiError } from '@/api/types'


const route = useRoute()
const managerStore = useManagerStore()
const authStore = useAuthStore()

const members = ref<UnitMember[]>([])
const loading = ref(true)
const error = ref('')
const mode = ref<'current' | 'past'>('current')

const personQuery = ref<string | null>('')
const labQuery = ref<string | null>('')
const personTokens = computed(() => tokenize(personQuery.value))
const labTokens = computed(() => tokenize(labQuery.value))

const editOpen = ref(false)
const editMember = ref<UnitMember | null>(null)

const unitSlug = computed(() => route.params.unitSlug as string)
const unit = computed(() => managerStore.units.find((u) => u.slug === unitSlug.value))

const rows = computed(() =>
    members.value.map((m) => {
        const affiliations = prioritizeMatches(buildAffiliations(m), labTokens.value, mode.value)
        const primary = affiliations[0]
        return {
            member: m,
            person_id: m.person_id,
            displayName: m.name,
            affiliations,
            position: primary?.position ?? null,
            positionOrder: primary?.sortOrder ?? Number.MAX_SAFE_INTEGER,
            labName: primary?.label ?? null,
            started: primary?.validFrom ?? null,
            finished: primary?.validUntil ?? null,
            dedication: primary?.dedication ?? null,
            cienciaId: m.researcher_details[0]?.ciencia_id ?? null,
        }
    })
)

const sortBy = ref<{ key: string; order: 'asc' | 'desc' }[]>([
    { key: 'displayName', order: 'asc' },
])

const filteredRows = computed(() =>
    rows.value.filter(
        (r) => matchesPerson(r.member, personTokens.value) && matchesLab(r.affiliations, labTokens.value, mode.value)
    )
)

const headers = [
    { title: '', key: 'data-table-expand', sortable: false, width: 48 },
    { title: 'ID', key: 'person_id' },
    { title: 'Name', key: 'displayName' },
    { title: 'Position', key: 'positionOrder' },
    { title: 'Lab name', key: 'labName' },
    { title: 'Started', key: 'started' },
    { title: 'Finished', key: 'finished' },
    { title: 'Dedication', key: 'dedication', align: 'end' as const },
    { title: 'Ciência ID', key: 'cienciaId', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end' as const },
]

const kindIcon: Record<AffiliationKind, string> = {
    lab: 'mdi-flask-outline',
    technician: 'mdi-wrench-outline',
    science_manager: 'mdi-account-tie-outline',
    administrative: 'mdi-briefcase-outline',
}

const fmt = (d: string | null) => d ?? '—'
const fmtDedication = (d: number | null) => (d == null ? '—' : `${d}%`)

function openEdit(member: UnitMember) {
    editMember.value = member
    editOpen.value = true
}

async function load() {
    if (!unit.value) return
    loading.value = true
    error.value = ''
    try {
        members.value = await fetchUnitMembers(authStore.user!.id, unit.value.id, mode.value === 'past')
    } catch (err) {
        error.value = (err as ApiError).message
        members.value = []
    } finally {
        loading.value = false
    }
}

watch(editOpen, (isOpen) => { if (!isOpen) load() })
watch([unitSlug, mode], load, { immediate: true })
</script>