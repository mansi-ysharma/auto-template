# Automotive Template — Block Analysis & Consolidation

Reference site: https://www.mgmotor.co.in/ · Source: `EDS-Blocks-Inventory.xlsx` (25 page templates).

This document explains **which blocks were built, which inventory line-items were consolidated, which are handled by out-of-the-box (OOB) capabilities, and which are intentionally out of scope**. It answers the three questions asked: (a) is a block actually required, (b) where multiple scenarios should be one block with `classes` vs. separate blocks, and (c) what needs backend/third-party integration.

---

## 1. Guiding principles

1. **Consolidate by behaviour, not by page.** The inventory lists the same component many times because it appears on many pages. A carousel is a carousel whether it shows cars, news cards, or gallery photos — so it is **one block** with visual variants selected by the author, not ten blocks.
2. **Variants via `classes`, not copies.** When two scenarios share DOM structure and JS behaviour and differ only in styling/layout, they are one block with a `classes` select field (xwalk applies the value as a CSS class). Separate blocks are only created when the **authoring contract** (the expected content structure) or the **core behaviour** genuinely differs.
3. **OOB first.** Text, Image, Button/CTA, and simple Video are default content in Edge Delivery — no custom block required. Columns and Cards already ship in the boilerplate.
4. **Stub, don't fake, third-party services.** Blocks that depend on external services (maps, chatbot, reCAPTCHA, search, OTP) are built as complete shells with author-configurable keys/endpoints and a clear `// TODO` hand-off point, so integration is a drop-in later.

---

## 2. OOB — no custom block required

| Inventory item | How it is delivered |
|---|---|
| Text | Default content (rich text) |
| Image | Default content (image), auto-optimised by the pipeline |
| CTA | Default content link → decorated as `.button` by `scripts.js` |
| Column / Column – Article / Column rail | Existing **columns** block (layout variants via section styling) |
| Cards (All variants) | Existing **cards** block (variants via `classes`) |
| Video | Link to a video auto-embeds; use a fragment/embed for hosted players |
| Hero (static) | Existing **hero** block |

> The inventory marks a few of these as "Custom" on some pages (e.g. Form, OTP) and "OOB" on others. Where the behaviour is non-trivial (Form, OTP) we built a real block; where it is genuinely default content we did not.

---

## 3. Consolidated custom blocks

### 3.1 `carousel` — replaces 10 line-items
Hero Carousel Banner (Clickable), Product Carousel, Carousel Banner, Gallery Carousel, Model Variant Carousel, Cards Carousel, Carousel, Variant Carousel → **one block**.
- **Why one block:** identical DOM (a track of slides), identical behaviour (arrows, dots, swipe, autoplay). Only sizing/layout differs.
- **Variants (`classes`):** `banner` (full-bleed, autoplay, clickable slide), `product`, `cards`, `gallery` (adds thumbnail strip), `model`, `variant`.
- **Product Tab Carousel** = `tabs` with a `carousel` inside each panel (composition, not a new block).

### 3.2 `tabs` — replaces 4 line-items
Tabs, Tabs (Product Accordion → see accordion), Tabs (Search), Product Tab Carousel.
- **Variants:** `default`, `search`, `pills`. On mobile "Product Accordion" behaviour is better served by the **accordion** block, so that item maps there.

### 3.3 `accordion` — replaces 3 line-items
Accordion, Specification Accordion, Expand/Collapse.
- Native `<details>/<summary>`. **Variants:** `default`, `specifications` (key/value rows), `single` (one open at a time).

### 3.4 `form` — replaces ~8 line-items
Form, Contact Form, Drive Scheduler (Test Drive), Booking Form – journey, Emanual Form, Find Dealer Form, plus **OTP** and **Google reCAPTCHA** as field types.
- **Why one block:** all are a list of fields + validation + submit. Differences are the *field set* (authored per instance) and styling.
- **Variants:** `default`, `contact`, `test-drive`, `booking`, `inline`. `fieldType` includes `otp` and `recaptcha` (both stubbed with a TODO hand-off).

### 3.5 `map` — replaces map line-items
Google Maps, Google maps, Dealer Location, and the map part of Location Selector / Trip route.
- Stubbed Google Maps (author supplies `apiKey`; graceful placeholder + marker list without a key). **Variant:** `route` for Trip-planner directions.

### 3.6 `dealer-locator` — composite
Dealer Locator + Dealer Location + Location Selector + View selector + Pagination working as one experience. Internally provides location search, State/City selectors, results list, map placeholder, list/map toggle and pagination. Standalone `filter`, `view-selector`, `pagination` blocks also exist for **generic** listings (e.g. Trip-planner, Newsroom).

### 3.7 Navigation & Footer variants (existing `header` / `footer`)
Navigation (default + login + search), Navigation – Blogs, Navigation – Logo Only, Navigation – Dealers → **header** with variants.
Footer (+ social share), Footer – Blogs, Footer – dealers → **footer** with variants. These are handled by section/nav-fragment classes rather than new blocks (see §5).

### 3.8 Other custom blocks (1:1, genuinely distinct)
`breadcrumb`, `banner` (+`flyout` variant covers "Flyout CTA"), `sticky-cta`, `scroll-down`, `cookie-consent` (Accept Cookies flyout), `search`, `filter`, `view-selector`, `pagination`, `variant-selector`, `product-comparison`, `emi-calculator`, `timeline` (+`carousel` variant covers "Timeline carousel"), `virtual-showroom`, `chatbot`, `download` (covers "Select all"), `progress-bar`, `menu`.

---

## 4. Third-party / backend integration required (stubbed)

| Block | What must be wired later |
|---|---|
| `map` / `dealer-locator` | Google Maps JS API key, geocoding, directions |
| `chatbot` | Provider widget script + `widgetId` (e.g. vendor bot) |
| `form` (OTP field) | OTP send/verify backend endpoint |
| `form` (reCAPTCHA field) | Google reCAPTCHA site key + server verification |
| `search` | Search index/query endpoint (returns `[{title, path}]`) |
| `emi-calculator` | Fully functional client-side; only *live* interest-rate feed would need a backend |

Each shell reads config from author fields and exposes a single `// TODO` hand-off — no external scripts are injected without configuration, so pages never break.

---

## 5. Out of scope as content blocks (documented only)

The **Post-login** rows are authenticated application features, not authorable content blocks:
Booking & Tracking, Service Scheduler, Service Book/Review/Cancel, Warranty, Spare parts/Accessories, Insurance, Customer Review, Loyalty, Referral, Connected App.

**Recommendation:** implement these as authenticated micro-apps mounted into a page via a lightweight container block or fragment, backed by identity + the relevant service APIs. They require login/session, personalised data and transactional back ends that are outside the scope of a reusable EDS content-block library. Modelling them as content blocks would be misleading.

Similarly, **Navigation** and **Footer** are best maintained as `nav`/`footer` fragments (the boilerplate pattern) with variant classes, rather than duplicated per page.

---

## 6. Summary count

- **OOB (reused):** text, image, button, video, columns, cards, hero, fragment.
- **New custom blocks built:** carousel, tabs, accordion, breadcrumb, banner, sticky-cta, scroll-down, cookie-consent, form, search, map, dealer-locator, filter, view-selector, pagination, variant-selector, product-comparison, emi-calculator, timeline, virtual-showroom, chatbot, download, progress-bar, menu (**24**).
- **~48 inventory line-items → 24 blocks** through consolidation.
- **Out of scope:** 10 post-login application features (documented, not built).
