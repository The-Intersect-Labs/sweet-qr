import { provideSSRWidth } from '@vueuse/core'

// Reka UI measures some components on mount; a stable SSR width avoids mobile
// hydration mismatches for popovers, selects and tooltips.
export default defineNuxtPlugin((nuxtApp) => {
  provideSSRWidth(1024, nuxtApp.vueApp)
})
