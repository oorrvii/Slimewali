export type ImageSize = 'full' | 'small'

const env = import.meta.env
const cloudName: string = env.VITE_CLOUDINARY_CLOUD_NAME ?? ''
const uploadPreset: string = env.VITE_CLOUDINARY_UPLOAD_PRESET ?? ''

export const imageHostConfigured = cloudName.length > 0 && uploadPreset.length > 0

const transforms: Record<ImageSize, string> = {
  full: 'f_auto,q_auto,w_1600',
  small: 'f_auto,q_auto,w_640',
}

export function imageUrl(path: string, size: ImageSize = 'full'): string {
  if (path.startsWith('/')) return path
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms[size]}/${path}`
}

type ProcessedImage = { full: Blob; small: Blob }

export async function uploadImage(
  folder: 'products' | 'categories',
  ownerId: string,
  image: ProcessedImage,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  if (!imageHostConfigured) {
    throw new Error('Image hosting is not configured. Add the Cloudinary settings to .env.local.')
  }
  const body = new FormData()
  body.append('file', image.full)
  body.append('upload_preset', uploadPreset)
  body.append('tags', `${folder},${ownerId}`)

  return new Promise<string>((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    request.onload = () => {
      let payload: { public_id?: unknown; error?: { message?: unknown } } = {}
      try {
        payload = JSON.parse(request.responseText)
      } catch {
        payload = {}
      }
      if (request.status >= 200 && request.status < 300 && typeof payload.public_id === 'string') {
        resolve(payload.public_id)
        return
      }
      const detail = typeof payload.error?.message === 'string' ? payload.error.message : `status ${request.status}`
      reject(new Error(`Cloudinary refused the upload: ${detail}`))
    }
    request.onerror = () => reject(new Error('The image could not be uploaded. Check your connection.'))
    request.send(body)
  })
}

export async function deleteStoredImages(paths: string[]): Promise<void> {
  void paths
}
