import { baseProducts, categories } from '../data/catalog.js';

const ADMIN_PRODUCTS_KEY = 'jokerfashion-admin-products';
const ADMIN_CATEGORIES_KEY = 'jokerfashion-admin-categories';
const ADMIN_SETTINGS_KEY = 'jokerfashion-admin-settings';
const MOCK_SESSION_KEY = 'jokerfashion-auth-session';
const CART_STORAGE_KEY = 'jokerfashion-cart';
const CHECKOUT_DRAFT_KEY = 'jokerfashion-checkout-draft';

function parseStorageItem(storageKey, fallbackValue) {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export function getCatalogProducts() {
  const adminProducts = parseStorageItem(ADMIN_PRODUCTS_KEY, []);
  return [...adminProducts, ...baseProducts];
}

export function getAdminCategories() {
  return parseStorageItem(ADMIN_CATEGORIES_KEY, []);
}

export function getCatalogCategories() {
  const adminCategories = getAdminCategories();
  return [...categories, ...adminCategories];
}

export function createAdminCategory(input) {
  const existing = getAdminCategories();
  const id = `cat-admin-${Date.now()}`;
  const category = {
    id,
    name: String(input.name || '').trim(),
    description: String(input.description || '').trim(),
    icon: String(input.icon || '🏷️').trim(),
    isAdminCreated: true,
  };
  saveStorageItem(ADMIN_CATEGORIES_KEY, [category, ...existing]);
  return category;
}

export function updateAdminCategory(categoryId, updates) {
  const existing = getAdminCategories();
  const index = existing.findIndex((c) => c.id === categoryId);
  if (index === -1) {
    return null;
  }
  const updated = {
    ...existing[index],
    name: String(updates.name ?? existing[index].name).trim(),
    description: String(updates.description ?? existing[index].description).trim(),
    icon: String(updates.icon ?? existing[index].icon).trim(),
  };
  existing[index] = updated;
  saveStorageItem(ADMIN_CATEGORIES_KEY, existing);
  return updated;
}

export function deleteAdminCategory(categoryId) {
  const existing = getAdminCategories();
  const next = existing.filter((c) => c.id !== categoryId);
  saveStorageItem(ADMIN_CATEGORIES_KEY, next);
}

export function getCatalogProductById(productId) {
  return getCatalogProducts().find((product) => product.id === productId) || null;
}

function saveStorageItem(storageKey, value) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

function notifyCartChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('jokerfashion:cart-updated', { detail: getCartSummary() }));
}

export function getAdminProducts() {
  return parseStorageItem(ADMIN_PRODUCTS_KEY, []);
}

export function createAdminProduct(productInput) {
  const draftProducts = getAdminProducts();
  const product = {
    id: `jf-admin-${Date.now()}`,
    name: String(productInput.name || '').trim(),
    category: String(productInput.category || '').trim(),
    priceSek: Number(productInput.priceSek),
    salePriceSek: productInput.salePriceSek ? Number(productInput.salePriceSek) : null,
    inventory: Number(productInput.inventory) || 0,
    badge: 'Admin',
    description: String(productInput.description || '').trim() || 'Produktbeskrivning saknas.',
    story: 'Produkt tillagd via adminpanelen.',
    highlights: ['Admin-skapad produkt'],
    sizes: productInput.sizes ? String(productInput.sizes).split(',').map((s) => s.trim()).filter(Boolean) : ['One size'],
    image: String(productInput.image || '').trim() ||
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
    isAdminCreated: true,
  };

  const nextProducts = [product, ...draftProducts];
  saveStorageItem(ADMIN_PRODUCTS_KEY, nextProducts);
  return product;
}

export function updateAdminProduct(productId, updates) {
  const draftProducts = getAdminProducts();
  const index = draftProducts.findIndex((p) => p.id === productId);
  if (index === -1) {
    return null;
  }
  const existing = draftProducts[index];
  const updated = {
    ...existing,
    name: String(updates.name ?? existing.name).trim(),
    category: String(updates.category ?? existing.category).trim(),
    priceSek: updates.priceSek !== undefined ? Number(updates.priceSek) : existing.priceSek,
    salePriceSek: updates.salePriceSek !== undefined
      ? (updates.salePriceSek ? Number(updates.salePriceSek) : null)
      : existing.salePriceSek,
    inventory: updates.inventory !== undefined ? Number(updates.inventory) : existing.inventory,
    description: updates.description !== undefined ? String(updates.description).trim() : existing.description,
    sizes: updates.sizes !== undefined
      ? String(updates.sizes).split(',').map((s) => s.trim()).filter(Boolean)
      : existing.sizes,
    image: updates.image !== undefined ? String(updates.image).trim() : existing.image,
  };
  draftProducts[index] = updated;
  saveStorageItem(ADMIN_PRODUCTS_KEY, draftProducts);
  return updated;
}

export function deleteAdminProduct(productId) {
  const draftProducts = getAdminProducts();
  const next = draftProducts.filter((p) => p.id !== productId);
  saveStorageItem(ADMIN_PRODUCTS_KEY, next);
}

export function getCartItems() {
  return parseStorageItem(CART_STORAGE_KEY, []);
}

export function getCartSummary() {
  const items = getCartItems();
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    totalPrice: items.reduce((sum, item) => sum + item.priceSek * item.quantity, 0),
  };
}

export function addCartItem(itemInput) {
  const cartItems = getCartItems();
  const normalizedItem = {
    productId: itemInput.productId,
    name: itemInput.name,
    category: itemInput.category,
    image: itemInput.image,
    size: itemInput.size,
    quantity: Number(itemInput.quantity) || 1,
    priceSek: Number(itemInput.priceSek) || 0,
  };

  const existingItem = cartItems.find(
    (item) => item.productId === normalizedItem.productId && item.size === normalizedItem.size
  );

  if (existingItem) {
    existingItem.quantity += normalizedItem.quantity;
  } else {
    cartItems.unshift(normalizedItem);
  }

  saveStorageItem(CART_STORAGE_KEY, cartItems);
  notifyCartChange();
  return cartItems;
}

export function updateCartItemQuantity(index, quantity) {
  const cartItems = getCartItems();
  if (!cartItems[index]) {
    return cartItems;
  }

  const nextQuantity = Number(quantity);
  if (Number.isNaN(nextQuantity) || nextQuantity < 1) {
    cartItems.splice(index, 1);
  } else {
    cartItems[index].quantity = nextQuantity;
  }

  saveStorageItem(CART_STORAGE_KEY, cartItems);
  notifyCartChange();
  return cartItems;
}

export function removeCartItem(index) {
  return updateCartItemQuantity(index, 0);
}

export function clearCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
  notifyCartChange();
}

export function getCheckoutDraft() {
  return parseStorageItem(CHECKOUT_DRAFT_KEY, {});
}

export function setCheckoutDraft(draft) {
  saveStorageItem(CHECKOUT_DRAFT_KEY, draft);
}

export function clearCheckoutDraft() {
  localStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

export function getShopSettings() {
  const defaults = {
    shippingRate: 49,
    freeShippingThreshold: 799,
    taxRate: 25,
    currency: 'SEK',
    shopEmail: '',
    shopName: 'JokerFashion',
  };
  const saved = parseStorageItem(ADMIN_SETTINGS_KEY, {});
  return { ...defaults, ...saved };
}

export function setShopSettings(settings) {
  const current = getShopSettings();
  const next = {
    ...current,
    shippingRate: settings.shippingRate !== undefined ? Number(settings.shippingRate) : current.shippingRate,
    freeShippingThreshold: settings.freeShippingThreshold !== undefined
      ? Number(settings.freeShippingThreshold)
      : current.freeShippingThreshold,
    taxRate: settings.taxRate !== undefined ? Number(settings.taxRate) : current.taxRate,
    currency: settings.currency !== undefined ? String(settings.currency).trim() : current.currency,
    shopEmail: settings.shopEmail !== undefined ? String(settings.shopEmail).trim() : current.shopEmail,
    shopName: settings.shopName !== undefined ? String(settings.shopName).trim() : current.shopName,
  };
  saveStorageItem(ADMIN_SETTINGS_KEY, next);
  return next;
}

export function getMockSession() {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setMockSession(role) {
  const session = {
    role,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearMockSession() {
  localStorage.removeItem(MOCK_SESSION_KEY);
}
