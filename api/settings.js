import { isKvAvailable, kvGet, kvSet, STORAGE_CONFIG_MESSAGE } from './_kv.js';
import { requireAdminSession } from './_auth.js';

const KV_KEY = 'jf:settings';

const DEFAULTS = {
  shippingRate: 49,
  freeShippingThreshold: 799,
  taxRate: 25,
  currency: 'SEK',
  shopEmail: '',
  shopName: 'JokerFashion',
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    try {
      const saved = (await kvGet(KV_KEY)) || {};
      return res.status(200).json({ ...DEFAULTS, ...saved });
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch settings.', error: err.message });
    }
  }

  if (req.method === 'PUT') {
    const session = requireAdminSession(req, res);
    if (!session) {
      return;
    }

    if (!isKvAvailable) {
      return res.status(503).json({
        message: STORAGE_CONFIG_MESSAGE,
      });
    }

    try {
      const current = { ...DEFAULTS, ...((await kvGet(KV_KEY)) || {}) };
      const body = req.body || {};

      const next = {
        shippingRate:
          body.shippingRate !== undefined ? Number(body.shippingRate) : current.shippingRate,
        freeShippingThreshold:
          body.freeShippingThreshold !== undefined
            ? Number(body.freeShippingThreshold)
            : current.freeShippingThreshold,
        taxRate: body.taxRate !== undefined ? Number(body.taxRate) : current.taxRate,
        currency:
          body.currency !== undefined ? String(body.currency).trim() : current.currency,
        shopEmail:
          body.shopEmail !== undefined ? String(body.shopEmail).trim() : current.shopEmail,
        shopName:
          body.shopName !== undefined ? String(body.shopName).trim() : current.shopName,
      };

      await kvSet(KV_KEY, next);
      return res.status(200).json(next);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to save settings.', error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ message: 'Method not allowed.' });
}
