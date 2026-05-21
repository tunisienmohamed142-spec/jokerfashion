import { initHomePage } from './pages/home.js';
import { initCatalogPage } from './pages/catalog.js';
import { initAccountPage } from './pages/account.js';
import { initAdminPage } from './pages/admin.js';

const initializers = {
  home: initHomePage,
  catalog: initCatalogPage,
  account: initAccountPage,
  admin: initAdminPage,
};

const pageKey = document.body.dataset.page;
const initPage = initializers[pageKey];

if (typeof initPage === 'function') {
  initPage();
}
