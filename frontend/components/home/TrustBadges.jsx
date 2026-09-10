import { Leaf, HandHeart, ShieldCheck, Sprout } from "lucide-react";

const BADGES = [
  {
    icon: Leaf,
    title: "100% Natural",
    text: "No additives, no shortcuts — just what the cows and the season give.",
  },
  {
    icon: Sprout,
    title: "Traditional Methods",
    text: "Bilona-churned ghee and hand-prepared panchagavya, as always.",
  },
  {
    icon: HandHeart,
    title: "Supports the Goshala",
    text: "Every order helps feed and care for the herd.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Checked",
    text: "Small batches, checked before they leave the goshala.",
  },
];

export default function TrustBadges() {
  return (
    <section className="border-y bg-surface">
      <div className="mx-auto grid max-w-content grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4 md:px-8">
        {BADGES.map((badge) => (
          <div key={badge.title} className="flex flex-col gap-3">
            <badge.icon size={26} strokeWidth={1.5} className="text-accent" />
            <p className="text-sm font-medium text-ink">{badge.title}</p>
            <p className="text-sm leading-relaxed text-ink-soft">{badge.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
