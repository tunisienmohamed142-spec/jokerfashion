const INTERNAL_BASE_URL = 'https://jokerfashion.local';

export const DEFAULT_HOME_CONTENT = {
  hero: {
    eyebrow: 'JokerFashion Signature',
    title: 'Mode med ett vassare leende.',
    body: 'Bär looks med mörk elegans, skarp silhuett och rå Joker-energi. Skapad för dig som vill väcka blickar direkt.',
    primaryCtaLabel: 'Shoppa kampanjen',
    primaryCtaHref: '/catalog.html',
    secondaryCtaLabel: 'Se nya drops',
    secondaryCtaHref: '/catalog.html?targetGroup=man',
  },
  highlight: {
    eyebrow: 'Trending now',
    title: 'Kuraterat för Kvinna & Man',
    body: 'Från statement-ytterplagg till minimalistiska essentials – designat för snabb och smidig shopping.',
    primaryCtaLabel: 'Kvinna',
    primaryCtaHref: '/catalog.html?targetGroup=kvinna',
    secondaryCtaLabel: 'Man',
    secondaryCtaHref: '/catalog.html?targetGroup=man',
  },
  categoriesSection: {
    eyebrow: 'Browse snabbt',
    title: 'Shoppa efter målgrupp',
  },
  featuredSection: {
    eyebrow: 'Populärt just nu',
    title: 'Utvalda premiumprodukter',
    ctaLabel: 'Se hela katalogen',
    ctaHref: '/catalog.html',
  },
  newArrivalsSection: {
    eyebrow: 'Nya släpp',
    title: 'Senaste i sortimentet',
    ctaLabel: 'Se alla nyheter',
    ctaHref: '/catalog.html',
  },
  footer: {
    marketingLine: 'JokerFashion • Exklusiv modekänsla • Fri frakt över 999 kr • Leverans 2–4 dagar',
    followTitle: 'Följ oss',
    instagramUrl: 'https://www.instagram.com/jokerfashion',
    tiktokUrl: 'https://www.tiktok.com/@jokerfashion',
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
      followTitle: sanitizeText(source.footer?.followTitle, baseContent.footer.followTitle, 60),
      instagramUrl: sanitizeContentLink(source.footer?.instagramUrl, baseContent.footer.instagramUrl),
      tiktokUrl: sanitizeContentLink(source.footer?.tiktokUrl, baseContent.footer.tiktokUrl),
    },
  };
}
