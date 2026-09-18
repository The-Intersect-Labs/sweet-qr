import { MAX_LOGO_DIMENSION, MAX_LOGO_FILE_BYTES } from '~/types'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

/**
 * Raster logos are downscaled and re-encoded as WebP so a saved code with a logo stays
 * small — localStorage is capped at a few megabytes and logo data URLs would otherwise
 * blow through it after a handful of saves.
 */
async function downscale(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  try {
    const ratio = Math.min(1, MAX_LOGO_DIMENSION / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * ratio))
    const height = Math.max(1, Math.round(bitmap.height * ratio))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas unavailable')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(bitmap, 0, 0, width, height)

    const webp = canvas.toDataURL('image/webp', 0.92)
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png')
  } finally {
    bitmap.close()
  }
}

export function useLogoUpload() {
  const error = ref<string | null>(null)
  const processing = ref(false)

  async function readLogo(file: File): Promise<string | null> {
    error.value = null

    if (!ALLOWED_TYPES.includes(file.type)) {
      error.value = 'Use a PNG, JPEG, WebP or SVG image.'
      return null
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      error.value = 'That image is larger than 5 MB.'
      return null
    }

    processing.value = true
    try {
      // SVG stays vector: it is tiny and scales perfectly into any export size.
      return file.type === 'image/svg+xml' ? await readAsDataUrl(file) : await downscale(file)
    } catch {
      error.value = 'That image could not be read.'
      return null
    } finally {
      processing.value = false
    }
  }

  return { readLogo, error, processing }
}
