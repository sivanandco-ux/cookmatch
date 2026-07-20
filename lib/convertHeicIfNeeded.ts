import convert from 'heic-convert'

export interface ImageUpload {
  buffer: Buffer
  mediaType: string
  ext: string
}

// iPhones save photos as HEIC by default. Two separate problems follow if
// one reaches here unconverted: Claude's vision API only accepts
// jpeg/png/gif/webp (so validateDishPhoto rejects a real dish photo as
// "not food" — it never actually got to look at it), and most browsers
// (everything but Safari) can't render a HEIC <img> at all, so even a
// photo that skipped moderation would show as broken on the public site.
// Converting server-side, once, at upload time avoids both.
function isHeic(mediaType: string, filename: string): boolean {
  const type = mediaType.toLowerCase()
  const name = filename.toLowerCase()
  return type === 'image/heic' || type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif')
}

export async function convertHeicIfNeeded(buffer: Buffer, mediaType: string, filename: string): Promise<ImageUpload> {
  if (!isHeic(mediaType, filename)) {
    return { buffer, mediaType, ext: filename.split('.').pop()?.toLowerCase() || 'jpg' }
  }
  const output = await convert({ buffer, format: 'JPEG', quality: 0.9 })
  return { buffer: Buffer.from(output), mediaType: 'image/jpeg', ext: 'jpg' }
}
