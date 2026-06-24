# Future Ideas — Parking Lot

> **Status:** Parked — not in active development.
>
> **Purpose:** This document preserves promising ideas that are intentionally
> out of scope for the current MVP. Ideas here should NOT be built until:
>
> 1. The core price-intelligence features have active, returning users.
> 2. You have validated demand directly (surveys, user interviews, repeated requests).
> 3. You can prove the feature serves the app's core mission: **helping users understand agricultural market prices**.
>
> **Decision rule:** Before pulling anything from this list into active dev,
> ask — *"Does this help a user understand agricultural prices better?"*
> If the answer is *"Yes, but it also requires a second product to exist first"*,
> leave it here.

---

## Group A — Farmer / Producer Features

These ideas form a distinct product: a **Farm Management System + Traceability Platform**.
Technically possible, but 5–10x the scope of the current app and require a different
type of user (one willing to invest 15+ minutes per session entering records).

| Idea | Why Parked |
|---|---|
| Farmer registration & login | Requires auth system, roles, and a new user type |
| Farmer dashboard | No price data = still useful. That means it's a separate product |
| Farm profiles (crop, land records) | Heavy data-entry burden on smallholder farmers |
| Crop lifecycle tracking | Requires per-plant, per-harvest, per-field records — complex |
| Pesticide logs | Hard to verify; fraud-prone without physical checks |
| Fertilizer records | Same challenges as pesticide logs |
| Harvest logs | Hard to standardize across crops and regions |
| Traceability (QR codes, farm-to-fork) | Phase 5+ — requires physical infra coordination |
| Certifications (organic, GAP) | Requires government/third-party integration |
| Product listings (farmer can sell) | Marketplace territory — explicitly out of scope in PRD |

**Validation test before building any of the above:**
> Add a survey: *"Would you be willing to maintain crop records in this app?"*
> If fewer than 10% of active users say yes, do not build.

---

## Group B — Data Expansion

| Idea | Why Parked |
|---|---|
| More market sources beyond current scrapers | Good idea — but only after current scraper is stable 30+ days |
| Nutrition facts per commodity | Useful but different domain; no validated demand |
| Weather data (rainfall, temperature) | Interesting correlation but requires external API + different expertise |
| Import/export price data | Good for traders; validate with actual traders first |
| Futures / commodity price forecasting | High complexity; requires ML pipeline |

---

## Group C — B2B / Platform Features

| Idea | Why Parked |
|---|---|
| Cooperative dashboards | Phase 4 per PRD roadmap |
| CSV export | Phase 4 — needs B2B accounts first |
| Data API for NGOs / researchers | Phase 5 per PRD roadmap |
| Custom data contracts for banks | Phase 5 |
| Subscription / billing | Phase 4+ |

---

## Group D — Mobile / Messaging

| Idea | Why Parked |
|---|---|
| Native iOS/Android app | Responsive web first; validate web traffic before native |
| WhatsApp price bot | Interesting channel; validate that users want push over pull |
| SMS price alerts (sending) | Phase 2 per PRD — interest capture already live |

---

## How to Graduate an Idea to Active Dev

1. Pick the idea.
2. Write a one-paragraph validation test (survey, A/B, landing page).
3. Run the test with real users.
4. If validated, add to the PRD as a new phase and create a proper implementation plan.
5. Move the idea from this file to `implementation-plan.md`.

---

*Last updated: 2026-06-25*
