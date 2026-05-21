import { isKvAvailable, kvGet, kvSet, STORAGE_CONFIG_MESSAGE } from './_kv.js';
import { requireAdminSession } from './_auth.js';
import { sanitizeRemoteImageUrl } from './_media.js';

const KV_KEY = 'jf:categories';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    try {
      const categories = (await kvGet(KV_KEY)) || [];
      return res.status(200).json(categories);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch categories.', error: err.message });
    }
  }

  if (req.method === 'POST') {
    const session = requireAdminSession(req, res);
    if (!session) {
      return;
    }

    if (!isKvAvailable) {
      return res.status(503).json({
        message: STORAGE_CONFIG_MESSAGE,
      });
    }

    const body = req.body || {};
    const { name } = body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Missing required field: name.' });
    }

    const category = {
      id: `cat-admin-${Date.now()}`,
      name: String(name).trim(),
      description: String(body.description || '').trim(),
      icon: String(body.icon || '🏷️').trim(),
      image: sanitizeRemoteImageUrl(body.image, ''),
      targetGroup: String(body.targetGroup || '').trim(),
      parentId: String(body.parentId || '').trim(),
      level: String(body.level || 'subcategory').trim(),
      isAdminCreated: true,
    };

    try {
      const existing = (await kvGet(KV_KEY)) || [];
      await kvSet(KV_KEY, [category, ...existing]);
      return res.status(201).json(category);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to save category.', error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ message: 'Method not allowed.' });
}
