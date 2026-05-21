// ── Mega Menu ───────────────────────────────────────────────────────────────
// Builds and injects a Zalando-style mega navigation with hover + click on
// desktop and an accordion drawer on mobile.

function slugify(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' och ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const MEGA_NAV = [
  {
    id: 'kvinna',
    name: 'Kvinna',
    categories: [
      {
        id: 'klader',
        name: 'Kläder',
        items: ['Byxor', 'Jackor', 'Klänningar', 'Toppar', 'Linnen', 'Tröjor & Hoddies'],
      },
      {
        id: 'skor',
        name: 'Skor',
        items: ['Sneakers', 'Tofflor', 'Högklackar', 'Loafers'],
      },
      {
        id: 'accessoarer',
        name: 'Accessoarer',
        items: ['Väskor', 'Smycken', 'Mössor & Kepsar', 'Skärp', 'Klockor', 'Plånböcker & fodral'],
      },
      {
        id: 'sport',
        name: 'Sport',
        items: ['Träningskläder'],
      },
    ],
  },
  {
    id: 'man',
    name: 'Man',
    categories: [
      {
        id: 'klader',
        name: 'Kläder',
        items: ['Jeans', 'Jackor', 'T-shirts & pikeer', 'Tröjor & Hoddies', 'Byxor', 'Västar', 'Underkläder & Strumpor'],
      },
      {
        id: 'skor',
        name: 'Skor',
        items: ['Sneakers', 'Kängor', 'Tofflor'],
      },
      {
        id: 'accessoarer',
        name: 'Accessoarer',
        items: ['Klockor', 'Solglasögon', 'Mössor & Hattar', 'Plånböcker & fodral', 'Smycken', 'Bälten', 'Midjeväskor', 'Ryggsäckar'],
      },
      {
        id: 'sport',
        name: 'Sport',
        items: ['Fotbollströjor', 'Fotbollsskor', 'Baskettröjor'],
      },
    ],
  },
  {
    id: 'barn',
    name: 'Barn',
    categories: [
      {
        id: 'klader',
        name: 'Kläder',
        items: ['Alla barnkläder'],
      },
      {
        id: 'skor',
        name: 'Skor',
        items: ['Alla barnskor'],
      },
      {
        id: 'accessoarer',
        name: 'Accessoarer',
        items: ['Alla accessoarer'],
      },
      {
        id: 'sport',
        name: 'Sport',
        items: ['Alla sportprodukter'],
      },
    ],
  },
];

function buildUrl(targetGroupId, mainCategoryId, subcategoryName) {
  const params = new URLSearchParams({ targetGroup: targetGroupId });
  if (mainCategoryId) {
    params.set('category', `${targetGroupId}-${mainCategoryId}`);
  }
  if (subcategoryName) {
    params.set('subcategory', `${targetGroupId}-${mainCategoryId}-${slugify(subcategoryName)}`);
  }
  return `catalog.html?${params}`;
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildMegaPanelHTML(group) {
  const catTabs = group.categories
    .map(
      (cat, i) => `
      <button
        class="mega-cat-btn${i === 0 ? ' is-active' : ''}"
        type="button"
        data-cat="${esc(cat.id)}"
        aria-expanded="${i === 0 ? 'true' : 'false'}">
        ${esc(cat.name)}
      </button>`
    )
    .join('');

  const subPanels = group.categories
    .map(
      (cat, i) => {
        const links = cat.items
          .map(
            (item) => `
          <a class="mega-subcat-link" href="${esc(buildUrl(group.id, cat.id, item))}">${esc(item)}</a>`
          )
          .join('');
        return `
      <div
        class="mega-subcat-panel${i === 0 ? ' is-active' : ''}"
        data-subcat-panel="${esc(cat.id)}"
        aria-hidden="${i === 0 ? 'false' : 'true'}">
        ${links}
      </div>`;
      }
    )
    .join('');

  return `
    <div class="mega-panel-inner container">
      <div class="mega-cats-col">
        <a class="mega-cats-shopall" href="${esc(buildUrl(group.id))}">
          Shoppa allt i ${esc(group.name)}
        </a>
        <div class="mega-cats-list" role="list">
          ${catTabs}
        </div>
      </div>
      <div class="mega-subcats-col">
        ${subPanels}
      </div>
    </div>`;
}

function buildNavHTML() {
  const items = MEGA_NAV.map(
    (group) => `
    <div class="mega-item" data-mega-item="${esc(group.id)}">
      <a
        class="mega-trigger"
        href="${esc(buildUrl(group.id))}"
        data-target-link="${esc(group.id)}">
        ${esc(group.name)}
      </a>
    </div>`
  ).join('');

  return `
    <nav class="mega-nav" aria-label="Huvudnavigation" id="mega-nav">
      ${items}
      <span class="mega-nav-divider" aria-hidden="true"></span>
      <a class="mega-nav-util" href="checkout.html">
        Varukorg&nbsp;<span class="cart-count" data-cart-count>0</span>
      </a>
      <a class="mega-nav-util" href="account.html">Konto</a>
      <a class="mega-nav-util mega-nav-util--admin" href="admin.html">Admin</a>
      <button
        class="mega-hamburger"
        type="button"
        id="mega-hamburger"
        aria-label="Öppna meny"
        aria-expanded="false"
        aria-controls="mega-mobile-drawer">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>`;
}

function buildPanelsHTML() {
  return MEGA_NAV.map(
    (group) => `
  <div class="mega-panel" data-panel="${esc(group.id)}" aria-hidden="true">
    ${buildMegaPanelHTML(group)}
  </div>`
  ).join('');
}

function buildMobileDrawerHTML() {
  const groups = MEGA_NAV.map((group) => {
    const cats = group.categories
      .map((cat) => {
        const links = cat.items
          .map(
            (item) => `
          <a class="mega-mob-sublink" href="${esc(buildUrl(group.id, cat.id, item))}">${esc(item)}</a>`
          )
          .join('');
        return `
        <div class="mega-mob-cat">
          <button class="mega-mob-cat-toggle" type="button" aria-expanded="false">
            <span>${esc(cat.name)}</span>
            <svg class="mega-mob-chevron" aria-hidden="true" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="mega-mob-cat-body" aria-hidden="true">
            <a class="mega-mob-sublink mega-mob-sublink--all" href="${esc(buildUrl(group.id, cat.id))}">Shoppa alla ${esc(cat.name.toLowerCase())}</a>
            ${links}
          </div>
        </div>`;
      })
      .join('');

    return `
      <div class="mega-mob-group">
        <button class="mega-mob-group-toggle" type="button" aria-expanded="false">
          <span>${esc(group.name)}</span>
          <svg class="mega-mob-chevron" aria-hidden="true" viewBox="0 0 10 6" fill="none">
            <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="mega-mob-group-body" aria-hidden="true">
          <a class="mega-mob-shopall" href="${esc(buildUrl(group.id))}">Shoppa allt i ${esc(group.name)}</a>
          ${cats}
        </div>
      </div>`;
  }).join('');

  return `
    <aside
      class="mega-mobile-drawer"
      id="mega-mobile-drawer"
      aria-hidden="true"
      aria-label="Mobilmeny">
      <div class="mega-mobile-header">
        <a class="brand" href="index.html">Joker<span>Fashion</span></a>
        <button
          class="mega-mobile-close"
          type="button"
          id="mega-mobile-close"
          aria-label="Stäng meny">✕</button>
      </div>
      <div class="mega-mobile-body">
        ${groups}
        <div class="mega-mob-utils">
          <a href="checkout.html" class="mega-mob-util-link">
            Varukorg <span class="cart-count" data-cart-count>0</span>
          </a>
          <a href="account.html" class="mega-mob-util-link">Konto</a>
          <a href="admin.html" class="mega-mob-util-link">Admin</a>
        </div>
      </div>
    </aside>
    <div class="mega-mobile-backdrop" id="mega-mobile-backdrop" aria-hidden="true"></div>`;
}

function markActivePage() {
  const params = new URLSearchParams(window.location.search);
  const activeTargetGroup = params.get('targetGroup');
  if (activeTargetGroup) {
    document.querySelectorAll('[data-target-link]').forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('data-target-link') === activeTargetGroup);
    });
  }
}

function setupDesktopInteractions() {
  const items = document.querySelectorAll('.mega-item');
  const panels = document.querySelectorAll('.mega-panel');
  let closeTimer = null;

  function openPanel(groupId) {
    clearTimeout(closeTimer);
    panels.forEach((panel) => {
      const isTarget = panel.dataset.panel === groupId;
      panel.classList.toggle('is-open', isTarget);
      panel.setAttribute('aria-hidden', String(!isTarget));
    });
    items.forEach((item) => {
      item.classList.toggle('is-open', item.dataset.megaItem === groupId);
    });
  }

  function closeAll() {
    clearTimeout(closeTimer);
    panels.forEach((panel) => {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
    });
    items.forEach((item) => item.classList.remove('is-open'));
  }

  function scheduleClose() {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeAll, 180);
  }

  function cancelClose() {
    clearTimeout(closeTimer);
  }

  items.forEach((item) => {
    const groupId = item.dataset.megaItem;

    item.addEventListener('mouseenter', () => openPanel(groupId));
    item.addEventListener('mouseleave', scheduleClose);
    item.addEventListener('focusin', () => openPanel(groupId));

    const trigger = item.querySelector('.mega-trigger');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        const panel = document.querySelector(`.mega-panel[data-panel="${groupId}"]`);
        if (!panel?.classList.contains('is-open')) {
          e.preventDefault();
          openPanel(groupId);
        }
      });
    }
  });

  panels.forEach((panel) => {
    panel.addEventListener('mouseenter', cancelClose);
    panel.addEventListener('mouseleave', scheduleClose);
  });

  document.querySelectorAll('.mega-cat-btn').forEach((btn) => {
    function activateCat() {
      cancelClose();
      const catId = btn.dataset.cat;
      const panel = btn.closest('.mega-panel');
      if (!panel) return;

      panel.querySelectorAll('.mega-cat-btn').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-expanded', String(b === btn));
      });
      panel.querySelectorAll('.mega-subcat-panel').forEach((p) => {
        const isActive = p.dataset.subcatPanel === catId;
        p.classList.toggle('is-active', isActive);
        p.setAttribute('aria-hidden', String(!isActive));
      });
    }

    btn.addEventListener('mouseenter', activateCat);
    btn.addEventListener('click', activateCat);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.mega-item') && !e.target.closest('.mega-panel')) {
      closeAll();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

function setupMobileInteractions() {
  const hamburger = document.getElementById('mega-hamburger');
  const drawer = document.getElementById('mega-mobile-drawer');
  const backdrop = document.getElementById('mega-mobile-backdrop');
  const closeBtn = document.getElementById('mega-mobile-close');

  function openMobile() {
    drawer?.classList.add('is-open');
    drawer?.setAttribute('aria-hidden', 'false');
    backdrop?.classList.add('is-visible');
    hamburger?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('mega-menu-open');
  }

  function closeMobile() {
    drawer?.classList.remove('is-open');
    drawer?.setAttribute('aria-hidden', 'true');
    backdrop?.classList.remove('is-visible');
    hamburger?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('mega-menu-open');
  }

  hamburger?.addEventListener('click', () => {
    hamburger.getAttribute('aria-expanded') === 'true' ? closeMobile() : openMobile();
  });

  closeBtn?.addEventListener('click', closeMobile);
  backdrop?.addEventListener('click', closeMobile);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobile();
  });

  document.querySelectorAll('.mega-mob-group-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      body?.setAttribute('aria-hidden', String(expanded));
      body?.classList.toggle('is-open', !expanded);
    });
  });

  document.querySelectorAll('.mega-mob-cat-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      body?.setAttribute('aria-hidden', String(expanded));
      body?.classList.toggle('is-open', !expanded);
    });
  });
}

export function initMegaMenu() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const oldNav = header.querySelector('.main-nav');
  if (oldNav) oldNav.remove();

  const navRow = header.querySelector('.nav-row');
  if (navRow) {
    navRow.insertAdjacentHTML('beforeend', buildNavHTML());
  }

  header.insertAdjacentHTML('beforeend', buildPanelsHTML());
  header.insertAdjacentHTML('afterend', buildMobileDrawerHTML());

  markActivePage();
  setupDesktopInteractions();
  setupMobileInteractions();
}
