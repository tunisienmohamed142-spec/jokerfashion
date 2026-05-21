import { renderProductGrid, showCartToast } from '../components/renderers.js';
import { addCartItem, getCatalogCategories, getCatalogProducts, getHomepageContent } from '../state/store.js';

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

function setFooterSocialLink(selector, href) {
  const element = document.querySelector(selector);
  if (!element || !href) {
    return;
  }
  element.setAttribute('href', href);
}

function applyHomepageContent(content) {
  setElementText('[data-home-hero-eyebrow]', content.hero.eyebrow);
  setElementText('[data-home-hero-title]', content.hero.title);
  setElementText('[data-home-hero-body]', content.hero.body);
  setElementLink('[data-home-hero-primary]', content.hero.primaryCtaLabel, content.hero.primaryCtaHref);
  setElementLink('[data-home-hero-secondary]', content.hero.secondaryCtaLabel, content.hero.secondaryCtaHref);

  setElementText('[data-home-featured-eyebrow]', content.featuredSection.eyebrow);
  setElementText('[data-home-featured-title]', content.featuredSection.title);

  setElementText('[data-home-follow-title]', content.footer.followTitle);
  setFooterSocialLink('[data-home-instagram-link]', content.footer.instagramUrl);
  setFooterSocialLink('[data-home-tiktok-link]', content.footer.tiktokUrl);
}

function handleAddToCart(event, allProducts, feedbackEl) {
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

  const feedback = document.querySelector('[data-home-feedback]');
  const featuredGrid = document.querySelector('[data-home-featured-products]');

  applyHomepageContent(homepageContent);
  renderProductGrid(featuredGrid, displayProducts, {
    enableQuickAdd: true,
    quickAddLabel: 'Lägg i varukorg',
    categories,
  });

  const addToCartHandler = (event) => handleAddToCart(event, allProducts, feedback);
  featuredGrid?.addEventListener('click', addToCartHandler);
}
