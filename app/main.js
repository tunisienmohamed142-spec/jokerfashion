import { initHomePage } from './pages/home.js';
import { initCatalogPage } from './pages/catalog.js';
import { initCheckoutPage } from './pages/checkout.js';
import { initAccountPage } from './pages/account.js';
import { initAdminPage } from './pages/admin.js';
import { initAdminLoginPage } from './pages/admin-login.js';
import { initProductPage } from './pages/product.js';
import { getCartSummary } from './state/store.js';
import { syncCartCountBadges } from './components/renderers.js';

const initializers = {
  home: initHomePage,
  catalog: initCatalogPage,
  checkout: initCheckoutPage,
  account: initAccountPage,
  admin: initAdminPage,
  'admin-login': initAdminLoginPage,
  product: initProductPage,
};

const pageKey = document.body.dataset.page;
const initPage = initializers[pageKey];

if (typeof initPage === 'function') {
  Promise.resolve(initPage()).catch((err) => {
    console.error('[JokerFashion] Page initialization error:', err);
  });
}

function updateCartBadges() {
  syncCartCountBadges(getCartSummary().itemCount);
}

updateCartBadges();
window.addEventListener('jokerfashion:cart-updated', updateCartBadges);
