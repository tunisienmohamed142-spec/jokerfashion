import { getCategoryById } from '../data/catalog.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeImageUrl(url) {
  try {
    const parsedUrl = new URL(String(url));
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:' ? parsedUrl.href : '';
  } catch {
    return '';
  }
}

export function formatPrice(priceSek, currency = 'SEK') {
  const amount = Number.isFinite(Number(priceSek)) ? Number(priceSek) : 0;
  const formattedNumber = new Intl.NumberFormat('sv-SE').format(Math.round(amount));
  return String(currency).toUpperCase() === 'SEK'
    ? `${formattedNumber} kr`
    : `${formattedNumber} ${escapeHtml(currency)}`;
}

export function renderCategoryPills(container, categories, activeCategoryId) {
  if (!container) {
    return;
  }

  container.innerHTML = categories
    .map(
      (category) => `
      <a class="pill ${category.id === activeCategoryId ? 'is-active' : ''}" href="catalog.html?category=${category.id}">
        <span>${category.name}</span>
      </a>
    `
    )
    .join('');
}

export function renderProductGrid(container, products, options = {}) {
  if (!container) {
    return;
  }

  if (!products.length) {
    container.innerHTML = '<p class="empty-state">Inga produkter i den här kategorin ännu.</p>';
    return;
  }

  container.innerHTML = products
    .map((product) => {
      const category = getCategoryById(product.category);
      const categoryName = category ? category.name : 'Övrigt';
      const detailUrl = `product.html?id=${encodeURIComponent(product.id)}`;
      const description = product.description || 'Mer produktdetaljer visas i spotlight-läget.';
      const imageUrl = sanitizeImageUrl(product.image);
      const isActive = product.id === options.activeProductId;
      const quickAddLabel = options.quickAddLabel || 'Lägg i varukorg';

      return `
        <article class="product-card ${isActive ? 'is-active' : ''}">
          <div class="product-image-wrap">
            <img src="${imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" />
            <span class="product-badge">${escapeHtml(product.badge || 'Shop')}</span>
          </div>
          <div class="product-copy">
            <p class="meta">${escapeHtml(categoryName)}</p>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(description)}</p>
            <p class="price">${formatPrice(product.priceSek)}</p>
            <div class="product-card-actions">
              ${options.enableQuickAdd ? `<button class="button primary" type="button" data-add-to-cart="${escapeHtml(product.id)}">${escapeHtml(quickAddLabel)}</button>` : ''}
              <a class="button secondary" href="${detailUrl}">${isActive ? 'Aktiv produkt' : 'Se detaljer'}</a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

export function renderProductSpotlight(container, product) {
  if (!container) {
    return;
  }

  if (!product) {
    container.innerHTML = '<p class="empty-state">Välj en produkt för att se detaljer, storlekar och köpknappar.</p>';
    return;
  }

  const category = getCategoryById(product.category);
  const categoryName = category ? category.name : 'Övrigt';
  const imageUrl = sanitizeImageUrl(product.image);
  const sizeOptions = (product.sizes || ['One size'])
    .map((size) => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`)
    .join('');
  const highlights = (product.highlights || [])
    .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
    .join('');

  container.innerHTML = `
    <div class="spotlight-media">
      <img src="${imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" />
    </div>
    <div class="spotlight-copy">
      <p class="eyebrow">${escapeHtml(categoryName)} • ${escapeHtml(product.badge || 'Shop')}</p>
      <h2>${escapeHtml(product.name)}</h2>
      <p class="spotlight-story">${escapeHtml(product.story || product.description || '')}</p>
      <p>${escapeHtml(product.description || '')}</p>
      <ul class="spotlight-list">${highlights}</ul>
      <p class="price spotlight-price">${formatPrice(product.priceSek)}</p>
      <form class="spotlight-form" data-product-form>
        <div>
          <label for="product-size">Storlek</label>
          <select id="product-size" name="size">${sizeOptions}</select>
        </div>
        <div>
          <label for="product-quantity">Antal</label>
          <input id="product-quantity" name="quantity" type="number" min="1" value="1" inputmode="numeric" />
        </div>
        <div class="spotlight-actions">
          <button class="button primary" type="submit">Lägg i varukorg</button>
          <a class="button secondary" href="product.html?id=${encodeURIComponent(product.id)}">Se fullständig produktsida</a>
        </div>
      </form>
    </div>
  `;
}

export function renderCartSummary(container, summary, options = {}) {
  if (!container) {
    return;
  }

  const itemLabel = summary.itemCount === 1 ? 'produkt' : 'produkter';
  const helperText = options.helperText || 'Fortsätt till checkout när du är redo att skicka ordern.';
  const pricing = options.pricing || null;
  const currency = pricing?.currency || options.currency || 'SEK';
  const hasPricingBreakdown = Boolean(pricing);
  const shippingText = pricing
    ? pricing.shippingPrice === 0
      ? 'Fri frakt'
      : formatPrice(pricing.shippingPrice, currency)
    : '';
  const shippingNote = pricing?.freeShippingThreshold
    ? pricing.qualifiesForFreeShipping
      ? `Fri frakt över ${formatPrice(pricing.freeShippingThreshold, currency)} aktiverad.`
      : `Fri frakt från ${formatPrice(pricing.freeShippingThreshold, currency)}.`
    : '';
  const summaryPriceMarkup = hasPricingBreakdown
    ? `
      <div class="summary-breakdown">
        <p><span>Delsumma</span><strong>${formatPrice(pricing.subtotalPrice, currency)}</strong></p>
        <p><span>Frakt</span><strong>${shippingText}</strong></p>
        <p class="summary-total"><span>Totalt</span><strong>${formatPrice(pricing.totalPrice, currency)}</strong></p>
      </div>
    `
    : `<p class="price">${formatPrice(summary.totalPrice, currency)}</p>`;

  container.innerHTML = `
    <p class="eyebrow">Varukorg</p>
    <h2>${summary.itemCount} ${itemLabel}</h2>
    ${summaryPriceMarkup}
    ${shippingNote ? `<p class="small-note">${escapeHtml(shippingNote)}</p>` : ''}
    <p>${escapeHtml(helperText)}</p>
    <div class="panel-actions">
      <a class="button primary" href="checkout.html">Öppna checkout</a>
      <a class="button secondary" href="catalog.html">Fortsätt handla</a>
    </div>
  `;
}

export function renderCheckoutCart(container, cartItems) {
  if (!container) {
    return;
  }

  if (!cartItems.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Varukorgen är tom. Lägg till produkter från katalogen för att fortsätta till orderflödet.</p>
        <a class="button primary" href="catalog.html">Till katalogen</a>
      </div>
    `;
    return;
  }

  container.innerHTML = cartItems
    .map(
      (item, index) => `
        <article class="checkout-item">
          <img class="checkout-item-image" src="${sanitizeImageUrl(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />
          <div class="checkout-item-copy">
            <p class="meta">${escapeHtml(getCategoryById(item.category)?.name || item.category)}</p>
            <h3>${escapeHtml(item.name)}</h3>
            <p class="small-note">Storlek: ${escapeHtml(item.size || 'One size')}</p>
            <div class="checkout-item-controls">
              <label>
                Antal
                <input
                  type="number"
                  min="1"
                  value="${item.quantity}"
                  data-cart-quantity="${index}"
                  inputmode="numeric"
                />
              </label>
              <button class="button secondary" type="button" data-remove-cart-item="${index}">Ta bort</button>
            </div>
          </div>
          <p class="price">${formatPrice(item.priceSek * item.quantity)}</p>
        </article>
      `
    )
    .join('');
}

export function renderRouteCards(container, routes) {
  if (!container) {
    return;
  }

  container.innerHTML = routes
    .map(
      (route) => `
      <article class="route-card">
        <h3>${escapeHtml(route.title)}</h3>
        <p>${escapeHtml(route.description)}</p>
        <a class="text-link" href="${route.href}">${route.cta}</a>
      </article>
    `
    )
    .join('');
}

export function syncCartCountBadges(count) {
  document.querySelectorAll('[data-cart-count]').forEach((badge) => {
    badge.textContent = String(count);
  });
}

export function showCartToast(productName) {
  const toast = document.querySelector('[data-cart-toast]');
  const toastText = document.querySelector('[data-cart-toast-text]');
  if (!toast) {
    return;
  }

  if (toastText) {
    toastText.textContent = `${productName} lades till i varukorgen.`;
  }

  toast.classList.remove('is-hidden');
  let toastTimer = setTimeout(() => toast.classList.add('is-hidden'), 3500);

  const closeBtn = toast.querySelector('[data-cart-toast-close]');
  if (closeBtn) {
    const handler = () => {
      clearTimeout(toastTimer);
      toast.classList.add('is-hidden');
    };

    closeBtn.addEventListener('click', handler, { once: true });
  }
}
