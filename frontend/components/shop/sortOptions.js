export const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating", label: "Highest Rated" },
];

export function sortProducts(products, sortId) {
  const list = [...products];
  switch (sortId) {
    case "price-asc":
      return list.sort((a, b) => a.basePrice - b.basePrice);
    case "price-desc":
      return list.sort((a, b) => b.basePrice - a.basePrice);
    case "rating":
      return list.sort((a, b) => b.ratingsAverage - a.ratingsAverage);
    default:
      return list;
  }
}
