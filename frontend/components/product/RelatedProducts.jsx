import ProductCard from "@/components/product/ProductCard";

export default function RelatedProducts({ products }) {
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-content px-6 py-14 md:px-8">
      <h2 className="font-display text-xl text-ink md:text-2xl">
        You may also like
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </section>
  );
}
