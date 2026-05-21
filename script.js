const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const productCards = document.querySelectorAll('.product-card');
const cartItemsContainer = document.querySelector('#cart-items');
const cartCount = document.querySelector('#cart-count');
const cartTotalItems = document.querySelector('#cart-total-items');
const cartTotalPrice = document.querySelector('#cart-total-price');
const orderForm = document.querySelector('#order-form');
const orderStatus = document.querySelector('#order-status');
const downloadPdfButton = document.querySelector('#download-pdf');
const orderFeedback = document.querySelector('#order-feedback');
const orderFeedbackTitle = document.querySelector('#order-feedback-title');
const orderFeedbackText = document.querySelector('#order-feedback-text');

const cart = [];

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    navigation.classList.toggle('is-open');
  });
}

function formatPrice(value) {
  return `${value} kr`;
}

function setOrderFeedback(type, message, title) {
  if (orderStatus) {
    orderStatus.textContent = message;
    orderStatus.className = `order-status order-status--${type}`;
  }

  if (!orderFeedback || !orderFeedbackTitle || !orderFeedbackText) {
    return;
  }

  orderFeedback.hidden = false;
  orderFeedback.className = `order-feedback order-feedback--${type}`;
  orderFeedbackTitle.textContent = title;
  orderFeedbackText.textContent = message;
}

function resetOrderFeedback() {
  if (orderStatus) {
    orderStatus.textContent = '';
    orderStatus.className = 'order-status';
  }

  if (orderFeedback) {
    orderFeedback.hidden = true;
    orderFeedback.className = 'order-feedback';
  }
}

function getOrderData() {
  if (!orderForm) {
    return null;
  }

  const formData = new FormData(orderForm);
  const orderItems = cart.map((item) => ({
    ...item,
    subtotal: item.price * item.quantity,
  }));

  return {
    customer: {
      firstName: formData.get('firstName')?.toString().trim() || '',
      lastName: formData.get('lastName')?.toString().trim() || '',
      email: formData.get('email')?.toString().trim() || '',
      phone: formData.get('phone')?.toString().trim() || '',
      address: formData.get('address')?.toString().trim() || '',
      postalCode: formData.get('postalCode')?.toString().trim() || '',
      city: formData.get('city')?.toString().trim() || '',
      message: formData.get('message')?.toString().trim() || '',
    },
    items: orderItems,
    totalPrice: orderItems.reduce((sum, item) => sum + item.subtotal, 0),
    totalItems: orderItems.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function clearOrderState() {
  cart.length = 0;
  renderCart();

  if (orderForm) {
    orderForm.reset();
  }

  productCards.forEach((card) => {
    const quantityField = card.querySelector('.product-qty');
    if (quantityField) {
      quantityField.value = '1';
    }
  });
}

function renderCart() {
  if (!cartItemsContainer || !cartCount || !cartTotalItems || !cartTotalPrice) {
    return;
  }

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p class="empty-cart">Inga produkter i varukorgen ännu.</p>';
    cartCount.textContent = '0';
    cartTotalItems.textContent = '0';
    cartTotalPrice.textContent = '0 kr';
    return;
  }

  cartItemsContainer.innerHTML = cart
    .map(
      (item, index) => `
        <article class="cart-item">
          <div>
            <h3>${item.name}</h3>
            <p class="cart-item-meta">Kategori: ${item.category}</p>
            <p class="cart-item-meta">Storlek/variant: ${item.size}</p>
            <p class="cart-item-meta">Antal: ${item.quantity}</p>
            <p class="cart-item-meta">Pris/st: ${formatPrice(item.price)}</p>
          </div>
          <div>
            <p class="cart-item-price">${formatPrice(item.price * item.quantity)}</p>
            <button class="btn btn-secondary remove-item" type="button" data-index="${index}">Ta bort</button>
          </div>
        </article>
      `
    )
    .join('');

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  cartCount.textContent = String(totalItems);
  cartTotalItems.textContent = String(totalItems);
  cartTotalPrice.textContent = formatPrice(totalPrice);

  const removeButtons = cartItemsContainer.querySelectorAll('.remove-item');
  removeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      cart.splice(index, 1);
      renderCart();
      if (cart.length === 0) {
        setOrderFeedback('info', 'Varukorgen är nu tom.', 'Varukorgen uppdaterad');
      }
    });
  });
}

function createPdf(orderData) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('PDF-biblioteket kunde inte laddas.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;

  doc.setFontSize(18);
  doc.text('JokerFashion - Beställning', 14, y);
  y += 10;

  doc.setFontSize(11);
  doc.text(`Kund: ${orderData.customer.firstName} ${orderData.customer.lastName}`, 14, y);
  y += 7;
  doc.text(`E-post: ${orderData.customer.email}`, 14, y);
  y += 7;
  doc.text(`Telefon: ${orderData.customer.phone}`, 14, y);
  y += 7;
  doc.text(`Adress: ${orderData.customer.address}`, 14, y);
  y += 7;
  doc.text(`Postnummer/Stad: ${orderData.customer.postalCode} ${orderData.customer.city}`, 14, y);
  y += 10;

  if (orderData.customer.message) {
    doc.text(`Meddelande: ${orderData.customer.message}`, 14, y);
    y += 10;
  }

  doc.setFontSize(13);
  doc.text('Produkter', 14, y);
  y += 8;
  doc.setFontSize(10);

  orderData.items.forEach((item, index) => {
    const lines = [
      `${index + 1}. ${item.name}`,
      `Kategori: ${item.category}`,
      `Storlek/variant: ${item.size}`,
      `Antal: ${item.quantity}`,
      `Pris/st: ${formatPrice(item.price)}`,
      `Delsumma: ${formatPrice(item.subtotal)}`,
    ];

    lines.forEach((line) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 6;
    });

    y += 3;
  });

  if (y > 270) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.text(`Totalt antal artiklar: ${orderData.totalItems}`, 14, y);
  y += 8;
  doc.text(`Totalsumma: ${formatPrice(orderData.totalPrice)}`, 14, y);

  doc.save(`jokerfashion-bestallning-${Date.now()}.pdf`);
}

function hasRequiredCustomerFields(orderData) {
  const { customer } = orderData;
  return Boolean(
    customer.firstName &&
      customer.lastName &&
      customer.email &&
      customer.phone &&
      customer.address &&
      customer.postalCode &&
      customer.city
  );
}

async function sendOrderEmail(orderData) {
  const response = await fetch('/api/send-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || 'Det gick inte att skicka beställningen.');
  }

  return result;
}

productCards.forEach((card) => {
  const addButton = card.querySelector('.add-to-cart');
  const sizeField = card.querySelector('.product-select');
  const quantityField = card.querySelector('.product-qty');

  if (!addButton || !sizeField || !quantityField) {
    return;
  }

  addButton.addEventListener('click', () => {
    const quantity = Number(quantityField.value);

    if (!quantity || quantity < 1) {
      quantityField.value = '1';
      setOrderFeedback('error', 'Ange ett giltigt antal innan du lägger till produkten.', 'Fel antal');
      return;
    }

    cart.push({
      id: card.dataset.productId || '',
      name: card.dataset.name || 'Produkt',
      category: card.dataset.category || '',
      price: Number(card.dataset.price || 0),
      size: sizeField.value,
      quantity,
    });

    renderCart();
    quantityField.value = '1';
    setOrderFeedback('success', `${card.dataset.name || 'Produkten'} har lagts till i varukorgen.`, 'Tillagd i varukorgen');
  });
});

if (orderForm) {
  orderForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      setOrderFeedback('error', 'Lägg till minst en produkt i varukorgen innan du fortsätter.', 'Varukorgen är tom');
      return;
    }

    const orderData = getOrderData();
    if (!orderData) {
      return;
    }

    if (!hasRequiredCustomerFields(orderData)) {
      setOrderFeedback('error', 'Fyll i alla kunduppgifter innan du skickar beställningen.', 'Uppgifter saknas');
      return;
    }

    setOrderFeedback('info', 'Skickar beställningen...', 'Bearbetar order');

    try {
      await sendOrderEmail(orderData);
      clearOrderState();
      setOrderFeedback('success', 'Beställningen har skickats. Varukorgen och formuläret har tömts.', 'Tack för din beställning!');
    } catch (error) {
      console.error(error);
      setOrderFeedback('error', error.message || 'Det gick inte att skicka beställningen.', 'Något gick fel');
    }
  });
}

if (downloadPdfButton) {
  downloadPdfButton.addEventListener('click', () => {
    if (cart.length === 0) {
      setOrderFeedback('error', 'Lägg till minst en produkt i varukorgen innan du laddar ner PDF.', 'Varukorgen är tom');
      return;
    }

    const orderData = getOrderData();

    if (!orderData) {
      return;
    }

    if (!hasRequiredCustomerFields(orderData)) {
      setOrderFeedback('error', 'Fyll i alla kunduppgifter innan du laddar ner PDF.', 'Uppgifter saknas');
      return;
    }

    try {
      createPdf(orderData);
      setOrderFeedback('success', 'PDF-filen har laddats ner.', 'PDF skapad');
    } catch (error) {
      console.error(error);
      setOrderFeedback('error', 'Det gick inte att skapa PDF-filen.', 'PDF-fel');
    }
  });

  downloadPdfButton.addEventListener('focus', resetOrderFeedback);
}

if (orderForm) {
  orderForm.addEventListener('input', resetOrderFeedback);
}

renderCart();
