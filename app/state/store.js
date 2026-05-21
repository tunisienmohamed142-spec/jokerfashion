import { baseProducts, categories } from '../data/catalog.js';

const ADMIN_PRODUCTS_KEY = 'jokerfashion-admin-products';
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

export function getCatalogCategories() {
  return categories;
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

export function createAdminProduct(productInput) {
  const draftProducts = parseStorageItem(ADMIN_PRODUCTS_KEY, []);
  const product = {
    id: `jf-admin-${Date.now()}`,
    name: productInput.name,
    category: productInput.category,
    priceSek: Number(productInput.priceSek),
    badge: 'Admin Draft',
    description: productInput.description || 'Nytt adminutkast som ännu inte kopplats till databas.',
    story: 'Den här produkten är tillagd via admin foundation och visas nu i den nya shoppen.',
    highlights: ['Admin draft', 'Lokal preview', 'Behöver backend i nästa fas'],
    sizes: ['One size'],
    image: productInput.image ||
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
  };

  const nextProducts = [product, ...draftProducts];
  saveStorageItem(ADMIN_PRODUCTS_KEY, nextProducts);
  return product;
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
