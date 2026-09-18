/**
 * Generates the PWA icon set with no native dependencies.
 *
 * Why not @vite-pwa/assets-generator? It rasterises through `sharp`, whose native
 * binary fails to load on some Windows setups (ERR_DLOPEN_FAILED). When that happens
 * the PWA plugin skips icon generation *silently* and ships a manifest with no icons.
 * This script encodes PNGs directly (zlib + CRC32) so the icons are always produced.
 *
 * Run with: npm run icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BRAND_FROM = [0x63, 0x66, 0xf1] // indigo-500
const BRAND_TO = [0x8b, 0x5c, 0xf6] // violet-500
const MARK = [0xff, 0xff, 0xff]

const SUPERSAMPLE = 3

/* ------------------------------------------------------------ PNG encoder --- */

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeBuffer = Buffer.from(type, 'latin1')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace

  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0 // filter type 0 (None)
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/* --------------------------------------------------------------- geometry --- */

function insideRoundedRect(x, y, x0, y0, x1, y1, radius) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  const cx = Math.min(Math.max(x, x0 + radius), x1 - radius)
  const cy = Math.min(Math.max(y, y0 + radius), y1 - radius)
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= radius * radius
}

function insideCircle(x, y, cx, cy, radius) {
  const dx = x - cx
  const dy = y - cy
  return dx * dx + dy * dy <= radius * radius
}

function mix(from, to, t) {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  ]
}

/** Finder patterns and data dots, expressed in the 0–1 content box. */
const FINDERS = [
  [0.0, 0.0],
  [0.7, 0.0],
  [0.0, 0.7],
]
const FINDER_SIZE = 0.3
const FINDER_RADIUS = 0.1
const FINDER_STROKE = 0.085
const FINDER_DOT_RADIUS = 0.062

const DATA_DOTS = (() => {
  const dots = []
  for (let gx = 0; gx < 5; gx += 1) {
    for (let gy = 0; gy < 5; gy += 1) {
      const x = 0.4 + gx * 0.142
      const y = 0.4 + gy * 0.142
      const overlapsFinder = FINDERS.some(
        ([fx, fy]) => x >= fx - 0.09 && x <= fx + FINDER_SIZE + 0.09 && y >= fy - 0.09 && y <= fy + FINDER_SIZE + 0.09,
      )
      if (!overlapsFinder) dots.push([x, y])
    }
  }
  // A few modules along the top and left timing rows.
  for (const x of [0.4, 0.542, 0.684]) dots.push([x, 0.09])
  for (const y of [0.4, 0.542, 0.684]) dots.push([0.09, y])
  return dots
})()

const DATA_DOT_RADIUS = 0.048

function isMark(x, y) {
  for (const [fx, fy] of FINDERS) {
    const outer = insideRoundedRect(x, y, fx, fy, fx + FINDER_SIZE, fy + FINDER_SIZE, FINDER_RADIUS)
    if (!outer) continue

    const inner = insideRoundedRect(
      x,
      y,
      fx + FINDER_STROKE,
      fy + FINDER_STROKE,
      fx + FINDER_SIZE - FINDER_STROKE,
      fy + FINDER_SIZE - FINDER_STROKE,
      FINDER_RADIUS * 0.5,
    )
    if (!inner) return true // the ring itself

    const center = FY_CENTER(fx, fy)
    if (insideCircle(x, y, center[0], center[1], FINDER_DOT_RADIUS)) return true
    return false
  }

  for (const [dx, dy] of DATA_DOTS) {
    if (insideCircle(x, y, dx, dy, DATA_DOT_RADIUS)) return true
  }

  return false
}

function FY_CENTER(fx, fy) {
  return [fx + FINDER_SIZE / 2, fy + FINDER_SIZE / 2]
}

/* ---------------------------------------------------------------- renderer --- */

function renderIcon(size, { maskable }) {
  const rgba = Buffer.alloc(size * size * 4)

  // Maskable icons must fill the whole canvas; the platform applies its own mask,
  // so the artwork shrinks into the safe zone instead of rounding its own corners.
  const contentScale = maskable ? 0.7 : 0.86
  const contentOffset = (1 - contentScale) / 2
  const backgroundRadius = maskable ? 0 : size * 0.22

  const toContent = (value) => (value / size - contentOffset) / contentScale

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let covered = 0
      let red = 0
      let green = 0
      let blue = 0

      for (let sy = 0; sy < SUPERSAMPLE; sy += 1) {
        for (let sx = 0; sx < SUPERSAMPLE; sx += 1) {
          const x = px + (sx + 0.5) / SUPERSAMPLE
          const y = py + (sy + 0.5) / SUPERSAMPLE

          const background = maskable
            ? true
            : insideRoundedRect(x, y, 0, 0, size, size, backgroundRadius)
          if (!background) continue

          const gradientT = (x + y) / (2 * size)
          const colour = isMark(toContent(x), toContent(y)) ? MARK : mix(BRAND_FROM, BRAND_TO, gradientT)

          covered += 1
          red += colour[0]
          green += colour[1]
          blue += colour[2]
        }
      }

      const index = (py * size + px) * 4
      if (covered === 0) {
        rgba[index + 3] = 0
        continue
      }

      // Average only covered samples so edges don't darken against transparency.
      rgba[index] = Math.round(red / covered)
      rgba[index + 1] = Math.round(green / covered)
      rgba[index + 2] = Math.round(blue / covered)
      rgba[index + 3] = Math.round((covered / (SUPERSAMPLE * SUPERSAMPLE)) * 255)
    }
  }

  return encodePng(size, size, rgba)
}

/* ------------------------------------------------------------------- main --- */

mkdirSync(OUT_DIR, { recursive: true })

const targets = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: true },
]

for (const target of targets) {
  const png = renderIcon(target.size, { maskable: target.maskable })
  writeFileSync(resolve(OUT_DIR, target.name), png)
  console.log(`✓ public/${target.name} (${target.size}×${target.size}, ${png.length} bytes)`)
}
