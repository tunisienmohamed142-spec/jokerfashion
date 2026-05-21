import { renderCartSummary, renderCategoryPills, renderProductGrid, showCartToast } from '../components/renderers.js';
import { addCartItem, getCartSummary, getCatalogCategories, getCatalogProducts } from '../state/store.js';

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
  women: '👗',
  men: '🧥',
  kids: '🎒',
  accessories: '👜',
};

function renderCategoryCards(container, categories) {
  if (!container) {
    return;
  }

  container.innerHTML = categories
    .map(
      (category) => {
        const imageUrl = sanitizeImageUrl(category.image);
        return `
      <a class="category-card" href="catalog.html?category=${encodeURIComponent(category.id)}">
        ${
          imageUrl
            ? `<img class="category-card-image" src="${escapeHtml(imageUrl)}" alt="${escapeHtml(category.name)}" loading="lazy" />`
            : `<span class="category-card-icon" aria-hidden="true">${categoryIcons[category.id] || category.icon || '🛍️'}</span>`
        }
        <h3>${escapeHtml(category.name)}</h3>
        <p>${escapeHtml(category.description)}</p>
      </a>
    `;
      }
    )
    .join('');
}

function renderHomeCart(container, helperText = 'Din varukorg följer med dig hela vägen till checkout.') {
  renderCartSummary(container, getCartSummary(), { helperText });
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
  const categories = await getCatalogCategories();
  const allProducts = await getCatalogProducts();

  const featuredProducts = allProducts.filter((p) => p.isFeatured).slice(0, 4);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : allProducts.slice(0, 4);
  const newArrivals = allProducts.filter((p) => p.isNew).slice(0, 4);

  const cartSummaryContainer = document.querySelector('[data-home-cart-summary]');
  const feedback = document.querySelector('[data-home-feedback]');
  const featuredGrid = document.querySelector('[data-home-featured-products]');
  const newArrivalsGrid = document.querySelector('[data-home-new-arrivals]');
  const categoryCardsContainer = document.querySelector('[data-home-category-cards]');

  renderCategoryCards(categoryCardsContainer, categories);
  renderCategoryPills(document.querySelector('[data-home-categories]'), categories);
  renderProductGrid(featuredGrid, displayProducts, { enableQuickAdd: true, quickAddLabel: 'Snabbköp' });

  if (newArrivalsGrid) {
    renderProductGrid(newArrivalsGrid, newArrivals, { enableQuickAdd: true, quickAddLabel: 'Snabbköp' });
  }

  renderHomeCart(cartSummaryContainer);

  const addToCartHandler = (event) => handleAddToCart(event, allProducts, feedback, cartSummaryContainer);
  featuredGrid?.addEventListener('click', addToCartHandler);
  newArrivalsGrid?.addEventListener('click', addToCartHandler);
}
