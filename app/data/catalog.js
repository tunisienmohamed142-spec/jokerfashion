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
    category: 'women',
    priceSek: 1199,
    badge: 'Limited',
    description: 'Mörk plissering, markerad midja och neonaccent för sena citykvällar.',
    story: 'Ett statement-plagg för en dramatisk men bärbar Joker-look.',
    highlights: ['Plisserad kjol', 'Mjuk innerlining', 'Begränsad drop'],
    sizes: ['XS', 'S', 'M', 'L'],
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-m-001',
    name: 'Riot Bomber Jacket',
    category: 'men',
    priceSek: 1399,
    badge: 'Popular',
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
    category: 'men',
    priceSek: 899,
    badge: 'Drop',
    description: 'Teknisk cargo med avsmalnande ben, stretch och nattmörk palett.',
    story: 'En vardagsbas som ändå känns exklusiv i en Joker-inspirerad garderob.',
    highlights: ['Teknisk stretch', 'Flera fickor', 'Smidig passform'],
    sizes: ['S', 'M', 'L', 'XL'],
    image:
      'https://images.unsplash.com/photo-1507680434567-5739c80be1ac?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-k-001',
    name: 'Electric Smile Hoodie',
    category: 'kids',
    priceSek: 549,
    badge: 'Kids',
    description: 'Mjuk hoodie med färgstark energi, borstad insida och lekfull twist.',
    story: 'För barn som vill bära färg, komfort och lite kaos i samma plagg.',
    highlights: ['Borstad insida', 'Maskintvätt 30°', 'Perfekt för vardag'],
    sizes: ['110/116', '122/128', '134/140'],
    image:
      'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&w=900&q=80',
  },
  {
    id: 'jf-a-001',
    name: 'Neon Edge Tote',
    category: 'accessories',
    priceSek: 399,
    badge: 'Accessory',
    description: 'Rymlig tote med kontrasterande bärremmar och city-ready uttryck.',
    story: 'En enkel accessoar som lyfter hela outfiten med Joker-signatur.',
    highlights: ['Invändig ficka', 'Canvas med struktur', 'One size'],
    sizes: ['One size'],
    image:
      'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80',
  },
];

export function getCategoryById(categoryId) {
  return categories.find((category) => category.id === categoryId);
}
