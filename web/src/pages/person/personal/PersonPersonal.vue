<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12" md="6">
                <DataVisibilitySection class="mb-4"/>
                <CoreInformationSection  class="mb-4"/>
            </v-col>
            <v-col cols="12" md="6">
                <PhotoSection  class="mb-4"/>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
import CoreInformationSection from '@/components/person/personal/CoreInformationSection.vue'
import DataVisibilitySection from '@/components/person/personal/DataVisibilitySection.vue';
import PhotoSection from '@/components/person/personal/PhotoSection.vue'

</script>