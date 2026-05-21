import {
  formatPrice,
  renderCartSummary,
  renderCheckoutCart,
} from '../components/renderers.js';
import {
  DEFAULT_SHOP_SETTINGS,
  calculateCartTotals,
  clearCart,
  clearCheckoutDraft,
  getCartItems,
  getCheckoutDraft,
  getShopSettings,
  normalizeShopSettings,
  removeCartItem,
  setCheckoutDraft,
  updateCartItemQuantity,
} from '../state/store.js';

function getOrderPayload(form, pricing, settings) {
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
    subtotalPrice: pricing.subtotalPrice,
    shippingPrice: pricing.shippingPrice,
    totalPrice: pricing.totalPrice,
    currency: pricing.currency,
    shopSettings: {
      shippingRate: settings.shippingRate,
      freeShippingThreshold: settings.freeShippingThreshold,
      taxRate: settings.taxRate,
      currency: settings.currency,
    },
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

function setCheckoutStep(stepNumber) {
  document.querySelectorAll('[data-checkout-step]').forEach((el) => {
    const step = Number(el.dataset.checkoutStep);
    el.classList.remove('is-active', 'is-done');

    if (step < stepNumber) {
      el.classList.add('is-done');
      const num = el.querySelector('.checkout-step-num');
      if (num) num.textContent = '✓';
    } else if (step === stepNumber) {
      el.classList.add('is-active');
    }
  });
}

function showOrderSuccess(orderData) {
  const successSection = document.querySelector('[data-checkout-success]');
  const mainSection = document.querySelector('[data-checkout-main]');
  const itemSummary = document.querySelector('[data-order-success-items]');

  if (mainSection) {
    mainSection.style.display = 'none';
  }

  if (successSection) {
    successSection.style.display = '';
  }

  if (itemSummary && orderData) {
    const itemCount = orderData.items.reduce((sum, item) => sum + item.quantity, 0);
    const itemLabel = itemCount === 1 ? 'produkt' : 'produkter';
    itemSummary.textContent = `${itemCount} ${itemLabel} för totalt ${formatPrice(orderData.totalPrice, orderData.currency)} är nu på väg till oss.`;
  }

  setCheckoutStep(3);
}

export function initCheckoutPage() {
  const cartContainer = document.querySelector('[data-checkout-cart]');
  const summaryContainer = document.querySelector('[data-checkout-summary]');
  const form = document.querySelector('[data-checkout-form]');
  const feedback = document.querySelector('[data-checkout-feedback]');
  const totalElement = document.querySelector('[data-checkout-total]');
  const shippingStripElement = document.querySelector('[data-checkout-shipping-message]');
  const shippingFooterElement = document.querySelector('[data-checkout-footer-shipping]');
  const clearButton = document.querySelector('[data-clear-cart]');
  const submitButton = form?.querySelector('[type="submit"]');
  let shopSettings = normalizeShopSettings(DEFAULT_SHOP_SETTINGS);

  function updateShippingMessaging(pricing) {
    const freeShippingLabel = pricing.freeShippingThreshold
      ? `Fri frakt över ${formatPrice(pricing.freeShippingThreshold, pricing.currency)}`
      : 'Fri frakt ej tillgänglig';
    const standardShippingLabel = pricing.shippingRate > 0
      ? `Standardfrakt ${formatPrice(pricing.shippingRate, pricing.currency)}`
      : 'Standardfrakt 0 kr';

    if (shippingStripElement) {
      shippingStripElement.innerHTML = `<strong>${freeShippingLabel}</strong> • ${standardShippingLabel}`;
    }

    if (shippingFooterElement) {
      shippingFooterElement.textContent = freeShippingLabel;
    }
  }

  function renderCheckoutState(helperText = 'Granska din varukorg och fyll i leveransuppgifterna för att slutföra ordern.') {
    const cartItems = getCartItems();
    const pricing = calculateCartTotals(cartItems, shopSettings);
    const summary = {
      itemCount: pricing.itemCount,
      totalPrice: pricing.totalPrice,
    };
    const shippingHelper = pricing.shippingPrice === 0 && pricing.itemCount > 0
      ? 'Frakten är gratis för din order.'
      : `Fraktkostnad ${formatPrice(pricing.shippingPrice, pricing.currency)} läggs till i totalen.`;

    renderCheckoutCart(cartContainer, cartItems);
    renderCartSummary(summaryContainer, summary, {
      helperText: `${helperText} ${shippingHelper}`,
      pricing,
    });

    if (totalElement) {
      totalElement.textContent = formatPrice(pricing.totalPrice, pricing.currency);
    }
    updateShippingMessaging(pricing);

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

  const settingsPromise = getShopSettings()
    .then((settings) => {
      shopSettings = normalizeShopSettings(settings);
    })
    .catch(() => {
      shopSettings = normalizeShopSettings(DEFAULT_SHOP_SETTINGS);
      if (feedback) {
        feedback.textContent = 'Kunde inte läsa butiksinställningar just nu. Standardfrakt används tillfälligt.';
      }
    });

  renderCheckoutState();
  settingsPromise.finally(() => {
    renderCheckoutState('Varukorg och frakt uppdaterade med aktuella butiksinställningar.');
  });

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

    const pricing = calculateCartTotals(getCartItems(), shopSettings);
    const orderData = getOrderPayload(form, pricing, shopSettings);
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
      showOrderSuccess(orderData);
    } catch (error) {
      if (feedback) {
        feedback.textContent = error.message || 'Det gick inte att skicka ordern.';
      }

      if (submitButton) {
        submitButton.disabled = getCartItems().length === 0;
        submitButton.textContent = 'Skicka order';
      }
    }
  });
}
