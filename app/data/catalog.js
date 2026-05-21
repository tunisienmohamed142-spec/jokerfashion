function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' och ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const TARGET_GROUPS = [
  {
    id: 'kvinna',
    name: 'Kvinna',
    legacyIds: ['women'],
    description: 'Shoppa damkollektionen med egna kategorier och underkategorier.',
    icon: '👠',
    order: 0,
  },
  {
    id: 'man',
    name: 'Man',
    legacyIds: ['men'],
    description: 'Shoppa herrsortimentet med tydlig navigation per kategori.',
    icon: '🧥',
    order: 1,
  },
  {
    id: 'barn',
    name: 'Barn',
    legacyIds: ['kids'],
    description: 'Shoppa barnsortimentet med redo MVP-struktur som går att bygga vidare på.',
    icon: '🧒',
    order: 2,
  },
];

export const DEFAULT_TARGET_GROUP_ID = TARGET_GROUPS[0].id;

const MAIN_CATEGORY_DEFS = [
  {
    key: 'klader',
    name: 'Kläder',
    icon: '👕',
    descriptions: {
      kvinna: 'Kvinnans kläder – från klänningar och toppar till jackor och stickat.',
      man: 'Mannens kläder – jeans, jackor, hoodies och vardagsbaser.',
      barn: 'Barnkläder redo att fyllas ut med fler underkategorier över tid.',
    },
  },
  {
    key: 'skor',
    name: 'Skor',
    icon: '👟',
    descriptions: {
      kvinna: 'Kvinnans skor – sneakers, loafers, tofflor och högklackat.',
      man: 'Mannens skor – sneakers, kängor och tofflor.',
      barn: 'Barnskor med enkel MVP-struktur som kan utökas vid behov.',
    },
  },
  {
    key: 'accessoarer',
    name: 'Accessoarer',
    icon: '👜',
    descriptions: {
      kvinna: 'Kvinnans accessoarer – väskor, smycken, klockor och mer.',
      man: 'Mannens accessoarer – klockor, solglasögon, väskor och detaljer.',
      barn: 'Barnaccessoarer som idag startar enkelt men kan byggas ut i admin.',
    },
  },
  {
    key: 'sport',
    name: 'Sport',
    icon: '🏀',
    descriptions: {
      kvinna: 'Kvinnans sportutbud – just nu med träningskläder som bas.',
      man: 'Mannens sportutbud – fotbolls- och basketplagg plus skor.',
      barn: 'Barnsport med praktisk grundstruktur för framtida sortiment.',
    },
  },
];

const SUBCATEGORY_DEFS = {
  man: {
    klader: ['Jeans', 'Jackor', 'T-shirts & pikeer', 'Tröjor & Hoddies', 'Byxor', 'Västar', 'Underkläder & Strumpor'],
    skor: ['Sneakers', 'Kängor', 'Tofflor'],
    accessoarer: [
      'Klockor',
      'Solglasögon',
      'Mössor & Hattar',
      'Plånböcker & fodral',
      'Smycken',
      'Bälten',
      'Midjeväskor',
      'Ryggsäckar',
    ],
    sport: ['Fotbollströjor', 'Fotbollsskor', 'Baskettröjor'],
  },
  kvinna: {
    klader: ['Byxor', 'Jackor', 'Klänningar', 'Toppar', 'Linnen', 'Tröjor & Hoddies'],
    skor: ['Sneakers', 'Tofflor', 'Högklackar', 'Loafers'],
    accessoarer: ['Väskor', 'Smycken', 'Mössor & Kepsar', 'Skärp', 'Klockor', 'Plånböcker & fodral'],
    sport: ['Träningskläder'],
  },
  barn: {
    klader: ['Alla barnkläder'],
    skor: ['Alla barnskor'],
    accessoarer: ['Alla accessoarer'],
    sport: ['Alla sportprodukter'],
  },
};

function buildMainCategoryId(targetGroupId, mainCategoryKey) {
  return `${targetGroupId}-${mainCategoryKey}`;
}

function buildSubcategoryId(targetGroupId, mainCategoryKey, name) {
  return `${targetGroupId}-${mainCategoryKey}-${slugify(name)}`;
}

function sortByOrderThenName(a, b) {
  return (Number(a.order) || 0) - (Number(b.order) || 0) || String(a.name).localeCompare(String(b.name), 'sv');
}

const BUILT_IN_MAIN_CATEGORIES = TARGET_GROUPS.flatMap((targetGroup) =>
  MAIN_CATEGORY_DEFS.map((mainCategory, index) => ({
    id: buildMainCategoryId(targetGroup.id, mainCategory.key),
    targetGroup: targetGroup.id,
    mainKey: mainCategory.key,
    name: mainCategory.name,
    description: mainCategory.descriptions[targetGroup.id] || '',
    icon: mainCategory.icon,
    level: 'main',
    order: targetGroup.order * 100 + index,
    isBuiltIn: true,
  }))
);

const BUILT_IN_SUBCATEGORIES = TARGET_GROUPS.flatMap((targetGroup) =>
  MAIN_CATEGORY_DEFS.flatMap((mainCategory, mainIndex) => {
    const visibleSubcategories = SUBCATEGORY_DEFS[targetGroup.id]?.[mainCategory.key] || [];
    const parentId = buildMainCategoryId(targetGroup.id, mainCategory.key);
    const visibleNodes = visibleSubcategories.map((name, index) => ({
      id: buildSubcategoryId(targetGroup.id, mainCategory.key, name),
      targetGroup: targetGroup.id,
      mainKey: mainCategory.key,
      parentId,
      name,
      description: `${name} inom ${targetGroup.name.toLowerCase()} → ${mainCategory.name.toLowerCase()}.`,
      icon: mainCategory.icon,
      level: 'subcategory',
      order: targetGroup.order * 1000 + mainIndex * 100 + index,
      isBuiltIn: true,
    }));

    const fallbackNode = {
      id: `${parentId}-fallback`,
      targetGroup: targetGroup.id,
      mainKey: mainCategory.key,
      parentId,
      name: `Allt i ${mainCategory.name.toLowerCase()}`,
      description: `Systemfallback för äldre produkter utan tydlig underkategori i ${targetGroup.name.toLowerCase()} → ${mainCategory.name.toLowerCase()}.`,
      icon: mainCategory.icon,
      level: 'subcategory',
      order: targetGroup.order * 1000 + mainIndex * 100 + 99,
      isBuiltIn: true,
      hiddenFromNavigation: true,
      isSystemFallback: true,
    };

    return [...visibleNodes, fallbackNode];
  })
);

export const categories = [...BUILT_IN_MAIN_CATEGORIES, ...BUILT_IN_SUBCATEGORIES];

const LEGACY_TARGET_GROUP_IDS = TARGET_GROUPS.reduce((map, targetGroup) => {
  map[targetGroup.id] = targetGroup.id;
  targetGroup.legacyIds.forEach((legacyId) => {
    map[legacyId] = targetGroup.id;
  });
  return map;
}, {});

const LEGACY_PRODUCT_CATEGORY_MAP = {
  women: { targetGroupId: 'kvinna', mainCategoryId: 'kvinna-klader' },
  men: { targetGroupId: 'man', mainCategoryId: 'man-klader' },
  kids: { targetGroupId: 'barn', mainCategoryId: 'barn-klader' },
  accessories: { targetGroupId: 'kvinna', mainCategoryId: 'kvinna-accessoarer' },
};

function normalizeCategory(category) {
  if (!category || typeof category !== 'object') {
    return null;
  }

  const targetGroup = normalizeTargetGroupId(category.targetGroup || category.targetGroupId || '');
  const level = category.level === 'main' ? 'main' : 'subcategory';
  const parentId = String(category.parentId || category.mainCategory || category.mainCategoryId || '').trim();

  return {
    ...category,
    targetGroup,
    level,
    parentId: level === 'subcategory' ? parentId : '',
    hiddenFromNavigation: Boolean(category.hiddenFromNavigation),
    order: Number.isFinite(Number(category.order)) ? Number(category.order) : 9999,
  };
}

function getNormalizedCategories(categoryList = categories) {
  return categoryList.map(normalizeCategory).filter(Boolean);
}

export function normalizeTargetGroupId(targetGroupId) {
  return LEGACY_TARGET_GROUP_IDS[String(targetGroupId || '').trim().toLowerCase()] || '';
}

export function getTargetGroupById(targetGroupId) {
  const normalizedId = normalizeTargetGroupId(targetGroupId);
  return TARGET_GROUPS.find((targetGroup) => targetGroup.id === normalizedId) || TARGET_GROUPS[0];
}

export function getCategoryById(categoryId, categoryList = categories) {
  const normalizedId = String(categoryId || '').trim();
  return getNormalizedCategories(categoryList).find((category) => category.id === normalizedId) || null;
}

export function getMainCategoriesForTargetGroup(categoryList, targetGroupId) {
  const normalizedTargetGroup = normalizeTargetGroupId(targetGroupId);
  return getNormalizedCategories(categoryList)
    .filter((category) => category.level === 'main' && category.targetGroup === normalizedTargetGroup)
    .sort(sortByOrderThenName);
}

export function getSubcategoriesForMainCategory(categoryList, parentId, options = {}) {
  const { includeHidden = false } = options;
  return getNormalizedCategories(categoryList)
    .filter((category) => category.level === 'subcategory' && category.parentId === parentId)
    .filter((category) => includeHidden || !category.hiddenFromNavigation)
    .sort(sortByOrderThenName);
}

export function getSubcategoryOptions(categoryList) {
  return getNormalizedCategories(categoryList)
    .filter((category) => category.level === 'subcategory' && !category.hiddenFromNavigation)
    .sort(sortByOrderThenName);
}

export function getMainCategoryPlacementOptions() {
  return TARGET_GROUPS.flatMap((targetGroup) =>
    MAIN_CATEGORY_DEFS.map((mainCategory) => ({
      id: buildMainCategoryId(targetGroup.id, mainCategory.key),
      targetGroupId: targetGroup.id,
      targetGroupName: targetGroup.name,
      mainCategoryName: mainCategory.name,
      label: `${targetGroup.name} / ${mainCategory.name}`,
    }))
  );
}

export function buildCatalogUrl({ targetGroupId, mainCategoryId, subcategoryId, productId } = {}) {
  const params = new URLSearchParams();

  if (targetGroupId) {
    params.set('targetGroup', targetGroupId);
  }
  if (mainCategoryId) {
    params.set('category', mainCategoryId);
  }
  if (subcategoryId) {
    params.set('subcategory', subcategoryId);
  }
  if (productId) {
    params.set('product', productId);
  }

  const query = params.toString();
  return `catalog.html${query ? `?${query}` : ''}`;
}

export function formatTaxonomyPath(taxonomy, options = {}) {
  if (!taxonomy) {
    return '';
  }

  const { includeTargetGroup = true, separator = ' / ' } = options;
  const parts = [];

  if (includeTargetGroup && taxonomy.targetGroup?.name) {
    parts.push(taxonomy.targetGroup.name);
  }
  if (taxonomy.mainCategory?.name) {
    parts.push(taxonomy.mainCategory.name);
  }
  if (taxonomy.subcategory?.name && taxonomy.subcategory.id !== taxonomy.mainCategory?.id) {
    parts.push(taxonomy.subcategory.name);
  }

  return parts.join(separator);
}

export function resolveProductTaxonomy(product, categoryList = categories) {
  const allCategories = getNormalizedCategories(categoryList);
  const explicitSubcategoryId = String(product?.subcategory || product?.subcategoryId || product?.category || '').trim();
  const explicitMainCategoryId = String(product?.mainCategory || product?.mainCategoryId || '').trim();
  const legacyProductCategory = String(product?.category || '').trim();

  let subcategory = getCategoryById(explicitSubcategoryId, allCategories);
  let mainCategory = getCategoryById(explicitMainCategoryId, allCategories);
  let targetGroupId = normalizeTargetGroupId(product?.targetGroup || product?.targetGroupId || '');

  if (subcategory?.level === 'main') {
    mainCategory = subcategory;
    subcategory = null;
  }

  if (!mainCategory && subcategory?.parentId) {
    mainCategory = getCategoryById(subcategory.parentId, allCategories);
  }

  if (!targetGroupId) {
    targetGroupId = normalizeTargetGroupId(subcategory?.targetGroup || mainCategory?.targetGroup || '');
  }

  if ((!mainCategory || !targetGroupId) && LEGACY_PRODUCT_CATEGORY_MAP[legacyProductCategory]) {
    const legacyMapping = LEGACY_PRODUCT_CATEGORY_MAP[legacyProductCategory];
    targetGroupId = targetGroupId || legacyMapping.targetGroupId;
    mainCategory = mainCategory || getCategoryById(legacyMapping.mainCategoryId, allCategories);
  }

  targetGroupId = targetGroupId || DEFAULT_TARGET_GROUP_ID;

  if (!mainCategory) {
    mainCategory = getMainCategoriesForTargetGroup(allCategories, targetGroupId)[0] || null;
  }

  if (!subcategory || subcategory.parentId !== mainCategory?.id) {
    const fallbackSubcategoryId = `${mainCategory?.id || ''}-fallback`;
    subcategory =
      getSubcategoriesForMainCategory(allCategories, mainCategory?.id, { includeHidden: true }).find(
        (category) => category.id === explicitSubcategoryId
      ) ||
      getSubcategoriesForMainCategory(allCategories, mainCategory?.id)[0] ||
      getCategoryById(fallbackSubcategoryId, allCategories);
  }

  const targetGroup = getTargetGroupById(targetGroupId);

  return {
    targetGroupId,
    targetGroup,
    mainCategoryId: mainCategory?.id || '',
    mainCategory,
    subcategoryId: subcategory?.id || '',
    subcategory,
    categoryId: subcategory?.id || mainCategory?.id || '',
  };
}

export const baseProducts = [
  {
    id: 'jf-w-001',
    name: 'Chaos Tailored Blazer',
    targetGroup: 'kvinna',
    mainCategory: 'kvinna-klader',
    subcategory: 'kvinna-klader-jackor',
    category: 'kvinna-klader-jackor',
    priceSek: 1499,
    badge: 'Ny',
    isNew: true,
    isFeatured: true,
    description: 'Skarp silhuett med satinrevers, lila lining och tydlig Joker-attityd.',
    story: 'Designad för kvällar där du vill bära couture-känsla med street edge.',
    highlights: ['Satinrevers', 'Rak oversized passform', 'Snabb leverans 2–4 dagar'],
    sizes: ['XS', 'S', 'M', 'L'],
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-w-002',
    name: 'Midnight Pleat Dress',
    targetGroup: 'kvinna',
    mainCategory: 'kvinna-klader',
    subcategory: 'kvinna-klader-klanningar',
    category: 'kvinna-klader-klanningar',
    priceSek: 1199,
    badge: 'Bestseller',
    isBestseller: true,
    isFeatured: true,
    description: 'Mörk plissering, markerad midja och neonaccent för sena citykvällar.',
    story: 'Ett statement-plagg för en dramatisk men bärbar Joker-look.',
    highlights: ['Plisserad kjol', 'Mjuk innerlining', 'Begränsad drop'],
    sizes: ['XS', 'S', 'M', 'L'],
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-w-003',
    name: 'Velvet Shadow Coat',
    targetGroup: 'kvinna',
    mainCategory: 'kvinna-klader',
    subcategory: 'kvinna-klader-jackor',
    category: 'kvinna-klader-jackor',
    priceSek: 1899,
    badge: 'Ny',
    isNew: true,
    description: 'Sammetskappa med djupsvart finish, strukturerade axlar och dramatisk silhuett.',
    story: 'För den som vill ta upp mer plats i rummet och göra entré med stillhet.',
    highlights: ['Sammetsmaterial', 'Strukturerade axlar', 'Blixtlåsfickor'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-w-004',
    name: 'Purple Rain Corset Top',
    targetGroup: 'kvinna',
    mainCategory: 'kvinna-klader',
    subcategory: 'kvinna-klader-toppar',
    category: 'kvinna-klader-toppar',
    priceSek: 699,
    badge: 'Populär',
    isBestseller: true,
    description: 'Korsetttopp i lila med benboning, satinskärp och unik Joker-finish.',
    story: 'Bär den till matchande byxor eller som statement-piece över en oversized skjorta.',
    highlights: ['Benboning', 'Satinskärp', 'Korsett-konstruktion'],
    sizes: ['XS', 'S', 'M', 'L'],
    image:
      'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-m-001',
    name: 'Riot Bomber Jacket',
    targetGroup: 'man',
    mainCategory: 'man-klader',
    subcategory: 'man-klader-jackor',
    category: 'man-klader-jackor',
    priceSek: 1399,
    badge: 'Populär',
    isBestseller: true,
    isFeatured: true,
    description: 'Bomberjacka med grafisk kontrast, lätt vaddering och premiumkänsla.',
    story: 'Byggd för lager-på-lager-styling med maximal Joker-energi.',
    highlights: ['Lätt vadderad', 'Kontrastfoder', 'Signaturfinish i neon'],
    sizes: ['S', 'M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-m-002',
    name: 'Nocturne Cargo Pant',
    targetGroup: 'man',
    mainCategory: 'man-klader',
    subcategory: 'man-klader-byxor',
    category: 'man-klader-byxor',
    priceSek: 899,
    badge: 'Populär',
    isFeatured: true,
    description: 'Teknisk cargo med avsmalnande ben, stretch och nattmörk palett.',
    story: 'En vardagsbas som ändå känns exklusiv i en Joker-inspirerad garderob.',
    highlights: ['Teknisk stretch', 'Flera fickor', 'Smidig passform'],
    sizes: ['S', 'M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-m-003',
    name: 'Joker Signature Hoodie',
    targetGroup: 'man',
    mainCategory: 'man-klader',
    subcategory: 'man-klader-t-shirts-och-pikeer',
    category: 'man-klader-t-shirts-och-pikeer',
    priceSek: 799,
    badge: 'Ny',
    isNew: true,
    description: 'Tungviktshoodie med broderat Joker-motiv, ribbed manschetter och boxig passform.',
    story: 'Gjord för den som vill ha comfort och statement i ett och samma plagg.',
    highlights: ['Tungvikt fleece', 'Broderat motiv', 'Ribbed manschetter'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    image:
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-m-004',
    name: 'Chaos Utility Vest',
    targetGroup: 'man',
    mainCategory: 'man-klader',
    subcategory: 'man-klader-vastar',
    category: 'man-klader-vastar',
    priceSek: 649,
    badge: 'Populär',
    description: 'Tactical utility-väst med flera fickor, justerbar passform och robust material.',
    story: 'Lager-på-lager eller solo — västen tar din look till en annan nivå.',
    highlights: ['Tactical design', '6 fickor', 'Justerbar passform'],
    sizes: ['S', 'M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-k-001',
    name: 'Electric Smile Hoodie',
    targetGroup: 'barn',
    mainCategory: 'barn-klader',
    subcategory: 'barn-klader-alla-barnklader',
    category: 'barn-klader-alla-barnklader',
    priceSek: 549,
    badge: 'Bestseller',
    isBestseller: true,
    description: 'Mjuk hoodie med färgstark energi, borstad insida och lekfull twist.',
    story: 'För barn som vill bära färg, komfort och lite kaos i samma plagg.',
    highlights: ['Borstad insida', 'Maskintvätt 30°', 'Perfekt för vardag'],
    sizes: ['110/116', '122/128', '134/140'],
    image:
      'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-k-002',
    name: 'Mini Riot Jogger',
    targetGroup: 'barn',
    mainCategory: 'barn-klader',
    subcategory: 'barn-klader-alla-barnklader',
    category: 'barn-klader-alla-barnklader',
    priceSek: 349,
    badge: 'Ny',
    isNew: true,
    description: 'Bekväma joggers med elastisk midja, sidofickor och lekfull grön kant.',
    story: 'Perfekt för lek, skola och allt däremellan — barnens svar på Joker Cargo.',
    highlights: ['Elastisk midja', 'Mjuk bomull', 'Lekfull neonkant'],
    sizes: ['110/116', '122/128', '134/140', '146/152'],
    image:
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-a-001',
    name: 'Neon Edge Tote',
    targetGroup: 'kvinna',
    mainCategory: 'kvinna-accessoarer',
    subcategory: 'kvinna-accessoarer-vaskor',
    category: 'kvinna-accessoarer-vaskor',
    priceSek: 399,
    badge: 'Populär',
    isBestseller: true,
    isFeatured: true,
    description: 'Rymlig tote med kontrasterande bärremmar och city-ready uttryck.',
    story: 'En enkel accessoar som lyfter hela outfiten med Joker-signatur.',
    highlights: ['Invändig ficka', 'Canvas med struktur', 'One size'],
    sizes: ['One size'],
    image:
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-a-002',
    name: 'Chaos Chain Belt',
    targetGroup: 'man',
    mainCategory: 'man-accessoarer',
    subcategory: 'man-accessoarer-balten',
    category: 'man-accessoarer-balten',
    priceSek: 299,
    badge: 'Ny',
    isNew: true,
    description: 'Tung metallkedja med matte black finish och karabinhakar — bär som bälte eller axelkedja.',
    story: 'En accessoar med attityd som styr hela outfitens energi.',
    highlights: ['Matte black finish', 'Justerbar längd', 'Karabinhake-stängning'],
    sizes: ['One size'],
    image:
      'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-a-003',
    name: 'Joker Cap',
    targetGroup: 'kvinna',
    mainCategory: 'kvinna-accessoarer',
    subcategory: 'kvinna-accessoarer-mossor-och-kepsar',
    category: 'kvinna-accessoarer-mossor-och-kepsar',
    priceSek: 249,
    badge: 'Populär',
    isBestseller: true,
    description: 'Snapback-keps med broderat Joker-märke, strukturerad kulle och justerbara passform.',
    story: 'Det sista pusselbiten i din Joker-look — från street till statement.',
    highlights: ['Broderat märke', 'Strukturerad kulle', 'Snapback-stängning'],
    sizes: ['One size'],
    image:
      'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=900&q=80',
  },
];
