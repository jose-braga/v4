<template>
    <ul v-if="labs.length" class="pl-5">
        <li v-for="l in labs" :key="l.id" class="mb-3">
            <v-chip size="x-small" label class="mr-2" :color="isCurrent(l.valid_until) ? 'success' : undefined">
                {{ isCurrent(l.valid_until) ? 'Current' : 'Past' }}
            </v-chip>
            <strong>{{ l.lab_position_name ?? 'Member' }}</strong>
            <span class="text-medium-emphasis">
                - {{ l.lab_name }}<template v-if="l.group_name">, {{ l.group_name }}</template>
                <template v-if="l.unit_name"> @ {{ l.unit_name }}</template>
            </span>
            <v-chip v-if="l.integrated" size="x-small" label class="ml-2">Integrated</v-chip>
            <v-chip v-if="l.nuclearCV" size="x-small" label class="ml-1">Nuclear CV</v-chip>
            <v-chip v-if="l.pluriannual" size="x-small" label class="ml-1">Pluriannual</v-chip>
            <div class="text-body-2">
                <template v-if="l.dedication !== null">Dedication: {{ l.dedication }}% </template>
                ({{ day(l.valid_from) ?? '?' }} - {{ day(l.valid_until) ?? '' }})
            </div>
        </li>
    </ul>
    <p v-else class="text-medium-emphasis">No lab positions recorded.</p>
</template>

<script lang="ts" setup>
import type { LabRow } from '@/api/person'
import { isCurrent } from '@/utils/date'

defineProps<{ labs: LabRow[] }>()
const day = (s: string | null) => (s ? s.slice(0, 10) : null)
</script>