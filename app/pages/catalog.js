import { renderCartSummary, renderCategoryPills, renderProductGrid, renderProductSpotlight, showCartToast } from '../components/renderers.js';
import {
  buildCatalogUrl,
  DEFAULT_TARGET_GROUP_ID,
  formatTaxonomyPath,
  getMainCategoriesForTargetGroup,
  getSubcategoriesForMainCategory,
  getTargetGroupById,
  resolveProductTaxonomy,
  TARGET_GROUPS,
} from '../data/catalog.js';
import { addCartItem, getCartSummary, getCatalogCategories, getCatalogProducts } from '../state/store.js';

function getCatalogState(categories) {
  const params = new URLSearchParams(window.location.search);
  const requestedMainCategoryId = params.get('category');
  const inferredTargetGroupFromCategory = (requestedMainCategoryId || '').split('-')[0];
  const legacyTargetGroup = requestedMainCategoryId;
  const requestedTargetGroup =
    params.get('targetGroup') ||
    TARGET_GROUPS.find((targetGroup) => targetGroup.id === inferredTargetGroupFromCategory)?.id ||
    legacyTargetGroup ||
    DEFAULT_TARGET_GROUP_ID;
  const targetGroup = getTargetGroupById(requestedTargetGroup);
  const mainCategories = getMainCategoriesForTargetGroup(categories, targetGroup.id);
  const activeMainCategory =
    mainCategories.find((category) => category.id === requestedMainCategoryId) || mainCategories[0] || null;
  const subcategories = getSubcategoriesForMainCategory(categories, activeMainCategory?.id);
  const requestedSubcategoryId = params.get('subcategory');
  const activeSubcategory =
    subcategories.find((subcategory) => subcategory.id === requestedSubcategoryId) || subcategories[0] || null;

  return {
    targetGroup,
    mainCategories,
    activeMainCategory,
    subcategories,
    activeSubcategory,
  };
}

function getCatalogProductsForSelection(products, categories, state) {
  return products.filter((product) => {
    const taxonomy = resolveProductTaxonomy(product, categories);
    return (
      taxonomy.targetGroupId === state.targetGroup.id &&
      taxonomy.mainCategoryId === state.activeMainCategory?.id &&
      taxonomy.subcategoryId === state.activeSubcategory?.id
    );
  });
}

function getActiveProductFromList(products) {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  return (productId ? products.find((product) => product.id === productId) : null) || products[0] || null;
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
  const state = getCatalogState(categories);
  const allProducts = await getCatalogProducts();
  const filteredProducts = getCatalogProductsForSelection(allProducts, categories, state);
  const activeProduct = getActiveProductFromList(filteredProducts);

  const heading = document.querySelector('[data-catalog-heading]');
  const intro = document.querySelector('[data-catalog-intro]');
  const productCount = document.querySelector('[data-catalog-product-count]');
  const feedback = document.querySelector('[data-catalog-feedback]');
  const grid = document.querySelector('[data-catalog-grid]');
  const spotlightContainer = document.querySelector('[data-catalog-spotlight]');
  const cartSummaryContainer = document.querySelector('[data-catalog-cart-summary]');
  const sortSelect = document.querySelector('[data-catalog-sort]');
  const targetGroupTabs = document.querySelector('[data-catalog-target-groups]');
  const mainCategoryTabs = document.querySelector('[data-catalog-main-categories]');
  const subcategoryTabs = document.querySelector('[data-catalog-subcategories]');
  const trail = document.querySelector('[data-catalog-trail]');

  document.querySelectorAll('[data-target-link]').forEach((link) => {
    link.classList.toggle('active', link.getAttribute('data-target-link') === state.targetGroup.id);
  });

  if (heading) {
    heading.textContent = state.targetGroup.name;
  }

  if (intro) {
    intro.textContent =
      formatTaxonomyPath(
        {
          targetGroup: state.targetGroup,
          mainCategory: state.activeMainCategory,
          subcategory: state.activeSubcategory,
        },
        { includeTargetGroup: false, separator: ' / ' }
      ) || state.targetGroup.description;
  }

  if (trail) {
    trail.textContent =
      formatTaxonomyPath(
        {
          targetGroup: state.targetGroup,
          mainCategory: state.activeMainCategory,
          subcategory: state.activeSubcategory,
        },
        { includeTargetGroup: true, separator: ' / ' }
      ) || state.targetGroup.name;
  }

  function updateProductCount(count) {
    if (productCount) {
      const locationLabel =
        state.activeSubcategory?.name || state.activeMainCategory?.name || state.targetGroup.name;
      productCount.textContent = `${count} ${count === 1 ? 'produkt' : 'produkter'} i ${locationLabel}`;
    }
  }

  function renderCatalogCartSummary(helperText) {
    renderCartSummary(cartSummaryContainer, getCartSummary(), { helperText });
  }

  function renderSortedGrid(sortValue = 'default') {
    const sorted = sortProducts(filteredProducts, sortValue);
    updateProductCount(sorted.length);
    renderProductGrid(grid, sorted, { activeProductId: activeProduct?.id, enableQuickAdd: true, categories });
  }

  renderCategoryPills(targetGroupTabs, TARGET_GROUPS, state.targetGroup.id, {
    getHref: (targetGroup) => buildCatalogUrl({ targetGroupId: targetGroup.id }),
    pillClassName: 'pill pill--level-1',
  });

  renderCategoryPills(mainCategoryTabs, state.mainCategories, state.activeMainCategory?.id, {
    getHref: (category) => buildCatalogUrl({ targetGroupId: state.targetGroup.id, mainCategoryId: category.id }),
    pillClassName: 'pill pill--level-2',
  });

  renderCategoryPills(subcategoryTabs, state.subcategories, state.activeSubcategory?.id, {
    getHref: (subcategory) =>
      buildCatalogUrl({
        targetGroupId: state.targetGroup.id,
        mainCategoryId: state.activeMainCategory?.id,
        subcategoryId: subcategory.id,
      }),
    pillClassName: 'pill pill--level-3',
  });

  renderSortedGrid();
  renderProductSpotlight(spotlightContainer, activeProduct, { categories });
  renderCatalogCartSummary(
    activeProduct
      ? `Lägg ${activeProduct.name} i varukorgen och fortsätt sedan till checkout.`
      : 'Välj en produkt för att börja shoppa.'
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
    const product = allProducts.find((candidate) => candidate.id === productId);
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
