import { isKvAvailable, kvGet, kvSet } from './_kv.js';

const ORDERS_KEY = 'jf:orders';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSafeString(value) {
  return String(value || '').trim();
}

function createOrderReference(createdAt, randomPart) {
  const date = new Date(createdAt);
  const datePart = Number.isNaN(date.getTime())
    ? '00000000'
    : `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}${String(
        date.getUTCDate()
      ).padStart(2, '0')}`;

  return `JF-${datePart}-${randomPart}`;
}

function normalizeOrderPayload(body = {}) {
  const customerInput = body.customer || {};
  const itemsInput = Array.isArray(body.items) ? body.items : [];
  const createdAt = new Date().toISOString();
  const randomPart = String(Math.floor(Math.random() * 900000) + 100000);
  const orderReference = createOrderReference(createdAt, randomPart);

  const customer = {
    firstName: toSafeString(customerInput.firstName),
    lastName: toSafeString(customerInput.lastName),
    email: toSafeString(customerInput.email),
    phone: toSafeString(customerInput.phone),
    address: toSafeString(customerInput.address),
    postalCode: toSafeString(customerInput.postalCode),
    city: toSafeString(customerInput.city),
    message: toSafeString(customerInput.message),
  };

  const items = itemsInput.map((item) => {
    const quantity = Math.max(1, Math.floor(toNumber(item.quantity, 1)));
    const unitPrice = Math.max(0, toNumber(item.priceSek, 0));
    const subtotal = Math.max(0, toNumber(item.subtotal, unitPrice * quantity));

    return {
      productId: toSafeString(item.productId),
      name: toSafeString(item.name),
      category: toSafeString(item.category),
      size: toSafeString(item.size),
      image: toSafeString(item.image),
      quantity,
      unitPrice,
      subtotal,
    };
  });

  const subtotalPrice = Math.max(0, toNumber(body.subtotalPrice));
  const shippingPrice = Math.max(0, toNumber(body.shippingPrice));
  const totalPrice = Math.max(0, toNumber(body.totalPrice, subtotalPrice + shippingPrice));
  const shippingRate = Math.max(0, toNumber(body.shippingRate));
  const freeShippingThreshold = body.freeShippingThreshold === Infinity
    ? null
    : Number.isFinite(Number(body.freeShippingThreshold))
      ? Math.max(0, Number(body.freeShippingThreshold))
      : null;

  return {
    persistedOrder: {
      id: `jf-order-${Date.now()}-${randomPart}`,
      orderReference,
      status: 'pending',
      createdAt,
      updatedAt: createdAt,
      customer,
      shippingAddress: {
        address: customer.address,
        postalCode: customer.postalCode,
        city: customer.city,
      },
      items,
      totals: {
        subtotalPrice,
        shippingPrice,
        totalPrice,
        shippingRate,
        freeShippingThreshold,
        currency: 'SEK',
      },
    },
    customer,
    items,
    subtotalPrice,
    shippingPrice,
    totalPrice,
    orderReference,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  try {
    if (!isKvAvailable) {
      return res.status(503).json({
        message: 'Storage not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN in Vercel.',
      });
    }

    const { persistedOrder, customer, items, subtotalPrice, shippingPrice, totalPrice, orderReference } =
      normalizeOrderPayload(req.body || {});

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing order data.' });
    }

    const existingOrders = (await kvGet(ORDERS_KEY)) || [];
    await kvSet(ORDERS_KEY, [persistedOrder, ...existingOrders]);

    const lines = items
      .map(
        (item) =>
          `- ${item.name} | ${item.category} | ${item.size} | antal ${item.quantity} | ${item.subtotal} kr`
      )
      .join('\n');

    const emailBody = [
      `Kund: ${customer.firstName} ${customer.lastName}`,
      `E-post: ${customer.email}`,
      `Telefon: ${customer.phone}`,
      `Adress: ${customer.address}`,
      `Postnummer/Stad: ${customer.postalCode} ${customer.city}`,
      `Meddelande: ${customer.message || '-'}`,
      '',
      'Produkter:',
      lines,
      '',
      `Subtotal: ${subtotalPrice ?? totalPrice} kr`,
      `Frakt: ${shippingPrice ?? 0} kr`,
      `Totalt: ${totalPrice} kr`,
    ].join('\n');

    const payload = {
      from: process.env.ORDER_FROM_EMAIL,
      to: [process.env.ORDER_TO_EMAIL],
      subject: `Ny beställning – ${customer.firstName} ${customer.lastName}`,
      text: emailBody,
    };

    let emailWarning = null;
    const hasEmailConfig = Boolean(
      process.env.RESEND_API_KEY && process.env.ORDER_FROM_EMAIL && process.env.ORDER_TO_EMAIL
    );

    if (hasEmailConfig) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        emailWarning = `Order saved, but email notification failed: ${errorText}`;
      }
    } else {
      emailWarning = 'Order saved, but email notification is not configured.';
    }

    return res.status(201).json({
      message: 'Order saved successfully.',
      orderReference,
      ...(emailWarning ? { warning: emailWarning } : {}),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected server error.', error: error.message });
  }
}
