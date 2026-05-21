import { isKvAvailable, kvGet, kvSet, STORAGE_CONFIG_MESSAGE } from '../../_kv.js';
import { requireAdminSession } from '../../_auth.js';

const ORDERS_KEY = 'jf:orders';
const ALLOWED_STATUSES = new Set(['pending', 'paid', 'fulfilled', 'cancelled']);

function normalizeStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : '';
}

export default async function handler(req, res) {
  const { id } = req.query;
  res.setHeader('Content-Type', 'application/json');

  if (!id || !String(id).trim()) {
    return res.status(400).json({ message: 'Order ID is required.' });
  }

  const session = requireAdminSession(req, res);
  if (!session) {
    return;
  }

  if (req.method === 'GET') {
    try {
      const rawOrders = (await kvGet(ORDERS_KEY)) || [];
      const orders = Array.isArray(rawOrders) ? rawOrders : [];
      const order = orders.find((entry) => entry?.id === id);
      if (!order) {
        return res.status(404).json({ message: 'Order not found.' });
      }
      return res.status(200).json(order);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to fetch order.', error: error.message });
    }
  }

  if (req.method === 'PATCH') {
    if (!isKvAvailable) {
      return res.status(503).json({
        message: STORAGE_CONFIG_MESSAGE,
      });
    }

    const status = normalizeStatus(req.body?.status);
    if (!status) {
      return res.status(400).json({
        message: 'Invalid status. Allowed values: pending, paid, fulfilled, cancelled.',
      });
    }

    try {
      const rawOrders = (await kvGet(ORDERS_KEY)) || [];
      const orders = Array.isArray(rawOrders) ? rawOrders : [];
      const index = orders.findIndex((entry) => entry?.id === id);
      if (index === -1) {
        return res.status(404).json({ message: 'Order not found.' });
      }

      const existing = orders[index];
      const updatedOrder = {
        ...existing,
        status,
        updatedAt: new Date().toISOString(),
      };
      orders[index] = updatedOrder;
      await kvSet(ORDERS_KEY, orders);

      return res.status(200).json(updatedOrder);
    } catch (error) {
      return res.status(500).json({ message: 'Failed to update order.', error: error.message });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ message: 'Method not allowed.' });
}
