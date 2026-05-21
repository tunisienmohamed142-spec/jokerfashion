import {
  formatPrice,
  renderCartSummary,
  renderCheckoutCart,
} from '../components/renderers.js';
import {
  clearCart,
  clearCheckoutDraft,
  getCartItems,
  getCartSummary,
  getCheckoutDraft,
  removeCartItem,
  setCheckoutDraft,
  updateCartItemQuantity,
} from '../state/store.js';

function getOrderPayload(form) {
  const formData = new FormData(form);
  const cartItems = getCartItems();

  return {
    customer: {
      firstName: String(formData.get('firstName') || '').trim(),
      lastName: String(formData.get('lastName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      address: String(formData.get('address') || '').trim(),
      postalCode: String(formData.get('postalCode') || '').trim(),
      city: String(formData.get('city') || '').trim(),
      message: String(formData.get('message') || '').trim(),
    },
    items: cartItems.map((item) => ({
      ...item,
      subtotal: item.priceSek * item.quantity,
    })),
    totalPrice: cartItems.reduce((sum, item) => sum + item.priceSek * item.quantity, 0),
  };
}

function validateOrderPayload(orderData) {
  const errors = [];
  const { customer, items } = orderData;

  if (!items.length) {
    errors.push('Varukorgen är tom. Lägg till minst en produkt innan du skickar ordern.');
  }

  if (!customer.firstName) {
    errors.push('Ange ditt förnamn.');
  }

  if (!customer.lastName) {
    errors.push('Ange ditt efternamn.');
  }

  if (!customer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
    errors.push('Ange en giltig e-postadress.');
  }

  if (!customer.phone || !/^[0-9+()\-\s]{7,20}$/.test(customer.phone)) {
    errors.push('Ange ett giltigt telefonnummer.');
  }

  if (!customer.address) {
    errors.push('Ange din adress.');
  }

  if (!customer.postalCode || !/^[0-9]{3}\s?[0-9]{2}$/.test(customer.postalCode)) {
    errors.push('Ange ett giltigt postnummer.');
  }

  if (!customer.city) {
    errors.push('Ange din stad.');
  }

  return errors;
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
    throw new Error(result.error || result.message || 'Det gick inte att skicka beställningen.');
  }
}

function fillCheckoutDraft(form) {
  const draft = getCheckoutDraft();

  Object.entries(draft).forEach(([fieldName, value]) => {
    const field = form.elements.namedItem(fieldName);
    if (field && typeof value === 'string') {
      field.value = value;
    }
  });
}

function saveCheckoutDraft(form) {
  const formData = new FormData(form);
  setCheckoutDraft(Object.fromEntries(formData.entries()));
}

export function initCheckoutPage() {
  const cartContainer = document.querySelector('[data-checkout-cart]');
  const summaryContainer = document.querySelector('[data-checkout-summary]');
  const form = document.querySelector('[data-checkout-form]');
  const feedback = document.querySelector('[data-checkout-feedback]');
  const totalElement = document.querySelector('[data-checkout-total]');
  const clearButton = document.querySelector('[data-clear-cart]');
  const submitButton = form?.querySelector('[type="submit"]');

  function renderCheckoutState(helperText = 'Granska din varukorg och fyll i leveransuppgifterna för att slutföra ordern.') {
    const cartItems = getCartItems();
    const summary = getCartSummary();

    renderCheckoutCart(cartContainer, cartItems);
    renderCartSummary(summaryContainer, summary, { helperText });

    if (totalElement) {
      totalElement.textContent = formatPrice(summary.totalPrice);
    }

    if (submitButton) {
      submitButton.disabled = cartItems.length === 0;
    }

    cartContainer?.querySelectorAll('[data-cart-quantity]').forEach((input) => {
      input.addEventListener('change', (event) => {
        const index = Number(event.currentTarget.dataset.cartQuantity);
        const quantity = Number(event.currentTarget.value);
        updateCartItemQuantity(index, quantity);
        renderCheckoutState('Varukorgen uppdaterades.');
      });
    });

    cartContainer?.querySelectorAll('[data-remove-cart-item]').forEach((button) => {
      button.addEventListener('click', () => {
        const index = Number(button.dataset.removeCartItem);
        removeCartItem(index);
        renderCheckoutState('Produkten togs bort från varukorgen.');
      });
    });
  }

  renderCheckoutState();

  fillCheckoutDraft(form);

  clearButton?.addEventListener('click', () => {
    clearCart();
    renderCheckoutState('Varukorgen tömdes.');
    if (feedback) {
      feedback.textContent = 'Varukorgen tömdes. Lägg till nya produkter från katalogen när du vill fortsätta.';
    }
  });

  form?.addEventListener('input', () => {
    saveCheckoutDraft(form);
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const orderData = getOrderPayload(form);
    const errors = validateOrderPayload(orderData);

    if (errors.length > 0) {
      if (feedback) {
        feedback.textContent = errors[0];
      }
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Skickar order...';
    }

    if (feedback) {
      feedback.textContent = 'Ordern skickas till JokerFashion-teamet...';
    }

    try {
      await sendOrderEmail(orderData);
      clearCart();
      clearCheckoutDraft();
      form.reset();
      renderCheckoutState('Ordern skickades och varukorgen tömdes.');

      if (feedback) {
        feedback.textContent = 'Tack! Din order skickades och checkout-flödet i den nya shoppen fungerar nu hela vägen till API:t.';
      }
    } catch (error) {
      if (feedback) {
        feedback.textContent = error.message || 'Det gick inte att skicka ordern.';
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = getCartItems().length === 0;
        submitButton.textContent = 'Skicka order';
      }
    }
  });
}
