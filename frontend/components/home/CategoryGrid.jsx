import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    name: "Ghee",
    href: "/shop/ghee",
    image: "https://images.unsplash.com/photo-1631206753348-db44968fd440?w=800&q=80",
  },
  {
    name: "Panchagavya Products",
    href: "/shop/panchagavya",
    image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=800&q=80",
  },
  {
    name: "Puja Products",
    href: "/shop/puja",
    image: "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800&q=80",
  },
  {
    name: "Natural & Organic",
    href: "/shop/natural",
    image: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=800&q=80",
  },
];

/**
 * Static for now — Stage 5 (admin > homepage content) will make this
 * list editable instead of hardcoded.
 */
export default function CategoryGrid() {
  return (
    <section className="mx-auto max-w-content px-6 py-16 md:px-8">
      <h2 className="font-display text-2xl font-medium text-ink md:text-3xl">
        Shop by category
      </h2>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
        {CATEGORIES.map((cat) => (
          <Link key={cat.href} href={cat.href} className="group block">
            <div className="aspect-square overflow-hidden rounded-2xl bg-line">
              <Image
                src={cat.image}
                alt={cat.name}
                width={400}
                height={400}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{cat.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
