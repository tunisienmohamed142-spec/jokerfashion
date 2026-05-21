import { renderCartSummary, renderCategoryPills, renderProductGrid, renderProductSpotlight, showCartToast } from '../components/renderers.js';
import { getCategoryById } from '../data/catalog.js';
import { addCartItem, getCartSummary, getCatalogCategories, getCatalogProducts } from '../state/store.js';

function getActiveCategoryId(categories) {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('category');
  return categories.some((category) => category.id === fromQuery) ? fromQuery : categories[0]?.id;
}

function getActiveProductFromList(products, activeCategoryId) {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  const selectedProduct = productId ? products.find((p) => p.id === productId) : null;

  if (selectedProduct && selectedProduct.category === activeCategoryId) {
    return selectedProduct;
  }

  return products[0] || null;
}

function sortProducts(products, sortValue) {
  const sorted = [...products];

  if (sortValue === 'price-asc') {
    sorted.sort((a, b) => a.priceSek - b.priceSek);
  } else if (sortValue === 'price-desc') {
    sorted.sort((a, b) => b.priceSek - a.priceSek);
  } else if (sortValue === 'name-asc') {
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'sv'));
  } else if (sortValue === 'new') {
    sorted.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  }

  return sorted;
}

export async function initCatalogPage() {
  const categories = await getCatalogCategories();
  const activeCategoryId = getActiveCategoryId(categories);
  const activeCategory = getCategoryById(activeCategoryId);

  const allProducts = await getCatalogProducts();
  const allCategoryProducts = allProducts.filter((product) => product.category === activeCategoryId);
  const activeProduct = getActiveProductFromList(allCategoryProducts, activeCategoryId);

  const heading = document.querySelector('[data-catalog-heading]');
  const intro = document.querySelector('[data-catalog-intro]');
  const productCount = document.querySelector('[data-catalog-product-count]');
  const feedback = document.querySelector('[data-catalog-feedback]');
  const grid = document.querySelector('[data-catalog-grid]');
  const spotlightContainer = document.querySelector('[data-catalog-spotlight]');
  const cartSummaryContainer = document.querySelector('[data-catalog-cart-summary]');
  const sortSelect = document.querySelector('[data-catalog-sort]');

  if (heading && activeCategory) {
    heading.textContent = activeCategory.name;
  }

  if (intro && activeCategory) {
    intro.textContent = activeCategory.description;
  }

  function updateProductCount(count) {
    if (productCount) {
      productCount.textContent = `${count} ${count === 1 ? 'produkt' : 'produkter'} i ${activeCategory?.name || 'kategorin'}`;
    }
  }

  function renderCatalogCartSummary(helperText) {
    renderCartSummary(cartSummaryContainer, getCartSummary(), { helperText });
  }

  function renderSortedGrid(sortValue = 'default') {
    const sorted = sortProducts(allCategoryProducts, sortValue);
    updateProductCount(sorted.length);
    renderProductGrid(grid, sorted, { activeProductId: activeProduct?.id, enableQuickAdd: true });
  }

  renderCategoryPills(document.querySelector('[data-catalog-categories]'), categories, activeCategoryId);
  renderSortedGrid();
  renderProductSpotlight(spotlightContainer, activeProduct);
  renderCatalogCartSummary(
    activeProduct ? `Lägg ${activeProduct.name} i varukorgen och fortsätt sedan till checkout.` : 'Välj en produkt för att börja shoppa.'
  );

  sortSelect?.addEventListener('change', (event) => {
    renderSortedGrid(event.currentTarget.value);
  });

  grid?.addEventListener('click', (event) => {
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
      salePriceSek: product.salePriceSek || null,
    });

    renderCatalogCartSummary(`${product.name} (${size}) lades till i varukorgen.`);
    showCartToast(product.name);

    if (feedback) {
      feedback.textContent = `${product.name} tillagd. Du kan fortsätta handla eller gå direkt till varukorgen.`;
    }
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
      salePriceSek: activeProduct.salePriceSek || null,
    });

    renderCatalogCartSummary(`${activeProduct.name} (${size}) lades till i varukorgen.`);
    showCartToast(activeProduct.name);

    if (feedback) {
      feedback.textContent = `${activeProduct.name} lades till i varukorgen. Du kan fortsätta handla eller gå direkt till checkout.`;
    }
  });
}

