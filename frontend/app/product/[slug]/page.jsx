import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/mockProducts";
import { fetchStorefrontProductBySlug } from "@/lib/productUtils";
import ProductDetailView from "@/components/product/ProductDetailView";
import RelatedProducts from "@/components/product/RelatedProducts";

export const dynamicParams = true;

export function generateStaticParams() {
  return getAllProducts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { product } = await fetchStorefrontProductBySlug(params.slug);
  if (!product) return {};

  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images,
    },
  };
}

export default async function ProductPage({ params }) {
  const { product, related } = await fetchStorefrontProductBySlug(params.slug);
  if (!product) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    image: product.images,
    offers: {
      "@type": "Offer",
      price: product.basePrice,
      priceCurrency: "INR",
      availability: product.variants.some((v) => v.stock > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating: product.ratingsCount
      ? {
          "@type": "AggregateRating",
          ratingValue: product.ratingsAverage,
          reviewCount: product.ratingsCount,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProductDetailView product={product} />
      <RelatedProducts products={related} />
    </>
  );
}
