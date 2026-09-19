<script setup lang="ts">
import { EyeIcon, EyeOffIcon } from '@lucide/vue'
import type { QrFormData, QrFormValue } from '~/types'
import type { QrTypeDef } from '~/lib/qr/fields'
import type { QrFormErrors } from '~/lib/qr/validate'
import { visibleFields } from '~/lib/qr/validate'

const props = defineProps<{
  def: QrTypeDef
  form: QrFormData
  errors: QrFormErrors
}>()

const emit = defineEmits<{ 'update:field': [key: string, value: QrFormValue] }>()

const fields = computed(() => visibleFields(props.def, props.form))

// Passwords (Wi-Fi keys) are masked by default but must be checkable before printing.
const revealed = reactive<Record<string, boolean>>({})

function fieldId(key: string) {
  return `qr-${props.def.id}-${key}`
}

function describedBy(key: string, hasHelp: boolean) {
  const ids: string[] = []
  if (hasHelp) ids.push(`${fieldId(key)}-help`)
  if (props.errors[key]) ids.push(`${fieldId(key)}-error`)
  return ids.length ? ids.join(' ') : undefined
}

function textValue(key: string) {
  const value = props.form[key]
  return typeof value === 'string' ? value : ''
}

function update(key: string, value: QrFormValue) {
  emit('update:field', key, value)
}
</script>

<template>
  <div class="grid gap-4">
    <div v-for="field in fields" :key="field.key" class="grid gap-1.5">
      <!-- Checkbox reads better with the control first and the label beside it. -->
      <div v-if="field.kind === 'checkbox'" class="flex items-start gap-2.5">
        <Checkbox
          :id="fieldId(field.key)"
          :model-value="form[field.key] === true"
          class="mt-0.5"
          :aria-describedby="describedBy(field.key, Boolean(field.help))"
          @update:model-value="(value) => update(field.key, value === true)"
        />
        <div class="grid gap-1">
          <Label :for="fieldId(field.key)" class="cursor-pointer leading-snug">
            {{ field.label }}
          </Label>
          <p v-if="field.help" :id="`${fieldId(field.key)}-help`" class="text-muted-foreground text-xs">
            {{ field.help }}
          </p>
        </div>
      </div>

      <template v-else>
        <Label :for="fieldId(field.key)">
          {{ field.label }}
          <span v-if="field.required" class="text-destructive" aria-hidden="true">*</span>
          <span v-if="field.required" class="sr-only">(required)</span>
        </Label>

        <Select
          v-if="field.kind === 'select'"
          :model-value="textValue(field.key)"
          @update:model-value="(value) => update(field.key, String(value ?? ''))"
        >
          <SelectTrigger
            :id="fieldId(field.key)"
            class="w-full"
            :aria-invalid="Boolean(errors[field.key])"
            :aria-describedby="describedBy(field.key, Boolean(field.help))"
          >
            <SelectValue :placeholder="field.placeholder ?? 'Select an option'" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in field.options" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Textarea
          v-else-if="field.kind === 'textarea'"
          :id="fieldId(field.key)"
          :model-value="textValue(field.key)"
          :rows="field.rows ?? 4"
          :placeholder="field.placeholder"
          :aria-invalid="Boolean(errors[field.key])"
          :aria-describedby="describedBy(field.key, Boolean(field.help))"
          @update:model-value="(value) => update(field.key, String(value))"
        />

        <div v-else-if="field.kind === 'password'" class="relative">
          <Input
            :id="fieldId(field.key)"
            :model-value="textValue(field.key)"
            :type="revealed[field.key] ? 'text' : 'password'"
            :placeholder="field.placeholder"
            :autocomplete="field.autocomplete ?? 'off'"
            class="pr-10"
            :aria-invalid="Boolean(errors[field.key])"
            :aria-describedby="describedBy(field.key, Boolean(field.help))"
            @update:model-value="(value) => update(field.key, String(value))"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            class="absolute top-1/2 right-0.5 -translate-y-1/2"
            :aria-label="revealed[field.key] ? `Hide ${field.label}` : `Show ${field.label}`"
            @click="revealed[field.key] = !revealed[field.key]"
          >
            <component :is="revealed[field.key] ? EyeOffIcon : EyeIcon" />
          </Button>
        </div>

        <Input
          v-else
          :id="fieldId(field.key)"
          :model-value="textValue(field.key)"
          :type="field.kind === 'number' ? 'number' : 'text'"
          :inputmode="field.inputmode"
          :autocomplete="field.autocomplete ?? 'off'"
          :placeholder="field.placeholder"
          :min="field.min"
          :max="field.max"
          :step="field.kind === 'number' ? 'any' : undefined"
          :aria-invalid="Boolean(errors[field.key])"
          :aria-describedby="describedBy(field.key, Boolean(field.help))"
          @update:model-value="(value) => update(field.key, String(value))"
        />

        <p v-if="field.help" :id="`${fieldId(field.key)}-help`" class="text-muted-foreground text-xs">
          {{ field.help }}
        </p>
      </template>

      <p
        v-if="errors[field.key]"
        :id="`${fieldId(field.key)}-error`"
        class="text-destructive text-xs"
        role="alert"
      >
        {{ errors[field.key] }}
      </p>
    </div>
  </div>
</template>
