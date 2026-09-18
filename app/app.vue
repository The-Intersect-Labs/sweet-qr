<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster position="top-right" :rich-colors="true" />
  </div>
</template>
