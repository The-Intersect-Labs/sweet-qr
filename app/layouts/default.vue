<template>
  <div class="bg-background text-foreground min-h-screen">
    <a
      href="#main-content"
      class="bg-primary text-primary-foreground sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:px-3 focus:py-2 focus:text-sm focus:font-medium"
    >
      Skip to content
    </a>

    <div class="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <aside class="hidden lg:sticky lg:top-0 lg:block lg:h-screen">
        <AppSidebar />
      </aside>

      <div class="flex min-h-screen min-w-0 flex-col">
        <AppHeader />

        <main id="main-content" class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <slot />
        </main>

        <footer class="text-muted-foreground mx-auto w-full max-w-6xl px-4 pb-8 text-xs sm:px-6 lg:px-8">
          <p>SweetQR is local-first: your codes, logos and scan history stay in this browser.</p>
        </footer>
      </div>
    </div>
  </div>
</template>
