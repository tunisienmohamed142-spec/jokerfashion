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
  getAdminSession,
  getHomepageContent,
  logoutAdmin,
  setShopSettings,
  updateHomepageContent,
  uploadAdminMedia,
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

function getSafeLoginRedirect() {
  const next = encodeURIComponent('admin.html');
  return `admin-login.html?next=${next}`;
}

function sanitizeImageUrl(value) {
  try {
    const parsed = new URL(String(value || '').trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : '';
  } catch {
    return '';
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Kunde inte läsa bildfilen.'));
    reader.readAsDataURL(file);
  });
}

function setImagePreview(target, imageUrl) {
  const preview = document.querySelector(`[data-admin-image-preview="${target}"]`);
  if (!preview) {
    return;
  }
  const safeUrl = sanitizeImageUrl(imageUrl);
  if (safeUrl) {
    preview.src = safeUrl;
    preview.hidden = false;
  } else {
    preview.removeAttribute('src');
    preview.hidden = true;
  }
}

function bindImageUrlPreview(target) {
  const urlInput = document.querySelector(`[data-admin-image-url="${target}"]`);
  if (!urlInput) {
    return;
  }
  const updatePreview = () => setImagePreview(target, urlInput.value);
  urlInput.addEventListener('input', updatePreview);
  urlInput.addEventListener('change', updatePreview);
  updatePreview();
}

function setupImageUpload({ target, usage, feedbackElement }) {
  const uploadInput = document.querySelector(`[data-admin-image-upload="${target}"]`);
  const urlInput = document.querySelector(`[data-admin-image-url="${target}"]`);
  if (!uploadInput || !urlInput) {
    return;
  }

  uploadInput.addEventListener('change', async () => {
    const file = uploadInput.files?.[0];
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      showFeedback(feedbackElement, 'Ogiltig filtyp. Använd JPG, PNG, WEBP eller GIF.', true);
      uploadInput.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showFeedback(feedbackElement, 'Bilden är för stor. Maxstorlek är 3 MB.', true);
      uploadInput.value = '';
      return;
    }

    try {
      showFeedback(feedbackElement, 'Laddar upp bild…');
      const dataUrl = await readFileAsDataUrl(file);
      const uploaded = await uploadAdminMedia({ dataUrl, usage, fileName: file.name });
      urlInput.value = uploaded.url;
      setImagePreview(target, uploaded.url);
      showFeedback(feedbackElement, 'Bild uppladdad och klar att spara.');
    } catch (err) {
      showFeedback(feedbackElement, err.message || 'Bilduppladdning misslyckades.', true);
    } finally {
      uploadInput.value = '';
    }
  });
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

async function renderCategoryOptions(selectElement) {
  if (!selectElement) {
    return;
  }
  try {
    const cats = await getCatalogCategories();
    selectElement.innerHTML = cats
      .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
      .join('');
  } catch {
    // keep whatever is currently rendered
  }
}

async function renderProductsTable() {
  const tbody = document.querySelector('[data-products-tbody]');
  if (!tbody) {
    return;
  }

  tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Laddar produkter…</td></tr>`;

  try {
    const products = await getAdminProducts();

    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="table-empty">Inga adminprodukter ännu. Lägg till en produkt nedan.</td></tr>`;
      return;
    }

    const cats = await getCatalogCategories();
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
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty notice-error">Kunde inte ladda produkter: ${escapeHtml(err.message)}</td></tr>`;
  }
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
  setImagePreview('product', product.image || '');
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
  setImagePreview('product', '');
  delete form.dataset.editingId;
  form.querySelector('[data-form-title]').textContent = 'Lägg till produkt';
  form.querySelector('[data-submit-label]').textContent = 'Lägg till produkt';
  form.querySelector('[data-cancel-edit]').hidden = true;
}

async function initProductsTab() {
  const form = document.querySelector('[data-admin-product-form]');
  const feedback = document.querySelector('[data-product-feedback]');
  const catSelect = form?.querySelector('[data-admin-category]');

  await Promise.all([renderCategoryOptions(catSelect), renderProductsTable()]);
  bindImageUrlPreview('product');
  setupImageUpload({ target: 'product', usage: 'products', feedbackElement: feedback });

  form?.querySelector('[data-cancel-edit]')?.addEventListener('click', () => {
    resetProductForm();
  });

  document.querySelector('[data-products-tbody]')?.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('[data-edit-product]');
    const deleteBtn = event.target.closest('[data-delete-product]');

    if (editBtn) {
      const productId = editBtn.dataset.editProduct;
      try {
        const products = await getAdminProducts();
        const product = products.find((p) => p.id === productId);
        if (product) {
          populateProductEditForm(product);
        }
      } catch (err) {
        showFeedback(feedback, `Kunde inte hämta produkten: ${err.message}`, true);
      }
    }

    if (deleteBtn) {
      const productId = deleteBtn.dataset.deleteProduct;
      if (confirm('Ta bort produkten? Detta kan inte ångras.')) {
        try {
          await deleteAdminProduct(productId);
          await renderProductsTable();
          showFeedback(feedback, 'Produkten har tagits bort.');
        } catch (err) {
          showFeedback(feedback, `Kunde inte ta bort produkten: ${err.message}`, true);
        }
      }
    }
  });

  form?.addEventListener('submit', async (event) => {
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

    if (image && !sanitizeImageUrl(image)) {
      showFeedback(feedback, 'Ogiltig bild-URL. Använd en fullständig http/https-länk.', true);
      return;
    }

    const editingId = form.dataset.editingId;

    try {
      if (editingId) {
        await updateAdminProduct(editingId, { name, category, priceSek, salePriceSek, inventory, image, description, sizes });
        showFeedback(feedback, `"${name}" har uppdaterats.`);
      } else {
        await createAdminProduct({ name, category, priceSek, salePriceSek, inventory, image, description, sizes });
        showFeedback(feedback, `"${name}" har lagts till.`);
      }

      resetProductForm();
      await Promise.all([renderCategoryOptions(catSelect), renderProductsTable()]);
    } catch (err) {
      showFeedback(feedback, err.message || 'Kunde inte spara produkten.', true);
    }
  });
}

// ── Categories tab ─────────────────────────────────────────────────────────────

async function renderCategoriesTable() {
  const tbody = document.querySelector('[data-categories-tbody]');
  if (!tbody) {
    return;
  }

  try {
    const allCats = await getCatalogCategories();
    const baseCats = allCats.filter((c) => !c.isAdminCreated);
    const adminCats = allCats.filter((c) => c.isAdminCreated);

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
          <td>${c.image ? `<img src="${escapeHtml(c.image)}" alt="" class="table-thumb" loading="lazy" />` : escapeHtml(c.icon || '🏷️')}</td>
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
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-empty notice-error">Kunde inte ladda kategorier: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function populateCategoryEditForm(category) {
  const form = document.querySelector('[data-admin-category-form]');
  if (!form) {
    return;
  }
  form.querySelector('[name="catName"]').value = category.name;
  form.querySelector('[name="catDescription"]').value = category.description || '';
  form.querySelector('[name="catIcon"]').value = category.icon || '';
  form.querySelector('[name="catImage"]').value = category.image || '';
  setImagePreview('category', category.image || '');
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
  setImagePreview('category', '');
  delete form.dataset.editingId;
  form.querySelector('[data-cat-form-title]').textContent = 'Skapa kategori';
  form.querySelector('[data-cat-submit-label]').textContent = 'Skapa kategori';
  form.querySelector('[data-cancel-cat-edit]').hidden = true;
}

async function initCategoriesTab() {
  const form = document.querySelector('[data-admin-category-form]');
  const feedback = document.querySelector('[data-category-feedback]');

  await renderCategoriesTable();
  bindImageUrlPreview('category');
  setupImageUpload({ target: 'category', usage: 'categories', feedbackElement: feedback });

  form?.querySelector('[data-cancel-cat-edit]')?.addEventListener('click', () => {
    resetCategoryForm();
  });

  document.querySelector('[data-categories-tbody]')?.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('[data-edit-category]');
    const deleteBtn = event.target.closest('[data-delete-category]');

    if (editBtn) {
      const catId = editBtn.dataset.editCategory;
      try {
        const cats = await getAdminCategories();
        const cat = cats.find((c) => c.id === catId);
        if (cat) {
          populateCategoryEditForm(cat);
        }
      } catch (err) {
        showFeedback(feedback, `Kunde inte hämta kategorin: ${err.message}`, true);
      }
    }

    if (deleteBtn) {
      const catId = deleteBtn.dataset.deleteCategory;
      if (confirm('Ta bort kategorin? Produkter med denna kategori påverkas inte.')) {
        try {
          await deleteAdminCategory(catId);
          await renderCategoriesTable();
          await renderCategoryOptions(document.querySelector('[data-admin-category]'));
          showFeedback(feedback, 'Kategorin har tagits bort.');
        } catch (err) {
          showFeedback(feedback, `Kunde inte ta bort kategorin: ${err.message}`, true);
        }
      }
    }
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('catName') || '').trim();
    const description = String(data.get('catDescription') || '').trim();
    const icon = String(data.get('catIcon') || '').trim() || '🏷️';
    const image = String(data.get('catImage') || '').trim();

    if (!name) {
      showFeedback(feedback, 'Fyll i ett kategorinamn.', true);
      return;
    }

    if (image && !sanitizeImageUrl(image)) {
      showFeedback(feedback, 'Ogiltig bild-URL. Använd en fullständig http/https-länk.', true);
      return;
    }

    const editingId = form.dataset.editingId;

    try {
      if (editingId) {
        await updateAdminCategory(editingId, { name, description, icon, image });
        showFeedback(feedback, `"${name}" har uppdaterats.`);
      } else {
        await createAdminCategory({ name, description, icon, image });
        showFeedback(feedback, `"${name}" har skapats.`);
      }

      resetCategoryForm();
      await renderCategoriesTable();
      await renderCategoryOptions(document.querySelector('[data-admin-category]'));
    } catch (err) {
      showFeedback(feedback, err.message || 'Kunde inte spara kategorin.', true);
    }
  });
}

// ── Shipping & Settings tab ───────────────────────────────────────────────────

async function initSettingsTab() {
  const form = document.querySelector('[data-admin-settings-form]');
  const feedback = document.querySelector('[data-settings-feedback]');

  if (!form) {
    return;
  }

  try {
    const settings = await getShopSettings();
    form.querySelector('[name="shippingRate"]').value = settings.shippingRate;
    form.querySelector('[name="freeShippingThreshold"]').value = settings.freeShippingThreshold;
    form.querySelector('[name="taxRate"]').value = settings.taxRate;
    form.querySelector('[name="currency"]').value = settings.currency;
    form.querySelector('[name="shopEmail"]').value = settings.shopEmail;
    form.querySelector('[name="shopName"]').value = settings.shopName;
  } catch (err) {
    showFeedback(feedback, `Kunde inte ladda inställningar: ${err.message}`, true);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    try {
      const updated = await setShopSettings({
        shippingRate: data.get('shippingRate'),
        freeShippingThreshold: data.get('freeShippingThreshold'),
        taxRate: data.get('taxRate'),
        currency: data.get('currency'),
        shopEmail: data.get('shopEmail'),
        shopName: data.get('shopName'),
      });
      showFeedback(feedback, `Inställningar sparade. Frakt: ${updated.shippingRate} ${updated.currency}, fri frakt från ${updated.freeShippingThreshold} ${updated.currency}.`);
    } catch (err) {
      showFeedback(feedback, err.message || 'Kunde inte spara inställningar.', true);
    }
  });
}

// ── Homepage CMS tab ───────────────────────────────────────────────────────────

async function initContentTab() {
  const form = document.querySelector('[data-admin-home-content-form]');
  const feedback = document.querySelector('[data-home-content-feedback]');

  if (!form) {
    return;
  }

  const populateForm = (content) => {
    form.querySelector('[name="heroEyebrow"]').value = content.hero.eyebrow;
    form.querySelector('[name="heroTitle"]').value = content.hero.title;
    form.querySelector('[name="heroBody"]').value = content.hero.body;
    form.querySelector('[name="heroPrimaryCtaLabel"]').value = content.hero.primaryCtaLabel;
    form.querySelector('[name="heroPrimaryCtaHref"]').value = content.hero.primaryCtaHref;
    form.querySelector('[name="heroSecondaryCtaLabel"]').value = content.hero.secondaryCtaLabel;
    form.querySelector('[name="heroSecondaryCtaHref"]').value = content.hero.secondaryCtaHref;
    form.querySelector('[name="highlightEyebrow"]').value = content.highlight.eyebrow;
    form.querySelector('[name="highlightTitle"]').value = content.highlight.title;
    form.querySelector('[name="highlightBody"]').value = content.highlight.body;
    form.querySelector('[name="highlightPrimaryCtaLabel"]').value = content.highlight.primaryCtaLabel;
    form.querySelector('[name="highlightPrimaryCtaHref"]').value = content.highlight.primaryCtaHref;
    form.querySelector('[name="highlightSecondaryCtaLabel"]').value = content.highlight.secondaryCtaLabel;
    form.querySelector('[name="highlightSecondaryCtaHref"]').value = content.highlight.secondaryCtaHref;
    form.querySelector('[name="categoriesEyebrow"]').value = content.categoriesSection.eyebrow;
    form.querySelector('[name="categoriesTitle"]').value = content.categoriesSection.title;
    form.querySelector('[name="featuredEyebrow"]').value = content.featuredSection.eyebrow;
    form.querySelector('[name="featuredTitle"]').value = content.featuredSection.title;
    form.querySelector('[name="featuredCtaLabel"]').value = content.featuredSection.ctaLabel;
    form.querySelector('[name="featuredCtaHref"]').value = content.featuredSection.ctaHref;
    form.querySelector('[name="newArrivalsEyebrow"]').value = content.newArrivalsSection.eyebrow;
    form.querySelector('[name="newArrivalsTitle"]').value = content.newArrivalsSection.title;
    form.querySelector('[name="newArrivalsCtaLabel"]').value = content.newArrivalsSection.ctaLabel;
    form.querySelector('[name="newArrivalsCtaHref"]').value = content.newArrivalsSection.ctaHref;
    form.querySelector('[name="footerMarketingLine"]').value = content.footer.marketingLine;
  };

  try {
    populateForm(await getHomepageContent());
  } catch (err) {
    showFeedback(feedback, `Kunde inte ladda startsideinnehåll: ${err.message}`, true);
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(form);

    try {
      const updated = await updateHomepageContent({
        hero: {
          eyebrow: data.get('heroEyebrow'),
          title: data.get('heroTitle'),
          body: data.get('heroBody'),
          primaryCtaLabel: data.get('heroPrimaryCtaLabel'),
          primaryCtaHref: data.get('heroPrimaryCtaHref'),
          secondaryCtaLabel: data.get('heroSecondaryCtaLabel'),
          secondaryCtaHref: data.get('heroSecondaryCtaHref'),
        },
        highlight: {
          eyebrow: data.get('highlightEyebrow'),
          title: data.get('highlightTitle'),
          body: data.get('highlightBody'),
          primaryCtaLabel: data.get('highlightPrimaryCtaLabel'),
          primaryCtaHref: data.get('highlightPrimaryCtaHref'),
          secondaryCtaLabel: data.get('highlightSecondaryCtaLabel'),
          secondaryCtaHref: data.get('highlightSecondaryCtaHref'),
        },
        categoriesSection: {
          eyebrow: data.get('categoriesEyebrow'),
          title: data.get('categoriesTitle'),
        },
        featuredSection: {
          eyebrow: data.get('featuredEyebrow'),
          title: data.get('featuredTitle'),
          ctaLabel: data.get('featuredCtaLabel'),
          ctaHref: data.get('featuredCtaHref'),
        },
        newArrivalsSection: {
          eyebrow: data.get('newArrivalsEyebrow'),
          title: data.get('newArrivalsTitle'),
          ctaLabel: data.get('newArrivalsCtaLabel'),
          ctaHref: data.get('newArrivalsCtaHref'),
        },
        footer: {
          marketingLine: data.get('footerMarketingLine'),
        },
      });

      populateForm(updated);
      showFeedback(feedback, 'Startsidans innehåll har sparats och används nu av storefronten.');
    } catch (err) {
      showFeedback(feedback, err.message || 'Kunde inte spara startsideinnehållet.', true);
    }
  });
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function initAdminPage() {
  const protectedApp = document.querySelector('[data-admin-app]');
  const gateStatus = document.querySelector('[data-admin-gate-status]');
  const sessionMeta = document.querySelector('[data-admin-session-meta]');
  const logoutButton = document.querySelector('[data-admin-logout]');

  try {
    const session = await getAdminSession();
    if (sessionMeta && session?.user?.username) {
      sessionMeta.textContent = `Inloggad som ${session.user.username} (admin).`;
    }
    if (gateStatus) {
      gateStatus.textContent = '';
    }
  } catch {
    window.location.replace(getSafeLoginRedirect());
    return;
  }

  if (protectedApp) {
    protectedApp.hidden = false;
  }

  logoutButton?.addEventListener('click', async () => {
    try {
      await logoutAdmin();
    } finally {
      window.location.replace(getSafeLoginRedirect());
    }
  });

  initTabs();
  await initProductsTab();
  await initCategoriesTab();
  await initSettingsTab();
  await initContentTab();
}
