"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileMenuDrawer from "@/components/layout/MobileMenuDrawer";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";

/**
 * The navigation shell every public page renders inside. Cart/wishlist
 * counts now come from CartContext/WishlistContext (see app/layout.jsx)
 * instead of being threaded through as props.
 */
export default function SiteShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = Boolean(
    user && (user.isAdmin || user.role === "admin" || user.role === "super_admin")
  );
  const isAdminRoute = pathname?.startsWith("/admin");

  // Authorized admins on /admin render the standalone Admin layout without public shop chrome
  if (isAdminRoute && isAdmin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen flex-col w-full">
      <Header />
      <MobileHeader onMenuOpen={() => setMenuOpen(true)} />
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 w-full max-w-full overflow-x-clip pb-[var(--bottom-nav-height)] md:pb-0">
        {children}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
