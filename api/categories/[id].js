import { isKvAvailable, kvGet, kvSet } from '../_kv.js';
import { requireAdminSession } from '../_auth.js';

const KV_KEY = 'jf:categories';

export default async function handler(req, res) {
  const { id } = req.query;

  res.setHeader('Content-Type', 'application/json');

  if (!id || !String(id).trim()) {
    return res.status(400).json({ message: 'Category ID is required.' });
  }

  if (req.method === 'GET') {
    const session = requireAdminSession(req, res);
    if (!session) {
      return;
    }

    try {
      const categories = (await kvGet(KV_KEY)) || [];
      const category = categories.find((c) => c.id === id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found.' });
      }
      return res.status(200).json(category);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch category.', error: err.message });
    }
  }

  if (req.method === 'PUT') {
    const session = requireAdminSession(req, res);
    if (!session) {
      return;
    }

    if (!isKvAvailable) {
      return res.status(503).json({ message: 'Storage not configured.' });
    }

    try {
      const categories = (await kvGet(KV_KEY)) || [];
      const index = categories.findIndex((c) => c.id === id);

      if (index === -1) {
        return res.status(404).json({ message: 'Category not found.' });
      }

      const existing = categories[index];
      const body = req.body || {};

      const updated = {
        ...existing,
        name: body.name !== undefined ? String(body.name).trim() : existing.name,
        description:
          body.description !== undefined
            ? String(body.description).trim()
            : existing.description,
        icon: body.icon !== undefined ? String(body.icon).trim() : existing.icon,
      };

      categories[index] = updated;
      await kvSet(KV_KEY, categories);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to update category.', error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const session = requireAdminSession(req, res);
    if (!session) {
      return;
    }

    if (!isKvAvailable) {
      return res.status(503).json({ message: 'Storage not configured.' });
    }

    try {
      const categories = (await kvGet(KV_KEY)) || [];
      const next = categories.filter((c) => c.id !== id);

      if (next.length === categories.length) {
        return res.status(404).json({ message: 'Category not found.' });
      }

      await kvSet(KV_KEY, next);
      return res.status(200).json({ message: 'Category deleted.' });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to delete category.', error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ message: 'Method not allowed.' });
}
