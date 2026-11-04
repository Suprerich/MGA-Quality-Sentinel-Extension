========================================================================
Quality Rating & Complaint Analysis Tool - v1.4.0 UPGRADE NOTES
========================================================================
ALL v1.0.2 - v1.3.0 behaviour is UNCHANGED (Search & Scan, Scan Current
Page, Copy JSON, Export CSV, Deep Analyze, Export Low-Rated Excel, Side
Panel, Cross-Platform Summary, Copy as Email Table). v1.4.0 only ADDS /
improves:

  1) SKU Validation (precise product matching)
  2) Standardized Complaint Classification
  3) Rating Trend Tracking
  + v1.4.0a: Key Findings now reads as a natural sentence, and the Safety
    category was tightened to remove false hits from the boilerplate
    "choking hazard - small parts" warning.

------------------------------------------------------------------------
FILES IN THIS UPGRADE
------------------------------------------------------------------------
NEW      classification_v2.js   (content script)
NEW      sku_core.js            (UI helper, loaded before summary.js)
NEW      sku_validation.js      (UI panel)
NEW      trend_tracking.js      (UI panel)
CHANGED  summary.js             (grouping logic + natural Key Findings)
CHANGED  manifest.json          (version 1.4.0; + "storage"; + classification_v2.js)
CHANGED  popup.html / sidepanel.html (load the 3 new scripts in order)

Keep all your other files as-is (background.js, content.js, deep_review.js,
popup.js, sidepanel.js, style.css, sidepanel.css).

INSTALL: remove the old unpacked extension > copy these files over the
old folder (overwrite when asked) > chrome://extensions > Reload.

========================================================================
KEY FINDINGS - NEW WORDING (v1.4.0a)
========================================================================
Before:  "Main 1-2* complaints: Function issue (3), Damage (1)."
Now:     "... is rated below 4.0 on Walmart US, Walmart CA, Target
          (lowest 2.1 on Target). Main complaints are related to
          function issues, not working, broken parts and quality concerns."

HOW IT WORKS
  - Categories are ranked by how often they appear in the 1-2* / negative
    reviews, mapped to friendly phrases (Function issue -> "function
    issues", Damage -> "broken parts", Quality -> "quality concerns"...).
  - A representative keyword found in the actual review text is surfaced
    right after key categories (e.g. "not working", "stopped working",
    "broken", "cheap"), so the sentence is concrete, not just labels.
  - Output is capped to the top ~5 phrases and joined naturally with
    commas + "and".

SAFETY FALSE-POSITIVE FIX
  - The Safety word list no longer contains generic tokens ("small parts",
    "sharp") that matched the standard on-page warning
    "choking hazard - small parts". Safety now needs an explicit phrase
    (e.g. "choking hazard", "sharp edge", "caught fire"), so a normal
    "saw stopped working" review is correctly classed as Function issue,
    not Safety.

========================================================================
1) SKU VALIDATION
========================================================================
  * "My Tracked SKUs (Watchlist)" editor, one item per line:
        Name | UPC | Model | WM# | TCIN | ASIN   (only Name required)
  * Matching priority: UPC > Model > platform ID (WM#/TCIN/ASIN) >
    strict name (>=0.60 overlap) WITH a series guard that blocks merging
    different variants (Class Prez <-> Princess Tots).
  * "Open exact product": paste a full URL or a bare UPC/TCIN/WM#/ASIN to
    jump straight to the exact item (incl. Target-exclusive by TCIN).
  * "Watchlist match on this page": confirms which tracked items matched
    and HOW, and flags other results as different series (not merged).
  * Cross-Platform Summary groups by the matched watchlist item, so the
    same item lines up across WM US / WM CA / Amazon / Target.

========================================================================
2) STANDARDIZED COMPLAINT CLASSIFICATION
========================================================================
  * Scored classifier (was "first rule wins"): counts keyword hits per
    category, picks the strongest, ties broken by severity priority:
    Safety > Function > Missing > Damage > Quality > Packaging >
    Assembly > Size/Appearance > Delivery > Value.
  * Each category carries Critical / Major / Minor severity
    (window.QC_ISSUE_SEVERITY / window.issueSeverity()).

========================================================================
3) RATING TREND TRACKING
========================================================================
  * Saves one snapshot per product+platform+day (chrome.storage.local).
  * Panel shows history oldest->latest with a delta arrow
    (v worsening / ^ improving / <-> flat); below-threshold shown red.
  * "Export Trend CSV" / "Clear History".

========================================================================
QUICK START
========================================================================
  1. Reload the extension. Open the Side Panel (or popup).
  2. Paste tracked items into "My Tracked SKUs" and Save.
  3. Use Search & Scan / Scan Current Page / Deep Analyze - or use
     "Open exact product" to jump to a specific item.
  4. Check the "Watchlist match" box to confirm the right item matched.
  5. Cross-Platform Summary + Rating Trend fill in automatically.

NOTE: These files passed JavaScript syntax validation, but were not run
inside a live Chrome browser here. Load Unpacked and test with a known
item (e.g. Little Tikes Power Cuts 2.1) before wider rollout.
========================================================================
