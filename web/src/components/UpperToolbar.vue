<template>
    <v-app-bar
      class="border-bottom px-3"
      color="white"
    >
      <v-app-bar-nav-icon @click="layoutStore.toggleDrawer()"></v-app-bar-nav-icon>
      <v-app-bar-title>{{ pageTitle }}</v-app-bar-title>
      <v-menu
        v-if="!authStore.isAuthenticated"
        v-model="loginMenu"
        :close-on-content-click="false"
        location="start"
      >
        <template v-slot:activator="{ props: menuProps }">
          <v-tooltip text="Login" location="bottom" :disabled="loginMenu">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-icon-btn
                icon="mdi-login"
                variant="text"
                color="green"
                v-bind="mergeProps(menuProps, tooltipProps)"
              ></v-icon-btn>
            </template>
          </v-tooltip>
        </template>
        <LoginMenu />
      </v-menu>
      <v-menu
        v-else
        v-model="accountMenu"
        location="bottom end"
      >
        <template v-slot:activator="{ props: menuProps }">
          <v-tooltip text="My account" location="bottom" :disabled="accountMenu">
            <template v-slot:activator="{ props: tooltipProps }">
              <v-avatar v-bind="mergeProps(menuProps, tooltipProps)" style="cursor: pointer">
                <v-img v-if="authStore.user?.photo_url" :src="authStore.user.photo_url" alt="User avatar"></v-img>
                <v-icon v-else icon="mdi-account-circle" size="32"></v-icon>
              </v-avatar>
            </template>
          </v-tooltip>
        </template>
        <v-list density="compact">
          <v-list-item
            :title="authStore.user?.username"
            prepend-icon="mdi-account"
            disabled
          ></v-list-item>
          <v-divider></v-divider>
          <v-list-item
            title="Change Password"
            prepend-icon="mdi-key"
            @click="changePasswordError = ''; changePasswordDialog = true"
          ></v-list-item>
          <v-list-item
            title="Logout"
            prepend-icon="mdi-logout"
            @click="handleLogout"
          ></v-list-item>
        </v-list>
      </v-menu>

      <v-tooltip text="Report bug or make suggestions" location="bottom">
        <template v-slot:activator="{ props }">
          <v-icon-btn icon="mdi-bug" variant="text" color="grey" v-bind="props"></v-icon-btn>
        </template>
      </v-tooltip>
      <v-tooltip text="Help about this page" location="bottom">
        <template v-slot:activator="{ props }">
          <v-icon-btn id="help-icon"
              icon="mdi-help"
              variant="text" color="blue"
              v-bind="props"
            ></v-icon-btn>
        </template>
      </v-tooltip>
    </v-app-bar>

    <v-dialog v-model="changePasswordDialog" max-width="400">
        <v-card>
            <v-card-title>Change Password</v-card-title>
            <v-card-text>
                <ChangePasswordForm
                    :prefill-username="authStore.user?.username"
                    :error="changePasswordError"
                    @submit="handleChangePasswordSubmit"
                    @cancel="changePasswordDialog = false"
                />
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, mergeProps, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLayoutStore } from '@/stores/layout'
import { useAuthStore } from '@/stores/auth'
//import { changePassword } from '@/api/auth' // you'd add this function
import type { ApiError } from '@/api/types'

import ChangePasswordForm from '@/components/auth/ChangePasswordForm.vue'
import LoginMenu from '@/components/auth/LoginMenu.vue'

const layoutStore = useLayoutStore()
const authStore = useAuthStore()
const route = useRoute()

const loginMenu = ref(false)
const accountMenu = ref(false)
const changePasswordDialog = ref(false)
const changePasswordError = ref('')

const pageTitle = computed(() => { return route.meta.title ?? '' })

watch(() => authStore.isAuthenticated, (isAuthenticated) => {
    if (isAuthenticated) {
        loginMenu.value = false
    }
})

async function handleChangePasswordSubmit(payload: {
    username: string
    oldPassword: string
    newPassword: string
    confirmPassword: string
}) {
    try {
        await authStore.changePassword(payload)
        changePasswordDialog.value = false
        // optionally: show a success snackbar
    } catch (err) {
        const apiError = err as ApiError
        changePasswordError.value = apiError.message
    }
}

async function handleLogout() {
    await authStore.logout()
}

</script>

<style scoped>
#help-icon :deep(.v-icon) {
    animation-duration: 3s;
    animation-name: help-highlight;
    animation-iteration-count: infinite;
    animation-direction: normal;
}
@keyframes help-highlight {
  from {
    font-size: 24px;
  }

  10% {
    font-size: 35px;
  }

  20% {
    font-size: 24px;
  }

  to {
    font-size: 24px;
  }
}
</style>