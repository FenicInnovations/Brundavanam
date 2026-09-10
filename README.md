# Brundavanam Goshala — Premium E‑Commerce Platform

Two independent apps, one repo:

```
brundavanam-goshala/
├── frontend/   → Next.js (App Router, JavaScript) — customer + admin UI
└── backend/    → Node.js + Express + MongoDB — REST API
```

They talk only through HTTP APIs (`frontend` never touches MongoDB directly),
so either side can be deployed, replaced, or scaled independently.

## What's in this delivery (Stage 1)

Per the staged plan, this pass covers **the design system and the navigation
shell** — the pieces every other page will be built on top of:

- Design tokens (colors, type, spacing) in `frontend/app/globals.css`
- `Header` (desktop), `MobileHeader`, `BottomNav` (the app‑style mobile nav
  you asked for), and `Footer`
- A homepage skeleton (`Hero`, `TrustBadges`, `CategoryGrid`) that shows the
  system in use
- The **backend folder structure** with a working Express bootstrap,
  MongoDB connection, and the first two Mongoose models (`User`, `Product`,
  `Category`), so the shape of the API is real from day one — full
  auth/products/orders logic comes in Stages 3–5 as originally planned

## Running it

**Frontend**
```
cd frontend
npm install
npm run dev        # http://localhost:3000
```

**Backend**
```
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT_SECRET, etc.
npm run dev             # http://localhost:5000
```

## Design direction (why it looks the way it does)

A goshala's world is brass diyas, sun-dried grain, aged ghee, hand-lettered
signage — not the generic "organic brand" cream-and-terracotta look. So the
palette leans into **temple brass and pasture green** instead:

| Token | Hex | Use |
|---|---|---|
| `--color-bg` (Buttermilk) | `#FBF6EC` | page background |
| `--color-surface` | `#FFFDF8` | cards |
| `--color-ink` (Deep Pasture) | `#1F2E22` | body text, near-black-green |
| `--color-accent` (Temple Brass) | `#A9762F` | primary actions, links |
| `--color-accent-soft` (Sandalwood) | `#C98A4B` | secondary accents, hover |
| `--color-support` (Moss) | `#56684A` | badges, success states |
| `--color-line` (Husk) | `#E4DAC5` | borders, dividers |

Type pairs **Fraunces** (a serif with real character for headlines — avoids
the generic AI-cliché serif) with **Inter** for UI/body text, both
self-hosted via `@fontsource` so nothing depends on an external font CDN.

The mobile bottom nav is the centerpiece you called out: fixed, five items
(Home / Shop / Search / Cart / Account), active-state indicator, live cart
badge, safe-area padding, and content gets bottom padding so nothing sits
underneath it.

## Next stages (unchanged from the original plan)

2. Shop, product detail, cart/wishlist UI
3. Backend: auth, products, categories fully wired
4. Cart, wishlist, orders, checkout flow end-to-end
5. Admin dashboard
6. Blog, reviews, donations
7. SEO, performance, accessibility, security pass
