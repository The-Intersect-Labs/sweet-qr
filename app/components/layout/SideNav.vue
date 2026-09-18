<script setup lang="ts">
import { ShieldCheckIcon } from '@lucide/vue'
import { PRIMARY_NAV, SECONDARY_NAV, type NavItem } from '~/lib/navigation'
import { cn } from '~/lib/utils'

const props = defineProps<{ onNavigate?: () => void }>()

const route = useRoute()

function isActive(to: string) {
  return route.path === to
}

function itemClass(item: NavItem) {
  return cn(
    'group focus-visible:ring-ring/50 relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3',
    isActive(item.to)
      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
      : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
  )
}
</script>

<template>
  <nav class="flex flex-col gap-1" aria-label="Main navigation">
    <NuxtLink
      v-for="item in PRIMARY_NAV"
      :key="item.to"
      :to="item.to"
      :class="itemClass(item)"
      :aria-current="isActive(item.to) ? 'page' : undefined"
      :title="item.description"
      @click="props.onNavigate?.()"
    >
      <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
      <span class="truncate">{{ item.label }}</span>
      <span
        v-if="isActive(item.to)"
        class="bg-primary ml-auto size-1.5 shrink-0 rounded-full"
        aria-hidden="true"
      />
    </NuxtLink>

    <Separator class="my-2" />

    <NuxtLink
      v-for="item in SECONDARY_NAV"
      :key="item.to"
      :to="item.to"
      :class="itemClass(item)"
      :aria-current="isActive(item.to) ? 'page' : undefined"
      :title="item.description"
      @click="props.onNavigate?.()"
    >
      <component :is="item.icon" class="size-4 shrink-0" aria-hidden="true" />
      <span class="truncate">{{ item.label }}</span>
      <span
        v-if="isActive(item.to)"
        class="bg-primary ml-auto size-1.5 shrink-0 rounded-full"
        aria-hidden="true"
      />
    </NuxtLink>

    <p class="text-muted-foreground mt-3 flex items-start gap-1.5 px-2.5 text-[0.7rem] leading-relaxed">
      <ShieldCheckIcon class="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>Your codes never leave this browser.</span>
    </p>
  </nav>
</template>
