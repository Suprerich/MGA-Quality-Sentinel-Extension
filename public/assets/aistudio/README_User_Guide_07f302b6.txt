Quality Rating & Complaint Analysis Tool v1.0.2 - User Guide
=============================================================

v1.0.2: Walmart __NEXT_DATA__ JSON extraction for reviews pages.
Improved fallback with Helpful?/Report patterns.
Structured user/date extraction. Review page cleanup.

Unified tool for QA + QC team. Two modes:
1. Search page -> Rating overview table.
2. Product/review page -> Complaint detail with sentiment.

Supported: Walmart US/CA, Amazon US/CA, Target.

Install: Unzip > chrome://extensions > Dev mode > Load unpacked.
Remove older versions first. Scroll to load reviews before scanning.



==============================================================
 v1.1.0 ADD-ON (OPT-IN): Deep Analyze Low-Rated Products
==============================================================
This is an EXTRA, optional feature. All original v1.0.2 behavior
(Search & Scan, Scan Current Page, Copy JSON, Export CSV) is
UNCHANGED. Use it only when you click the new button.

WHAT IT DOES
------------
After you scan a search results page (e.g. keyword "mini glam"),
the Rating Overview lists products with their average rating and
ALERT / OK status. Click:

    "Deep Analyze Low-Rated Products"

The tool then automatically:
  1. Picks every low-rated product (Status = ALERT, i.e. average
     rating <= your threshold), up to 8 products.
  2. Opens each product page in a background tab, auto-scrolls and
     clicks "Load more / Next page" to pull in its reviews, then
     closes the tab.
  3. Collects the LOW-RATED and QUALITY-related reviews (star
     rating <= threshold, NEGATIVE sentiment, or a quality issue
     type: Safety, Function, Missing parts, Damage, Quality,
     Packaging, Assembly, Size/Appearance).
  4. Classifies each complaint (issue type, sentiment, keywords)
     and shows a per-product breakdown so you can see WHY those
     low-scoring products scored low.

EXPORT
------
Click "Export Low-Rated Excel" to download a colour-coded .xls,
grouped by product, showing rating info (avg rating, review count,
threshold, alert status, main issue, URL) and each review's star
rating + issue classification.

HOW TO USE
----------
1. popup > choose retailer + keyword (e.g. "mini glam") > Search & Scan.
   (or open a search page and click Scan Current Page)
2. Wait for the Rating Overview table.
3. Click "Deep Analyze Low-Rated Products".
4. Review the per-product low/quality complaints table.
5. Click "Export Low-Rated Excel" to save the report.

Note: keep the popup open while it works through the products.
For best coverage, allow each product page a few seconds to load.



==============================================================
 v1.2.0 ADD-ON: Persistent docked Side Panel
==============================================================
The tool now opens as a browser SIDE PANEL that stays docked on the
side of the window - just like a pinned sidebar. You click the
extension's toolbar icon ONCE and the panel stays open; it does NOT
close or need re-clicking when you open a new page or a new tab.

HOW IT WORKS
------------
- Click the extension icon in the toolbar -> the Side Panel opens
  docked on the right side of the browser window.
- Keep it open while you browse: navigate to a search results page,
  open product pages, switch tabs - the panel remains available.
- To pin it so it stays across sessions, use the browser's side
  panel pin option (puzzle/side-panel menu > Pin).
- All controls are identical to before: Search & Scan, Scan Current
  Page, Copy JSON, Export CSV, plus the v1.1.0 opt-in
  "Deep Analyze Low-Rated Products" and "Export Low-Rated Excel".

FALLBACK
--------
The classic popup (popup.html) is still included, so nothing is lost.
If your browser build does not support the Side Panel API, the
toolbar click will still show the popup.

REQUIREMENTS
------------
Chrome 114+ or Edge 114+ (Side Panel API). Reload the unpacked
extension after upgrading.

==============================================================
v1.2.1 CHANGES (logic only; layout / UI unchanged)

- Target reviews fix: added embedded-JSON fallback for Target
  (and any application/json blocks), and stopped the fallback
  scan from wrongly dropping whole review sections. Rating parser
  now also reads Target's "N out of 5" (no "stars") wording.
- Deep loading: background tabs now poll up to 8s until reviews
  actually render, instead of a fixed blind wait (better coverage
  for Target / Amazon lazy-loaded reviews).
- Deep Excel export: each review row now includes Source URL and
  Captured At columns for traceability.
- Country of Origin detection tightened (requires a separator
  after "origin", word boundaries, value trimmed) to avoid false
  hits like "Original".
- ALERT judgment now uses strict "below threshold" (< 4.0) to
  match the WMCA bulletin wording. The "Show only rating <=
  threshold" display checkbox keeps its own <= behaviour.
- Button label: removed "(extra)".

==============================================================
v1.2.2 CHANGES (reliability only; no new features, UI unchanged)
- Deep Analyze now scans each low-rated product in the FOREGROUND
  tab (active:true) instead of a background tab. Background tabs are
  throttled so lazy-loaded reviews (Target / Walmart) never mounted,
  which is why batch Deep Analyze found the low rating but returned
  0 reviews while a manual single-item scan (foreground) returned the
  full list. Batch now follows the same working path.
- deep_review.js loader hardened: reveals the reviews section, scrolls
  both the window and inner scroll containers, fires real scroll events,
  and clicks "See all reviews / Show more / Load more" so lazy reviews
  render. Adaptive wait (up to 12s, stops once counts stabilise) - more
  complete and usually faster.
- Search-results link scoping: product links are now limited to the main
  results container and de-duped by product ID, so sponsored / "you may
  also like" / carousel links no longer inflate the item count
  (e.g. Target showing 39 items for a 7-result search).
- No change to buttons, layout, message types, JSON/CSV/Excel output,
  or the original Scan / Search & Scan behaviour.

==============================================================
v1.3.0 ADD-ON: Cross-Platform Summary + Email Table (additive)
==============================================================
All original behavior (Search & Scan, Scan Current Page, Copy JSON,
Export CSV, Deep Analyze, Export Low-Rated Excel, Side Panel) is
UNCHANGED. v1.3.0 only ADDS features - nothing was removed or
re-styled. New file: summary.js (loaded by popup.html/sidepanel.html).

NEW - Cross-Platform Summary & Email Table
- A new section auto-collects every Scan / Search & Scan / Deep Analyze
  into ONE matrix: Item | Walmart US | Walmart CA | Amazon US |
  Amazon CA | Target | Below 4.0 #.
- Same product scanned on different sites is merged into one row
  (matched by UPC / model number first, then product-name overlap
  >= 0.34). Platforms with no listing show "N/A".
- Cells show "avg rating (review count)"; anything below the threshold
  is highlighted red.
- "Below 4.0 #" column = how many platforms are below 4.0 (see at a
  glance which product has the widest problem).

NEW - Auto Key Finding (focus on < 4.0 only)
- Below the table, a Key Finding is written automatically, listing only
  items rated below 4.0 and summarising their 1-star & 2-star,
  quality-related complaints (Safety / Function / Missing parts /
  Damage / Quality / Packaging / Assembly / Size). Positive reviews are
  ignored (per Navis's guidance: only items below 4.0 matter).
- "Only show items below threshold" checkbox (ON by default) keeps the
  view focused; untick to see every tracked item.

NEW - One-click "Copy as Email Table"
- Copies a formatted HTML table + Key Findings straight to the
  clipboard. Paste (Ctrl+V) into Outlook and the table drops in ready
  to send. Falls back to tab-separated plain text if rich copy is
  blocked. The capture date/time is always included for traceability.

CHANGED (logic only; UI look unchanged)
- "Show only rating <= threshold" checkbox is now strict "< threshold"
  (below), matching the WMUS/WMCA "below 4.0" rule and the ALERT logic.
- (A) Data accuracy: on product pages the average rating & review count
  are now read from the retailer's embedded JSON (Walmart __NEXT_DATA__,
  Target __TGT_DATA__, ld+json) and cross-checked against the DOM; the
  JSON value wins if they disagree (no rounding drift). A model/style
  number is also captured to make cross-platform matching more reliable.
- (B) Efficiency: Deep Analyze now opens each low-rated item's
  reviews-specific URL (/reviews/product/... , /product-reviews/...) so
  the reviews mount directly - faster and more complete. Target keeps
  its product page. (Scans stay in the foreground, as fixed in v1.2.2.)
- (D) Small UX: capture date/time is embedded in the email copy, and the
  summary carries the "Below 4.0 #" column.

HOW TO USE
- Use the tool exactly as before (Search & Scan / Scan Current Page /
  Deep Analyze). Everything you scan now also appears in the
  "Cross-Platform Summary" section.
- When done, click "Copy as Email Table" and paste into Outlook.
- "Refresh" re-reads the latest scan; "Clear Summary" empties the matrix.
