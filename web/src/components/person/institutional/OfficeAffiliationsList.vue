<template>
    <ul class="pl-5">
        <li v-for="o in offices" :key="`${o.kind}-${o.id}`" class="mb-3">
            <v-chip
                v-if="o.valid_from || o.valid_until"
                size="x-small" label class="mr-2"
                :color="isCurrent(o.valid_until) ? 'success' : undefined"
            >
                {{ isCurrent(o.valid_until) ? 'Current' : 'Past' }}
            </v-chip>
            <strong>{{ o.position ?? 'Member' }}</strong>
            <span class="text-medium-emphasis">
                - {{ o.office }}<template v-if="o.unit"> @ {{ o.unit }}</template>
            </span>
            <v-chip size="x-small" label class="ml-2">{{ officeKindLabels[o.kind] }}</v-chip>
            <div v-if="o.dedication !== null || o.valid_from || o.valid_until" class="text-body-2">
                <template v-if="o.dedication !== null">Dedication: {{ o.dedication }}% </template>
                ({{ day(o.valid_from) ?? '?' }} - {{ day(o.valid_until) ?? '' }})
            </div>
        </li>
    </ul>
</template>

<script lang="ts" setup>
import { officeKindLabels, type OfficeAffiliation } from '@/api/person'
import { isCurrent } from '@/utils/date'

defineProps<{ offices: OfficeAffiliation[] }>()
const day = (s: string | null) => (s ? s.slice(0, 10) : null)
</script>