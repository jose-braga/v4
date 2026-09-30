<template>
    <v-tabs :model-value="route.path" color="primary" class="px-3">
        <v-tab to="/person/personal" value="/person/personal">Personal</v-tab>
        <v-tab to="/person/professional-academic" value="/person/professional-academic">Professional/Academic</v-tab>
        <v-tab to="/person/institutional-scientific" value="/person/institutional-scientific">Institutional/Scientific</v-tab>
    </v-tabs>
    <router-view></router-view>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>