<!-- DataVisibilitySection.vue -->
<template>
    <v-card>
        <v-card-title>Data Visibility</v-card-title>
        <v-card-text>
            <b>In accordance with the General Data Protection Regulation
            (EU) 2016/679, in force since 25 May, 2018, I have been
            informed that:</b>
                <ul class="small-text">
                    <li>All data provided through the platform https://v2.laqv-ucibio.info/
                        can be used to:<br>
                        (1) the internal management of the research team
                        and<br>
                        (2) dissemination of the activities of the institution.<br>
                        For the second purpose, only the Full name, Colloquial name,
                        Photo URL, Academic degrees & academic jobs, Lab and
                        group affiliations within LAQV or UCIBIO, Institutional
                        contacts: Email, Phone and Internal Phone extension,
                        Institutional personal webpage & CV, ORCID, Researcher ID,
                        Ciência ID, and Publications will be used.
                    </li>
                    <li>I have the right to request, at any time, the access to my
                        personal data, as well as the rectification or erasure of
                        data collected for dissemination purposes, by sending an
                        email to josebraga@fct.unl.pt.
                    </li>
                    <li>The Research Units have taken technical and organizational
                        measures necessary to ensure the protection of my personal
                        data;
                    </li>
                    <li>By saying YES, I consent the use of my personal data
                        for the above-mentioned purposes.</li>
                </ul>
        </v-card-text>

        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <v-alert v-else-if="error && !data" type="error" density="compact">
                {{ error }}
            </v-alert>
            <DataVisibilityForm
                v-else
                :visibility="data?.visibility ?? false"
                :saving="submitting"
                :error="error"
                :success="success"
                @change="submit"
            />
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import DataVisibilityForm from './DataVisibilityForm.vue'
import type { DataVisibilityPayload } from './DataVisibilityForm.vue'
import { fetchDataVisibility, updateDataVisibility } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'

const authStore = useAuthStore()
const personId = computed(() => authStore.user!.person_id)

const { data, loading, submitting, error, success, submit } = useEditableSection<DataVisibilityPayload>(
    () => fetchDataVisibility(personId.value),
    (payload) => updateDataVisibility(personId.value, payload)
)
</script>