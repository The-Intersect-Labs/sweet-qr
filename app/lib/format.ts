export function slugify(input: string, fallback = 'sweetqr'): string {
  const slug = input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || fallback
}

export function truncate(value: string, max = 80): string {
  const collapsed = value.replace(/\s+/g, ' ').trim()
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
  ['second', 1],
]

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return ''

  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  const deltaSeconds = (timestamp - now) / 1000

  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(deltaSeconds) >= seconds || unit === 'second') {
      return formatter.format(Math.round(deltaSeconds / seconds), unit)
    }
  }
  return ''
}

export function formatDateTime(iso: string): string {
  const timestamp = new Date(iso)
  if (Number.isNaN(timestamp.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

export function formatDayLabel(iso: string, now: Date = new Date()): string {
  const timestamp = new Date(iso)
  if (Number.isNaN(timestamp.getTime())) return ''

  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const dayDelta = Math.round((startOfDay(now) - startOfDay(timestamp)) / 86_400_000)

  if (dayDelta === 0) return 'Today'
  if (dayDelta === 1) return 'Yesterday'
  if (dayDelta < 7) return new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(timestamp)
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(timestamp)
}
