<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" md="6">
                <DataVisibilitySection class="mb-4"/>
                <CoreInformationSection class="mb-4"/>
            </v-col>
            <v-col cols="12" md="6">
                <PhotoSection class="mb-4"/>
                <ShortCvSection class="mb-4"/>
                <v-expansion-panels class="mb-4" multiple gap="2">
                    <PersonalContacts />
                    <PersonalUrlsSection />
                    <EmergencyContactsSection />
                    <OtherEditorsSection />
                </v-expansion-panels>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
import CoreInformationSection from '@/components/person/personal/CoreInformationSection.vue'
import DataVisibilitySection from '@/components/person/personal/DataVisibilitySection.vue'
import PhotoSection from '@/components/person/personal/PhotoSection.vue'
import ShortCvSection from '@/components/person/personal/ShortCvSection.vue'
import PersonalContacts from '@/components/person/personal/PersonalContactsSection.vue'
import PersonalUrlsSection from '@/components/person/personal/PersonalUrlsSection.vue'
import EmergencyContactsSection from '@/components/person/personal/EmergencyContactsSection.vue'
import OtherEditorsSection from '@/components/person/personal/OtherEditorsSection.vue'

</script>