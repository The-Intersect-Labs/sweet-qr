<script setup lang="ts">
const props = defineProps<{
  open: boolean
  defaultName: string
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [payload: { name: string; favorite: boolean }]
}>()

const name = ref(props.defaultName)
const favorite = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    name.value = props.defaultName
    favorite.value = false
  },
)

function confirm() {
  emit('save', { name: name.value.trim() || props.defaultName, favorite: favorite.value })
}
</script>

<template>
  <Dialog :open="open" @update:open="(value) => emit('update:open', value)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ mode === 'create' ? 'Save QR code' : 'Update QR code' }}</DialogTitle>
        <DialogDescription>
          Saved to this browser only. Give it a name so you can find it later.
        </DialogDescription>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="confirm">
        <div class="grid gap-1.5">
          <Label for="save-qr-name">Name</Label>
          <Input
            id="save-qr-name"
            v-model="name"
            placeholder="My QR code"
            autocomplete="off"
            maxlength="80"
          />
        </div>

        <div class="flex items-center justify-between gap-3 rounded-lg border p-3">
          <div class="grid gap-0.5">
            <Label for="save-qr-favorite" class="cursor-pointer text-sm">Add to favourites</Label>
            <p class="text-muted-foreground text-xs">Favourites can be filtered in your library.</p>
          </div>
          <Switch id="save-qr-favorite" v-model="favorite" />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="emit('update:open', false)">Cancel</Button>
          <Button type="submit">{{ mode === 'create' ? 'Save' : 'Update' }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
