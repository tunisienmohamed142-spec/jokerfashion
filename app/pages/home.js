import { renderCartSummary, renderProductGrid, showCartToast } from '../components/renderers.js';
import { buildCatalogUrl, TARGET_GROUPS } from '../data/catalog.js';
import { addCartItem, getCartSummary, getCatalogCategories, getCatalogProducts, getHomepageContent } from '../state/store.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sanitizeImageUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

const categoryIcons = {
  kvinna: '👗',
  man: '🧥',
  barn: '🎒',
};

function renderCategoryCards(container, categories) {
  if (!container) {
    return;
  }

  container.innerHTML = categories
    .map(
      (targetGroup) => {
        const imageUrl = sanitizeImageUrl(targetGroup.image);
        return `
      <a class="category-card" href="${buildCatalogUrl({ targetGroupId: targetGroup.id })}">
        ${
          imageUrl
            ? `<img class="category-card-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(targetGroup.name)}" loading="lazy" />`
            : `<span class="category-card-icon" aria-hidden="true">${categoryIcons[targetGroup.id] || targetGroup.icon || '🛍️'}</span>`
        }
        <h3>${escapeHtml(targetGroup.name)}</h3>
        <p>${escapeHtml(targetGroup.description)}</p>
      </a>
    `;
      }
    )
    .join('');
}

function renderHomeCart(container, helperText = 'Din varukorg följer med dig hela vägen till checkout.') {
  renderCartSummary(container, getCartSummary(), { helperText });
}

function setElementText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value) {
    element.textContent = value;
  }
}

function setElementLink(selector, label, href) {
  const element = document.querySelector(selector);
  if (!element) {
    return;
  }

  if (label) {
    element.textContent = label;
  }
  if (href) {
    element.setAttribute('href', href);
  }
}

function applyHomepageContent(content) {
  setElementText('[data-home-hero-eyebrow]', content.hero.eyebrow);
  setElementText('[data-home-hero-title]', content.hero.title);
  setElementText('[data-home-hero-body]', content.hero.body);
  setElementLink('[data-home-hero-primary]', content.hero.primaryCtaLabel, content.hero.primaryCtaHref);
  setElementLink('[data-home-hero-secondary]', content.hero.secondaryCtaLabel, content.hero.secondaryCtaHref);

  setElementText('[data-home-highlight-eyebrow]', content.highlight.eyebrow);
  setElementText('[data-home-highlight-title]', content.highlight.title);
  setElementText('[data-home-highlight-body]', content.highlight.body);
  setElementLink(
    '[data-home-highlight-primary]',
    content.highlight.primaryCtaLabel,
    content.highlight.primaryCtaHref
  );
  setElementLink(
    '[data-home-highlight-secondary]',
    content.highlight.secondaryCtaLabel,
    content.highlight.secondaryCtaHref
  );

  setElementText('[data-home-categories-eyebrow]', content.categoriesSection.eyebrow);
  setElementText('[data-home-categories-title]', content.categoriesSection.title);

  setElementText('[data-home-featured-eyebrow]', content.featuredSection.eyebrow);
  setElementText('[data-home-featured-title]', content.featuredSection.title);
  setElementLink(
    '[data-home-featured-link]',
    content.featuredSection.ctaLabel,
    content.featuredSection.ctaHref
  );

  setElementText('[data-home-new-arrivals-eyebrow]', content.newArrivalsSection.eyebrow);
  setElementText('[data-home-new-arrivals-title]', content.newArrivalsSection.title);
  setElementLink(
    '[data-home-new-arrivals-link]',
    content.newArrivalsSection.ctaLabel,
    content.newArrivalsSection.ctaHref
  );

  setElementText('[data-home-footer-marketing]', content.footer.marketingLine);
}

function handleAddToCart(event, allProducts, feedbackEl, cartSummaryContainer) {
  const button = event.target.closest('[data-add-to-cart]');
  if (!button) {
    return;
  }

  const productId = String(button.dataset.addToCart || '');
  const product = allProducts.find((p) => p.id === productId);
  if (!product) {
    return;
  }

  const size = product.sizes?.[0] || 'One size';
  addCartItem({
    productId: product.id,
    name: product.name,
    category: product.category,
    image: product.image,
    size,
    quantity: 1,
    priceSek: product.priceSek,
  });

  renderHomeCart(cartSummaryContainer, `${product.name} lades till i varukorgen.`);
  showCartToast(product.name);

  if (feedbackEl) {
    feedbackEl.textContent = `${product.name} (${size}) tillagd. Gå till varukorgen när du vill checka ut.`;
  }
}

export async function initHomePage() {
  const [categories, allProducts, homepageContent] = await Promise.all([
    getCatalogCategories(),
    getCatalogProducts(),
    getHomepageContent(),
  ]);

  const featuredProducts = allProducts.filter((p) => p.isFeatured).slice(0, 4);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : allProducts.slice(0, 4);
  const newArrivals = allProducts.filter((p) => p.isNew).slice(0, 4);

  const cartSummaryContainer = document.querySelector('[data-home-cart-summary]');
  const feedback = document.querySelector('[data-home-feedback]');
  const featuredGrid = document.querySelector('[data-home-featured-products]');
  const newArrivalsGrid = document.querySelector('[data-home-new-arrivals]');
  const categoryCardsContainer = document.querySelector('[data-home-category-cards]');

  applyHomepageContent(homepageContent);
  renderCategoryCards(categoryCardsContainer, TARGET_GROUPS);
  renderProductGrid(featuredGrid, displayProducts, {
    enableQuickAdd: true,
    quickAddLabel: 'Snabbköp',
    categories,
  });

  if (newArrivalsGrid) {
    renderProductGrid(newArrivalsGrid, newArrivals, {
      enableQuickAdd: true,
      quickAddLabel: 'Snabbköp',
      categories,
    });
  }

  renderHomeCart(cartSummaryContainer);

  const addToCartHandler = (event) => handleAddToCart(event, allProducts, feedback, cartSummaryContainer);
  featuredGrid?.addEventListener('click', addToCartHandler);
  newArrivalsGrid?.addEventListener('click', addToCartHandler);
}
