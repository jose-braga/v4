<template>
    <v-card>
        <v-card-title>Website Personal Photo</v-card-title>
        <v-card-text>
            <div v-if="loading" class="d-flex justify-center pa-6">
                <v-progress-circular indeterminate></v-progress-circular>
            </div>
            <PhotoForm
                v-else
                :photo600-url="data?.photo600Url"
                :error="error"
                :success="success"
                @upload="handleUpload"
            />
        </v-card-text>
    </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import PhotoForm from './PhotoForm.vue'
import type { PersonPhoto } from './PhotoForm.vue'
import { fetchPhoto, uploadPhoto } from '@/api/person'
import { useEditableSection } from '@/composables/useEditableSection'


const authStore = useAuthStore()
const personId = computed(() => authStore.user!.person_id)

const { data, loading, error, success, submit } = useEditableSection<PersonPhoto, Blob>(
    () => fetchPhoto(personId.value),
    (blob: Blob) => uploadPhoto(personId.value, blob)
)

async function handleUpload(blob: Blob) {
    await submit(blob)

    // If upload succeeded and returns the new photo URL (photo196Url or photo600Url)
    if (data.value?.photo196Url || data.value?.photo600Url) {
        const newPhotoUrl = data.value.photo196Url || data.value.photo600Url!
        authStore.updateUserPhoto(newPhotoUrl)
    }
}
</script>