# Product Requirements Document (PRD) — Krishi Mulya (कृषि मूल्य)

> **Status:** ✅ Final for MVP — confirmed after discussion.
>
> **Audience:** Human developer + AI coding agents (e.g. Antigravity)
> working in this repo. This file defines **what** to build and **why**.
> **How** to build it lives in `tech-stack.md` (technology choices),
> `frontend-guidelines.md`, `backend-structure.md`, and
> `implementation-plan.md` (sequencing).
>
> **Related documents:**
> - `tech-stack.md` — confirmed technology choices
> - Original market research report (Nepal Project Opportunity Research,
>   June 2026) — full competitive landscape, revenue model, and longer-term
>   phase details

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Target Users](#2-target-users)
3. [Language Strategy](#3-language-strategy)
4. [MVP Feature Scope](#4-mvp-feature-scope)
5. [Out of Scope for v1](#5-out-of-scope-for-v1)
6. [Non-Goals](#6-non-goals)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Success Criteria](#8-success-criteria)
9. [Assumptions & Risks](#9-assumptions--risks)
10. [Roadmap (Future Phases)](#10-roadmap-future-phases)
11. [Decisions Log](#11-decisions-log)

---

## 1. Product Vision

> **Krishi Mulya gives Nepal's farmers, traders, and cooperatives free
> access to daily and historical Kalimati wholesale prices — information
> that was previously scattered, single-day-only, or locked behind manual
> spreadsheets.**

The product's core value is **information that didn't exist in usable form
before**: historical price trends, day-over-day change indicators, and a
bilingual interface — built on top of public government data that, until
now, has only been published as a single daily snapshot with no memory of
the past.

---

## 2. Target Users

### MVP focus: the free public dashboard

The MVP is built for **anyone who wants to know Kalimati wholesale
prices** — farmers, traders, cooperative staff, NGO researchers, students,
journalists, or curious members of the public. No login, no account, no
gatekeeping.

**Why this focus:** the public dashboard is what builds the **data moat**
(daily scraping → growing historical record) and serves as **proof of
value** before approaching cooperatives or institutions for paid tiers.
Building B2B features (accounts, orgs, billing) before validating that
people use the core data would be building on an unproven foundation.

### Deferred user types (Phase 2+)

| User type | What they'd need | Phase |
|---|---|---|
| Individual farmers wanting alerts | SMS/email price alerts | Phase 2 |
| Cooperatives | Multi-commodity dashboards, CSV export | Phase 4 |
| Wholesale traders | Premium analytics, market comparison | Phase 3–4 |
| NGOs / researchers | Historical data API | Phase 5 |
| Banks / agri-businesses | Custom data contracts | Phase 5 |

Full detail on these personas and their willingness-to-pay is in the
original research report — not repeated here to avoid duplication.

---

## 3. Language Strategy

**Bilingual UI with a language toggle (English ⇄ Nepali).**

- Commodity names already exist in both languages in the database
  (`name_en`, `name_ne`) — these are "free" to display regardless of UI
  language.
- The toggle affects **UI strings** (labels, headers, buttons, messages) —
  implementation approach (e.g. `next-intl`, simple JSON dictionaries +
  React context) is decided in `frontend-guidelines.md`.
- Date display uses `nepali-date-converter` to show Bikram Sambat dates
  alongside Gregorian, regardless of which UI language is active (this is a
  "Nepali-ness" feature, not strictly tied to the language toggle).
- **Numerals:** ✅ **confirmed** — prices, percentages, and units always use
  Arabic numerals (0–9) in both locales (rapid magnitude-scanning matters
  more than linguistic consistency for price data). Bikram Sambat dates use
  locale-appropriate digits (Devanagari in the Nepali locale). Full
  rationale and formatting utilities in `frontend-guidelines.md` §4.

---

## 4. MVP Feature Scope

### 4.1 Today's Prices Dashboard

**As a visitor, I can see today's wholesale prices** for all ~98 tracked
commodities (vegetables, fruits, fish) in a searchable, filterable table
showing minimum, maximum, and average price in NPR per unit (kg / dozen /
piece).

- Search by commodity name (English or Nepali)
- Filter by category (All / Vegetables / Fruits / Fish)
- Table shows: commodity name (both languages), min, max, avg, unit

### 4.2 Commodity Detail & Price History

**As a visitor, I can click a commodity** to see:

- A line chart of min/avg/max price over time (grows daily from launch —
  day 1 shows a single point, day 90 shows a full 90-day trend)
- Current price stats (latest avg, latest min/max, date)
- Both Gregorian and Bikram Sambat date display

### 4.3 Price Change Indicators

**As a visitor, I can see at-a-glance price movement** — e.g. ▲ +8.2% or ▼
-3.1% vs. the previous day (and, once enough history exists, vs. a week
ago).

- **Acceptance note:** at launch, most commodities will show "—" (no
  comparison data yet) since history starts accumulating from day 1. This
  is an accepted "grows into itself" launch state, not a bug.

### 4.4 Language Toggle

**As a visitor, I can switch the entire UI between English and Nepali** via
a persistent toggle (e.g. in the header).

### 4.5 Alerts "Coming Soon" Section

**As a visitor, I can see a section describing upcoming SMS/email price
alerts**, with an interest-capture mechanism (e.g. email signup) to gauge
demand — no actual alert-sending logic in v1.

### 4.6 Automated Daily Data Pipeline

**The system automatically scrapes Kalimati prices once daily** via Vercel
Cron, with zero manual intervention required, logging any unmatched
commodities for review.

---

## 5. Out of Scope for v1

Deferred to later phases — **will** be built, just not in v1:

- SMS/email alert **sending** logic (v1 has the teaser/signup only)
- User accounts / login (Supabase Auth arrives with Phase 2 alerts)
- Cooperative / B2B dashboards, organizations, subscription plans
- Data API for external partners
- Multi-market price comparison (v1 = Kalimati only; schema supports more
  markets later without migration)
- Payments / subscriptions
- Seasonal forecasting or predictive pricing features
- Native mobile app (responsive web only)

---

## 6. Non-Goals

Permanent boundaries — **not part of this project's vision**, to prevent
scope creep regardless of future ambition:

- **Not a marketplace.** Krishi Mulya is an *information* platform — it
  will never facilitate buying, selling, payments between farmers/traders,
  or order fulfillment.
- **Not a general farming advisory app.** No weather forecasts, pest/disease
  diagnosis, crop planning advice, or farming technique content — that's
  the territory of apps like Hamro Krishi. Krishi Mulya's domain is strictly
  **price information**.
- **No physical infrastructure.** No warehousing, logistics, cold storage,
  or delivery — purely digital.
- **Not a replacement for the government data source.** Krishi Mulya is a
  better *frontend and historical archive* for public Kalimati data — it
  does not compete with or seek to replace the Kalimati Market Development
  Board as the source of truth, and should always be transparent about
  attribution.

---

## 7. Non-Functional Requirements

| Requirement | Detail |
|---|---|
| **Responsive design** | Must work well on mobile browsers (primary usage), tablet, and desktop. Web app, not a native app. |
| **Performance** | SSR pages load quickly even on slower mobile connections; avoid heavy client-side JS beyond chart components. |
| **SEO** | Each commodity page has a unique, descriptive `<title>` and meta description (e.g. "Tomato Price in Kalimati Market Today — Krishi Mulya") to support organic search discovery — a primary acquisition channel. |
| **Browser support** | Modern mobile/desktop browsers (Chrome, Safari, Edge). No legacy browser support needed. |
| **Accessibility** | Basic semantic HTML, sufficient color contrast (especially for price ▲/▼ indicators which shouldn't rely on color alone). |

---

## 8. Success Criteria

Framed qualitatively — numeric targets are premature pre-launch.

- ✅ Scraper runs daily without manual intervention for 30+ consecutive days
- ✅ All ~98 commodities map correctly (zero persistent "unmatched" log
  entries)
- ✅ At least a few commodity pages get indexed by Google
- ✅ Core flows (view today's prices, search/filter, view chart, switch
  language) work cleanly on a mobile browser
- ✅ Informal positive feedback from a handful of real users (farmers,
  traders, friends testing it)

---

## 9. Assumptions & Risks

| Assumption / Risk | Mitigation |
|---|---|
| `kalimatimarket.gov.np` remains publicly accessible with stable HTML structure | Scraper logs "unmatched" commodities; structure changes are caught quickly via logs, not silent failures |
| Vercel Hobby's once-daily cron limit is sufficient | Matches the source's own once-daily publishing cadence — not a real constraint for v1 |
| Users can find the bilingual toggle / it's discoverable | Place prominently in header; revisit placement based on feedback |

---

## 10. Roadmap (Future Phases)

Brief pointers only — full detail in the original research report.

- **Phase 2 — Alerts:** SMS (Sparrow SMS) / email price alerts, requires
  Supabase Auth
- **Phase 3 — Multi-market data:** district markets beyond Kalimati
  (Pokhara, Butwal, Biratnagar)
- **Phase 4 — Cooperative / B2B dashboards:** organizations, CSV export,
  subscription plans
- **Phase 5 — Data API:** API-key access for NGOs, banks, researchers

---

## 11. Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06 | MVP = free public dashboard only; B2B deferred | Validate core data value before building accounts/billing |
| 2026-06 | Bilingual (EN/NE) UI with toggle | Reach both Nepali-literate farmers and English-comfortable traders/diaspora |
| 2026-06 | Price change indicators included in v1 | High-value "at a glance" feature; accepted that it's sparse at launch |
| 2026-06 | Alerts "coming soon" section kept visible | Gauges demand via signup capture without building full alert infra |
| 2026-06 | Responsive web app, not native app | Matches mobile-heavy usage in Nepal without native dev overhead |
| 2026-06 | Added explicit Non-Goals section | Prevents scope creep into marketplace/advisory-app territory |
