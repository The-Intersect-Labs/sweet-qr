<script setup lang="ts">
import { MenuIcon } from '@lucide/vue'
import { navTitleFor } from '~/lib/navigation'

const route = useRoute()
const title = computed(() => navTitleFor(route.path))
const mobileNavOpen = ref(false)
</script>

<template>
  <header class="bg-background/80 sticky top-0 z-30 border-b backdrop-blur-md">
    <div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
      <Sheet v-model:open="mobileNavOpen">
        <SheetTrigger as-child>
          <Button variant="ghost" size="icon" class="lg:hidden" aria-label="Open navigation menu">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" class="w-72 gap-0 p-0">
          <SheetHeader class="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>SweetQR sections</SheetDescription>
          </SheetHeader>
          <AppSidebar :on-navigate="() => (mobileNavOpen = false)" />
        </SheetContent>
      </Sheet>

      <p class="truncate text-sm font-semibold tracking-tight">{{ title }}</p>

      <div class="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </div>
  </header>
</template>
