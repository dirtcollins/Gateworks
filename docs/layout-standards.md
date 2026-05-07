# Product Layout Standards

These rules prevent catalog and product-page UI from overlapping as product data, image sizes, and viewport widths change.

## Product Cards

- Product cards use a three-row structure: media, body, footer.
- Product media containers must have fixed height and `overflow: hidden`.
- Product images must use `object-fit: contain` with `max-width` and `max-height`; never allow natural image dimensions to drive card height.
- Titles and descriptions are clamped to a fixed number of lines.
- Footer actions live in their own row and cannot overlap body copy.
- Cards must have `min-width: 0` on grid children so long SKU/name text wraps instead of forcing overflow.

## Product Pages

- Product detail pages use separate gallery and information columns on desktop.
- Detail galleries use contained images with max heights and thumbnails below.
- Variant selectors update the current variant in place without reloading.
- Price, SKU, inventory, dimensions, weight, and shipping data are displayed from the selected variant.
- PDP top sections must include title, brand, gallery, variants, price, bulk price, inventory, shipping/pickup, quantity, add to cart, add to project, SKU, and ratings.
- PDP galleries must include thumbnails, zoom/fullscreen behavior, variant-specific images, and mobile-friendly horizontal scrolling.
- PDPs must include Pros Buy These Together, Customers Also Viewed, Recently Viewed, and product accordions.
- Add to Project must support named project lists and exportable material lists.
- Mobile PDPs must expose sticky Add to Cart and large touch targets.

## PDP Sizing Standards

These desktop values are based on a 1440px viewport and follow the Home Depot-style PDP pattern: a centered content well, two-column top product area, then full-width merchandising/detail bands.

| Section | Desktop width | Desktop height target |
| --- | ---: | ---: |
| PDP content well | 1440px max page, 1368px inner sections | content-driven |
| Breadcrumb | 1368px | 20px minimum |
| Top product grid | 1368px | content-driven by right column |
| Media column | about 726px | about 690px |
| Main product image | about 692px | 430-540px clamp |
| Thumbnail row | about 692px | 76px minimum |
| Info/buy column | about 618px | content-driven |
| Summary card | about 618px | about 265px |
| Buy box | about 618px | about 470px |
| Options card | about 618px | only shown when real selectable choices exist |
| Shipping card | about 618px | about 165px |
| Project panel | 1368px | 116px minimum |
| Bundle section | 1368px | about 458px |
| Bundle cards | 5 equal columns | 252px minimum |
| Recommendation section | 1368px | about 600px |
| Recommendation cards | 212-232px columns | 452px minimum |
| Accordion section | 1368px | content-driven, 58px summary rows |

Rules:

- The PDP top grid must use `align-items: start`; never stretch the gallery column to the height of the buy column.
- The gallery uses a fixed/clamped image frame, and product images must be contained inside that frame.
- Lower PDP modules use the same 1368px max width and 16px internal padding.
- Static variant specs must not appear as non-clickable option boxes in the buy column; only render option controls when the user can actually choose between variants.
- The variant URL must remain shareable in the browser address bar, but do not show a large share-URL box in the PDP buy column.
- Desktop bundle rows fit five products across; below 1120px they become horizontal scrolling cards.
- Recommendation cards use fixed media and minimum card heights so action buttons line up.

## Ecommerce Hierarchy

- Homepage links to category pages, not directly to final buying flows.
- Category PLPs link to subcategory PLPs.
- Subcategory PLPs link to PDPs.
- PDP breadcrumbs must show: Home / Category / Subcategory / Product.
- PDP back actions return to the subcategory PLP for the product’s department.
- Pretty ecommerce paths should be used during navigation: `/c/gate-hardware`, `/c/gate-hardware/gate-hinges`, and `/products/{product}?variant={sku}`.

## Responsive Rules

- Product grids collapse to two columns, then one column, with the same media/body/footer row structure.
- Touch targets for buttons, pills, dropdowns, and swatches must be at least 44px tall.
- Sticky headers require `scroll-margin-top` on major product sections so anchored content is not hidden.

## QA Checklist

- No product image may cover product title, metadata, price, or buttons.
- Long product names must clamp instead of pushing buttons out of view.
- Variant controls must remain tappable on mobile.
- Add-to-quote controls must remain visually separated from product content.
- Browser console must have no errors after loading catalog and product detail pages.
