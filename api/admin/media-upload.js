import { createHash } from 'node:crypto';
import { requireAdminSession } from '../_auth.js';
import { validateUploadPayload } from '../_media.js';

function cloudinaryConfig() {
  const cloudName = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
  const apiKey = String(process.env.CLOUDINARY_API_KEY || '').trim();
  const apiSecret = String(process.env.CLOUDINARY_API_SECRET || '').trim();
  const uploadFolder = String(process.env.CLOUDINARY_UPLOAD_FOLDER || 'jokerfashion/admin').trim();

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadFolder,
    isConfigured: Boolean(cloudName && apiKey && apiSecret),
  };
}

function buildCloudinarySignature(params, apiSecret) {
  const sorted = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && String(value).length > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  return createHash('sha1')
    .update(`${sorted}${apiSecret}`, 'utf8')
    .digest('hex');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  const session = requireAdminSession(req, res);
  if (!session) {
    return;
  }

  const config = cloudinaryConfig();
  if (!config.isConfigured) {
    return res.status(503).json({
      message:
        'Media storage not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
    });
  }

  const validation = validateUploadPayload(req.body || {});
  if (!validation.valid) {
    return res.status(400).json({ message: validation.message });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const safeUsage = validation.usage.replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'general';
  const folder = `${config.uploadFolder}/${safeUsage}`;
  const signature = buildCloudinarySignature({ folder, timestamp }, config.apiSecret);

  const formData = new FormData();
  formData.append('file', validation.image.dataUrl);
  formData.append('api_key', config.apiKey);
  formData.append('timestamp', String(timestamp));
  formData.append('signature', signature);
  formData.append('folder', folder);

  if (validation.fileName) {
    formData.append('filename_override', validation.fileName.replace(/\.[^/.]+$/, ''));
    formData.append('use_filename', 'true');
    formData.append('unique_filename', 'true');
  }

  try {
    const uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const uploadData = await uploadResponse.json();
    if (!uploadResponse.ok) {
      return res.status(502).json({
        message: uploadData?.error?.message || 'Failed to upload image to media storage.',
      });
    }

    return res.status(201).json({
      url: uploadData.secure_url || uploadData.url,
      width: uploadData.width,
      height: uploadData.height,
      format: uploadData.format,
      bytes: uploadData.bytes,
      provider: 'cloudinary',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to upload image.', error: err.message });
  }
}
