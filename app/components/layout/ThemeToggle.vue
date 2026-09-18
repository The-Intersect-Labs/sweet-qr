<script setup lang="ts">
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from '@lucide/vue'

const colorMode = useColorMode()

const options = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: MonitorIcon },
] as const

const active = computed(
  () => options.find((option) => option.value === colorMode.preference) ?? options[2],
)
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" aria-label="Change colour theme">
        <component :is="active.icon" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-40">
      <DropdownMenuItem
        v-for="option in options"
        :key="option.value"
        @select="colorMode.preference = option.value"
      >
        <component :is="option.icon" />
        <span>{{ option.label }}</span>
        <CheckIcon v-if="colorMode.preference === option.value" class="ml-auto" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
