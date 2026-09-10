import Image from "next/image";

/**
 * Alternating image/text block used across About and Goshala pages so
 * both stay visually consistent without duplicating the layout code.
 */
export default function StorySection({ eyebrow, title, children, image, reversed = false }) {
  return (
    <div
      className={`grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14 ${
        reversed ? "md:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-line">
        <Image
          src={image}
          alt={title}
          width={800}
          height={600}
          className="h-full w-full object-cover"
        />
      </div>

      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-deep">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 font-display text-2xl text-ink md:text-3xl">{title}</h2>
        <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-ink-soft">
          {children}
        </div>
      </div>
    </div>
  );
}
