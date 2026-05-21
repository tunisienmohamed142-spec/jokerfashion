import { buildCatalogUrl, formatTaxonomyPath, getCategoryById, resolveProductTaxonomy } from '../data/catalog.js';

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

export function formatPrice(priceSek) {
  return `${new Intl.NumberFormat('sv-SE').format(priceSek)} kr`;
}

export function renderCategoryPills(container, categories, activeCategoryId, options = {}) {
  if (!container) {
    return;
  }

  const getHref = options.getHref || ((category) => buildCatalogUrl({ mainCategoryId: category.id }));
  const getLabel = options.getLabel || ((category) => category.name);
  const pillClassName = options.pillClassName || 'pill';

  container.innerHTML = categories
    .map(
      (category) => `
      <a class="${pillClassName} ${category.id === activeCategoryId ? 'is-active' : ''}" href="${escapeHtml(getHref(category))}">
        <span>${escapeHtml(getLabel(category))}</span>
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
      const taxonomy = resolveProductTaxonomy(product, options.categories);
      const category = getCategoryById(taxonomy.subcategoryId || product.category, options.categories);
      const categoryName = formatTaxonomyPath(taxonomy, { includeTargetGroup: true, separator: ' • ' }) || category?.name || 'Övrigt';
      const detailUrl = `product.html?id=${encodeURIComponent(product.id)}`;
      const description = product.description || 'Mer produktdetaljer visas i spotlight-läget.';
      const imageUrl = sanitizeImageUrl(product.image);
      const isActive = product.id === options.activeProductId;
      const quickAddLabel = options.quickAddLabel || 'Lägg i varukorg';

      const effectiveBadge = product.salePriceSek ? 'REA' : (product.badge || '');
      const badgeHtml = effectiveBadge
        ? `<span class="product-badge product-badge--${escapeHtml(effectiveBadge.toLowerCase())}">${escapeHtml(effectiveBadge)}</span>`
        : '';

      const priceHtml = product.salePriceSek
        ? `<p class="price"><span class="price-sale">${formatPrice(product.salePriceSek)}</span> <s class="price-original">${formatPrice(product.priceSek)}</s></p>`
        : `<p class="price">${formatPrice(product.priceSek)}</p>`;

      return `
        <article class="product-card ${isActive ? 'is-active' : ''}">
          <div class="product-image-wrap">
            <img src="${imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" />
            ${badgeHtml}
          </div>
          <div class="product-copy">
            <p class="meta">${escapeHtml(categoryName)}</p>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(description)}</p>
            ${priceHtml}
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

export function renderProductSpotlight(container, product, options = {}) {
  if (!container) {
    return;
  }

  if (!product) {
    container.innerHTML = '<p class="empty-state">Välj en produkt för att se detaljer, storlekar och köpknappar.</p>';
    return;
  }

  const category = getCategoryById(product.category, options.categories);
  const taxonomy = resolveProductTaxonomy(product, options.categories);
  const categoryName = formatTaxonomyPath(taxonomy, { includeTargetGroup: true, separator: ' • ' }) || category?.name || 'Övrigt';
  const imageUrl = sanitizeImageUrl(product.image);
  const sizeOptions = (product.sizes || ['One size'])
    .map((size) => `<option value="${escapeHtml(size)}">${escapeHtml(size)}</option>`)
    .join('');
  const highlights = (product.highlights || [])
    .map((highlight) => `<li>${escapeHtml(highlight)}</li>`)
    .join('');

  const effectiveBadge = product.salePriceSek ? 'REA' : (product.badge || '');
  const priceHtml = product.salePriceSek
    ? `<p class="price spotlight-price"><span class="price-sale">${formatPrice(product.salePriceSek)}</span> <s class="price-original">${formatPrice(product.priceSek)}</s></p>`
    : `<p class="price spotlight-price">${formatPrice(product.priceSek)}</p>`;

  container.innerHTML = `
    <div class="spotlight-media">
      <img src="${imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" />
    </div>
    <div class="spotlight-copy">
      <p class="eyebrow">${escapeHtml(categoryName)} • ${escapeHtml(effectiveBadge || 'Shop')}</p>
      <h2>${escapeHtml(product.name)}</h2>
      <p class="spotlight-story">${escapeHtml(product.story || product.description || '')}</p>
      <p>${escapeHtml(product.description || '')}</p>
      <ul class="spotlight-list">${highlights}</ul>
      ${priceHtml}
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
  const hasShippingDetails =
    Number.isFinite(Number(summary.subtotalPrice)) && Number.isFinite(Number(summary.shippingPrice));
  const summaryMarkup = hasShippingDetails
    ? `
      <div>
        <p>Subtotal: ${formatPrice(summary.subtotalPrice)}</p>
        <p>Frakt: ${summary.freeShippingApplied ? `Gratis (${formatPrice(summary.shippingRate)})` : formatPrice(summary.shippingPrice)}</p>
        <p class="price">Totalt: ${formatPrice(summary.totalPrice)}</p>
      </div>
    `
    : `<p class="price">${formatPrice(summary.totalPrice)}</p>`;

  container.innerHTML = `
    <p class="eyebrow">Varukorg</p>
    <h2>${summary.itemCount} ${itemLabel}</h2>
    ${summaryMarkup}
    <p>${escapeHtml(helperText)}</p>
    <div class="panel-actions">
      <a class="button primary" href="checkout.html">Öppna checkout</a>
      <a class="button secondary" href="catalog.html">Fortsätt handla</a>
    </div>
  `;
}

export function renderCheckoutCart(container, cartItems, options = {}) {
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
      (item, index) => {
        const taxonomy = resolveProductTaxonomy(item, options.categories);
        const itemCategoryLabel =
          formatTaxonomyPath(taxonomy, { includeTargetGroup: true, separator: ' • ' }) ||
          getCategoryById(item.category, options.categories)?.name ||
          item.category;
        const itemPriceHtml = item.compareAtPriceSek
          ? `<span class="price-sale">${formatPrice(item.priceSek * item.quantity)}</span> <s class="price-original">${formatPrice(item.compareAtPriceSek * item.quantity)}</s>`
          : formatPrice(item.priceSek * item.quantity);
        return `
        <article class="checkout-item">
          <img class="checkout-item-image" src="${sanitizeImageUrl(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />
          <div class="checkout-item-copy">
            <p class="meta">${escapeHtml(itemCategoryLabel || 'Övrigt')}</p>
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
          <p class="price">${itemPriceHtml}</p>
        </article>
      `;
      }
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
