import { renderCartSummary, renderCategoryPills, renderProductGrid, renderRouteCards } from '../components/renderers.js';
import { getCartSummary, getCatalogCategories, getCatalogProducts } from '../state/store.js';

export function initHomePage() {
  const categories = getCatalogCategories();
  const products = getCatalogProducts().slice(0, 4);

  renderCategoryPills(document.querySelector('[data-home-categories]'), categories);
  renderProductGrid(document.querySelector('[data-home-featured-products]'), products);
  renderCartSummary(document.querySelector('[data-home-cart-summary]'), getCartSummary(), {
    helperText: 'Din varukorg följer med mellan katalog och checkout i den nya Joker-upplevelsen.',
  });

  renderRouteCards(document.querySelector('[data-home-future-routes]'), [
    {
      title: 'Checkout',
      description: 'Ny kundvagn, orderöversikt och väg in till beställnings-API:t i nya UI:t.',
      href: 'checkout.html',
      cta: 'Öppna checkout',
    },
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
