export const categories = [
  {
    id: 'women',
    name: 'Dam',
    description: 'Skräddade silhuetter, mörk romantik och statement-plagg.',
  },
  {
    id: 'men',
    name: 'Herr',
    description: 'Street couture med Joker-attityd och tydliga kontraster.',
  },
  {
    id: 'kids',
    name: 'Barn',
    description: 'Lekfulla färgkrockar och bekväm passform för vardag.',
  },
  {
    id: 'accessories',
    name: 'Accessoarer',
    description: 'Detaljer som lyfter varje outfit och bygger looken.',
  },
];

export const baseProducts = [
  {
    id: 'jf-w-001',
    name: 'Chaos Tailored Blazer',
    category: 'women',
    priceSek: 1499,
    badge: 'New',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-w-002',
    name: 'Midnight Pleat Dress',
    category: 'women',
    priceSek: 1199,
    badge: 'Limited',
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-m-001',
    name: 'Riot Bomber Jacket',
    category: 'men',
    priceSek: 1399,
    badge: 'Popular',
    image:
      'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-m-002',
    name: 'Nocturne Cargo Pant',
    category: 'men',
    priceSek: 899,
    badge: 'Drop',
    image:
      'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-k-001',
    name: 'Electric Smile Hoodie',
    category: 'kids',
    priceSek: 549,
    badge: 'Kids',
    image:
      'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-a-001',
    name: 'Neon Edge Tote',
    category: 'accessories',
    priceSek: 399,
    badge: 'Accessory',
    image:
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
  },
];

export function getCategoryById(categoryId) {
  return categories.find((category) => category.id === categoryId);
}
