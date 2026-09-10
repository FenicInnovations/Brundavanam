import Link from "next/link";
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react";
import {
  SITE_NAME,
  CONTACT_PHONE,
  CONTACT_EMAIL,
  CONTACT_ADDRESS,
} from "@/lib/constants";
import { CATEGORIES } from "@/lib/mockCategories";

const QUICK_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Shop", href: "/shop" },
  { label: "Cart", href: "/cart" },
  { label: "Wishlist", href: "/account/wishlist" },
  { label: "My Account", href: "/account" },
];

const POLICY_LINKS = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
  { label: "Refund Policy", href: "/policies/refund" },
  { label: "Shipping Policy", href: "/policies/shipping" },
];

const SOCIALS = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "YouTube", href: "#", icon: Youtube },
  { label: "Twitter", href: "#", icon: Twitter },
];

export default function Footer() {
  return (
    <footer className="mt-20 bg-ink text-bg">
      <div className="mx-auto max-w-content px-6 pt-12 md:px-8">
        {/* Newsletter */}
        <div className="flex flex-col items-center justify-between gap-6 border-b border-bg/15 pb-10 md:flex-row">
          <div>
            <p className="font-display text-2xl">Subscribe to Our Newsletter</p>
            <p className="mt-1 text-sm text-bg/60">
              Get updates on new products and exclusive offers.
            </p>
          </div>
          <form className="flex w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full rounded-l border border-bg/20 bg-ink px-4 py-3 text-sm text-bg outline-none placeholder:text-bg/40 focus:border-accent md:w-80"
            />
            <button
              type="submit"
              className="rounded-r bg-accent px-6 py-3 text-sm font-semibold text-surface transition-colors duration-150 hover:bg-accent-deep"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-xl">{SITE_NAME}</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-bg/60">
              Traditional cow care and natural, panchagavya-based products —
              bringing the goodness of the goshala directly to your door.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-bg/70">
              <li>{CONTACT_PHONE}</li>
              <li>{CONTACT_EMAIL}</li>
              <li>{CONTACT_ADDRESS}</li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-bg/50">
              Categories
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-bg/70">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/shop/${cat.slug}`} className="transition-colors duration-150 hover:text-bg">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop" className="font-medium text-bg">
                  View All Categories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-bg/50">
              Quick Links
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-bg/70">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors duration-150 hover:text-bg">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-bg/50">
              Policies
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-bg/70">
              {POLICY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors duration-150 hover:text-bg">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-bg/50">
              Follow Us
            </p>
            <div className="mt-3 flex gap-2.5">
              {SOCIALS.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-bg/10 transition-colors duration-150 hover:bg-accent hover:text-surface"
                >
                  <social.icon size={16} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-bg/15 bg-ink/95 py-4 pb-[calc(var(--bottom-nav-height)+16px)] md:pb-4">
        <p className="mx-auto max-w-content px-6 text-center text-xs text-bg/50 md:px-8">
          © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
