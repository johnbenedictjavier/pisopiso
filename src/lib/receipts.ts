import { blobToDataUrl, compressImage, validateImage } from './images'

export function validateReceipt(file: File): string | null {
  return validateImage(file)
}

export async function compressReceipt(file: File): Promise<Blob> {
  if (file.type === 'image/webp' && file.size < 1_500_000) return file
  return compressImage(file, 1800, 0.82)
}

export { blobToDataUrl }
