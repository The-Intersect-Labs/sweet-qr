<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  title: string
  description?: string
  icon?: Component
}>()
</script>

<template>
  <Empty class="border-border/70 bg-muted/20 border">
    <EmptyHeader>
      <EmptyMedia v-if="icon" variant="icon" class="size-11 rounded-xl">
        <component :is="icon" class="size-5" />
      </EmptyMedia>
      <EmptyTitle>{{ title }}</EmptyTitle>
      <EmptyDescription v-if="description">{{ description }}</EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="$slots.default">
      <slot />
    </EmptyContent>
  </Empty>
</template>
