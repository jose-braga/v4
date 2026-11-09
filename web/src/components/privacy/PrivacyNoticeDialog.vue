<template>
    <v-dialog v-model="open" max-width="800" scrollable>
        <v-card>
            <v-toolbar density="compact" color="surface">
                <v-toolbar-title>Privacy notice</v-toolbar-title>
                <v-btn icon="mdi-close" aria-label="Close" @click="open = false" />
            </v-toolbar>
            <v-divider />
            <v-card-text class="pa-6">
                <PrivacyNoticeContent />
            </v-card-text>
            <v-divider />
            <v-card-actions>
                <v-spacer />
                <v-btn color="primary" variant="flat" @click="open = false">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import PrivacyNoticeContent from './PrivacyNoticeContent.vue'

const open = defineModel<boolean>({ required: true })
</script>