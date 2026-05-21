import { renderCategoryPills, renderProductGrid, renderRouteCards } from '../components/renderers.js';
import { getCatalogCategories, getCatalogProducts } from '../state/store.js';

export function initHomePage() {
  const categories = getCatalogCategories();
  const products = getCatalogProducts().slice(0, 4);

  renderCategoryPills(document.querySelector('[data-home-categories]'), categories);
  renderProductGrid(document.querySelector('[data-home-featured-products]'), products);

  renderRouteCards(document.querySelector('[data-home-future-routes]'), [
    {
      title: 'Mitt konto',
      description: 'Scaffold för registrering, login och framtida orderhistorik.',
      href: 'account.html',
      cta: 'Gå till kontostruktur',
    },
    {
      title: 'Admin Studio',
      description: 'Grund för produkt- och kategorihantering i kommande sprintar.',
      href: 'admin.html',
      cta: 'Öppna admin foundation',
    },
  ]);
}
