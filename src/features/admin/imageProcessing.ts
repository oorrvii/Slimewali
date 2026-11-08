const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const MAX_INPUT_BYTES = 15 * 1024 * 1024

export type ProcessedImage = { full: Blob; small: Blob }

export class ImageRejectedError extends Error {}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ImageRejectedError('Could not convert this image.'))),
      'image/webp',
      quality,
    )
  })
}

async function render(bitmap: ImageBitmap, maxEdge: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new ImageRejectedError('Could not process this image.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return toBlob(canvas, quality)
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new ImageRejectedError(`${file.name}: use a JPEG, PNG, WebP or AVIF image.`)
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageRejectedError(`${file.name}: the file is larger than 15 MB.`)
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new ImageRejectedError(`${file.name}: this file could not be read as an image.`)
  }

  try {
    const full = await render(bitmap, 1600, 0.82)
    const small = await render(bitmap, 640, 0.8)
    return { full, small }
  } finally {
    bitmap.close()
  }
}
