# Frontend Guidelines — Krishi Mulya (कृषि मूल्य)

> **Status:** ✅ Final for MVP — confirmed after discussion.
>
> **Audience:** Human developer + AI coding agents (e.g. Antigravity)
> working in this repo. This file defines **visual identity, layout
> conventions, i18n implementation, formatting rules, and component
> organization**. Screen-level flows live in `app-flow.md`; data layer in
> `backend-structure.md`.

---

## Table of Contents

1. [Visual Identity](#1-visual-identity)
2. [Responsive Layout Strategy](#2-responsive-layout-strategy)
3. [Internationalization (i18n) Implementation](#3-internationalization-i18n-implementation)
4. [Number & Date Formatting](#4-number--date-formatting)
5. [Price Change Indicator Spec](#5-price-change-indicator-spec)
6. [Default Sort Orders](#6-default-sort-orders)
7. [Component Organization](#7-component-organization)
8. [Component Conventions](#8-component-conventions)
9. [Accessibility](#9-accessibility)
10. [Decisions Log](#10-decisions-log)

---

## 1. Visual Identity

### Color palette

Agricultural theme — green ("leaf") as primary, brown ("soil") as text/neutral base. Extends Tailwind's default palette rather than replacing it.

| Token | Hex | Usage |
|---|---|---|
| `leaf-50` | `#f0f9f4` | Page background |
| `leaf-100` | `#dcf0e4` | Borders, subtle backgrounds, hover states |
| `leaf-500` | `#1d9e75` | Accents |
| `leaf-600` | `#15805e` | Primary actions, header background, links |
| `leaf-700` | `#0f4a2e` | Headings |
| `soil-50` | `#fbf8f3` | Card backgrounds (alt) |
| `soil-800` | `#3a2a1d` | Body text |
| `amber-600` | (Tailwind default `#d97706`) | Price increase (▲) |
| `blue-600` | (Tailwind default `#2563eb`) | Price decrease (▼) |
| `gray-500` | (Tailwind default `#6b7280`) | No change data (—) |

Defined in `tailwind.config.js` under `theme.extend.colors` (already scaffolded — `leaf` and `soil` keys).

### Typography

**Noto Sans + Noto Sans Devanagari**, loaded via `next/font/google` with both `latin` and `devanagari` subsets:

```ts
// app/[locale]/layout.tsx
import { Noto_Sans, Noto_Sans_Devanagari } from "next/font/google";

const notoSans = Noto_Sans({ subsets: ["latin"], variable: "--font-sans" });
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
});
```

Apply both font variables to `<html>` / `<body>` so both scripts render
correctly regardless of which is active — Noto Sans and Noto Sans
Devanagari are designed as a matching pair (similar weight/proportions), so
mixed English/Nepali text (e.g., commodity names shown in both languages)
looks visually consistent.

### Branding

- Wordmark: "Krishi Mulya" (+ कृषि मूल्य as subtitle/tagline, shown in header)
- Logo: 🌾 emoji as a placeholder icon for MVP — a proper logo can come
  later without blocking launch.

---

## 2. Responsive Layout Strategy

**Single breakpoint at `md` (768px).**

| Width | Layout |
|---|---|
| `< 768px` | **Cards** (`PriceCardList`) |
| `≥ 768px` | **Table** (`PriceTable`) |

**Implementation:** both components render in the markup; visibility is
controlled via Tailwind responsive classes — **not** JS viewport detection
(`useMediaQuery`/`isDesktop`), which causes SSR/hydration mismatches since
the server doesn't know the client's screen size.

```tsx
<PriceCardList prices={prices} className="md:hidden" />
<PriceTable prices={prices} className="hidden md:block" />
```

Both components consume the **same data prop** — only presentation differs.

### Table layout (≥768px)

Columns: `Commodity Name (EN/NE) | Avg | Min | Max | Unit | Change`

### Card layout (<768px)

**Primary** (large, prominent):
- Commodity name (current locale)
- Average price
- Price change badge

**Secondary** (smaller text, below the fold of the primary row):
- Min / Max
- Unit

Example:

```
🥔 Potato (Local)
Rs. 62/kg          ▲ +4.2%

Min: 58  Max: 67  Unit: kg
[View Details →]
```

---

## 3. Internationalization (i18n) Implementation

**JSON dictionaries, no i18n library.** Given the limited string surface
(nav labels, table headers, buttons, messages — not prose-heavy content),
`next-intl` or similar would add complexity without solving a problem we
have.

```
web/dictionaries/en.json
web/dictionaries/ne.json
```

**Structure** (nested by section):

```json
{
  "nav": { "all": "All", "vegetables": "Vegetables", "fruits": "Fruits", "fish": "Fish" },
  "dashboard": { "title": "Today's Wholesale Prices", "search_placeholder": "Search commodity..." },
  "commodity": { "back": "Back to", "min": "Min", "max": "Max", "avg": "Avg", "no_history": "Price history will appear here as data accumulates — check back tomorrow." },
  "alerts": { "title": "Get notified about price changes", "email_placeholder": "your@email.com", "submit": "Notify me", "success": "Thanks! We'll notify you when alerts launch." },
  "footer": { "source": "Source: Kalimati Fruits & Vegetable Market Development Board, Government of Nepal", "updated": "Last updated" }
}
```

**Loading pattern:**

- `lib/dictionary.ts` exports `getDictionary(locale: "en" | "ne")` —
  imports the appropriate JSON and returns it (typed via a shared
  `Dictionary` type).
- **Server Components** (pages, layouts) call `getDictionary(locale)`
  directly and pass the relevant strings down as **props** to Client
  Components.
- **Client Components** (SearchBar, LanguageSwitcher, AlertSignupForm)
  never load dictionaries themselves — they receive translated strings as
  props. This avoids any client-side i18n context/state.

---

## 4. Number & Date Formatting

> **Confirmed decision** (revisits and reaffirms the PRD §3 default — this
> is now final, not provisional):

| Value type | English locale | Nepali locale |
|---|---|---|
| Prices | `Rs. 125/kg` | `रु 125/केजी` |
| Percentages | `+3.2%` | `+3.2%` |
| Units/quantities | Arabic numerals | Arabic numerals |
| Bikram Sambat dates | `2083-03-15 BS` | `२०८३-०३-१५` |

**Rule:** *labels and units translate; numeric values for prices,
percentages, and quantities stay in Arabic numerals (0-9) in both locales —
these are "scan for magnitude" values where rapid recognition matters more
than linguistic consistency.* Bikram Sambat dates are the one exception —
read as a whole label rather than scanned for magnitude, so they follow
locale-appropriate digit conventions via `nepali-date-converter`.

**Utility functions** (`lib/format.ts`):

```ts
formatPrice(value: number, unit: string, locale: "en" | "ne"): string
// "Rs. 125/kg" | "रु 125/केजी"

formatChange(pct: number | null): string
// "+3.2%" | "-1.8%" | "—"  (always Arabic numerals, both locales)

formatBSDate(date: Date, locale: "en" | "ne"): string
// "2083-03-15 BS" | "२०८३-०३-१५"  (digit conversion only for "ne")
```

---

## 5. Price Change Indicator Spec

| State | Symbol | Color | Example |
|---|---|---|---|
| Increase | ▲ | `amber-600` | `▲ +3.2%` |
| Decrease | ▼ | `blue-600` | `▼ -1.8%` |
| No data | — | `gray-500` | `—` |

- **Never color-only** — symbol + text always present (accessibility
  requirement from PRD).
- Colors are deliberately **not red/green**: rising prices aren't
  inherently "bad" for this product's audience (good for farmers, bad for
  buyers) — amber/blue mirrors the Max/Min line colors already used in
  `PriceChart`, keeping chart and badge conventions consistent.
- **Dashboard table / cards:** show 1-day change only (space-constrained).
- **Commodity detail page:** show both 1-day and 7-day change.

---

## 6. Default Sort Orders

**No user-triggered sorting in v1** (server-side defaults only):

| Page | Default order |
|---|---|
| Dashboard (`/[locale]`) | By category, then commodity name (alphabetical) — a "browse everything" order |
| Category pages (`/[locale]/[category]`) | By average price, descending — surfaces highest-value items first within a category |
| Search results (`?q=...`) | Name match relevance (simple substring match is sufficient for v1) |
| Commodity detail | N/A (single item) |

Column-header sorting is an explicit fast-follow candidate if usage data
shows demand — not blocking v1.

---

## 7. Component Organization

Feature-grouped (by domain concept, not component type):

```
web/
  dictionaries/
    en.json
    ne.json
  lib/
    dictionary.ts          # getDictionary(locale)
    format.ts               # formatPrice, formatChange, formatBSDate
    supabase.ts             # (from tech-stack.md)
  components/
    layout/
      Header.tsx
      Footer.tsx
      LanguageSwitcher.tsx
      Breadcrumbs.tsx
    commodity/
      PriceTable.tsx        # desktop, hidden md:block
      PriceCardList.tsx      # mobile, md:hidden
      PriceChangeBadge.tsx   # shared by table + cards + detail page
      PriceChart.tsx
      CommodityStats.tsx
    shared/
      SearchBar.tsx          # used on dashboard + category pages
    alerts/
      AlertSignupForm.tsx    # used on dashboard + commodity pages
```

---

## 8. Component Conventions

- **Server Components by default.** Add `"use client"` only where
  interactivity requires it: `SearchBar`, `LanguageSwitcher`,
  `PriceChart` (Recharts), `AlertSignupForm`.
- **Data fetching happens in Server Components** (pages/layouts) via
  `lib/supabase.ts` helpers — Client Components receive data as props,
  never fetch on their own.
- **Naming:** `PascalCase.tsx` for components, `camelCase.ts` for lib
  modules, `kebab-case` for route folders (Next.js convention).
- **Props types** mirror database types from `lib/supabase.ts` where
  possible (`Commodity`, `LatestPrice`, `DailyPrice`) — avoid redefining
  shapes per component.
- **Loading states:** use Next.js `loading.tsx` per route segment for
  navigation transitions (e.g., when search updates the URL and the server
  re-renders) — no custom spinners needed for initial page load since pages
  are SSR'd.

---

## 9. Accessibility

- **Color contrast:** body text (`soil-800` on `leaf-50`/white) and price
  change colors (`amber-600`, `blue-600`, `gray-500`) meet WCAG AA contrast
  against their backgrounds.
- **Semantic HTML:** `<table>` for `PriceTable` (with `<thead>`/`<th
  scope="col">`), `<nav>` for header navigation, `<main>` for page content,
  `<footer>` for attribution.
- **Language switcher:** updates the `lang` attribute on `<html>` (via the
  `[locale]` segment driving `<html lang={locale}>` in the root layout) and
  includes an `aria-label` (e.g., "Switch to Nepali" / "अंग्रेजीमा बदलनुहोस्").
- **Price change badges:** symbol + text, never color-only (see Section 5).
- **Touch targets:** cards and buttons sized for comfortable mobile tapping
  (minimum ~44×44px), per the mobile-first responsive strategy.

---

## 10. Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06 | Noto Sans + Noto Sans Devanagari | Matching pair designed for mixed-script text; reliable mobile rendering |
| 2026-06 | JSON dictionaries, no i18n library | Small string surface; avoids unused complexity (`next-intl`) |
| 2026-06 | Server Components load dictionaries, pass strings as props | Keeps Client Components simple — no client-side i18n state |
| 2026-06 | `md` (768px) single breakpoint, cards below / table above | Two layouts to maintain (not three); matches Tailwind defaults |
| 2026-06 | CSS visibility classes for layout switch, not JS viewport detection | Avoids SSR/hydration mismatches |
| 2026-06 | Cards prioritize name + avg price + change; min/max/unit secondary | Matches primary "quick lookup" user task, not spreadsheet comparison |
| 2026-06 | No user-triggered sorting in v1 | Low value for "quick lookup" use case vs. added URL/state complexity |
| 2026-06 | Category pages sorted by avg price DESC; dashboard by category+name | Category pages surface "what's valuable"; dashboard is a browse view |
| 2026-06 | Price change colors: amber-600 (▲) / blue-600 (▼) / gray-500 (—) | Avoids red/green "good/bad" framing; consistent with chart line colors |
| 2026-06 | **Reaffirmed:** prices/percentages/units use Arabic numerals in both locales; BS dates use locale-specific digits | Prices are "scanned for magnitude" (Arabic numerals faster to read); dates are "read as a label" (Devanagari feels natural in Nepali context) |
| 2026-06 | Keep existing green/soil agricultural palette | No PRD signal for brand repositioning before launch |
| 2026-06 | Feature-grouped component organization (`commodity/`, `layout/`, `alerts/`) | Scales better than type-based grouping (`charts/`, `prices/`) as features grow |
