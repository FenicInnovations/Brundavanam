import StorySection from "@/components/marketing/StorySection";

export const metadata = {
  title: "About Us",
  description:
    "The story, mission, and people behind Brundavanam Goshala's traditional ghee and panchagavya products.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
          About Us
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
          Care for cows, made into everyday goodness.
        </h1>
      </div>

      <div className="mt-14 flex flex-col gap-16 md:gap-24">
        <StorySection
          eyebrow="Our Story"
          title="It started with one herd, and a promise to look after them properly."
          image="https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=900&q=80"
        >
          <p>
            Brundavanam Goshala began as a small shelter for cows that had
            nowhere else to go. Over time, caring for them properly — good
            feed, open land, and patient hands — meant more milk, ghee, and
            panchagavya than the goshala itself could use.
          </p>
          <p>
            Sharing what was left over became a way to fund the goshala's
            daily needs without depending on donations alone. That's still
            the idea behind everything we sell today.
          </p>
        </StorySection>

        <StorySection
          eyebrow="Our Mission"
          title="Every product should trace back to a cow that's actually well cared for."
          image="https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=900&q=80"
          reversed
        >
          <p>
            We make ghee and panchagavya products the way they've always
            been made at the goshala — by hand, in small batches, without
            shortcuts. No product leaves until it's been checked the same
            way we'd check something for our own kitchen.
          </p>
        </StorySection>

        <StorySection
          eyebrow="Our Vision"
          title="A goshala that pays for its own care, indefinitely."
          image="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=900&q=80"
        >
          <p>
            We'd like Brundavanam Goshala to need less and less outside
            support over time — funded by the products it naturally
            produces, so the herd's care never depends on how good a
            fundraising year it's been.
          </p>
        </StorySection>

        <StorySection
          eyebrow="Cow Care"
          title="The herd comes first — the products come from that, not the other way round."
          image="https://images.unsplash.com/photo-1604881991720-f91add269bed?w=900&q=80"
          reversed
        >
          <p>
            Grazing land, clean water, and regular veterinary visits aren't
            negotiable, regardless of order volume. If a batch would mean
            pushing the herd harder than we're comfortable with, we simply
            make less of it.
          </p>
        </StorySection>

        <StorySection
          eyebrow="Sustainability"
          title="Nothing from the goshala goes to waste."
          image="https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=900&q=80"
        >
          <p>
            Milk becomes ghee, dung becomes fertilizer and dhoop, and even
            the byproducts of panchagavya preparation get used rather than
            discarded. It's less a sustainability initiative than just how
            a goshala has always worked.
          </p>
        </StorySection>
      </div>

      <section className="mt-24">
        <h2 className="font-display text-2xl text-ink md:text-3xl">
          Community Impact
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Beyond the herd, the goshala supports a small team of local
          caretakers and craftspeople who hand-prepare everything from ghee
          to dhoop sticks — work that stays close to home rather than
          moving to a factory.
        </p>
      </section>
    </div>
  );
}
