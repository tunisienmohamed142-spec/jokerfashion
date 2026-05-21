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
const submitOrderButton = document.querySelector('.submit-order[type="submit"]');
const fieldErrors = document.querySelectorAll('.field-error');

const CART_STORAGE_KEY = 'jokerfashion-cart';
const FORM_STORAGE_KEY = 'jokerfashion-order-form';
const cart = [];

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    navigation.classList.toggle('is-open');
  });
}

function formatPrice(value) {
  return `${value} kr`;
}

function saveCart() {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Could not save cart to localStorage.', error);
  }
}

function loadCart() {
  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!storedCart) {
      return;
    }

    const parsedCart = JSON.parse(storedCart);
    if (!Array.isArray(parsedCart)) {
      return;
    }

    cart.splice(0, cart.length, ...parsedCart);
  } catch (error) {
    console.error('Could not load cart from localStorage.', error);
  }
}

function clearSavedCart() {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
  } catch (error) {
    console.error('Could not clear cart from localStorage.', error);
  }
}

function saveFormData() {
  if (!orderForm) {
    return;
  }

  try {
    const formData = new FormData(orderForm);
    const payload = Object.fromEntries(formData.entries());
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Could not save form to localStorage.', error);
  }
}

function loadFormData() {
  if (!orderForm) {
    return;
  }

  try {
    const storedForm = localStorage.getItem(FORM_STORAGE_KEY);
    if (!storedForm) {
      return;
    }

    const parsedForm = JSON.parse(storedForm);
    if (!parsedForm || typeof parsedForm !== 'object') {
      return;
    }

    Object.entries(parsedForm).forEach(([key, value]) => {
      const field = orderForm.elements.namedItem(key);
      if (field && typeof value === 'string') {
        field.value = value;
      }
    });
  } catch (error) {
    console.error('Could not load form from localStorage.', error);
  }
}

function clearSavedFormData() {
  try {
    localStorage.removeItem(FORM_STORAGE_KEY);
  } catch (error) {
    console.error('Could not clear form from localStorage.', error);
  }
}

function setButtonsDisabled(disabled) {
  if (submitOrderButton) {
    submitOrderButton.disabled = disabled;
    submitOrderButton.textContent = disabled ? 'Skickar...' : 'Skapa beställning';
  }

  if (downloadPdfButton) {
    downloadPdfButton.disabled = disabled;
  }
}

function scrollToOrderFeedback() {
  if (orderFeedback && !orderFeedback.hidden) {
    orderFeedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else if (orderStatus) {
    orderStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
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

function clearFieldErrors() {
  fieldErrors.forEach((errorElement) => {
    errorElement.textContent = '';
  });

  if (!orderForm) {
    return;
  }

  const fields = orderForm.querySelectorAll('input, textarea, select');
  fields.forEach((field) => {
    field.classList.remove('input-error');
    field.removeAttribute('aria-invalid');
  });
}

function setFieldError(fieldName, message) {
  if (!orderForm) {
    return;
  }

  const field = orderForm.elements.namedItem(fieldName);
  const errorElement = orderForm.querySelector(`[data-error-for="${fieldName}"]`);

  if (field) {
    field.classList.add('input-error');
    field.setAttribute('aria-invalid', 'true');
  }

  if (errorElement) {
    errorElement.textContent = message;
  }
}

function focusFirstFieldError() {
  if (!orderForm) {
    return;
  }

  const firstErrorField = orderForm.querySelector('.input-error');
  if (firstErrorField) {
    firstErrorField.focus();
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[0-9+()\-\s]{7,20}$/.test(phone);
}

function isValidPostalCode(postalCode) {
  return /^[0-9]{3}\s?[0-9]{2}$/.test(postalCode);
}

function validateOrderData(orderData) {
  const { customer } = orderData;
  clearFieldErrors();

  const errors = [];

  if (!customer.firstName) {
    errors.push({ field: 'firstName', message: 'Ange ditt förnamn.' });
  }

  if (!customer.lastName) {
    errors.push({ field: 'lastName', message: 'Ange ditt efternamn.' });
  }

  if (!customer.email) {
    errors.push({ field: 'email', message: 'Ange din e-postadress.' });
  } else if (!isValidEmail(customer.email)) {
    errors.push({ field: 'email', message: 'Ange en giltig e-postadress.' });
  }

  if (!customer.phone) {
    errors.push({ field: 'phone', message: 'Ange ditt telefonnummer.' });
  } else if (!isValidPhone(customer.phone)) {
    errors.push({ field: 'phone', message: 'Ange ett giltigt telefonnummer med minst 7 tecken.' });
  }

  if (!customer.address) {
    errors.push({ field: 'address', message: 'Ange din adress.' });
  }

  if (!customer.postalCode) {
    errors.push({ field: 'postalCode', message: 'Ange ditt postnummer.' });
  } else if (!isValidPostalCode(customer.postalCode)) {
    errors.push({ field: 'postalCode', message: 'Ange ett giltigt postnummer, t.ex. 12345 eller 123 45.' });
  }

  if (!customer.city) {
    errors.push({ field: 'city', message: 'Ange din stad.' });
  }

  errors.forEach(({ field, message }) => {
    setFieldError(field, message);
  });

  if (errors.length > 0) {
    return {
      valid: false,
      title: 'Kontrollera formuläret',
      message: 'Vissa uppgifter saknas eller är ogiltiga. Kontrollera fälten markerade nedan.',
    };
  }

  return { valid: true };
}

function clearOrderState() {
  cart.length = 0;
  clearSavedCart();
  renderCart();

  if (orderForm) {
    orderForm.reset();
  }

  clearSavedFormData();
  clearFieldErrors();

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
      saveCart();
      renderCart();
      if (cart.length === 0) {
        setOrderFeedback('info', 'Varukorgen är nu tom.', 'Varukorgen uppdaterad');
      } else {
        setOrderFeedback('info', 'Produkten togs bort från varukorgen.', 'Varukorgen uppdaterad');
      }
      scrollToOrderFeedback();
    });
  });
}

function getOrderPdfDocument(orderData) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error('PDF-biblioteket kunde inte laddas.');
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const maxWidth = 180;
  let y = 20;

  const addWrappedText = (label, value, spacing = 7) => {
    const lines = doc.splitTextToSize(`${label}${value}`, maxWidth);
    lines.forEach((line) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += spacing;
    });
  };

  doc.setFontSize(18);
  doc.text('JokerFashion - Beställning', 14, y);
  y += 10;

  doc.setFontSize(11);
  addWrappedText('Kund: ', `${orderData.customer.firstName} ${orderData.customer.lastName}`);
  addWrappedText('E-post: ', orderData.customer.email);
  addWrappedText('Telefon: ', orderData.customer.phone);
  addWrappedText('Adress: ', orderData.customer.address);
  addWrappedText('Postnummer/Stad: ', `${orderData.customer.postalCode} ${orderData.customer.city}`);
  y += 3;

  if (orderData.customer.message) {
    addWrappedText('Meddelande: ', orderData.customer.message);
    y += 3;
  }

  doc.setFontSize(13);
  if (y > pageHeight - 30) {
    doc.addPage();
    y = 20;
  }
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
      '----------------------------------------',
    ];

    lines.forEach((line) => {
      const wrappedLines = doc.splitTextToSize(line, maxWidth);
      wrappedLines.forEach((wrappedLine) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }
        doc.text(wrappedLine, 14, y);
        y += 6;
      });
    });

    y += 2;
  });

  if (y > pageHeight - 25) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(13);
  doc.text(`Totalt antal artiklar: ${orderData.totalItems}`, 14, y);
  y += 8;
  doc.text(`Totalsumma: ${formatPrice(orderData.totalPrice)}`, 14, y);

  return doc;
}

function createPdf(orderData) {
  const doc = getOrderPdfDocument(orderData);
  doc.save(`jokerfashion-bestallning-${Date.now()}.pdf`);
}

function createOrderPdfAttachment(orderData) {
  const doc = getOrderPdfDocument(orderData);
  const pdfDataUri = doc
    .output('datauristring')
    .replace(/^data:application\/pdf;filename=[^;]+;base64,/i, 'data:application/pdf;base64,');

  return {
    name: `jokerfashion-bestallning-${Date.now()}.pdf`,
    data: pdfDataUri,
  };
}

async function sendOrderEmail(orderData) {
  const payload = {
    ...orderData,
    orderPdfAttachment: createOrderPdfAttachment(orderData),
  };

  const response = await fetch('/api/send-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || result.message || 'Det gick inte att skicka beställningen.');
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
      scrollToOrderFeedback();
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

    saveCart();
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
      scrollToOrderFeedback();
      return;
    }

    const orderData = getOrderData();
    if (!orderData) {
      return;
    }

    const validation = validateOrderData(orderData);
    if (!validation.valid) {
      setOrderFeedback('error', validation.message, validation.title);
      focusFirstFieldError();
      scrollToOrderFeedback();
      return;
    }

    setButtonsDisabled(true);
    setOrderFeedback('info', 'Skickar beställningen...', 'Bearbetar order');
    scrollToOrderFeedback();

    try {
      await sendOrderEmail(orderData);
      clearOrderState();
      setOrderFeedback('success', 'Beställningen har skickats. Varukorgen och formuläret har tömts.', 'Tack för din beställning!');
      scrollToOrderFeedback();
    } catch (error) {
      console.error(error);
      setOrderFeedback('error', error.message || 'Det gick inte att skicka beställningen.', 'Något gick fel');
      scrollToOrderFeedback();
    } finally {
      setButtonsDisabled(false);
    }
  });
}

if (downloadPdfButton) {
  downloadPdfButton.addEventListener('click', () => {
    if (cart.length === 0) {
      setOrderFeedback('error', 'Lägg till minst en produkt i varukorgen innan du laddar ner PDF.', 'Varukorgen är tom');
      scrollToOrderFeedback();
      return;
    }

    const orderData = getOrderData();

    if (!orderData) {
      return;
    }

    const validation = validateOrderData(orderData);
    if (!validation.valid) {
      setOrderFeedback('error', validation.message, validation.title);
      focusFirstFieldError();
      scrollToOrderFeedback();
      return;
    }

    try {
      createPdf(orderData);
      setOrderFeedback('success', 'PDF-filen har laddats ner.', 'PDF skapad');
    } catch (error) {
      console.error(error);
      setOrderFeedback('error', 'Det gick inte att skapa PDF-filen.', 'PDF-fel');
      scrollToOrderFeedback();
    }
  });

  downloadPdfButton.addEventListener('focus', resetOrderFeedback);
}

if (orderForm) {
  orderForm.addEventListener('input', (event) => {
    saveFormData();
    resetOrderFeedback();

    const field = event.target;
    if (field && field.name) {
      field.classList.remove('input-error');
      field.removeAttribute('aria-invalid');

      const errorElement = orderForm.querySelector(`[data-error-for="${field.name}"]`);
      if (errorElement) {
        errorElement.textContent = '';
      }
    }
  });
}

loadCart();
loadFormData();
renderCart();
