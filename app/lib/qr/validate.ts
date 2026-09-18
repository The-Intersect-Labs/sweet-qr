import type { QrFormData } from '~/types'
import type { QrField, QrFormErrors, QrTypeDef } from './fields'
import { str } from './codec'

export type { QrFormErrors }

/** Fields that currently apply, i.e. conditionals like "password unless open network". */
export function visibleFields(def: QrTypeDef, form: QrFormData): QrField[] {
  return def.fields.filter((field) => !field.showIf || field.showIf(form))
}

export function validateQrForm(def: QrTypeDef, form: QrFormData): QrFormErrors {
  const errors: QrFormErrors = {}

  for (const field of visibleFields(def, form)) {
    if (field.kind === 'checkbox') continue

    const value = str(form[field.key])

    if (field.required && !value) {
      errors[field.key] = `${field.label} is required.`
      continue
    }

    if (!value) continue

    if (field.kind === 'number') {
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) {
        errors[field.key] = 'Enter a number.'
        continue
      }
      if (field.min !== undefined && parsed < field.min) {
        errors[field.key] = `Must be ${field.min} or greater.`
        continue
      }
      if (field.max !== undefined && parsed > field.max) {
        errors[field.key] = `Must be ${field.max} or less.`
        continue
      }
    }

    const custom = field.validate?.(value, form)
    if (custom) errors[field.key] = custom
  }

  return { ...errors, ...def.validate?.(form) }
}

export function hasErrors(errors: QrFormErrors): boolean {
  return Object.keys(errors).length > 0
}

