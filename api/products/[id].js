import { isKvAvailable, kvGet, kvSet } from '../_kv.js';
import { requireAdminSession } from '../_auth.js';
import { sanitizeRemoteImageUrl } from '../_media.js';

const KV_KEY = 'jf:products';

export default async function handler(req, res) {
  const { id } = req.query;

  res.setHeader('Content-Type', 'application/json');

  if (!id || !String(id).trim()) {
    return res.status(400).json({ message: 'Product ID is required.' });
  }

  if (req.method === 'GET') {
    const session = requireAdminSession(req, res);
    if (!session) {
      return;
    }

    try {
      const products = (await kvGet(KV_KEY)) || [];
      const product = products.find((p) => p.id === id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
      return res.status(200).json(product);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch product.', error: err.message });
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
      const products = (await kvGet(KV_KEY)) || [];
      const index = products.findIndex((p) => p.id === id);

      if (index === -1) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      const existing = products[index];
      const body = req.body || {};
      const ALLOWED_BADGES = ['', 'REA', 'Ny', 'Populär', 'Bestseller'];
      const rawBadge = body.badge !== undefined ? String(body.badge).trim() : existing.badge;

      const updated = {
        ...existing,
        name: body.name !== undefined ? String(body.name).trim() : existing.name,
        category: body.category !== undefined ? String(body.category).trim() : existing.category,
        priceSek:
          body.priceSek !== undefined ? Number(body.priceSek) : existing.priceSek,
        salePriceSek:
          body.salePriceSek !== undefined
            ? body.salePriceSek
              ? Number(body.salePriceSek)
              : null
            : existing.salePriceSek,
        inventory:
          body.inventory !== undefined ? Number(body.inventory) : existing.inventory,
        description:
          body.description !== undefined
            ? String(body.description).trim()
            : existing.description,
        sizes:
          body.sizes !== undefined
            ? String(body.sizes)
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
            : existing.sizes,
        image:
          body.image !== undefined ? sanitizeRemoteImageUrl(body.image, existing.image) : existing.image,
        badge: ALLOWED_BADGES.includes(rawBadge) ? rawBadge : (existing.badge || ''),
        isNew: body.isNew !== undefined ? Boolean(body.isNew) : Boolean(existing.isNew),
        featured: body.featured !== undefined ? Boolean(body.featured) : Boolean(existing.featured),
        isBestseller: body.isBestseller !== undefined ? Boolean(body.isBestseller) : Boolean(existing.isBestseller),
      };

      if (updated.salePriceSek !== null && updated.salePriceSek >= updated.priceSek) {
        return res
          .status(400)
          .json({ message: 'Sale price must be lower than regular price.' });
      }

      products[index] = updated;
      await kvSet(KV_KEY, products);
      return res.status(200).json(updated);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to update product.', error: err.message });
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
      const products = (await kvGet(KV_KEY)) || [];
      const next = products.filter((p) => p.id !== id);

      if (next.length === products.length) {
        return res.status(404).json({ message: 'Product not found.' });
      }

      await kvSet(KV_KEY, next);
      return res.status(200).json({ message: 'Product deleted.' });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to delete product.', error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, PUT, DELETE');
  return res.status(405).json({ message: 'Method not allowed.' });
}
