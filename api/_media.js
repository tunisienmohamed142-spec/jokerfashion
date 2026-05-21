const ALLOWED_UPLOAD_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // 3 MB

export function sanitizeRemoteImageUrl(value, fallback = '') {
  const candidate = String(value || '').trim();
  if (!candidate) {
    return fallback;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
  } catch {
    // invalid URL
  }

  return fallback;
}

export function parseDataUrlImage(dataUrl) {
  const value = String(dataUrl || '').trim();
  const match = value.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    return null;
  }

  const mimeType = match[1].toLowerCase();
  const base64Data = match[2].replace(/\s+/g, '');

  if (!ALLOWED_UPLOAD_MIME_TYPES.has(mimeType)) {
    return null;
  }

  try {
    const binary = Buffer.from(base64Data, 'base64');
    return {
      mimeType,
      sizeBytes: binary.length,
      dataUrl: `data:${mimeType};base64,${base64Data}`,
    };
  } catch {
    return null;
  }
}

export function validateUploadPayload(payload = {}) {
  const parsed = parseDataUrlImage(payload.dataUrl);
  if (!parsed) {
    return {
      valid: false,
      message: 'Invalid image format. Use JPG, PNG, WEBP or GIF.',
    };
  }

  if (parsed.sizeBytes <= 0 || parsed.sizeBytes > MAX_UPLOAD_BYTES) {
    return {
      valid: false,
      message: 'Image too large. Max size is 3 MB.',
    };
  }

  const usage = String(payload.usage || '').trim().toLowerCase() || 'general';
  const fileName = String(payload.fileName || '').trim().slice(0, 120);

  return {
    valid: true,
    image: parsed,
    usage,
    fileName,
  };
}
