import {
  ContactIcon,
  LinkIcon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PhoneIcon,
  TypeIcon,
  WifiIcon,
} from '@lucide/vue'
import type { QrFormData, QrTypeId } from '~/types'
import type { QrField, QrFormErrors, QrTypeDef } from './fields'
import {
  buildEmailPayload,
  buildGeoPayload,
  buildPhonePayload,
  buildSmsPayload,
  buildVCardPayload,
  buildWifiPayload,
  isSafeWebUrl,
  normalizeUrl,
  str,
} from './codec'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}

function countDigits(value: string): number {
  return value.replace(/\D/g, '').length
}

const websiteField: QrField = {
  key: 'website',
  label: 'Website',
  kind: 'text',
  placeholder: 'example.com',
  inputmode: 'url',
  autocomplete: 'url',
  validate: (value) => (value && !isSafeWebUrl(normalizeUrl(value)) ? 'Enter a valid web address.' : null),
}

const emailValueField: QrField = {
  key: 'email',
  label: 'Email',
  kind: 'text',
  placeholder: 'ada@example.com',
  inputmode: 'email',
  autocomplete: 'email',
  validate: (value) => (value && !isValidEmail(value) ? 'Enter a valid email address.' : null),
}

const phoneValueField: QrField = {
  key: 'phone',
  label: 'Phone',
  kind: 'text',
  placeholder: '+1 555 010 2030',
  inputmode: 'tel',
  autocomplete: 'tel',
  validate: (value) => (value && countDigits(value) < 5 ? 'Enter a valid phone number.' : null),
}

export const QR_TYPE_DEFS: QrTypeDef[] = [
  {
    id: 'url',
    label: 'Website URL',
    description: 'Send people to a link.',
    icon: LinkIcon,
    fields: [
      {
        key: 'url',
        label: 'URL',
        kind: 'text',
        placeholder: 'https://example.com',
        inputmode: 'url',
        autocomplete: 'url',
        required: true,
        help: 'Missing https:// is added for you.',
        validate: (value) => (isSafeWebUrl(normalizeUrl(value)) ? null : 'Enter a valid http or https address.'),
      },
    ],
    defaults: { url: '' },
    build: (form) => normalizeUrl(str(form.url)),
  },
  {
    id: 'text',
    label: 'Plain text',
    description: 'Show a message, note or code.',
    icon: TypeIcon,
    fields: [
      {
        key: 'text',
        label: 'Text',
        kind: 'textarea',
        rows: 6,
        placeholder: 'Anything you like…',
        required: true,
      },
    ],
    defaults: { text: '' },
    build: (form) => str(form.text),
  },
  {
    id: 'wifi',
    label: 'Wi-Fi',
    description: 'Join a network without typing a password.',
    icon: WifiIcon,
    fields: [
      {
        key: 'ssid',
        label: 'Network name (SSID)',
        kind: 'text',
        placeholder: 'MyNetwork',
        required: true,
        autocomplete: 'off',
      },
      {
        key: 'security',
        label: 'Security',
        kind: 'select',
        required: true,
        options: [
          { label: 'WPA / WPA2', value: 'WPA' },
          { label: 'WEP', value: 'WEP' },
          { label: 'WPA2-Enterprise', value: 'WPA2-EAP' },
          { label: 'None (open network)', value: 'nopass' },
        ],
      },
      {
        key: 'password',
        label: 'Password',
        kind: 'password',
        placeholder: 'Network password',
        autocomplete: 'off',
        required: true,
        showIf: (form) => str(form.security) !== 'nopass',
      },
      {
        key: 'identity',
        label: 'Identity',
        kind: 'text',
        placeholder: 'user@company.com',
        autocomplete: 'off',
        required: true,
        help: 'Required for enterprise networks.',
        showIf: (form) => str(form.security) === 'WPA2-EAP',
      },
      {
        key: 'hidden',
        label: 'Hidden network',
        kind: 'checkbox',
        help: 'Enable if the SSID is not broadcast.',
      },
    ],
    defaults: { ssid: '', security: 'WPA', password: '', identity: '', hidden: false },
    build: buildWifiPayload,
  },
  {
    id: 'vcard',
    label: 'Contact',
    description: 'Share contact details as a vCard.',
    icon: ContactIcon,
    fields: [
      {
        key: 'firstName',
        label: 'First name',
        kind: 'text',
        placeholder: 'Ada',
        autocomplete: 'given-name',
      },
      {
        key: 'lastName',
        label: 'Last name',
        kind: 'text',
        placeholder: 'Lovelace',
        autocomplete: 'family-name',
      },
      {
        key: 'organization',
        label: 'Organisation',
        kind: 'text',
        placeholder: 'Analytical Engines Ltd',
        autocomplete: 'organization',
      },
      { key: 'title', label: 'Job title', kind: 'text', placeholder: 'Mathematician', autocomplete: 'organization-title' },
      phoneValueField,
      emailValueField,
      websiteField,
      { key: 'street', label: 'Street', kind: 'text', placeholder: '12 Marylebone Road', autocomplete: 'street-address' },
      { key: 'city', label: 'City', kind: 'text', placeholder: 'London', autocomplete: 'address-level2' },
      { key: 'region', label: 'Region / state', kind: 'text', placeholder: 'Greater London', autocomplete: 'address-level1' },
      { key: 'postalCode', label: 'Postal code', kind: 'text', placeholder: 'NW1 5LS', autocomplete: 'postal-code' },
      { key: 'country', label: 'Country', kind: 'text', placeholder: 'United Kingdom', autocomplete: 'country-name' },
      { key: 'note', label: 'Note', kind: 'textarea', rows: 3, placeholder: 'Anything else worth sharing' },
    ],
    defaults: {
      firstName: '',
      lastName: '',
      organization: '',
      title: '',
      phone: '',
      email: '',
      website: '',
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: '',
      note: '',
    },
    // A contact needs a name, but either name alone is enough.
    validate: (form): QrFormErrors =>
      str(form.firstName) || str(form.lastName) ? {} : { firstName: 'Enter at least a first or last name.' },
    build: buildVCardPayload,
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Pre-fill an email to a specific address.',
    icon: MailIcon,
    fields: [
      {
        key: 'address',
        label: 'Recipient',
        kind: 'text',
        placeholder: 'hello@example.com',
        inputmode: 'email',
        autocomplete: 'email',
        required: true,
        validate: (value) => (isValidEmail(value) ? null : 'Enter a valid email address.'),
      },
      { key: 'subject', label: 'Subject', kind: 'text', placeholder: 'Hello there' },
      { key: 'body', label: 'Message', kind: 'textarea', rows: 5, placeholder: 'Pre-filled message body' },
    ],
    defaults: { address: '', subject: '', body: '' },
    build: buildEmailPayload,
  },
  {
    id: 'phone',
    label: 'Phone',
    description: 'Start a call with one scan.',
    icon: PhoneIcon,
    fields: [
      {
        key: 'number',
        label: 'Phone number',
        kind: 'text',
        placeholder: '+1 555 010 2030',
        inputmode: 'tel',
        autocomplete: 'tel',
        required: true,
        help: 'Include the country code so it dials from anywhere.',
        validate: (value) => (countDigits(value) >= 5 ? null : 'Enter a valid phone number.'),
      },
    ],
    defaults: { number: '' },
    build: buildPhonePayload,
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Open a text message, pre-written.',
    icon: MessageSquareIcon,
    fields: [
      {
        key: 'number',
        label: 'Phone number',
        kind: 'text',
        placeholder: '+1 555 010 2030',
        inputmode: 'tel',
        autocomplete: 'tel',
        required: true,
        validate: (value) => (countDigits(value) >= 5 ? null : 'Enter a valid phone number.'),
      },
      { key: 'message', label: 'Message', kind: 'textarea', rows: 4, placeholder: 'Pre-written text message' },
    ],
    defaults: { number: '', message: '' },
    build: buildSmsPayload,
  },
  {
    id: 'location',
    label: 'Location',
    description: 'Point to a place on a map.',
    icon: MapPinIcon,
    fields: [
      {
        key: 'latitude',
        label: 'Latitude',
        kind: 'number',
        placeholder: '51.5074',
        inputmode: 'decimal',
        required: true,
        min: -90,
        max: 90,
        help: 'Between -90 and 90.',
      },
      {
        key: 'longitude',
        label: 'Longitude',
        kind: 'number',
        placeholder: '-0.1278',
        inputmode: 'decimal',
        required: true,
        min: -180,
        max: 180,
        help: 'Between -180 and 180.',
      },
      { key: 'label', label: 'Place name', kind: 'text', placeholder: 'SweetQR HQ' },
    ],
    defaults: { latitude: '', longitude: '', label: '' },
    build: buildGeoPayload,
  },
]

export const DEFAULT_QR_TYPE: QrTypeId = 'url'

const DEFS_BY_ID = new Map<QrTypeId, QrTypeDef>(QR_TYPE_DEFS.map((def) => [def.id, def]))

export function getQrTypeDef(id: QrTypeId): QrTypeDef {
  return DEFS_BY_ID.get(id) ?? QR_TYPE_DEFS[0]!
}

export function isQrTypeId(value: unknown): value is QrTypeId {
  return typeof value === 'string' && DEFS_BY_ID.has(value as QrTypeId)
}

/** Fresh copy of a type's blank form (never share a reference between callers). */
export function createQrForm(type: QrTypeId): QrFormData {
  return { ...getQrTypeDef(type).defaults }
}
