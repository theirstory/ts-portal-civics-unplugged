# Plan: Beautiful Notes, PDF Export, Public Share & Slide Export

## Context

The notes feature currently works well functionally but looks generic — system fonts, plain Helvetica PDFs, a minimal public share page, and no slide export. The goal is to elevate all four surfaces to creative-agency quality: polished typography, professional branding, and cohesive visual design.

---

## 1. Typography Foundation — Load Inter via `next/font`

The theme declares `Inter` but it's never loaded. This is the single highest-impact change.

**File:** `app/layout.tsx`

- Import Inter from `next/font/google` with weights 400, 500, 600, 700
- Apply the font variable to `<html>` className
- Update `app/globals.css` to use the CSS variable instead of 'Public Sans'

**File:** `lib/theme/theme.ts`

- Update fontFamily to use the CSS variable: `'var(--font-inter), Inter, system-ui, sans-serif'`

---

## 2. PDF Export — Professional Report Quality

Replace the current bare-text jsPDF output with a branded, typographically-polished document.

**File:** `app/notes/Components/NoteEditor.tsx` (handleExportPdf)

**Changes:**

- **Title page:** Organization logo (loaded from config), note title in large type, author/date, subtle primary-color accent line
- **Page numbers:** "Page X of Y" in footer on every page (except title page)
- **Header accent:** Thin primary-color line at top of each content page
- **Better typography:** Use Helvetica-Bold for headings (jsPDF built-in), proper size hierarchy (24pt title, 18/14/12 headings, 10.5pt body), 1.5x line height
- **Blockquote styling:** Primary-color left bar instead of grey
- **Code blocks:** Light grey fill rectangle with proper padding
- **Image handling:** Keep existing alignment/width logic
- **Spacing:** More generous margins between sections, proper paragraph spacing

**Approach:** Refactor the PDF generation into a dedicated utility file `app/notes/utils/pdfExport.ts` to keep NoteEditor.tsx manageable. The function receives the TipTap JSON, org config (name, logo), theme colors, and note metadata (title, updatedAt).

---

## 3. Public Share Page — Beautiful Reading Experience

Transform the plain Paper component into a polished, magazine-quality reading view.

**File:** `app/notes/public/[slug]/page.tsx`

**Changes:**

- **Hero section:** Note title in large display type (2.5rem, weight 700), subtle date below, thin primary-color divider
- **Content area:** Wider max-width (720px content), generous line-height (1.8), slightly larger body text (1.0625rem / 17px)
- **Typography refinements:** Larger heading sizes, better spacing between sections, styled blockquotes with primary-color left border
- **Organization branding:** Small org name + logo in a minimal footer
- **Clean background:** White card on subtle off-white (#fafafa) background, no border (elevation: 0, subtle shadow)
- **Image styling:** Rounded corners, subtle shadow on images
- **Responsive:** Stack gracefully on mobile with adjusted padding
- **Meta tags:** Add Open Graph / Twitter card metadata via `generateMetadata` for nice link previews when shared (title, description from first paragraph)

**File:** `app/notes/public/[slug]/layout.tsx` (new)

- Override metadata with dynamic note title/description for social sharing

---

## 4. Notes Editor — Visual Polish

Subtle refinements to the editing experience (not a redesign).

**File:** `app/notes/Components/NoteEditor.tsx`

- **Editor content area:** Increase line-height to 1.7, slightly larger body text (0.9375rem)
- **Heading sizes:** Bump up slightly — h1: 2rem, h2: 1.5rem, h3: 1.25rem
- **Blockquotes:** Use primary color for the left border instead of grey divider
- **Better image styling:** Subtle box-shadow on images in editor

**File:** `app/notes/Components/NoteEditorToolbar.tsx`

- **Visual grouping:** Slightly more spacing between divider groups, subtle background on hover states

---

## 5. Slide Export — New Feature (PPTX via pptxgenjs)

Add ability to export notes as PowerPoint-compatible slides.

**Install:** `pptxgenjs` (generates .pptx files that open in PowerPoint, Google Slides, Keynote)

**New file:** `app/notes/utils/slideExport.ts`

**Slide splitting strategy:**

- Each **H1** starts a new slide as a **title slide** (large centered text)
- Each **H2** starts a new content slide with the H2 as slide title
- Content between headings becomes bullet points on that slide
- Images become full-slide or half-slide backgrounds/insets depending on size
- Blockquotes become styled quote slides
- If there are no headings, split every ~5 paragraphs into a slide

**Slide design:**

- **Title slide:** Org logo top-left, note title centered large, primary-color accent bar, date at bottom
- **Content slides:** H2 title at top, body text as bullets, primary-color accent line under title
- **Quote slides:** Large italic quote text centered, speaker attribution below
- **Image slides:** Image fills most of the slide with a small caption
- **Closing slide:** Org name + logo centered

**Branding:** Pull org name, logo path, and primary/secondary colors from config.json

**UI integration:**

- Add "Export as slides" button in the NoteEditor header (next to PDF button)
- Use `SlideshowIcon` from MUI icons

---

## Files to Create

- `app/notes/utils/pdfExport.ts` — extracted PDF generation logic
- `app/notes/utils/slideExport.ts` — PPTX generation
- `app/notes/public/[slug]/layout.tsx` — metadata for social sharing

## Files to Modify

- `app/layout.tsx` — load Inter font
- `app/globals.css` — use Inter CSS variable
- `lib/theme/theme.ts` — reference font variable
- `app/notes/Components/NoteEditor.tsx` — editor styling, refactored PDF handler, slide export button
- `app/notes/Components/NoteEditorToolbar.tsx` — subtle visual refinements
- `app/notes/public/[slug]/page.tsx` — redesigned public view

## Existing Code to Reuse

- `config/organizationConfig.ts` — org name, logo, colors (already exported)
- `lib/theme/colors.ts` — centralized color system
- `renderInlineContent()` / `renderListItems()` in NoteEditor.tsx — move to shared util
- `getPlainText()` helper — reuse for both PDF and slides

## Verification

1. Load a note in the editor — typography should look more polished
2. Export as PDF — should have title page with logo, page numbers, proper formatting
3. Open a public share link — should look like a polished article page
4. Export as slides — open the .pptx in PowerPoint/Google Slides/Keynote, verify branding and layout
5. Type-check: `npx tsc --noEmit`
