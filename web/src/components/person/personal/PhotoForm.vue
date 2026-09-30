<template>
    <div>
        <div class="d-flex align-center ga-4 mb-4">
            <v-avatar size="120" rounded="0">
                <v-img v-if="photo600Url" :src="photo600Url" alt="Profile photo"></v-img>
                <v-icon v-else icon="mdi-account-circle" size="120"></v-icon>
            </v-avatar>
            <div>
                <div class="text-body-2 mb-1">To change image click "Browse" below.</div>
                <v-file-input
                    label="File"
                    accept="image/*"
                    density="compact"
                    prepend-icon="mdi-paperclip"
                    hide-details
                    @update:model-value="onFileSelected"
                ></v-file-input>
            </div>
        </div>

        <v-row v-if="imageSrc" class="mt-2">
            <v-col cols="12" sm="6">
                <div class="text-overline text-center mb-1">Original</div>
                <cropper
                    ref="cropperRef"
                    class="cropper"
                    :src="imageSrc"
                    :stencil-props="{ aspectRatio: 1 }"
                    image-restriction="stencil"
                    @change="onCropChange"
                ></cropper>
            </v-col>
            <v-col cols="12" sm="6">
                <div class="text-overline text-center mb-1">Crop</div>
                <div class="preview-wrapper">
                    <img v-if="previewSrc" :src="previewSrc" class="preview-image" alt="Crop preview" />
                </div>
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12" md="10">
                <v-alert v-if="error" type="error" density="compact" class="mb-4">
                    {{ error }}
                </v-alert>
                <v-alert v-if="success" type="success" density="compact" class="mb-4">
                    {{ success }}
                </v-alert>
            </v-col>
        </v-row>


        <div v-if="imageSrc" class="d-flex justify-end ga-2 mt-4">
            <v-btn variant="text" :disabled="uploading" @click="cancelCrop">Cancel</v-btn>
            <v-btn color="primary" :loading="uploading" @click="confirmCrop">Update</v-btn>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

export interface PersonPhoto {
    photo196Url: string | null
    photo600Url: string | null
}

defineProps<{
    photo600Url?: string | null
    error?: string
    success?: string
}>()

const emit = defineEmits<{
    upload: [blob: Blob]
}>()

const cropperRef = ref<InstanceType<typeof Cropper> | null>(null)
const imageSrc = ref('')
const previewSrc = ref('')
const uploading = ref(false)

function onFileSelected(file: File | File[] | null) {
    const selected = Array.isArray(file) ? file[0] : file
    if (!selected) return

    if (imageSrc.value) URL.revokeObjectURL(imageSrc.value)
    imageSrc.value = URL.createObjectURL(selected)
    previewSrc.value = ''
}

function onCropChange({ canvas }: { canvas: HTMLCanvasElement }) {
    previewSrc.value = canvas.toDataURL('image/jpeg', 0.9)
}

function cancelCrop() {
    if (imageSrc.value) URL.revokeObjectURL(imageSrc.value)
    imageSrc.value = ''
    previewSrc.value = ''
}

async function confirmCrop() {
    const result = cropperRef.value?.getResult()
    if (!result?.canvas) return

    uploading.value = true
    result.canvas.toBlob(
        (blob) => {
            uploading.value = false
            if (blob) {
                emit('upload', blob)
                cancelCrop()
            }
        },
        'image/jpeg',
        0.9
    )
}
</script>

<style scoped>
.cropper {
    height: 260px;
    background: #ddd;
}

.preview-wrapper {
    height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eee;
    overflow: hidden;
}

.preview-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
</style>