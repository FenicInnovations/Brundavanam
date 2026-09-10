"use client";

import { useState } from "react";
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <MobileHeader onMenuOpen={() => setMenuOpen(true)} />
      <MobileMenuDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1 pb-[var(--bottom-nav-height)] md:pb-0">
        {children}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
