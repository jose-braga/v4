import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  // State: TypeScript automatically infers this as Ref<boolean>
  const isDrawerOpen = ref<boolean>(true)

  // Action: Toggles the visibility state
  function toggleDrawer(): void {
    isDrawerOpen.value = !isDrawerOpen.value
  }

  return {
    isDrawerOpen,
    toggleDrawer
  }
})