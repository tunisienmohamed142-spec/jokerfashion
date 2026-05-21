export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ message: 'Only POST requests are allowed.' });
  }

  try {
    const { customer, items, totalPrice, orderPdfAttachment } = req.body || {};
    const rawOrderPdfData =
      typeof orderPdfAttachment?.data === 'string' ? orderPdfAttachment.data.trim() : '';
    const normalizedOrderPdfData = rawOrderPdfData.replace(
      /^data:application\/pdf;filename=[^;]+;base64,/i,
      'data:application/pdf;base64,'
    );

    if (!customer || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Missing order data.' });
    }

    if (
      !orderPdfAttachment
      || typeof orderPdfAttachment !== 'object'
      || typeof orderPdfAttachment.name !== 'string'
      || !orderPdfAttachment.name.trim()
      || !normalizedOrderPdfData.startsWith('data:application/pdf;base64,')
    ) {
      return res.status(400).json({ message: 'Missing valid PDF attachment.' });
    }

    if (normalizedOrderPdfData.length > 7_000_000) {
      return res.status(400).json({ message: 'PDF attachment is too large.' });
    }

    const pdfBase64 = normalizedOrderPdfData.replace(/^data:application\/pdf;base64,/, '');

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
      `Totalt: ${totalPrice} kr`,
    ].join('\n');

    const payload = {
      from: process.env.ORDER_FROM_EMAIL,
      to: [process.env.ORDER_TO_EMAIL],
      subject: `Ny beställning – ${customer.firstName} ${customer.lastName}`,
      text: emailBody,
      attachments: [
        {
          filename: orderPdfAttachment.name,
          content: pdfBase64,
        },
      ],
    };

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
      return res.status(500).json({ message: 'Failed to send email.', error: errorText });
    }

    return res.status(200).json({ message: 'Order email sent successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unexpected server error.', error: error.message });
  }
}
