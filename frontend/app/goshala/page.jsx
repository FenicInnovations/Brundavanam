import Image from "next/image";
import StorySection from "@/components/marketing/StorySection";
import Button from "@/components/ui/Button";

export const metadata = {
  title: "The Goshala",
  description:
    "A look inside Brundavanam Goshala — daily cow care, facilities, and how visitors can support the herd.",
};

const FACILITY_IMAGES = [
  "https://images.unsplash.com/photo-1560114928-40f1f1eb26a0?w=700&q=80",
  "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=700&q=80",
  "https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=700&q=80",
  "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=700&q=80",
];

export default function GoshalaPage() {
  return (
    <div className="mx-auto max-w-content px-6 py-10 md:px-8 md:py-14">
      <div className="max-w-xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
          The Goshala
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">
          A day at Brundavanam Goshala
        </h1>
      </div>

      <div className="mt-14 flex flex-col gap-16 md:gap-24">
        <StorySection
          eyebrow="About the Goshala"
          title="Open pasture, a resident herd, and a small team that knows every cow by name."
          image="https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=900&q=80"
        >
          <p>
            The goshala sits on open land with room to graze, shaded rest
            areas, and a water source that doesn't run dry in summer. It's
            not a large operation — small enough that the caretakers know
            each cow individually, which matters more than scale.
          </p>
        </StorySection>

        <StorySection
          eyebrow="Daily Activities"
          title="Mornings start early — milking, feeding, and a walk out to pasture."
          image="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=900&q=80"
          reversed
        >
          <p>
            The herd is milked by hand each morning, fed a mix of grass and
            supplementary feed, and let out to graze through the day. Ghee
            is churned the same day using the bilona method, and any
            panchagavya preparation happens in a separate area so nothing
            gets mixed up.
          </p>
        </StorySection>

        <StorySection
          eyebrow="Cow Care"
          title="A veterinarian visits regularly, not just when something's wrong."
          image="https://images.unsplash.com/photo-1604881991720-f91add269bed?w=900&q=80"
        >
          <p>
            Routine checkups, vaccinations, and hoof care happen on a
            schedule rather than only in emergencies. Older or unwell cows
            are given lighter duties and more rest — no cow is worked past
            what's comfortable for it.
          </p>
        </StorySection>
      </div>

      <section className="mt-24">
        <h2 className="font-display text-2xl text-ink md:text-3xl">Facilities</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {FACILITY_IMAGES.map((src, i) => (
            <div key={i} className="aspect-square overflow-hidden rounded-lg bg-line">
              <Image
                src={src}
                alt="Goshala facilities"
                width={400}
                height={400}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-24 rounded-xl border bg-surface p-10 text-center">
        <h2 className="font-display text-2xl text-ink md:text-3xl">
          Help us keep the herd well cared for.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-soft">
          Every donation goes directly toward feed, veterinary care, and
          maintaining the goshala's land.
        </p>
        <div className="mt-6">
          <Button href="/donate">Support Our Goshala</Button>
        </div>
      </section>
    </div>
  );
}
