// Stand-in for GET /api/categories until Stage 3 connects the real backend.
// Shape mirrors backend/models/Category.js so swapping later is a
// find-and-replace of the data source, not the components.
export const CATEGORIES = [
  {
    slug: "ghee",
    name: "Ghee",
    image: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600&q=80",
    itemCount: 6,
  },
  {
    slug: "panchagavya",
    name: "Panchagavya Products",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=600&q=80",
    itemCount: 14,
  },
  {
    slug: "puja",
    name: "Puja Products",
    image: "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=600&q=80",
    itemCount: 9,
  },
  {
    slug: "natural",
    name: "Natural & Organic",
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600&q=80",
    itemCount: 11,
  },
];

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug);
}
