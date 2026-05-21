import { formatPrice } from '../components/renderers.js';
import {
  getCatalogCategories,
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  getAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  getShopSettings,
  setShopSettings,
} from '../state/store.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inventoryBadge(qty) {
  if (qty === 0) {
    return '<span class="inv-badge out">Slut</span>';
  }
  if (qty <= 5) {
    return `<span class="inv-badge low">${qty} st</span>`;
  }
  return `<span class="inv-badge ok">${qty} st</span>`;
}

function showFeedback(element, message, isError = false) {
  if (!element) {
    return;
  }
  element.textContent = message;
  element.className = isError ? 'notice notice-error' : 'notice';
  clearTimeout(element._timer);
  element._timer = setTimeout(() => {
    element.textContent = '';
  }, 4000);
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll('[data-admin-tab]');
  const panels = document.querySelectorAll('[data-admin-panel]');

  function activateTab(target) {
    tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.adminTab === target));
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.adminPanel !== target;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activateTab(tab.dataset.adminTab));
  });

  activateTab('products');
}

// ── Products tab ─────────────────────────────────────────────────────────────

function renderCategoryOptions(selectElement) {
  if (!selectElement) {
    return;
  }
  const cats = getCatalogCategories();
  selectElement.innerHTML = cats
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
    .join('');
}

function renderProductsTable() {
  const tbody = document.querySelector('[data-products-tbody]');
  if (!tbody) {
    return;
  }

  const products = getAdminProducts();
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Inga adminprodukter ännu. Lägg till en produkt nedan.</td></tr>`;
    return;
  }

  const cats = getCatalogCategories();
  const catMap = Object.fromEntries(cats.map((c) => [c.id, c.name]));

  tbody.innerHTML = products
    .map((p) => {
      const displayPrice = p.salePriceSek
        ? `<span class="price-sale">${formatPrice(p.salePriceSek)}</span> <s class="price-original">${formatPrice(p.priceSek)}</s>`
        : formatPrice(p.priceSek);
      return `
      <tr data-product-row="${escapeHtml(p.id)}">
        <td>
          <div class="table-product-name">${escapeHtml(p.name)}</div>
          <div class="table-sub">${escapeHtml(p.sizes.join(', '))}</div>
        </td>
        <td>${escapeHtml(catMap[p.category] || p.category)}</td>
        <td class="table-price">${displayPrice}</td>
        <td>${inventoryBadge(p.inventory)}</td>
        <td class="table-img">
          ${p.image ? `<img src="${escapeHtml(p.image)}" alt="" class="table-thumb" loading="lazy" />` : '–'}
        </td>
        <td>
          <div class="table-actions">
            <button class="button secondary btn-sm" data-edit-product="${escapeHtml(p.id)}">Redigera</button>
            <button class="button danger btn-sm" data-delete-product="${escapeHtml(p.id)}">Ta bort</button>
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

function populateProductEditForm(product) {
  const form = document.querySelector('[data-admin-product-form]');
  if (!form) {
    return;
  }

  form.querySelector('[name="name"]').value = product.name;
  form.querySelector('[name="priceSek"]').value = product.priceSek;
  form.querySelector('[name="salePriceSek"]').value = product.salePriceSek || '';
  form.querySelector('[name="inventory"]').value = product.inventory;
  form.querySelector('[name="image"]').value = product.image || '';
  form.querySelector('[name="description"]').value = product.description || '';
  form.querySelector('[name="sizes"]').value = product.sizes.join(', ');
  const catSelect = form.querySelector('[data-admin-category]');
  if (catSelect) {
    catSelect.value = product.category;
  }
  form.dataset.editingId = product.id;
  form.querySelector('[data-form-title]').textContent = 'Redigera produkt';
  form.querySelector('[data-submit-label]').textContent = 'Spara ändringar';
  form.querySelector('[data-cancel-edit]').hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetProductForm() {
  const form = document.querySelector('[data-admin-product-form]');
  if (!form) {
    return;
  }
  form.reset();
  delete form.dataset.editingId;
  form.querySelector('[data-form-title]').textContent = 'Lägg till produkt';
  form.querySelector('[data-submit-label]').textContent = 'Lägg till produkt';
  form.querySelector('[data-cancel-edit]').hidden = true;
}

function initProductsTab() {
  const form = document.querySelector('[data-admin-product-form]');
  const feedback = document.querySelector('[data-product-feedback]');
  const catSelect = form?.querySelector('[data-admin-category]');

  renderCategoryOptions(catSelect);
  renderProductsTable();

  form?.querySelector('[data-cancel-edit]')?.addEventListener('click', () => {
    resetProductForm();
  });

  document.querySelector('[data-products-tbody]')?.addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-edit-product]');
    const deleteBtn = event.target.closest('[data-delete-product]');

    if (editBtn) {
      const productId = editBtn.dataset.editProduct;
      const products = getAdminProducts();
      const product = products.find((p) => p.id === productId);
      if (product) {
        populateProductEditForm(product);
      }
    }

    if (deleteBtn) {
      const productId = deleteBtn.dataset.deleteProduct;
      if (confirm('Ta bort produkten? Detta kan inte ångras.')) {
        deleteAdminProduct(productId);
        renderProductsTable();
        showFeedback(feedback, 'Produkten har tagits bort.');
      }
    }
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const category = String(data.get('category') || '').trim();
    const priceSek = Number(data.get('priceSek'));
    const salePriceSek = data.get('salePriceSek') ? Number(data.get('salePriceSek')) : null;
    const inventory = Number(data.get('inventory') || 0);
    const image = String(data.get('image') || '').trim();
    const description = String(data.get('description') || '').trim();
    const sizes = String(data.get('sizes') || '').trim();

    if (!name || !category || Number.isNaN(priceSek) || priceSek <= 0) {
      showFeedback(feedback, 'Fyll i namn, kategori och ett giltigt pris.', true);
      return;
    }

    if (salePriceSek !== null && salePriceSek >= priceSek) {
      showFeedback(feedback, 'Reapriset måste vara lägre än ordinarie pris.', true);
      return;
    }

    const editingId = form.dataset.editingId;

    if (editingId) {
      updateAdminProduct(editingId, { name, category, priceSek, salePriceSek, inventory, image, description, sizes });
      showFeedback(feedback, `"${name}" har uppdaterats.`);
    } else {
      createAdminProduct({ name, category, priceSek, salePriceSek, inventory, image, description, sizes });
      showFeedback(feedback, `"${name}" har lagts till.`);
    }

    resetProductForm();
    renderCategoryOptions(catSelect);
    renderProductsTable();
  });
}

// ── Categories tab ─────────────────────────────────────────────────────────────

function renderCategoriesTable() {
  const tbody = document.querySelector('[data-categories-tbody]');
  if (!tbody) {
    return;
  }

  const baseCats = getCatalogCategories().filter((c) => !c.isAdminCreated);
  const adminCats = getAdminCategories();

  let html = baseCats
    .map(
      (c) => `
    <tr>
      <td>${escapeHtml(c.icon || '📁')}</td>
      <td><strong>${escapeHtml(c.name)}</strong></td>
      <td>${escapeHtml(c.description || '–')}</td>
      <td><span class="inv-badge ok">Inbyggd</span></td>
      <td>–</td>
    </tr>`
    )
    .join('');

  if (adminCats.length > 0) {
    html += adminCats
      .map(
        (c) => `
      <tr data-category-row="${escapeHtml(c.id)}">
        <td>${escapeHtml(c.icon || '🏷️')}</td>
        <td><strong>${escapeHtml(c.name)}</strong></td>
        <td>${escapeHtml(c.description || '–')}</td>
        <td><span class="inv-badge low">Admin</span></td>
        <td>
          <div class="table-actions">
            <button class="button secondary btn-sm" data-edit-category="${escapeHtml(c.id)}">Redigera</button>
            <button class="button danger btn-sm" data-delete-category="${escapeHtml(c.id)}">Ta bort</button>
          </div>
        </td>
      </tr>`
      )
      .join('');
  }

  if (!html) {
    html = `<tr><td colspan="5" class="table-empty">Inga kategorier ännu.</td></tr>`;
  }

  tbody.innerHTML = html;
}

function populateCategoryEditForm(category) {
  const form = document.querySelector('[data-admin-category-form]');
  if (!form) {
    return;
  }
  form.querySelector('[name="catName"]').value = category.name;
  form.querySelector('[name="catDescription"]').value = category.description || '';
  form.querySelector('[name="catIcon"]').value = category.icon || '';
  form.dataset.editingId = category.id;
  form.querySelector('[data-cat-form-title]').textContent = 'Redigera kategori';
  form.querySelector('[data-cat-submit-label]').textContent = 'Spara ändringar';
  form.querySelector('[data-cancel-cat-edit]').hidden = false;
  form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function resetCategoryForm() {
  const form = document.querySelector('[data-admin-category-form]');
  if (!form) {
    return;
  }
  form.reset();
  delete form.dataset.editingId;
  form.querySelector('[data-cat-form-title]').textContent = 'Skapa kategori';
  form.querySelector('[data-cat-submit-label]').textContent = 'Skapa kategori';
  form.querySelector('[data-cancel-cat-edit]').hidden = true;
}

function initCategoriesTab() {
  const form = document.querySelector('[data-admin-category-form]');
  const feedback = document.querySelector('[data-category-feedback]');

  renderCategoriesTable();

  form?.querySelector('[data-cancel-cat-edit]')?.addEventListener('click', () => {
    resetCategoryForm();
  });

  document.querySelector('[data-categories-tbody]')?.addEventListener('click', (event) => {
    const editBtn = event.target.closest('[data-edit-category]');
    const deleteBtn = event.target.closest('[data-delete-category]');

    if (editBtn) {
      const catId = editBtn.dataset.editCategory;
      const cats = getAdminCategories();
      const cat = cats.find((c) => c.id === catId);
      if (cat) {
        populateCategoryEditForm(cat);
      }
    }

    if (deleteBtn) {
      const catId = deleteBtn.dataset.deleteCategory;
      if (confirm('Ta bort kategorin? Produkter med denna kategori påverkas inte.')) {
        deleteAdminCategory(catId);
        renderCategoriesTable();
        renderCategoryOptions(document.querySelector('[data-admin-category]'));
        showFeedback(feedback, 'Kategorin har tagits bort.');
      }
    }
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('catName') || '').trim();
    const description = String(data.get('catDescription') || '').trim();
    const icon = String(data.get('catIcon') || '').trim() || '🏷️';

    if (!name) {
      showFeedback(feedback, 'Fyll i ett kategorinamn.', true);
      return;
    }

    const editingId = form.dataset.editingId;

    if (editingId) {
      updateAdminCategory(editingId, { name, description, icon });
      showFeedback(feedback, `"${name}" har uppdaterats.`);
    } else {
      createAdminCategory({ name, description, icon });
      showFeedback(feedback, `"${name}" har skapats.`);
    }

    resetCategoryForm();
    renderCategoriesTable();
    renderCategoryOptions(document.querySelector('[data-admin-category]'));
  });
}

// ── Shipping & Settings tab ───────────────────────────────────────────────────

function initSettingsTab() {
  const form = document.querySelector('[data-admin-settings-form]');
  const feedback = document.querySelector('[data-settings-feedback]');

  if (!form) {
    return;
  }

  const settings = getShopSettings();
  form.querySelector('[name="shippingRate"]').value = settings.shippingRate;
  form.querySelector('[name="freeShippingThreshold"]').value = settings.freeShippingThreshold;
  form.querySelector('[name="taxRate"]').value = settings.taxRate;
  form.querySelector('[name="currency"]').value = settings.currency;
  form.querySelector('[name="shopEmail"]').value = settings.shopEmail;
  form.querySelector('[name="shopName"]').value = settings.shopName;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const updated = setShopSettings({
      shippingRate: data.get('shippingRate'),
      freeShippingThreshold: data.get('freeShippingThreshold'),
      taxRate: data.get('taxRate'),
      currency: data.get('currency'),
      shopEmail: data.get('shopEmail'),
      shopName: data.get('shopName'),
    });
    showFeedback(feedback, `Inställningar sparade. Frakt: ${updated.shippingRate} ${updated.currency}, fri frakt från ${updated.freeShippingThreshold} ${updated.currency}.`);
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function initAdminPage() {
  initTabs();
  initProductsTab();
  initCategoriesTab();
  initSettingsTab();
}
