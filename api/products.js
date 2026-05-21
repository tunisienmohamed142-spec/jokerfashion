import { isKvAvailable, kvGet, kvSet } from './_kv.js';
import { requireAdminSession } from './_auth.js';
import { sanitizeRemoteImageUrl } from './_media.js';

const KV_KEY = 'jf:products';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80';

function sanitizeProductInput(input) {
  const priceSek = Number(input.priceSek);
  const salePriceSek = input.salePriceSek ? Number(input.salePriceSek) : null;
  const inventory = Number(input.inventory) || 0;

  return {
    name: String(input.name || '').trim(),
    category: String(input.category || '').trim(),
    priceSek,
    salePriceSek,
    inventory,
    description: String(input.description || '').trim() || 'Produktbeskrivning saknas.',
    sizes: input.sizes
      ? String(input.sizes)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : ['One size'],
    image: sanitizeRemoteImageUrl(input.image, FALLBACK_IMAGE),
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    try {
      const products = (await kvGet(KV_KEY)) || [];
      return res.status(200).json(products);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch products.', error: err.message });
    }
  }

  if (req.method === 'POST') {
    const session = requireAdminSession(req, res);
    if (!session) {
      return;
    }

    if (!isKvAvailable) {
      return res.status(503).json({
        message: 'Storage not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.',
      });
    }

    const body = req.body || {};
    const { name, category, priceSek } = body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Missing required field: name.' });
    }
    if (!category || !String(category).trim()) {
      return res.status(400).json({ message: 'Missing required field: category.' });
    }
    if (!priceSek || Number.isNaN(Number(priceSek)) || Number(priceSek) <= 0) {
      return res.status(400).json({ message: 'Invalid priceSek: must be a positive number.' });
    }

    const sanitized = sanitizeProductInput(body);

    if (sanitized.salePriceSek !== null && sanitized.salePriceSek >= sanitized.priceSek) {
      return res.status(400).json({ message: 'Sale price must be lower than regular price.' });
    }

    const product = {
      id: `jf-admin-${Date.now()}`,
      badge: 'Admin',
      story: 'Produkt tillagd via adminpanelen.',
      highlights: ['Admin-skapad produkt'],
      isAdminCreated: true,
      ...sanitized,
    };

    try {
      const existing = (await kvGet(KV_KEY)) || [];
      await kvSet(KV_KEY, [product, ...existing]);
      return res.status(201).json(product);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to save product.', error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ message: 'Method not allowed.' });
}
