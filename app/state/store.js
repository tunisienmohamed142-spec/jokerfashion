import { baseProducts, categories } from '../data/catalog.js';

const ADMIN_PRODUCTS_KEY = 'jokerfashion-admin-products';
const MOCK_SESSION_KEY = 'jokerfashion-auth-session';

function parseStorageItem(storageKey) {
  try {
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

export function getCatalogProducts() {
  const adminProducts = parseStorageItem(ADMIN_PRODUCTS_KEY);
  return [...adminProducts, ...baseProducts];
}

export function getCatalogCategories() {
  return categories;
}

export function createAdminProduct(productInput) {
  const draftProducts = parseStorageItem(ADMIN_PRODUCTS_KEY);
  const product = {
    id: `jf-admin-${Date.now()}`,
    name: productInput.name,
    category: productInput.category,
    priceSek: Number(productInput.priceSek),
    badge: 'Admin Draft',
    image: productInput.image ||
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  };

  const nextProducts = [product, ...draftProducts];
  localStorage.setItem(ADMIN_PRODUCTS_KEY, JSON.stringify(nextProducts));
  return product;
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
