const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function validateImage(file: File, maxBytes = 8 * 1024 * 1024): string | null {
  if (!acceptedImageTypes.has(file.type)) return 'Use a JPG, PNG, or WebP image.'
  if (file.size > maxBytes) return 'Keep images under 8 MB.'
  return null
}

export async function compressImage(file: File, maxDimension = 1800, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image compression is unavailable in this browser.')
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not process this image.'))), 'image/webp', quality)
  })
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read this image.'))
    reader.readAsDataURL(blob)
  })
}
