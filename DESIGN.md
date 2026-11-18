---
name: 1mm
description: The 1mm quick parcel. A navy box with yellow tape and a waybill, opened by scrolling, holding white die-cut insert cards on a pale tray.
colors:
  navy: "#1E2A5A"
  navy-deep: "#141d42"
  navy-lift: "#2b3a75"
  yellow: "#FFD23F"
  yellow-hover: "#ffdb63"
  yellow-wash: "#FFF3CC"
  tray: "#f3f5f9"
  paper: "#ffffff"
  line: "#dfe3eb"
  ink: "#14161c"
  muted: "#566074"
  on-navy: "#e8ecf7"
  on-navy-muted: "#b7c0dd"
  good: "#087a4e"
  bad: "#c8261d"
typography:
  display:
    fontFamily: "Noto Sans KR, Apple SD Gothic Neo, system-ui, sans-serif"
    fontSize: "clamp(34px, 9vw, 58px)"
    fontWeight: 900
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Noto Sans KR, Apple SD Gothic Neo, system-ui, sans-serif"
    fontSize: "clamp(27px, 5.4vw, 42px)"
    fontWeight: 900
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  figure:
    fontFamily: "Noto Sans KR, Apple SD Gothic Neo, system-ui, sans-serif"
    fontSize: "clamp(34px, 7vw, 48px)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Noto Sans KR, Apple SD Gothic Neo, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Noto Sans KR, Apple SD Gothic Neo, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Noto Sans KR, Apple SD Gothic Neo, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  wordmark:
    fontFamily: "Nunito, Noto Sans KR, sans-serif"
    fontSize: "24px"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "-0.02em"
  numeral:
    fontFamily: "Nunito, Noto Sans KR, sans-serif"
    fontSize: "clamp(86px, 22vw, 150px)"
    fontWeight: 900
    lineHeight: 0.85
    letterSpacing: "-0.04em"
rounded:
  label: "6px"
  tag: "7px"
  panel: "10px"
  control-sm: "12px"
  control: "14px"
  pill: "999px"
spacing:
  gutter: "16px"
  row-x: "20px"
  row-y: "18px"
  stack: "14px"
  split: "56px"
  section-top: "clamp(72px, 12vw, 132px)"
  section-bottom: "clamp(48px, 8vw, 96px)"
components:
  button-primary:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.navy}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-primary-hover:
    backgroundColor: "{colors.yellow-hover}"
    textColor: "{colors.navy}"
  button-navy:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-navy-hover:
    backgroundColor: "{colors.navy-lift}"
    textColor: "{colors.paper}"
  button-small:
    rounded: "{rounded.control-sm}"
    padding: "10px 14px"
  waybill:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.label}"
    width: "min(560px, 100%)"
  waybill-header:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.navy}"
    padding: "14px 18px"
  waybill-stub:
    backgroundColor: "{colors.yellow-wash}"
    textColor: "{colors.muted}"
    padding: "16px 18px 18px"
  insert-card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "18px 20px"
  insert-card-navy:
    backgroundColor: "{colors.navy-lift}"
    textColor: "{colors.on-navy-muted}"
    padding: "20px"
  insert-card-yellow:
    backgroundColor: "{colors.yellow}"
    textColor: "{colors.navy}"
    padding: "26px 22px"
  document-header-navy:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.paper}"
    padding: "16px 20px"
  receipt:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "22px 20px 26px"
  tag:
    backgroundColor: "{colors.tray}"
    textColor: "{colors.navy}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "3px 9px"
  pill-numbered:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy}"
    rounded: "{rounded.pill}"
    padding: "6px 12px 6px 6px"
  pick-panel:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
    padding: "24px 20px"
  top-bar:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-navy}"
    height: "56px"
---

# Design System: 1mm

Scope: this file governs the **1mm web surfaces only** (today `1mm-site/index.html`; future 1mm intro or marketing pages follow it). The rest of this repository is LUMI, an unrelated Android/iOS photo app; nothing here applies to LUMI, and LUMI's visual language must not leak into 1mm.

The brand palette (navy and yellow) and the fonts (Noto Sans KR, Nunito 900 wordmark) were pinned by the existing 1mm quote prototype before this world was built. Everything else below is what the first build established.

## Overview

**Creative North Star: "The Quick Parcel"**

The page is the parcel itself. A visitor arrives at the face of a corrugated navy box, sealed by a strip of yellow tape, with a shipping waybill stuck in the middle. Scrolling slits the tape, the two lid flaps swing open, the waybill lifts away, and the pale tray inside shows what was packed: phone, USIM, inspection sheet, care card. Every section after that is one of the box's paper contents: a packing slip, a receipt, an inspection sheet, a 7-day card, the back of the waybill.

The world is shipping paperwork, not shop window. Information sits in ruled rows, line items, checkboxes and stamps, so limits and example amounts read as printed facts rather than marketing. Density is moderate and phone-first: one column at 390px, two columns of "prose + document" from 760px.

The world is kraft-free. The box board is navy, not brown cardboard, and the yellow is tape and label stock, not a highlight colour sprinkled on generic cards.

**Key Characteristics:**
- Navy board, yellow tape, white paper: three materials, each with a fixed job.
- Every container is a shipping document or a die-cut insert card, never a plain rounded card.
- Ruled rows (1.5px ink under headers, dashed hairlines between line items) carry structure instead of boxes and shadows.
- Heavy Korean type (Noto Sans KR 900) with tight negative tracking; Nunito 900 only for the wordmark and standalone numerals.
- One signature interaction: the scroll-driven unboxing.

## Colors

Two brand inks on paper: a deep blue-black navy board and a warm label yellow, over a cool near-white tray.

### Primary
- **Box Board Navy** (navy): the box face, the top bar, navy bands (USIM section, closing section), the waybill's notches, navy buttons, all headings on light ground, check boxes and numbered circles. It is the ink of the system.
- **Board Shadow Navy** (navy-deep): the dark edge of the board gradient, the slit line cut through the tape, the tray rim. Depth inside the navy only.
- **Board Highlight Navy** (navy-lift): the lit centre of the board gradient, navy-button hover, and the fill of insert cards that sit on a navy band.

### Secondary
- **Label Yellow** (yellow): packing tape, the waybill header strip, the primary CTA, counter discs on navy, the 7-day card, the highlighter band under the key word of the hero headline, and the wordmark's "mm" on navy.
- **Label Yellow, pressed** (yellow-hover): hover state of the yellow button only.
- **Stub Wash** (yellow-wash): the tear-off stub under the waybill, the "free quick fee" bar, slip-row hover, and the 1mm column of the comparison table.

### Neutral
- **Tray** (tray): page background for every light section and the inside of the opened box; also the fill of tags and icon wells.
- **Paper** (paper): waybill body, insert cards, receipt, inspection sheet, comparison table.
- **Hairline** (line): 1px borders on insert cards, dashed rules between line items, table row rules.
- **Ink** (ink): body text and the 1.5px header rules on documents.
- **Muted Ink** (muted): secondary text, field labels on the waybill, sub-lines; about 5.8:1 on tray.
- **On-Navy** (on-navy) / **On-Navy Muted** (on-navy-muted): text on navy bands; white is reserved for headings and bold row values there.

### Status
- **Pass Green** (good): checkmarks, the "S" grade, negative (discount) receipt amounts.
- **Stamp Red** (bad): the rotated "예시" stamp, the "no" icon (Jeju, no delivery). Never decorative.

**The Three Materials Rule.** Navy is board, yellow is tape and label stock, white is paper. A new element picks the material it would be made of in a real parcel, and takes that colour.

**The Yellow Sits On Navy Rule.** Yellow is a fill or a mark on navy; yellow text appears only on navy (wordmark "mm", emphasized figures in the pick panel). On white or tray, yellow is a fill behind navy text, never a text colour.

**The Stamp Rule.** Any illustrative amount is stamped: a red, outlined, slightly rotated "예시" stamp on the document, with unknown digits printed as ○. Red is reserved for stamps and hard "no" states.

## Typography

**Display Font:** Noto Sans KR (with Apple SD Gothic Neo, system-ui)
**Body Font:** Noto Sans KR
**Wordmark / Numeral Font:** Nunito 900

**Character:** One Korean grotesque doing all the talking at weights 400 to 900, tightened so 900 headlines read as stencilled box print; a rounded, chunky Latin face appears only where the brand mark or a single big character stands alone.

### Hierarchy
- **Display** (display): the hero headline printed on the waybill. Navy, balanced wrapping, key word underlined by a yellow highlighter band (62% to 92% of the line).
- **Headline** (headline): section titles, navy on tray, white on navy. A muted subtitle (700, clamp(14px, 2.6vw, 20px)) may sit directly under it as part of the heading. The closing section uses a larger headline (clamp(32px, 7vw, 54px)).
- **Figure** (figure): a single printed amount that is the point of a document row ("퀵비 5만원").
- **Title** (title): item names inside documents and cards (17 to 22px across contexts, 700 or 900).
- **Body** (body): paragraphs and section intros (16 to 16.5px, max 36 to 52ch); document rows run 13.5 to 15px.
- **Label** (label): tags, waybill captions, stub notes, footnotes (12 to 13.5px).
- **Wordmark** (wordmark): "1mm" with "mm" in yellow on navy, all navy on yellow or white.
- **Numeral** (numeral): the "7" on the care card; grade letters S / A / B at 30px use the same face.

**The Keep-All Rule.** Korean text breaks at word boundaries (`word-break: keep-all`) and headings wrap balanced. Never let a Korean word split across lines.

**The Nunito Is Only For Marks Rule.** Nunito sets the wordmark, grade letters and the lone big numeral. It never sets a Korean word, a sentence or a heading.

**The Tabular Rule.** Numbers are tabular across the page so receipt and waybill columns align.

## Layout

A single 1080px column (`max-width`) with a 16px gutter, or the safe-area inset when larger. Light sections sit on the tray; navy sections are full-bleed bands. Section rhythm is spacing.section-top over spacing.section-bottom; sections that continue the previous one (phone after slip, care after inspection) pull their top padding in to roughly half.

Under 760px everything is one column. From 760px the "two" pattern sets a heading-and-prose column beside its document (1fr / 1fr, 48px gap), the receipt split goes 5fr / 6fr with a 56px gap, the activation flow becomes three equal steps, and the top bar grows from 56px to 64px. Under 420px document rows tighten to 14px side padding and secondary row notes drop.

The first viewport is the full-height box face (100svh) with the waybill centred; the top bar is fixed and navy at all times.

**The Tray Rule.** Content lives on the tray; navy bands are the box walls between groups of paper. Do not alternate random section colours.

## Elevation & Depth

Depth is physical and soft: paper resting on a tray, lit from above. Shadows are long, low-opacity, navy-tinted drops with negative spread, so they pool under an object rather than ringing it. Most documents carry no shadow at all and rely on the tray contrast and a hairline. The box itself gets depth from a radial board gradient, fine vertical flutes (2px every 7px at 2.5% white), and an inset rim shadow on the open tray.

### Shadow Vocabulary
- **Waybill lift** (`0 30px 60px -24px rgba(0,0,0,.6), 0 2px 0 rgba(0,0,0,.05)`): the waybill on the box face only.
- **Receipt rest** (`0 24px 40px -28px rgba(20,29,66,.4)`): a loose paper document on the tray.
- **Table rest** (`0 24px 50px -32px rgba(20,29,66,.35)`): the comparison table.
- **Button yellow** (`0 6px 14px -6px rgba(10,14,32,.45)`) / **Button navy** (`0 8px 18px -8px rgba(30,42,90,.55)`): buttons sit slightly proud.
- **Object drop** (`drop-shadow(0 22px 26px rgba(20,29,66,.35))`): illustrated objects (phone, USIM) in the open tray.
- **Bar edge** (`0 1px 0 rgba(0,0,0,.25)`): the fixed top bar.

**The Resting Paper Rule.** Shadows have negative spread and navy tint and fall downward. No hard offset shadows, no glows, no shadow on every card.

## Shapes

Three shape families, each tied to a material:

- **Die-cut inserts.** Insert cards (packing slip, phone routes, inspection sheet, care list, waybill back, grade tiles, activation steps, 7-day card) have square edges with a concave quarter-circle notch (15px) punched out of each corner, made by a CSS mask, not by border-radius.
- **Paper documents.** The waybill has small rounded corners (rounded.label) with two navy half-circle notches where the stub tears off along a 2px dashed perforation. The receipt has a straight top and a scalloped torn bottom edge (7px bites every 16px).
- **Controls and labels.** Buttons are softly rounded (rounded.control, rounded.control-sm for small); tags and check boxes use rounded.tag; contents pills and question chips are full pills; numbered markers are circles (navy outline or filled), or 10px rounded squares on the activation steps.

Rules: a 1.5px ink line under every document header; 1px dashed hairlines between line items; 1px solid hairlines between table rows.

**The Die-Cut Rule.** A container that holds content in this world is an insert card with die-cut corners or a named shipping document. Never a plain rounded rectangle card.

## Components

### Buttons
- **Shape:** softly rounded (rounded.control); small variant rounded.control-sm.
- **Primary (yellow):** yellow fill, navy 700 text, 15px, 13px x 18px padding, button-yellow shadow. Used in the top bar, on navy panels, and in the closing band.
- **Navy:** navy fill, white text; used where the ground is yellow or white (the waybill stub CTA).
- **Hover / Active:** fill shifts to yellow-hover or navy-lift; the trailing arrow slides 3px right; press scales to 0.97. Transitions 0.2s on the expo-out ease.
- **Focus:** 3px yellow outline at 3px offset on navy ground, navy outline on light ground.

### Waybill (signature)
The hero object. White paper with a yellow header strip holding the navy wordmark, "퀵 송장" and a barcode drawn from bars with a letter-spaced caption. Below: a two-column field list (muted label / bold value, 1px row rules) closed by a 1.5px ink rule; then the display headline and lede; then the tear-off stub in yellow-wash, separated by a dashed perforation with navy notches, holding the navy CTA and a label-size note.

### Insert cards and documents
- **Packing slip:** header row (bold title, muted route "1mm 출고지 → 고객님") over a numbered list; each row has an outlined navy number circle, item name and sub-line, quantity and a chevron; rows hover to yellow-wash.
- **Inspection sheet:** navy header strip, then checklist rows with 26px outlined navy boxes whose checks draw in sequence (0.5s each, 0.12s stagger) when the sheet scrolls into view; the default state is legible without motion.
- **Receipt:** wordmark header with the red "예시" stamp, line-item table with dashed rules, discounts in green, ○ placeholder digits, a navy 900 total row, and a footnote.
- **Waybill back:** header row, status rows led by a green check / navy mark / red cross icon, closed by a yellow-wash figure bar.
- **Grade tiles:** three die-cut tiles, Nunito grade letter (S in green) over a muted description.
- **7-day card:** a yellow die-cut card carrying the giant Nunito numeral.
- **Activation steps:** navy-lift die-cut cards on the navy band, numbered by yellow rounded squares.

### Chips
- **Tag:** tray fill, navy 700 label text, rounded.tag. Static descriptors only.
- **Numbered pill:** white pill with a navy or yellow numbered disc; used for the tray contents legend and the question list in the pick panel (translucent white on navy there).

### Navigation
A fixed navy top bar: wordmark left, muted tagline (hidden under 420px), small yellow CTA right. No menu; in-page movement happens through the packing slip's rows.

### Unboxing interaction (signature)
The hero section is 210svh tall with a sticky 100svh stage. Scroll progress drives three custom properties, each eased with a cubic ease-out: the tape slit (0 to 16% of the run), the waybill lifting up and rotating -9deg out of frame (10 to 36%), and the lid opening (22 to 78%), where two board flaps rotate up to 82deg on a 1400px perspective and the yellow tape halves fade. The tray fades up behind them with the phone and USIM and a numbered contents legend. With reduced motion or without JS, the page shows the closed box face with the waybill, statically, and nothing is hidden.

## Do's and Don'ts

### Do:
- **Do** make every new surface a parcel object: a waybill, slip, receipt, sheet, card or label, with a header rule and ruled rows.
- **Do** give insert cards the die-cut corner mask and a 1px hairline, on paper, navy-lift or yellow.
- **Do** stamp every illustrative amount "예시" and print unknown digits as ○.
- **Do** keep primary CTAs yellow on navy and navy on yellow or white.
- **Do** set Korean in Noto Sans KR with `keep-all` breaking and negative tracking at 700 to 900.
- **Do** draw icons as stroked inline SVG (2 to 2.4px strokes, round caps) in navy, green or red by meaning.
- **Do** ship the closed-box face as the full reduced-motion experience.

### Don't:
- **Don't** use kraft brown or cardboard textures; the board is navy.
- **Don't** use plain rounded cards, glassmorphism or gradient cards for content.
- **Don't** set yellow text on white or tray.
- **Don't** use Nunito for Korean or for headings.
- **Don't** add hard offset shadows, glows or shadows on every card.
- **Don't** add kicker or eyebrow labels above headings; the subtitle sits under the heading.
- **Don't** use carrier, Apple or Samsung logos; carrier names are plain text.
- **Don't** use emoji or text glyphs as icons.
