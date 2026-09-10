import Link from "next/link";

const VARIANTS = {
  primary: "bg-ink text-bg hover:bg-accent-deep",
  secondary: "bg-transparent text-ink border border-ink hover:border-accent hover:text-accent-deep",
  ghost: "bg-transparent text-ink hover:text-accent-deep",
};

/**
 * Renders a <Link> when `href` is given, otherwise a <button>.
 * A restrained rectangular shape (not a rounded pill) reads more like a
 * boutique storefront than a generic app button.
 */
export default function Button({
  href,
  variant = "primary",
  className = "",
  children,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded px-7 py-3 text-sm font-medium tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
