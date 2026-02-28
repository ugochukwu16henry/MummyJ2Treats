/**
 * Media preservation policy: uploaded pictures and videos must not be removed
 * when updates are done via partial payloads (e.g. PATCH). Only update a media
 * URL when the request explicitly provides a new non-empty URL.
 *
 * Use shouldUpdateMediaUrl() before including image_url / featured_image_url /
 * og_image_url (etc.) in any UPDATE so that null, undefined, or empty string
 * do not overwrite existing media.
 */

/**
 * Returns true only when value is a non-empty string. Use this to decide
 * whether to include a media URL in an UPDATE. When false, do not add the
 * field to the update (preserve existing value).
 */
export function shouldUpdateMediaUrl(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
