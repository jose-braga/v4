<template>
    <v-dialog v-model="open" max-width="1600" scrollable>
        <v-card v-if="member">
            <v-toolbar density="compact">
                <v-toolbar-title>{{ displayName }}</v-toolbar-title>
                <v-btn icon="mdi-close" @click="open = false"></v-btn>
            </v-toolbar>

            <v-alert type="info" variant="tonal" density="compact" class="mx-4 mt-3">
                You are editing information on behalf of {{ displayName }}.
            </v-alert>

            <v-tabs v-model="tab" color="primary" class="px-3">
                <v-tab v-for="t in tabs" :key="t.key" :value="t.key">{{ t.label }}</v-tab>
            </v-tabs>
            <v-divider></v-divider>

            <!-- keyed by person so switching people never shows stale data -->
            <v-card-text :key="member.person_id" class="pa-4">
                <v-window v-model="tab">
                    <v-window-item v-for="t in tabs" :key="t.key" :value="t.key">
                        <component :is="tabComponents[t.key]" />
                    </v-window-item>
                </v-window>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, type Component } from 'vue'
import type { UnitMember } from '@/api/manager'
import { provideTargetPersonId } from '@/composables/useTargetPersonId'
import { personTabs, type PersonTabKey } from '@/pages/person/tabs'
import { managerOnlyTabs } from '@/components/manager/managerTabs'
import PersonPersonal from '@/pages/person/personal/PersonPersonal.vue'
import PersonProfessional from '@/pages/person/professional/PersonProfessional.vue'
import PermissionsControl from '@/components/manager/PermissionsControl.vue'
import UserSettings from '@/components/manager/UserSettings.vue'

const tabs = [...managerOnlyTabs, ...personTabs ]
type DialogTabKey = typeof tabs[number]['key']

const open = defineModel<boolean>({ required: true })
const props = defineProps<{ member: UnitMember | null }>()

provideTargetPersonId(() => String(props.member?.person_id ?? ''))

const displayName = computed(() => props.member?.colloquial_name || props.member?.name || '')

const tabComponents: Record<DialogTabKey, Component> = {
    'permissions': PermissionsControl,
    'user': UserSettings,
    'personal': PersonPersonal,
    'professional-academic': PersonProfessional,
    //'institutional-scientific': PersonInstitutional,
}
const tab = ref('personal')

watch(open, (isOpen) => {
    if (isOpen) tab.value = 'personal'
})
</script>