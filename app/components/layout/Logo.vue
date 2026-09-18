<script setup lang="ts">
import { QrCodeIcon } from '@lucide/vue'

defineProps<{ compact?: boolean }>()
</script>

<template>
  <NuxtLink
    to="/"
    class="focus-visible:ring-ring/50 flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3"
  >
    <span
      class="from-primary to-chart-2 grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm"
      aria-hidden="true"
    >
      <QrCodeIcon class="size-5" />
    </span>
    <span v-if="!compact" class="flex min-w-0 flex-col leading-tight">
      <span class="text-sm font-semibold tracking-tight">SweetQR</span>
      <span class="text-muted-foreground text-[0.7rem]">Local-first QR toolkit</span>
    </span>
  </NuxtLink>
</template>
