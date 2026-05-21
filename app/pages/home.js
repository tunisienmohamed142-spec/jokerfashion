import { renderCartSummary, renderCategoryPills, renderProductGrid, renderRouteCards } from '../components/renderers.js';
import { addCartItem, getCartSummary, getCatalogCategories, getCatalogProductById, getCatalogProducts } from '../state/store.js';

export function initHomePage() {
  const categories = getCatalogCategories();
  const products = getCatalogProducts().slice(0, 4);
  const cartSummaryContainer = document.querySelector('[data-home-cart-summary]');
  const feedback = document.querySelector('[data-home-feedback]');
  const featuredGrid = document.querySelector('[data-home-featured-products]');

  function renderHomeCart(helperText = 'Din varukorg följer med mellan katalog och checkout i den nya Joker-upplevelsen.') {
    renderCartSummary(cartSummaryContainer, getCartSummary(), { helperText });
  }

  renderCategoryPills(document.querySelector('[data-home-categories]'), categories);
  renderProductGrid(featuredGrid, products, { enableQuickAdd: true, quickAddLabel: 'Snabbköp' });
  renderHomeCart();

  featuredGrid?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-add-to-cart]');
    if (!button) {
      return;
    }

    const product = getCatalogProductById(String(button.dataset.addToCart || ''));
    if (!product) {
      return;
    }

    const size = product.sizes?.[0] || 'One size';
    addCartItem({
      productId: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      size,
      quantity: 1,
      priceSek: product.priceSek,
    });

    renderHomeCart(`${product.name} lades till i varukorgen.`);
    if (feedback) {
      feedback.textContent = `${product.name} (${size}) tillagd. Gå till varukorgen när du vill checka ut.`;
    }
  });

  renderRouteCards(document.querySelector('[data-home-future-routes]'), [
    {
      title: 'Varukorg & checkout',
      description: 'Sammanhållet kundflöde för varukorg, orderöversikt och väg in till beställnings-API:t.',
      href: 'checkout.html',
      cta: 'Öppna varukorg',
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
