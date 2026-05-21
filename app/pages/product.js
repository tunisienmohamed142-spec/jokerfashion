import { formatPrice, renderProductGrid } from '../components/renderers.js';
import { addCartItem, getCatalogCategories, getCatalogProductById, getCatalogProducts } from '../state/store.js';
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
    const parsed = new URL(String(url));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function showCartToast(productName) {
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
  closeBtn?.addEventListener('click', () => {
    clearTimeout(toastTimer);
    toast.classList.add('is-hidden');
  }, { once: true });
}

function renderProductDetail(container, product, categories) {
  const category = getCategoryById(product.category, categories);
  const taxonomy = resolveProductTaxonomy(product, categories);
  const categoryName = formatTaxonomyPath(taxonomy, { includeTargetGroup: true, separator: ' • ' }) || category?.name || 'Övrigt';
  const imageUrl = sanitizeImageUrl(product.image);

  const sizeButtons = (product.sizes || ['One size'])
    .map((size, index) => `
      <button
        class="size-option${index === 0 ? ' is-selected' : ''}"
        type="button"
        data-size="${escapeHtml(size)}"
      >${escapeHtml(size)}</button>
    `)
    .join('');

  const highlights = (product.highlights || [])
    .map((h) => `<li>${escapeHtml(h)}</li>`)
    .join('');

  const effectiveBadge = product.salePriceSek ? 'REA' : (product.badge || '');
  const badgeHtml = effectiveBadge
    ? `<span class="product-badge product-badge--${escapeHtml(effectiveBadge.toLowerCase())}">${escapeHtml(effectiveBadge)}</span>`
    : '';

  const priceHtml = product.salePriceSek
    ? `<p class="product-detail-price"><span class="price-sale">${formatPrice(product.salePriceSek)}</span> <s class="price-original">${formatPrice(product.priceSek)}</s></p>`
    : `<p class="product-detail-price">${formatPrice(product.priceSek)}</p>`;

  container.innerHTML = `
    <div class="product-detail-grid">
      <div class="product-detail-media">
        <img src="${imageUrl}" alt="${escapeHtml(product.name)}" loading="eager" />
        ${badgeHtml ? `<div class="product-detail-badge-wrap">${badgeHtml}</div>` : ''}
      </div>

      <div class="product-detail-copy">
        <div>
          <p class="eyebrow">${escapeHtml(categoryName)} &bull; ${escapeHtml(effectiveBadge || 'Shop')}</p>
          <h1>${escapeHtml(product.name)}</h1>
        </div>

        ${priceHtml}

        <p class="product-detail-story">${escapeHtml(product.story || product.description || '')}</p>

        ${highlights ? `
          <ul class="product-detail-highlights">${highlights}</ul>
        ` : ''}

        <form class="product-detail-form" data-product-buy-form>
          <div>
            <p class="size-label">Storlek</p>
            <div class="size-options" data-size-options>${sizeButtons}</div>
          </div>

          <div class="qty-row">
            <button class="qty-btn" type="button" data-qty-dec aria-label="Minska antal">−</button>
            <span class="qty-display" data-qty-display>1</span>
            <button class="qty-btn" type="button" data-qty-inc aria-label="Öka antal">+</button>
            <span class="small-note">antal</span>
          </div>

          <div style="display:grid;gap:0.6rem;">
            <button class="button primary" type="submit" style="font-size:1rem;padding:0.8rem 1.5rem;">
              Lägg i varukorg
            </button>
            <a class="button secondary" href="checkout.html" style="text-align:center;">Gå till varukorg</a>
          </div>

          <div class="delivery-strip">
            <span><strong>Fri frakt</strong> över 999 kr</span>
            <span><strong>2–4 dagar</strong> leverans</span>
            <span><strong>14 dagar</strong> öppet köp</span>
          </div>

          <p class="notice" data-product-feedback></p>
        </form>
      </div>
    </div>
  `;
}

export async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const product = productId ? await getCatalogProductById(productId) : null;
  const categories = await getCatalogCategories();

  const detailContainer = document.querySelector('[data-product-detail]');
  const relatedSection = document.querySelector('[data-product-related-section]');
  const relatedGrid = document.querySelector('[data-product-related]');
  const breadcrumbName = document.querySelector('[data-product-breadcrumb-name]');
  const categoryLink = document.querySelector('[data-product-category-link]');
  const catalogLink = document.querySelector('[data-product-catalog-link]');

  if (!product) {
    if (detailContainer) {
      detailContainer.innerHTML = `
        <div class="empty-state">
          <p>Produkten hittades inte. Gå tillbaka till katalogen för att hitta något du gillar.</p>
          <a class="button primary" href="catalog.html" style="margin-top:1rem;">Till katalogen</a>
        </div>
      `;
    }

    document.title = 'Produkt hittades inte | JokerFashion';
    return;
  }

  document.title = `${product.name} | JokerFashion`;

  const category = getCategoryById(product.category, categories);
  const taxonomy = resolveProductTaxonomy(product, categories);
  const categoryName =
    formatTaxonomyPath(taxonomy, { includeTargetGroup: true, separator: ' / ' }) || category?.name || 'Katalog';
  const categoryUrl = buildCatalogUrl({
    targetGroupId: taxonomy.targetGroupId,
    mainCategoryId: taxonomy.mainCategoryId,
    subcategoryId: taxonomy.subcategoryId,
  });

  if (breadcrumbName) {
    breadcrumbName.textContent = product.name;
  }

  if (categoryLink) {
    categoryLink.href = categoryUrl;
    categoryLink.textContent = categoryName;
  }

  if (catalogLink) {
    catalogLink.href = categoryUrl;
  }

  document.querySelectorAll('[data-target-link]').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('data-target-link') === taxonomy.targetGroupId);
  });

  if (detailContainer) {
    renderProductDetail(detailContainer, product, categories);
  }

  // Size selection
  const sizeOptions = detailContainer?.querySelector('[data-size-options]');
  let selectedSize = product.sizes?.[0] || 'One size';

  sizeOptions?.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-size]');
    if (!btn) {
      return;
    }

    sizeOptions.querySelectorAll('.size-option').forEach((b) => b.classList.remove('is-selected'));
    btn.classList.add('is-selected');
    selectedSize = btn.dataset.size;
  });

  // Quantity stepper
  let quantity = 1;
  const qtyDisplay = detailContainer?.querySelector('[data-qty-display]');

  detailContainer?.querySelector('[data-qty-dec]')?.addEventListener('click', () => {
    if (quantity > 1) {
      quantity--;
      if (qtyDisplay) qtyDisplay.textContent = String(quantity);
    }
  });

  detailContainer?.querySelector('[data-qty-inc]')?.addEventListener('click', () => {
    quantity++;
    if (qtyDisplay) qtyDisplay.textContent = String(quantity);
  });

  // Add to cart
  const form = detailContainer?.querySelector('[data-product-buy-form]');
  const feedback = detailContainer?.querySelector('[data-product-feedback]');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    addCartItem({
      productId: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      size: selectedSize,
      quantity,
      priceSek: product.priceSek,
      salePriceSek: product.salePriceSek || null,
    });

    if (feedback) {
      feedback.textContent = `${product.name} (${selectedSize}) &times; ${quantity} lades till i varukorgen.`;
    }

    showCartToast(product.name);
  });

  // Related products (same category, excluding current)
  const allProducts = await getCatalogProducts();
  const related = allProducts
    .filter((candidate) => {
      if (candidate.id === product.id) {
        return false;
      }

      const candidateTaxonomy = resolveProductTaxonomy(candidate, categories);
      return candidateTaxonomy.subcategoryId === taxonomy.subcategoryId;
    })
    .slice(0, 4);

  if (related.length > 0 && relatedSection && relatedGrid) {
    relatedSection.style.display = '';
    renderProductGrid(relatedGrid, related, { enableQuickAdd: false, categories });

    // Make related product cards link to product detail
    relatedGrid.querySelectorAll('.product-card .button.secondary').forEach((btn) => {
      const href = btn.getAttribute('href');
      if (href && href.includes('catalog.html?')) {
        const relParams = new URLSearchParams(href.split('?')[1] || '');
        const relId = relParams.get('product');
        if (relId) {
          btn.href = `product.html?id=${encodeURIComponent(relId)}`;
          btn.textContent = 'Se produkt';
        }
      }
    });
  }
}
