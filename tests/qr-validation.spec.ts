import { describe, expect, it } from 'vitest'
import type { QrFormData, QrTypeId } from '~/types'
import { getQrTypeDef } from '~/lib/qr/registry'
import { hasErrors, validateQrForm, visibleFields } from '~/lib/qr/validate'

function validate(type: QrTypeId, form: QrFormData) {
  return validateQrForm(getQrTypeDef(type), form)
}

describe('required fields', () => {
  it('reports a missing required value', () => {
    const errors = validate('url', { url: '' })
    expect(errors.url).toBe('URL is required.')
    expect(hasErrors(errors)).toBe(true)
  })

  it('passes a valid url', () => {
    expect(hasErrors(validate('url', { url: 'example.com' }))).toBe(false)
  })

  it('rejects a non-web url', () => {
    expect(validate('url', { url: 'javascript:alert(1)' }).url).toBeDefined()
    expect(validate('url', { url: 'ftp://example.com' }).url).toBeDefined()
  })
})

describe('email fields', () => {
  it('rejects a malformed address', () => {
    expect(validate('email', { address: 'nope', subject: '', body: '' }).address).toBeDefined()
  })

  it('accepts a well-formed address', () => {
    expect(hasErrors(validate('email', { address: 'ada@example.com', subject: '', body: '' }))).toBe(false)
  })
})

describe('phone fields', () => {
  it('requires a plausible number of digits', () => {
    expect(validate('phone', { number: '12' }).number).toBeDefined()
    expect(hasErrors(validate('phone', { number: '+1 (555) 010-2030' }))).toBe(false)
  })
})

describe('location ranges', () => {
  it('accepts coordinates inside the valid range', () => {
    expect(hasErrors(validate('location', { latitude: '51.5074', longitude: '-0.1278', label: '' }))).toBe(false)
  })

  it('rejects out-of-range coordinates', () => {
    expect(validate('location', { latitude: '91', longitude: '0', label: '' }).latitude).toBe('Must be 90 or less.')
    expect(validate('location', { latitude: '0', longitude: '-181', label: '' }).longitude).toBe(
      'Must be -180 or greater.',
    )
  })

  it('rejects a non-numeric coordinate', () => {
    expect(validate('location', { latitude: 'abc', longitude: '0', label: '' }).latitude).toBe('Enter a number.')
  })
})

describe('wifi conditional fields', () => {
  it('hides the password field for open networks', () => {
    const def = getQrTypeDef('wifi')
    const open = { ssid: 'Cafe', security: 'nopass', password: '', identity: '', hidden: false }
    const secured = { ...open, security: 'WPA' }

    expect(visibleFields(def, open).some((field) => field.key === 'password')).toBe(false)
    expect(visibleFields(def, secured).some((field) => field.key === 'password')).toBe(true)
  })

  it('does not demand a password for an open network', () => {
    expect(hasErrors(validate('wifi', { ssid: 'Cafe', security: 'nopass', password: '', hidden: false }))).toBe(false)
  })

  it('demands a password once security is on', () => {
    const errors = validate('wifi', { ssid: 'Cafe', security: 'WPA', password: '', hidden: false })
    expect(errors.password).toBe('Password is required.')
  })

  it('demands an identity only for enterprise networks', () => {
    const base = { ssid: 'Corp', password: 'pw', hidden: false }
    expect(validate('wifi', { ...base, security: 'WPA2-EAP', identity: '' }).identity).toBeDefined()
    expect(hasErrors(validate('wifi', { ...base, security: 'WPA2-EAP', identity: 'ada@corp.com' }))).toBe(false)
    expect(hasErrors(validate('wifi', { ...base, security: 'WPA', identity: '' }))).toBe(false)
  })
})

describe('vcard names', () => {
  it('accepts a first name on its own', () => {
    const form = { ...getQrTypeDef('vcard').defaults, firstName: 'Ada' }
    expect(hasErrors(validate('vcard', form))).toBe(false)
  })

  it('accepts a last name on its own', () => {
    const form = { ...getQrTypeDef('vcard').defaults, lastName: 'Lovelace' }
    expect(hasErrors(validate('vcard', form))).toBe(false)
  })

  it('rejects a nameless contact', () => {
    const form = { ...getQrTypeDef('vcard').defaults }
    expect(validate('vcard', form).firstName).toBe(
      'Enter at least a first or last name.',
    )
  })

  it('validates an optional email when one is supplied', () => {
    const form = { ...getQrTypeDef('vcard').defaults, firstName: 'Ada', email: 'nope' }
    expect(validate('vcard', form).email).toBeDefined()
  })
})
