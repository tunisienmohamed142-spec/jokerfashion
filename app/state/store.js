import { baseProducts, categories } from '../data/catalog.js';
import { DEFAULT_HOME_CONTENT, mergeHomeContent } from '../data/home-content.js';

const MOCK_SESSION_KEY = 'jokerfashion-auth-session';
const CART_STORAGE_KEY = 'jokerfashion-cart';
const CHECKOUT_DRAFT_KEY = 'jokerfashion-checkout-draft';
export const DEFAULT_SHOP_SETTINGS = {
  shippingRate: 49,
  freeShippingThreshold: 799,
  taxRate: 25,
  currency: 'SEK',
  shopEmail: '',
  shopName: 'JokerFashion',
};

// ── localStorage helpers (cart / checkout / session only) ────────────────────

function parseStorageItem(storageKey, fallbackValue) {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function saveStorageItem(storageKey, value) {
  localStorage.setItem(storageKey, JSON.stringify(value));
}

// ── API fetch helper ──────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.status}`;
    try {
      const errData = await res.json();
      errorMsg = errData.message || errorMsg;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

// ── Admin auth (API-backed) ───────────────────────────────────────────────────

export async function getAdminSession() {
  return apiFetch('/api/admin/session', {
    cache: 'no-store',
  });
}

export async function loginAdmin({ username, password }) {
  return apiFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({
      username: String(username || '').trim(),
      password: String(password || ''),
    }),
  });
}

export async function logoutAdmin() {
  return apiFetch('/api/admin/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function uploadAdminMedia({ dataUrl, usage, fileName }) {
  return apiFetch('/api/admin/media-upload', {
    method: 'POST',
    body: JSON.stringify({
      dataUrl: String(dataUrl || ''),
      usage: String(usage || ''),
      fileName: String(fileName || ''),
    }),
  });
}

// ── Homepage CMS content (API-backed, graceful fallback) ──────────────────────

export async function getHomepageContent() {
  try {
    const content = await apiFetch('/api/content/home', {
      cache: 'no-store',
    });
    return mergeHomeContent(content, DEFAULT_HOME_CONTENT);
  } catch {
    return mergeHomeContent({}, DEFAULT_HOME_CONTENT);
  }
}

export async function updateHomepageContent(contentInput) {
  const updated = await apiFetch('/api/content/home', {
    method: 'PUT',
    body: JSON.stringify(contentInput || {}),
  });
  return mergeHomeContent(updated, DEFAULT_HOME_CONTENT);
}

// ── Admin products (API-backed) ───────────────────────────────────────────────

export async function getAdminProducts() {
  return apiFetch('/api/products');
}

export async function createAdminProduct(productInput) {
  return apiFetch('/api/products', {
    method: 'POST',
    body: JSON.stringify({
      name: String(productInput.name || '').trim(),
      category: String(productInput.category || '').trim(),
      priceSek: Number(productInput.priceSek),
      salePriceSek: productInput.salePriceSek ? Number(productInput.salePriceSek) : null,
      inventory: Number(productInput.inventory) || 0,
      description: String(productInput.description || '').trim(),
      sizes: productInput.sizes,
      image: String(productInput.image || '').trim(),
    }),
  });
}

export async function updateAdminProduct(productId, updates) {
  return apiFetch(`/api/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteAdminProduct(productId) {
  return apiFetch(`/api/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

// ── Admin categories (API-backed) ─────────────────────────────────────────────

export async function getAdminCategories() {
  return apiFetch('/api/categories');
}

export async function createAdminCategory(input) {
  return apiFetch('/api/categories', {
    method: 'POST',
    body: JSON.stringify({
      name: String(input.name || '').trim(),
      description: String(input.description || '').trim(),
      icon: String(input.icon || '🏷️').trim(),
      image: String(input.image || '').trim(),
    }),
  });
}

export async function updateAdminCategory(categoryId, updates) {
  return apiFetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteAdminCategory(categoryId) {
  return apiFetch(`/api/categories/${encodeURIComponent(categoryId)}`, {
    method: 'DELETE',
  });
}

// ── Catalog helpers (API-backed, graceful fallback to base data) ──────────────

export async function getCatalogProducts() {
  try {
    const adminProducts = await getAdminProducts();
    return [...adminProducts, ...baseProducts];
  } catch {
    return [...baseProducts];
  }
}

export async function getCatalogCategories() {
  try {
    const adminCategories = await getAdminCategories();
    return [...categories, ...adminCategories];
  } catch {
    return [...categories];
  }
}

export async function getCatalogProductById(productId) {
  try {
    const allProducts = await getCatalogProducts();
    return allProducts.find((product) => product.id === productId) || null;
  } catch {
    return null;
  }
}

// ── Shop settings (API-backed) ────────────────────────────────────────────────

export async function getShopSettings() {
  const settings = await apiFetch('/api/settings', {
    cache: 'no-store',
  });

  return {
    ...DEFAULT_SHOP_SETTINGS,
    ...settings,
  };
}

export async function getStorefrontShopSettings() {
  try {
    return await getShopSettings();
  } catch {
    return { ...DEFAULT_SHOP_SETTINGS };
  }
}

export async function setShopSettings(settings) {
  return apiFetch('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}

// ── Cart (localStorage-backed, synchronous) ───────────────────────────────────

function notifyCartChange() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent('jokerfashion:cart-updated', { detail: getCartSummary() }));
}

export function getCartItems() {
  return parseStorageItem(CART_STORAGE_KEY, []);
}

export function getCartSummary() {
  const items = getCartItems();
  const subtotalPrice = items.reduce((sum, item) => sum + item.priceSek * item.quantity, 0);
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalPrice,
    totalPrice: subtotalPrice,
  };
}

export function getCheckoutTotals(cartItems, settingsInput = DEFAULT_SHOP_SETTINGS) {
  const items = Array.isArray(cartItems) ? cartItems : [];
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = items.reduce((sum, item) => sum + item.priceSek * item.quantity, 0);
  const shippingRate = Number(settingsInput.shippingRate);
  const freeShippingThreshold = Number(settingsInput.freeShippingThreshold);

  const normalizedShippingRate = Number.isFinite(shippingRate) ? Math.max(0, shippingRate) : 0;
  const normalizedFreeShippingThreshold = Number.isFinite(freeShippingThreshold)
    ? Math.max(0, freeShippingThreshold)
    : Number.POSITIVE_INFINITY;

  const freeShippingApplied =
    normalizedShippingRate > 0 &&
    Number.isFinite(normalizedFreeShippingThreshold) &&
    subtotalPrice >= normalizedFreeShippingThreshold;

  const shippingPrice = itemCount === 0 ? 0 : freeShippingApplied ? 0 : normalizedShippingRate;
  const totalPrice = subtotalPrice + shippingPrice;

  return {
    itemCount,
    subtotalPrice,
    shippingPrice,
    totalPrice,
    shippingRate: normalizedShippingRate,
    freeShippingThreshold: normalizedFreeShippingThreshold,
    freeShippingApplied,
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

// ── Checkout draft (localStorage-backed, synchronous) ─────────────────────────

export function getCheckoutDraft() {
  return parseStorageItem(CHECKOUT_DRAFT_KEY, {});
}

export function setCheckoutDraft(draft) {
  saveStorageItem(CHECKOUT_DRAFT_KEY, draft);
}

export function clearCheckoutDraft() {
  localStorage.removeItem(CHECKOUT_DRAFT_KEY);
}

// ── Mock session (localStorage-backed, synchronous) ───────────────────────────

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
