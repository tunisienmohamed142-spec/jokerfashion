import { requireAdminSession } from '../_auth.js';
import { isKvAvailable, kvGet, kvSet, STORAGE_CONFIG_MESSAGE } from '../_kv.js';
import { DEFAULT_HOME_CONTENT, mergeHomeContent } from '../../app/data/home-content.js';

const KV_KEY = 'jf:home-content';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET') {
    try {
      const saved = (await kvGet(KV_KEY)) || {};
      return res.status(200).json(mergeHomeContent(saved, DEFAULT_HOME_CONTENT));
    } catch (err) {
      return res.status(200).json(DEFAULT_HOME_CONTENT);
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
      const next = mergeHomeContent(req.body || {}, DEFAULT_HOME_CONTENT);
      await kvSet(KV_KEY, next);
      return res.status(200).json(next);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to save homepage content.', error: err.message });
    }
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ message: 'Method not allowed.' });
}
