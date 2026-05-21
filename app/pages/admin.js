import { renderProductGrid } from '../components/renderers.js';
import { getCatalogCategories, getCatalogProducts, createAdminProduct } from '../state/store.js';

function renderCategoryOptions(selectElement, categories) {
  if (!selectElement) {
    return;
  }

  selectElement.innerHTML = categories
    .map((category) => `<option value="${category.id}">${category.name}</option>`)
    .join('');
}

function renderAdminPreview() {
  const products = getCatalogProducts().slice(0, 6);
  renderProductGrid(document.querySelector('[data-admin-product-preview]'), products);
}

export function initAdminPage() {
  const categories = getCatalogCategories();
  const form = document.querySelector('[data-admin-product-form]');
  const feedback = document.querySelector('[data-admin-feedback]');
  const categorySelect = document.querySelector('[data-admin-category]');

  renderCategoryOptions(categorySelect, categories);
  renderAdminPreview();

  form?.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const category = String(formData.get('category') || '').trim();
    const priceSek = Number(formData.get('priceSek'));
    const image = String(formData.get('image') || '').trim();

    if (!name || !category || Number.isNaN(priceSek) || priceSek <= 0) {
      if (feedback) {
        feedback.textContent = 'Fyll i namn, kategori och ett giltigt pris.';
      }
      return;
    }

    createAdminProduct({ name, category, priceSek, image });
    form.reset();
    renderCategoryOptions(categorySelect, categories);
    renderAdminPreview();

    if (feedback) {
      feedback.textContent = 'Produkt tillagd i lokal admin-draft. Databas-CRUD kopplas i nästa fas.';
    }
  });
}
