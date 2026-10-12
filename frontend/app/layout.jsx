import "./globals.css";
import SiteShell from "@/components/layout/SiteShell";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { ReduxProvider } from "@/lib/redux/store";
import { SITE_NAME } from "@/lib/constants";

export const metadata = {
  title: {
    default: `${SITE_NAME} — Traditional Ghee & Goshala Products`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Traditional bilona-churned ghee and panchagavya products from Brundavanam Goshala, made with care for our cows and our customers.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: SITE_NAME,
    description:
      "Traditional bilona-churned ghee and panchagavya products from Brundavanam Goshala.",
    siteName: SITE_NAME,
    type: "website",
    images: [{ url: "/images/logo.png" }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ReduxProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <SiteShell>{children}</SiteShell>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}