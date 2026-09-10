import Image from "next/image";
import Button from "@/components/ui/Button";

/**
 * Typography-led hero: the headline itself is the hero, not a stock
 * photo. A single small framed image sits offset in the corner — an
 * accent, not the centerpiece — with a thin marigold rule as the one
 * decorative device, echoing a garland thread rather than a generic
 * gradient underline.
 *
 * The whole block animates in once on load (see .hero-enter in
 * globals.css) — one orchestrated moment, not a fade on every section.
 */
export default function Hero() {
  return (
    <section className="relative mx-auto max-w-content px-6 pb-20 pt-14 md:px-8 md:pb-28 md:pt-20">
      <div className="hero-enter max-w-2xl">
        <span className="block h-[2px] w-14 bg-accent" aria-hidden="true" />
        <h1 className="mt-6 font-display text-[2.75rem] leading-[1.12] text-ink md:text-[4rem]">
          Ghee and goshala goods, made the way our cows deserve.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
          Every product traces back to the same herd and the same hands —
          traditional bilona-churned ghee and panchagavya essentials from
          Brundavanam Goshala.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Button href="/shop">Shop Now</Button>
          <Button href="/donate" variant="secondary">
            Support Our Goshala
          </Button>
        </div>
      </div>

      <div className="hero-enter-delayed absolute right-6 top-14 hidden w-[260px] rotate-2 border-4 border-surface shadow-card lg:right-10 lg:block xl:w-[300px]">
        <div className="aspect-[3/4] w-full overflow-hidden bg-line">
          <Image
            src="https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=800&q=80"
            alt="A cow at Brundavanam Goshala"
            width={600}
            height={800}
            priority
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}
