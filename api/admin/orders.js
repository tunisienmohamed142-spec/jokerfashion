import { kvGet } from '../_kv.js';
import { requireAdminSession } from '../_auth.js';

const ORDERS_KEY = 'jf:orders';
const ALLOWED_STATUSES = new Set(['pending', 'paid', 'fulfilled', 'cancelled']);

function normalizeStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : '';
}

function sortOrders(orders) {
  return [...orders].sort((a, b) => {
    const left = new Date(b?.createdAt || 0).getTime();
    const right = new Date(a?.createdAt || 0).getTime();
    return left - right;
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  const session = requireAdminSession(req, res);
  if (!session) {
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ message: 'Method not allowed.' });
  }

  try {
    const rawOrders = (await kvGet(ORDERS_KEY)) || [];
    const orders = Array.isArray(rawOrders) ? rawOrders : [];
    const status = normalizeStatus(req.query?.status);

    const filteredOrders = status ? orders.filter((order) => order?.status === status) : orders;
    return res.status(200).json(sortOrders(filteredOrders));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders.', error: error.message });
  }
}
