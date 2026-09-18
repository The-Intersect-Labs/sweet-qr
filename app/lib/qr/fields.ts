import type { Component } from 'vue'
import type { QrFormData, QrTypeId } from '~/types'

export type QrFieldKind = 'text' | 'textarea' | 'password' | 'number' | 'select' | 'checkbox'

export interface QrFieldOption {
  label: string
  value: string
}

export interface QrField {
  key: string
  label: string
  kind: QrFieldKind
  placeholder?: string
  help?: string
  required?: boolean
  options?: QrFieldOption[]
  inputmode?: 'text' | 'url' | 'email' | 'tel' | 'numeric' | 'decimal'
  autocomplete?: string
  min?: number
  max?: number
  rows?: number
  /** Only render (and validate) this field when the predicate passes. */
  showIf?: (form: QrFormData) => boolean
  /** Field-specific rule layered on top of the `required` check. */
  validate?: (value: string, form: QrFormData) => string | null
}

export interface QrTypeDef {
  id: QrTypeId
  label: string
  description: string
  icon: Component
  fields: QrField[]
  defaults: QrFormData
  build: (form: QrFormData) => string
  /**
   * Cross-field rules that a single field cannot express, e.g. "a contact needs a
   * first *or* last name". Runs after field-level validation and may add or replace
   * any field's error.
   */
  validate?: (form: QrFormData) => QrFormErrors
}

export type QrFormErrors = Record<string, string>
