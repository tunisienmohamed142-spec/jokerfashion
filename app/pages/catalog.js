import { renderCartSummary, renderCategoryPills, renderProductGrid, renderProductSpotlight } from '../components/renderers.js';
import { getCategoryById } from '../data/catalog.js';
import { addCartItem, getCartSummary, getCatalogCategories, getCatalogProductById, getCatalogProducts } from '../state/store.js';

function getActiveCategoryId(categories) {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('category');
  return categories.some((category) => category.id === fromQuery) ? fromQuery : categories[0]?.id;
}

function getActiveProduct(products, activeCategoryId) {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  const selectedProduct = productId ? getCatalogProductById(productId) : null;

  if (selectedProduct && selectedProduct.category === activeCategoryId) {
    return selectedProduct;
  }

  return products[0] || null;
}

export function initCatalogPage() {
  const categories = getCatalogCategories();
  const activeCategoryId = getActiveCategoryId(categories);
  const activeCategory = getCategoryById(activeCategoryId);

  const products = getCatalogProducts().filter((product) => product.category === activeCategoryId);
  const activeProduct = getActiveProduct(products, activeCategoryId);

  const heading = document.querySelector('[data-catalog-heading]');
  const intro = document.querySelector('[data-catalog-intro]');
  const feedback = document.querySelector('[data-catalog-feedback]');
  const spotlightContainer = document.querySelector('[data-catalog-spotlight]');

  if (heading && activeCategory) {
    heading.textContent = activeCategory.name;
  }

  if (intro && activeCategory) {
    intro.textContent = activeCategory.description;
  }

  renderCategoryPills(document.querySelector('[data-catalog-categories]'), categories, activeCategoryId);
  renderProductGrid(document.querySelector('[data-catalog-grid]'), products, { activeProductId: activeProduct?.id });
  renderProductSpotlight(spotlightContainer, activeProduct);
  renderCartSummary(document.querySelector('[data-catalog-cart-summary]'), getCartSummary(), {
    helperText: activeProduct
      ? `Lägg ${activeProduct.name} i varukorgen och fortsätt sedan till checkout.`
      : 'Välj en produkt för att börja shoppa.',
  });

  spotlightContainer?.querySelector('[data-product-form]')?.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!activeProduct) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const quantity = Math.max(1, Number(formData.get('quantity')) || 1);
    const size = String(formData.get('size') || activeProduct.sizes?.[0] || 'One size');

    addCartItem({
      productId: activeProduct.id,
      name: activeProduct.name,
      category: activeProduct.category,
      image: activeProduct.image,
      size,
      quantity,
      priceSek: activeProduct.priceSek,
    });

    renderCartSummary(document.querySelector('[data-catalog-cart-summary]'), getCartSummary(), {
      helperText: `${activeProduct.name} (${size}) lades till i varukorgen.`,
    });

    if (feedback) {
      feedback.textContent = `${activeProduct.name} lades till i varukorgen. Du kan fortsätta handla eller gå direkt till checkout.`;
    }
  });
}
