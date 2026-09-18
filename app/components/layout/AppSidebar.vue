<script setup lang="ts">
import { PlusIcon } from '@lucide/vue'

defineProps<{ onNavigate?: () => void }>()
</script>

<template>
  <div class="bg-sidebar border-sidebar-border flex h-full flex-col gap-5 overflow-y-auto border-r px-3 py-4">
    <Logo class="px-1.5" />

    <Button as-child class="w-full">
      <NuxtLink to="/generator" @click="onNavigate?.()">
        <PlusIcon />
        New QR code
      </NuxtLink>
    </Button>

    <SideNav :on-navigate="onNavigate" class="flex-1" />
  </div>
</template>
