<template>
    <v-tabs :model-value="route.path" color="primary" class="px-3">
        <v-tab to="/person/personal" value="/person/personal">Personal</v-tab>
        <v-tab to="/person/professional" value="/person/professional">Professional</v-tab>
    </v-tabs>
    <router-view></router-view>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>