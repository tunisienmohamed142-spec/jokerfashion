import { renderCategoryPills, renderProductGrid } from '../components/renderers.js';
import { getCategoryById } from '../data/catalog.js';
import { getCatalogCategories, getCatalogProducts } from '../state/store.js';

function getActiveCategoryId(categories) {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('category');
  return categories.some((category) => category.id === fromQuery) ? fromQuery : categories[0]?.id;
}

export function initCatalogPage() {
  const categories = getCatalogCategories();
  const activeCategoryId = getActiveCategoryId(categories);
  const activeCategory = getCategoryById(activeCategoryId);

  const products = getCatalogProducts().filter((product) => product.category === activeCategoryId);

  const heading = document.querySelector('[data-catalog-heading]');
  const intro = document.querySelector('[data-catalog-intro]');

  if (heading && activeCategory) {
    heading.textContent = activeCategory.name;
  }

  if (intro && activeCategory) {
    intro.textContent = activeCategory.description;
  }

  renderCategoryPills(document.querySelector('[data-catalog-categories]'), categories, activeCategoryId);
  renderProductGrid(document.querySelector('[data-catalog-grid]'), products);
}
