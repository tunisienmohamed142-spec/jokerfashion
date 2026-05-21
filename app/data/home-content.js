const INTERNAL_BASE_URL = 'https://jokerfashion.local';

export const DEFAULT_HOME_CONTENT = {
  hero: {
    eyebrow: 'JokerFashion Atelier',
    title: 'Premium street couture med Joker-signatur',
    body: 'Kuraterade kollektioner med dramatisk silhuett, statement-detaljer och Joker-attityd. Shoppa dam, herr, barn och accessoarer.',
    primaryCtaLabel: 'Shoppa kollektion',
    primaryCtaHref: '/catalog.html',
    secondaryCtaLabel: 'Öppna varukorg',
    secondaryCtaHref: '/checkout.html',
  },
  highlight: {
    eyebrow: 'Nytt i kollektionen',
    title: 'Senaste dropparna',
    body: 'Utforska nya statement-plagg och senaste accessoarer — limited drops och exklusiva silhuetter.',
    primaryCtaLabel: 'Dam',
    primaryCtaHref: '/catalog.html?category=women',
    secondaryCtaLabel: 'Herr',
    secondaryCtaHref: '/catalog.html?category=men',
  },
  categoriesSection: {
    eyebrow: 'Shoppa efter avdelning',
    title: 'Kollektioner',
  },
  featuredSection: {
    eyebrow: 'Utvalda produkter',
    title: 'Joker-kuraterat sortiment',
    ctaLabel: 'Se hela katalogen',
    ctaHref: '/catalog.html',
  },
  newArrivalsSection: {
    eyebrow: 'Nyast i lager',
    title: 'Nya kollektionen',
    ctaLabel: 'Se alla nyheter',
    ctaHref: '/catalog.html',
  },
  footer: {
    marketingLine: 'JokerFashion • Fri frakt över 999 kr • 14 dagars öppet köp • Leverans 2–4 dagar',
  },
};

function sanitizeText(value, fallback, maxLength = 280) {
  const nextValue = String(value || '').trim();
  return nextValue ? nextValue.slice(0, maxLength) : fallback;
}

export function sanitizeContentLink(value, fallback) {
  const raw = String(value || '').trim();
  if (!raw || /[\u0000-\u001F]/.test(raw)) {
    return fallback;
  }

  try {
    const parsed = new URL(raw, INTERNAL_BASE_URL);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return fallback;
    }

    if (parsed.origin === INTERNAL_BASE_URL) {
      const relativePath = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      return relativePath || fallback;
    }

    return parsed.href;
  } catch {
    return fallback;
  }
}

export function mergeHomeContent(input = {}, baseContent = DEFAULT_HOME_CONTENT) {
  const source = input && typeof input === 'object' ? input : {};

  return {
    hero: {
      eyebrow: sanitizeText(source.hero?.eyebrow, baseContent.hero.eyebrow, 80),
      title: sanitizeText(source.hero?.title, baseContent.hero.title, 160),
      body: sanitizeText(source.hero?.body, baseContent.hero.body, 320),
      primaryCtaLabel: sanitizeText(source.hero?.primaryCtaLabel, baseContent.hero.primaryCtaLabel, 50),
      primaryCtaHref: sanitizeContentLink(source.hero?.primaryCtaHref, baseContent.hero.primaryCtaHref),
      secondaryCtaLabel: sanitizeText(
        source.hero?.secondaryCtaLabel,
        baseContent.hero.secondaryCtaLabel,
        50
      ),
      secondaryCtaHref: sanitizeContentLink(
        source.hero?.secondaryCtaHref,
        baseContent.hero.secondaryCtaHref
      ),
    },
    highlight: {
      eyebrow: sanitizeText(source.highlight?.eyebrow, baseContent.highlight.eyebrow, 80),
      title: sanitizeText(source.highlight?.title, baseContent.highlight.title, 140),
      body: sanitizeText(source.highlight?.body, baseContent.highlight.body, 280),
      primaryCtaLabel: sanitizeText(
        source.highlight?.primaryCtaLabel,
        baseContent.highlight.primaryCtaLabel,
        50
      ),
      primaryCtaHref: sanitizeContentLink(
        source.highlight?.primaryCtaHref,
        baseContent.highlight.primaryCtaHref
      ),
      secondaryCtaLabel: sanitizeText(
        source.highlight?.secondaryCtaLabel,
        baseContent.highlight.secondaryCtaLabel,
        50
      ),
      secondaryCtaHref: sanitizeContentLink(
        source.highlight?.secondaryCtaHref,
        baseContent.highlight.secondaryCtaHref
      ),
    },
    categoriesSection: {
      eyebrow: sanitizeText(
        source.categoriesSection?.eyebrow,
        baseContent.categoriesSection.eyebrow,
        80
      ),
      title: sanitizeText(source.categoriesSection?.title, baseContent.categoriesSection.title, 120),
    },
    featuredSection: {
      eyebrow: sanitizeText(source.featuredSection?.eyebrow, baseContent.featuredSection.eyebrow, 80),
      title: sanitizeText(source.featuredSection?.title, baseContent.featuredSection.title, 120),
      ctaLabel: sanitizeText(source.featuredSection?.ctaLabel, baseContent.featuredSection.ctaLabel, 50),
      ctaHref: sanitizeContentLink(source.featuredSection?.ctaHref, baseContent.featuredSection.ctaHref),
    },
    newArrivalsSection: {
      eyebrow: sanitizeText(
        source.newArrivalsSection?.eyebrow,
        baseContent.newArrivalsSection.eyebrow,
        80
      ),
      title: sanitizeText(
        source.newArrivalsSection?.title,
        baseContent.newArrivalsSection.title,
        120
      ),
      ctaLabel: sanitizeText(
        source.newArrivalsSection?.ctaLabel,
        baseContent.newArrivalsSection.ctaLabel,
        50
      ),
      ctaHref: sanitizeContentLink(
        source.newArrivalsSection?.ctaHref,
        baseContent.newArrivalsSection.ctaHref
      ),
    },
    footer: {
      marketingLine: sanitizeText(source.footer?.marketingLine, baseContent.footer.marketingLine, 220),
    },
  };
}
