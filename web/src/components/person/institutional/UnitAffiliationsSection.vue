<template>
    <v-card>
        <v-card-title>Affiliations</v-card-title>
    <v-card-text>
    <div v-if="loading" class="d-flex justify-center pa-4"><v-progress-circular indeterminate /></div>
    <v-alert v-else-if="loadError" type="error" density="compact">{{ loadError }}</v-alert>
    <template v-else-if="data">
        <section v-if="data.editable || data.labs.length" class="mb-6">
            <div class="text-subtitle-1 font-weight-medium mb-2">Lab positions</div>
            <LabPositionsForm
                v-if="data.editable"
                :labs="data.labs" :error="labsError" :success="labsSuccess"
                @submit="onSubmit"
            />
            <LabPositionsList v-else :labs="data.labs" />
        </section>

        <section v-if="data.editable || data.offices.length">
            <div class="text-subtitle-1 font-weight-medium mb-2">Offices and facilities</div>
            <OfficeAffiliationsForm
                v-if="data.editable"
                :offices="data.offices" :error="officesError" :success="officesSuccess"
                @submit="onSubmitOffices"
            />
            <OfficeAffiliationsList v-else :offices="data.offices" />
        </section>
        <p v-if="!data.editable && !data.labs.length && !data.offices.length" class="text-medium-emphasis">
            No institutional affiliations recorded.
        </p>
    </template>
    </v-card-text>
    </v-card>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useTargetPersonId } from '@/composables/useTargetPersonId'
import { useFlashMessages } from '@/composables/useFlashMessages'
import type { ApiError } from '@/api/types'
import {
    fetchInstitutionalAffiliations, updateLabs, updateOffices,
    type InstitutionalAffiliations
} from '@/api/person'
import LabPositionsForm, { type LabsPayload } from './LabPositionsForm.vue'
import OfficeAffiliationsForm, { type OfficesPayload } from './OfficeAffiliationsForm.vue'
import LabPositionsList from './LabPositionsList.vue'
import OfficeAffiliationsList from './OfficeAffiliationsList.vue'


const personId = useTargetPersonId()
const data = ref<InstitutionalAffiliations | null>(null)
const loading = ref(true)
const loadError = ref('')
// one pair of self-dismissing messages per form (destructured, so the template unwraps them)
const {
    error: labsError, success: labsSuccess,
    setError: setLabsError, setSuccess: setLabsSuccess,
} = useFlashMessages()
const {
    error: officesError, success: officesSuccess,
    setError: setOfficesError, setSuccess: setOfficesSuccess,
} = useFlashMessages()

onMounted(async () => {
    try {
        data.value = await fetchInstitutionalAffiliations(Number(personId.value))
    } catch (err) {
        loadError.value = (err as ApiError).message
    } finally {
        loading.value = false
    }
})


async function onSubmit(payload: LabsPayload) {
    setLabsError('')
    setLabsSuccess('')
    try {
        const res = await updateLabs(Number(personId.value), payload)
        data.value = { ...data.value!, labs: res.labs }          // keep `offices` untouched
        setLabsSuccess('Saved successfully.')
    } catch (err) {
        setLabsError((err as ApiError).message)
    }
}

async function onSubmitOffices(payload: OfficesPayload) {
    setOfficesError('')
    setOfficesSuccess('')
    try {
        const res = await updateOffices(Number(personId.value), payload)
        data.value = { ...data.value!, offices: res.offices }    // keep `labs` untouched
        setOfficesSuccess('Saved successfully.')
    } catch (err) {
        setOfficesError((err as ApiError).message)
    }
}
</script>