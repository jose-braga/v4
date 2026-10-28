<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" md="6">
                <AcademicAffiliationsSection class="mb-4"/>
                <WorkPlacesSection class="mb-4"/>
            </v-col>
            <v-col cols="12" md="6">
                <AcademicDegreesSection class="mb-4"/>
                <ProfessionalSituationSection class="mb-4"/>

            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import AcademicAffiliationsSection from '@/components/person/professional/AcademicAffiliationsSection.vue';
import WorkPlacesSection from '@/components/person/professional/WorkPlacesSection.vue';
import AcademicDegreesSection from '@/components/person/professional/AcademicDegreesSection.vue';
import ProfessionalSituationSection from '@/components/person/professional/ProfessionalSituationSection.vue';

</script>