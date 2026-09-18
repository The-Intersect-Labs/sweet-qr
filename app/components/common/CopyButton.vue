<script setup lang="ts">
import { useClipboard } from '@vueuse/core'
import { CheckIcon, CopyIcon } from '@lucide/vue'
import type { ButtonVariants } from '~/components/ui/button'

const props = withDefaults(
  defineProps<{
    value: string
    label?: string
    variant?: ButtonVariants['variant']
    size?: ButtonVariants['size']
    iconOnly?: boolean
  }>(),
  {
    label: 'Copy',
    variant: 'outline',
    size: 'sm',
    iconOnly: false,
  },
)

const { copy, copied, isSupported } = useClipboard({ copiedDuring: 1600 })

function onCopy() {
  if (!isSupported.value) return
  copy(props.value)
}
</script>

<template>
  <Button
    :variant="variant"
    :size="size"
    :disabled="!isSupported"
    :title="isSupported ? undefined : 'Clipboard is unavailable in this browser context'"
    :aria-label="copied ? 'Copied to clipboard' : label"
    @click="onCopy"
  >
    <component :is="copied ? CheckIcon : CopyIcon" />
    <span v-if="!iconOnly">{{ copied ? 'Copied' : label }}</span>
    <span class="sr-only" aria-live="polite">{{ copied ? 'Copied to clipboard' : '' }}</span>
  </Button>
</template>
