// Stand-in for GET /api/products until Stage 3 connects the real backend.
// Shape mirrors backend/models/Product.js so swapping the data source
// later doesn't require touching ProductCard, the shop page, or the
// product detail page.

const img = (id) => `https://images.unsplash.com/${id}?w=900&q=80`;

export const PRODUCTS = [
  {
    slug: "bilona-cow-ghee-500ml",
    name: "Bilona Cow Ghee",
    category: "ghee",
    shortDescription: "Hand-churned, single-batch ghee from grass-fed cows.",
    description:
      "Made using the traditional bilona method — curd is hand-churned, and the butter is slow-cooked over a wood fire, exactly as our goshala has done it for generations. Rich, grainy texture and a deep aroma that machine-made ghee doesn't have.",
    ingredients: "100% cow milk (from grass-fed goshala cows).",
    usageInstructions: "Store in a cool, dry place. Use a dry spoon each time.",
    images: [img("photo-1631206753348-db44968fd440"), img("photo-1631206753348-db44968fd440")],
    variants: [
      { id: "500ml", label: "500ml", price: 899, compareAtPrice: 999, stock: 24 },
      { id: "1l", label: "1L", price: 1699, compareAtPrice: 1899, stock: 12 },
    ],
    basePrice: 899,
    compareAtPrice: 999,
    ratingsAverage: 4.8,
    ratingsCount: 156,
    tags: ["bestseller"],
  },
  {
    slug: "a2-desi-cow-ghee-1l",
    name: "A2 Desi Cow Ghee",
    category: "ghee",
    shortDescription: "From our native Gir cows, slow-simmered in small batches.",
    description:
      "Sourced only from our A2 Gir cows and finished in small batches so quality never gets diluted across a large run. A pale gold color and a naturally sweet, nutty finish.",
    ingredients: "100% A2 cow milk.",
    usageInstructions: "Best kept below 30°C. Solidifies in winter — this is natural.",
    images: [img("photo-1628088062854-d1870b4553da")],
    variants: [
      { id: "500ml", label: "500ml", price: 949, stock: 18 },
      { id: "1l", label: "1L", price: 1799, stock: 9 },
    ],
    basePrice: 949,
    ratingsAverage: 4.9,
    ratingsCount: 88,
    tags: ["bestseller"],
  },
  {
    slug: "panchagavya-soap",
    name: "Panchagavya Herbal Soap",
    category: "panchagavya",
    shortDescription: "Cold-pressed soap with panchagavya and neem.",
    description:
      "A gentle, cold-pressed soap made with panchagavya and neem, formulated with our goshala's own products rather than store-bought bases. No sulphates, no synthetic fragrance.",
    ingredients: "Panchagavya, neem oil, coconut oil, natural glycerin.",
    usageInstructions: "For external use. Store in a dry soap dish between uses.",
    images: [img("photo-1600857544200-b2f666a9a2ec")],
    variants: [{ id: "100g", label: "100g", price: 149, stock: 60 }],
    basePrice: 149,
    ratingsAverage: 4.6,
    ratingsCount: 41,
    tags: [],
  },
  {
    slug: "panchagavya-dhoop",
    name: "Panchagavya Dhoop Sticks",
    category: "panchagavya",
    shortDescription: "Hand-rolled dhoop made with cow dung and natural resins.",
    description:
      "Hand-rolled at the goshala using cow dung, ghee, and natural resins — no charcoal, no synthetic binders. A slow, earthy fragrance suited for daily puja.",
    ingredients: "Cow dung, ghee, natural resins, herbs.",
    usageInstructions: "Light one end and place in a heat-safe holder.",
    images: [img("photo-1602928321679-e2ce239dfa63")],
    variants: [{ id: "pack-20", label: "Pack of 20", price: 199, stock: 40 }],
    basePrice: 199,
    ratingsAverage: 4.7,
    ratingsCount: 29,
    tags: [],
  },
  {
    slug: "puja-cotton-wicks",
    name: "Cotton Diya Wicks",
    category: "puja",
    shortDescription: "Hand-rolled cotton wicks for daily aarti.",
    description:
      "Hand-rolled from pure cotton by goshala volunteers. Burns evenly and cleanly, without the black soot that mill-made wicks leave behind.",
    ingredients: "100% cotton.",
    usageInstructions: "Use with ghee or sesame oil diyas.",
    images: [img("photo-1604881991720-f91add269bed")],
    variants: [{ id: "pack-50", label: "Pack of 50", price: 79, stock: 100 }],
    basePrice: 79,
    ratingsAverage: 4.5,
    ratingsCount: 18,
    tags: [],
  },
  {
    slug: "gomutra-ark",
    name: "Gomutra Ark",
    category: "panchagavya",
    shortDescription: "Distilled cow urine, traditionally prepared.",
    description:
      "Distilled and prepared following traditional methods used in goshalas for generations. Prepared in small batches under supervision.",
    ingredients: "Distilled gomutra (cow urine).",
    usageInstructions: "Follow a practitioner's guidance for use and dosage.",
    images: [img("photo-1611080626919-7cf5a9dbab5b")],
    variants: [{ id: "500ml", label: "500ml", price: 249, stock: 30 }],
    basePrice: 249,
    ratingsAverage: 4.4,
    ratingsCount: 22,
    tags: [],
  },
  {
    slug: "natural-cow-dung-fertilizer",
    name: "Cow Dung Fertilizer",
    category: "natural",
    shortDescription: "Sun-dried, composted fertilizer for home gardens.",
    description:
      "Fully composted and sun-dried cow dung from our goshala, sieved and packed for home gardens and potted plants. No chemical additives.",
    ingredients: "100% composted cow dung.",
    usageInstructions: "Mix into topsoil; use roughly a handful per medium pot.",
    images: [img("photo-1416879595882-3373a0480b5b")],
    variants: [{ id: "2kg", label: "2kg", price: 199, stock: 50 }],
    basePrice: 199,
    ratingsAverage: 4.3,
    ratingsCount: 14,
    tags: [],
  },
  {
    slug: "natural-turmeric-powder",
    name: "Sun-Dried Turmeric Powder",
    category: "natural",
    shortDescription: "Stone-ground turmeric from goshala farmland.",
    description:
      "Grown on land adjoining the goshala, sun-dried and stone-ground the traditional way — a deeper color and stronger aroma than most powders on the shelf.",
    ingredients: "100% turmeric.",
    usageInstructions: "Store airtight, away from direct sunlight.",
    images: [img("photo-1615485500704-8e990f9900f7")],
    variants: [{ id: "250g", label: "250g", price: 179, stock: 45 }],
    basePrice: 179,
    ratingsAverage: 4.7,
    ratingsCount: 33,
    tags: ["bestseller"],
  },
];

export function getAllProducts() {
  return PRODUCTS;
}

export function getBestSellers(limit = 4) {
  const tagged = PRODUCTS.filter((p) => p.tags.includes("bestseller"));
  const rest = PRODUCTS.filter((p) => !p.tags.includes("bestseller"));
  return [...tagged, ...rest].slice(0, limit);
}

export function getHotProduct() {
  return PRODUCTS.find((p) => p.slug === "bilona-cow-ghee-500ml") ?? PRODUCTS[0];
}

export function getProductBySlug(slug) {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getRelatedProducts(product, limit = 4) {
  return PRODUCTS.filter(
    (p) => p.category === product.category && p.slug !== product.slug
  ).slice(0, limit);
}
