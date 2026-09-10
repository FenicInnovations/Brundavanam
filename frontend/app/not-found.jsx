import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center px-6 py-24 text-center md:py-32">
      <span className="font-display text-6xl text-accent">404</span>
      <h1 className="mt-4 font-display text-2xl text-ink">
        We couldn't find that page
      </h1>
      <p className="mt-3 max-w-sm text-sm text-ink-soft">
        It may have been moved or no longer exists. Let's get you back to
        somewhere useful.
      </p>
      <div className="mt-8 flex gap-3">
        <Button href="/">Go Home</Button>
        <Button href="/shop" variant="secondary">
          Browse Shop
        </Button>
      </div>
    </div>
  );
}
