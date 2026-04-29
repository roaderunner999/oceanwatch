'use strict';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_B64_LEN   = 5_000_000;   // ~3.75 MB decoded — generous for frames

function validateImage({ imageData, mediaType }) {
  if (!imageData || typeof imageData !== 'string') {
    return { valid: false, error: 'imageData is required and must be a base64 string.' };
  }

  // Strip data URL prefix if the client sent it
  const clean = imageData.replace(/^data:[^;]+;base64,/, '');

  if (clean.length > MAX_B64_LEN) {
    return { valid: false, error: `Image too large (max ~3.75 MB decoded). Received ${(clean.length * 0.75 / 1e6).toFixed(1)} MB.` };
  }

  if (!ALLOWED_TYPES.has(mediaType)) {
    return { valid: false, error: `Unsupported media type "${mediaType}". Use image/jpeg, image/png, or image/webp.` };
  }

  return { valid: true, clean };
}

module.exports = { validateImage };
