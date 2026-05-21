import { getCategoryById } from '../data/catalog.js';

function formatPrice(priceSek) {
  return `${new Intl.NumberFormat('sv-SE').format(priceSek)} kr`;
}

export function renderCategoryPills(container, categories, activeCategoryId) {
  if (!container) {
    return;
  }

  container.innerHTML = categories
    .map(
      (category) => `
      <a class="pill ${category.id === activeCategoryId ? 'is-active' : ''}" href="catalog.html?category=${category.id}">
        <span>${category.name}</span>
      </a>
    `
    )
    .join('');
}

export function renderProductGrid(container, products) {
  if (!container) {
    return;
  }

  if (!products.length) {
    container.innerHTML = '<p class="empty-state">Inga produkter i den här kategorin ännu.</p>';
    return;
  }

  container.innerHTML = products
    .map((product) => {
      const category = getCategoryById(product.category);
      const categoryName = category ? category.name : 'Övrigt';

      return `
        <article class="product-card">
          <div class="product-image-wrap">
            <img src="${product.image}" alt="${product.name}" loading="lazy" />
            <span class="product-badge">${product.badge}</span>
          </div>
          <div class="product-copy">
            <p class="meta">${categoryName}</p>
            <h3>${product.name}</h3>
            <p class="price">${formatPrice(product.priceSek)}</p>
          </div>
        </article>
      `;
    })
    .join('');
}

export function renderRouteCards(container, routes) {
  if (!container) {
    return;
  }

  container.innerHTML = routes
    .map(
      (route) => `
      <article class="route-card">
        <h3>${route.title}</h3>
        <p>${route.description}</p>
        <a class="text-link" href="${route.href}">${route.cta}</a>
      </article>
    `
    )
    .join('');
}
