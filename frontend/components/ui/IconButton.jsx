import Link from "next/link";

/**
 * A tappable icon target sized for touch (44px hit area) with an optional
 * numeric badge — used for the cart icon in the header and bottom nav.
 */
export default function IconButton({
  href,
  icon: Icon,
  label,
  badge,
  active = false,
  onClick,
  className = "",
}) {
  const content = (
    <span className="relative flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center">
      <Icon
        size={20}
        strokeWidth={active ? 2.25 : 1.75}
        className={`${active ? "text-accent" : "text-ink"} transition-colors`}
      />
      {badge > 0 && (
        <span className="absolute -right-0.5 -top-0.5 sm:right-1 sm:top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-surface shadow-xs">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );

  const classes = `inline-flex items-center justify-center ${className}`;

  if (href) {
    return (
      <Link href={href} aria-label={label} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
