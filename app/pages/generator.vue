<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { QrFormData, QrFormValue, QrStyleState, QrTypeId } from '~/types'
import { DEFAULT_QR_TYPE, createQrForm, getQrTypeDef, isQrTypeId } from '~/lib/qr/registry'
import { hasErrors, validateQrForm, visibleFields, type QrFormErrors } from '~/lib/qr/validate'
import { formFromPayload, parseQrPayload } from '~/lib/qr/parse'
import { str } from '~/lib/qr/codec'
import { createDefaultStyle } from '~/lib/storage'

useSeoMeta({ title: 'Generator · SweetQR' })

const route = useRoute()
const router = useRouter()
const { settings } = useSettings()
const { get, save, suggestName } = useSavedQrCodes()

const type = ref<QrTypeId>(DEFAULT_QR_TYPE)
const form = reactive<QrFormData>(createQrForm(DEFAULT_QR_TYPE))
const style = reactive<QrStyleState>({ ...settings.value.defaultStyle })

const editingId = ref<string | null>(null)
const saveDialogOpen = ref(false)
const submitted = ref(false)
const errors = ref<QrFormErrors>({})

const def = computed(() => getQrTypeDef(type.value))
const payload = computed(() => def.value.build(form))
const liveErrors = computed(() => validateQrForm(def.value, form))

/** Don't render a code until every required field has something in it. */
const missingRequired = computed(() =>
  visibleFields(def.value, form).some(
    (field) => field.kind !== 'checkbox' && field.required && !str(form[field.key]),
  ),
)

const previewPayload = computed(() => (missingRequired.value ? '' : payload.value))
const canSave = computed(() => !missingRequired.value && !hasErrors(liveErrors.value) && Boolean(payload.value))

const suggestedName = computed(() => suggestName(type.value, form, payload.value))

function setType(next: QrTypeId) {
  if (next === type.value) return
  type.value = next
  for (const key of Object.keys(form)) delete form[key]
  Object.assign(form, createQrForm(next))
  errors.value = {}
  submitted.value = false
  editingId.value = null
}

function updateField(key: string, value: QrFormValue) {
  form[key] = value
}

function applyStyle(patch: Partial<QrStyleState>) {
  Object.assign(style, patch)
}

function loadSaved(id: string) {
  const saved = get(id)
  if (!saved) return false

  type.value = saved.type
  for (const key of Object.keys(form)) delete form[key]
  Object.assign(form, { ...createQrForm(saved.type), ...saved.form })
  Object.assign(style, { ...createDefaultStyle(), ...saved.style })
  editingId.value = saved.id
  return true
}

onMounted(() => {
  const query = route.query

  // Editing an existing code takes precedence over everything else.
  if (typeof query.id === 'string' && loadSaved(query.id)) return

  if (typeof query.from === 'string' && query.from.trim()) {
    const seeded = formFromPayload(parseQrPayload(query.from))
    type.value = seeded.type
    for (const key of Object.keys(form)) delete form[key]
    Object.assign(form, seeded.form)
    return
  }

  if (isQrTypeId(query.type)) setType(query.type)
})

// Once the user has tried to save, keep error messages in sync so they clear as the
// offending field is fixed.
watch(liveErrors, (current) => {
  if (submitted.value) errors.value = current
})

function openSaveDialog() {
  submitted.value = true
  errors.value = liveErrors.value

  if (hasErrors(liveErrors.value)) {
    toast.error('Some fields need attention', {
      description: 'Fix the highlighted fields before saving.',
    })
    return
  }

  saveDialogOpen.value = true
}

function confirmSave({ name, favorite }: { name: string; favorite: boolean }) {
  const saved = save({
    id: editingId.value ?? undefined,
    name,
    type: type.value,
    payload: payload.value,
    form: { ...form },
    style: { ...style },
    favorite,
  })

  const wasEditing = Boolean(editingId.value)
  editingId.value = saved.id
  saveDialogOpen.value = false
  submitted.value = false

  toast.success(wasEditing ? 'QR code updated' : 'QR code saved', {
    description: 'Find it any time under My QR codes.',
  })

  void router.replace({ query: { id: saved.id } })
}

function startNew() {
  editingId.value = null
  submitted.value = false
  errors.value = {}
  for (const key of Object.keys(form)) delete form[key]
  Object.assign(form, createQrForm(type.value))
  void router.replace({ query: { type: type.value } })
}
</script>

<template>
  <div>
    <PageHeader
      :title="editingId ? 'Edit QR code' : 'Generator'"
      :description="
        editingId
          ? 'Changes are saved back to your library.'
          : 'Pick a type, fill in the details and download your code.'
      "
    >
      <template #actions>
        <Badge v-if="editingId" variant="secondary">Editing a saved code</Badge>
        <Button v-if="editingId" variant="outline" size="sm" @click="startNew">
          Start a new code
        </Button>
      </template>
    </PageHeader>

    <ClientOnly>
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
        <!-- On mobile the preview comes first so it is visible while editing. -->
        <div class="order-2 grid min-w-0 gap-6 lg:order-1">
          <section class="grid gap-3">
            <h2 class="text-sm font-medium">Type</h2>
            <QrTypePicker :model-value="type" @update:model-value="setType" />
          </section>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">{{ def.label }}</CardTitle>
              <CardDescription>{{ def.description }}</CardDescription>
            </CardHeader>
            <CardContent>
              <QrTypeForm :def="def" :form="form" :errors="errors" @update:field="updateField" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle class="text-base">Customise</CardTitle>
              <CardDescription>The preview updates as you go.</CardDescription>
            </CardHeader>
            <CardContent>
              <QrCustomizer :style="style" :default-style="settings.defaultStyle" @change="applyStyle" />
            </CardContent>
          </Card>
        </div>

        <div class="order-1 grid gap-4 lg:order-2 lg:sticky lg:top-20">
          <Card>
            <CardContent class="grid gap-4 pt-6">
              <QrPreview :payload="previewPayload" :style="style" />

              <div class="grid gap-1 text-center">
                <p class="truncate text-sm font-medium">{{ suggestedName }}</p>
                <p class="text-muted-foreground text-xs">
                  {{ def.label }} · {{ style.size }} × {{ style.size }} px
                </p>
              </div>

              <QrActions
                :payload="previewPayload"
                :style="style"
                :name="suggestedName"
                :can-save="canSave"
                :is-editing="Boolean(editingId)"
                @save="openSaveDialog"
              />
            </CardContent>
          </Card>

          <CodeBlock v-if="payload" :value="payload" />
        </div>
      </div>

      <template #fallback>
        <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div class="grid gap-6">
            <Skeleton class="h-28 w-full" />
            <Skeleton class="h-72 w-full" />
          </div>
          <Skeleton class="h-96 w-full" />
        </div>
      </template>
    </ClientOnly>

    <SaveQrDialog
      v-model:open="saveDialogOpen"
      :default-name="suggestedName"
      :mode="editingId ? 'edit' : 'create'"
      @save="confirmSave"
    />
  </div>
</template>
