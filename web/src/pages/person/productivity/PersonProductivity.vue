<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" md="3" xl="2">
                <v-card v-if="mdAndUp" class="position-sticky" style="top: 16px">
                    <v-list nav density="comfortable">
                        <template v-for="g in groups" :key="g.title ?? 'main'">
                            <v-list-subheader v-if="g.title">{{ g.title }}</v-list-subheader>
                            <v-list-item
                                v-for="s in g.items"
                                :key="s.key"
                                :title="s.label"
                                :prepend-icon="s.icon"
                                :active="active === s.key"
                                color="primary"
                                rounded="lg"
                                @click="active = s.key"
                            >
                                <template #append>
                                    <v-chip
                                        size="x-small" label variant="tonal"
                                        :color="active === s.key ? 'primary' : undefined"
                                        :class="{ 'text-medium-emphasis': !counts[s.key] }"
                                    >
                                        {{ counts[s.key] ?? '–' }}
                                    </v-chip>
                                </template>
                            </v-list-item>
                        </template>
                    </v-list>
                </v-card>
                <v-select
                    v-else
                    v-model="active"
                    :items="selectItems"
                    label="Section"
                    hide-details
                />
            </v-col>
            <v-col v-if="active === 'publications'"
                cols="12" md="9" xl="10">
                <AuthorNamesSection class="mb-4"/>
            </v-col>
            <v-col v-if="active === 'projects'"
                cols="12" md="9" xl="10">

            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import AuthorNamesSection from '@/components/person/productivity/AuthorNamesSection.vue'

import { computed, ref } from 'vue'
import { useDisplay } from 'vuetify'

const { mdAndUp } = useDisplay()

interface Section {
    key: string
    label: string
    icon: string
    group?: 'other'
}

const sections: Section[] = [
    { key: 'publications',   label: 'Publications',       icon: 'mdi-book-open-page-variant-outline' },
    { key: 'projects',       label: 'Projects',           icon: 'mdi-folder-star-outline' },
    { key: 'communications', label: 'Communications',     icon: 'mdi-presentation' },
    { key: 'meetings',       label: 'Meetings organised', icon: 'mdi-calendar-account-outline', group: 'other' },
    { key: 'patents',        label: 'Patents',            icon: 'mdi-lightbulb-outline',        group: 'other' },
    { key: 'prizes',         label: 'Prizes',             icon: 'mdi-trophy-outline',           group: 'other' },
]

const groups = [
    { title: null, items: sections.filter((s) => !s.group) },
    { title: 'Other', items: sections.filter((s) => s.group === 'other') },
]

// demo values: in the real tab they come from one API call (see below)
const counts = ref<Record<string, number>>({
    publications: 124, projects: 7, communications: 38, meetings: 4, patents: 0, prizes: 3,
})

const active = ref('publications')
const activeSection = computed(() => sections.find((s) => s.key === active.value)!)
const selectItems = computed(() =>
    sections.map((s) => ({ value: s.key, title: `${s.label} (${counts.value[s.key] ?? 0})` })),
)
</script>