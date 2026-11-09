<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" md="6">
                <UnitAffiliationsSection class="mb-4"/>
                <PolesSection class="mb-4"/>
                <SupervisorsSection class="mb-4"/>

            </v-col>
            <v-col cols="12" md="6">
                <ResearcherInfoSection class="mb-4"/>
                <ContactSection class="mb-4"/>
                <ResearchInterestsSection class="mb-4"/>


            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import UnitAffiliationsSection from '@/components/person/institutional/UnitAffiliationsSection.vue'
import PolesSection from '@/components/person/institutional/PolesSection.vue'
import SupervisorsSection from '@/components/person/institutional/SupervisorsSection.vue'
import ResearcherInfoSection from '@/components/person/institutional/ResearcherInfoSection.vue'
import ContactSection from '@/components/person/institutional/ContactSection.vue'
import ResearchInterestsSection from '@/components/person/institutional/ResearchInterestsSection.vue'

</script>