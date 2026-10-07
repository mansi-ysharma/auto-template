# MG Clone — Document-Authoring Guide (Word / Sidekick)

Pages for this site are authored as **Word documents** (one `.docx` per page) using the
Edge Delivery **document-authoring** model. The `.docx` files live in `drafts/` and are the
source of truth; Sidekick previews/publishes them and the aem.live pipeline converts their
tables into blocks. (The earlier `drafts/*.html` files were a local shortcut and have been
replaced by these documents.)

## How a document maps to a page

- **Default content** — headings (Heading 1–6), paragraphs, lists, and **images pasted inline**
  become the page's text/media. Buttons are links formatted **bold** (primary), *italic*
  (secondary), or ***bold+italic*** (accent). Several CTAs may share one paragraph.
- **A block = a table.** The **first row is a single cell** containing the block name; the
  variant(s) go in parentheses. Each following row is a block row, one cell per column.
  - `Carousel (banner)` → `<div class="carousel banner">`
  - `Cards (model-range)` → `<div class="cards model-range">`
  - `Accordion (specifications, single)` → `<div class="accordion specifications single">`
  - `Variant Selector`, `Emi Calculator`, `Sticky Cta`, `Dealer Locator` → the hyphenated
    class (`variant-selector`, `emi-calculator`, …). The block name is Title-Case words; the
    pipeline lowercases and hyphenates to the class.
- **Sections** are separated by a **horizontal rule** (in the generated docs, an empty
  paragraph with a bottom border). Each `---` starts a new EDS section.
- **Section styling** — a `Section Metadata` table with a `Style` row: `dark`, `light`,
  `full-width`, `center`, `highlight` (comma-separated for several).
- **Page metadata** — a `Metadata` table (`Title`, `Description`) at the end of the doc.
- **Nav & footer** are their own documents: `nav.docx` and `footer.docx`, placed so they
  resolve to `/nav` and `/footer` (the `header`/`footer` blocks fetch those paths).
- **Homepage** is `index.docx` (serves at the content root `/`). Internal links are
  **site-root paths** — `/`, `/windsor-ev`, `/ebooking?model=windsor_ev`, etc. (no folder
  prefix) — so the documents are meant to live at the content root.

## Block tables used in this project

| Block name in doc | Class produced | Rows / cells |
|---|---|---|
| `Hero` | `hero` | one row, 2 cells: **image** \| **eyebrow + H1 + copy + CTAs** |
| `Breadcrumb` | `breadcrumb` | one row: `Home` \| `/` (auto-builds from URL) |
| `Carousel (banner\|gallery\|model\|cards)` | `carousel …` | one row per slide; cells: image \| body |
| `Cards (model-range\|highlights\|quicklinks)` | `cards …` | one row per card; image cell + body cell |
| `Columns (feature[, reverse])` | `columns …` | one row, N cells (image/text) |
| `Tabs (pills)` | `tabs …` | rows: label \| panel content |
| `Accordion (specifications, single)` | `accordion …` | rows: summary \| content (specs as **Key:** value lines) |
| `Form` | `form` | rows: fieldType \| label \| required \| options |
| `Variant Selector` | `variant-selector` | optional heading row; rows: name \| swatch \| image \| price |
| `Emi Calculator` | `emi-calculator` | rows: key \| value (`price`, `interestrate`, …) |
| `Banner` | `banner` | one row: image \| text+CTA |
| `Sticky Cta` | `sticky-cta` | one row: CTAs \| scroll-px |
| `Dealer Locator`, `Map`, `Timeline`, `Download`, `Virtual Showroom`, `Progress Bar`, `Cookie Consent`, `Chatbot` | matching class | see each block's `.js` for its row contract |

## Code notes (blocks already match the doc model)

Because a block table's name row becomes the class and the remaining rows become the block's
row/cell `<div>`s, the block JS already consumes the pipeline output. Two adjustments were made
so document-authored content renders correctly:

- **`blocks/hero/hero.js`** flattens the pipeline's row/cell wrappers up to `.hero` (a `Hero`
  table is authored as 2 columns — image | text — so aem.js `wrapTextNodes` doesn't collapse it).
- **`scripts/scripts.js` `decorateButtons`** now supports **multiple CTAs in one paragraph**
  (the "Book Now / Test Drive" pattern), not just a single link.

## Previewing

Open a `.docx` from the connected content source (SharePoint/Drive) and use **Sidekick →
Preview**, then view `https://<branch>--<repo>--<owner>.aem.page/<path>`. Local
`aem-cli up --html-folder drafts` only served the old HTML and does not render `.docx`.

## Regenerating from source art

The placeholder images are in `drafts/img/` (embedded into each doc). To rebuild the docs from
edited source, see the one-off converter approach in the session notes; it needs the `docx` and
`node-html-parser` npm packages (installed only while generating, then removed).
