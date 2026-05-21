export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  try {
    const { customer, items, totalPrice } = req.body || {};

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing order data.' });
    }

    const lines = items
      .map(
        (item) =>
          `- ${item.name} | ${item.category} | ${item.size} | antal ${item.quantity} | ${item.subtotal} kr`
      )
      .join('\n');

    const payload = {
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      private_key: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        customer_name: `${customer.firstName} ${customer.lastName}`,
        customer_email: customer.email,
        customer_phone: customer.phone,
        customer_address: customer.address,
        customer_postal_code: customer.postalCode,
        customer_city: customer.city,
        customer_message: customer.message || '-',
        order_items: lines,
        order_total: `${totalPrice} kr`,
      },
    };

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ message: 'Failed to send email.', error: errorText });
    }

    return res.status(200).json({ message: 'Order email sent successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected server error.', error: error.message });
  }
}
