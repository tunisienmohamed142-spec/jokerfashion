const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.site-nav');
const productCards = document.querySelectorAll('.product-card');
const cartItemsContainer = document.querySelector('#cart-items');
const cartCount = document.querySelector('#cart-count');
const cartTotalItems = document.querySelector('#cart-total-items');
const cartTotalPrice = document.querySelector('#cart-total-price');
const orderForm = document.querySelector('#order-form');
const orderStatus = document.querySelector('#order-status');

const cart = [];

if (menuButton && navigation) {
  menuButton.addEventListener('click', () => {
    navigation.classList.toggle('is-open');
  });
}

function formatPrice(value) {
  return `${value} kr`;
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
    });
  });
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
  });
});

if (orderForm) {
  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (cart.length === 0) {
      if (orderStatus) {
        orderStatus.textContent = 'Lägg till minst en produkt i varukorgen innan du fortsätter.';
      }
      return;
    }

    const formData = new FormData(orderForm);
    const firstName = formData.get('firstName')?.toString().trim() || '';
    const lastName = formData.get('lastName')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const phone = formData.get('phone')?.toString().trim() || '';
    const address = formData.get('address')?.toString().trim() || '';
    const postalCode = formData.get('postalCode')?.toString().trim() || '';
    const city = formData.get('city')?.toString().trim() || '';
    const message = formData.get('message')?.toString().trim() || '';

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const lines = cart
      .map(
        (item) =>
          `${item.name} | ${item.category} | ${item.size} | antal ${item.quantity} | ${formatPrice(item.price * item.quantity)}`
      )
      .join('\n');

    const orderSummary = [
      'Ny beställning från JokerFashion',
      '',
      `Kund: ${firstName} ${lastName}`,
      `E-post: ${email}`,
      `Telefon: ${phone}`,
      `Adress: ${address}`,
      `Postnummer: ${postalCode}`,
      `Stad: ${city}`,
      message ? `Meddelande: ${message}` : 'Meddelande: -',
      '',
      'Produkter:',
      lines,
      '',
      `Totalsumma: ${formatPrice(totalPrice)}`,
    ].join('\n');

    console.log(orderSummary);

    if (orderStatus) {
      orderStatus.textContent = 'Beställningen är sammanställd. Nästa steg är att koppla PDF och mejlutskick.';
    }
  });
}

renderCart();
