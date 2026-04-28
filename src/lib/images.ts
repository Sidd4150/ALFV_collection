/**
 * Given a thumb URL (e.g. .../1234_thumb.webp), returns the matching full-size URL.
 * Falls back to the same URL for legacy images that pre-date the thumb/full split.
 */
export function getFullImageUrl(thumbUrl: string): string {
  if (thumbUrl.includes('_thumb.webp')) {
    return thumbUrl.replace('_thumb.webp', '_full.webp')
  }
  return thumbUrl
}
