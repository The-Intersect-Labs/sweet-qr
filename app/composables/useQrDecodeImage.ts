/** Uploaded images are downscaled before decoding: jsQR is O(pixels) and photos are huge. */
const DECODE_MAX_DIMENSION = 1000

const HEIC_TYPES = ['image/heic', 'image/heif']

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file)
  } catch {
    // Fallback for formats createImageBitmap rejects but <img> can still render.
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const image = new Image()
      image.onload = () => {
        URL.revokeObjectURL(url)
        resolve(image)
      }
      image.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('decode failed'))
      }
      image.src = url
    })
  }
}

export function useQrDecodeImage() {
  const decoding = ref(false)
  const error = ref<string | null>(null)

  async function decodeFile(file: File): Promise<string | null> {
    error.value = null

    if (HEIC_TYPES.includes(file.type) || /\.hei[cf]$/i.test(file.name)) {
      error.value = 'Browsers cannot decode HEIC photos. Convert the image to PNG or JPEG first.'
      return null
    }

    if (!file.type.startsWith('image/')) {
      error.value = 'That file is not an image. Choose a PNG, JPEG or WebP photo of a QR code.'
      return null
    }

    decoding.value = true
    try {
      const bitmap = await loadBitmap(file)

      const naturalWidth = bitmap.width
      const naturalHeight = bitmap.height
      if (!naturalWidth || !naturalHeight) {
        error.value = 'That image could not be read.'
        return null
      }

      const scale = Math.min(1, DECODE_MAX_DIMENSION / Math.max(naturalWidth, naturalHeight))
      const width = Math.max(1, Math.round(naturalWidth * scale))
      const height = Math.max(1, Math.round(naturalHeight * scale))

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) {
        error.value = 'That image could not be read.'
        return null
      }
      context.drawImage(bitmap, 0, 0, width, height)
      if ('close' in bitmap) bitmap.close()

      const frame = context.getImageData(0, 0, width, height)
      const { default: jsQR } = await import('jsqr')

      // attemptBoth also finds light-on-dark codes, which screenshots often contain.
      const found = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: 'attemptBoth' })
      if (!found?.data) {
        error.value = 'No QR code was found in that image. Try a sharper or less cropped photo.'
        return null
      }

      return found.data
    } catch {
      error.value = 'That image could not be read.'
      return null
    } finally {
      decoding.value = false
    }
  }

  return { decodeFile, decoding, error }
}
