# All This I Did Without You

[![Code: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](./LICENSE)
[![Letter: © Durrell family, all rights reserved](https://img.shields.io/badge/letter-%C2%A9%20Durrell%20family%20%C2%B7%20all%20rights%20reserved-8b1a2b.svg)](./COPYRIGHT.md)
[![Non-commercial](https://img.shields.io/badge/use-non--commercial-lightgrey.svg)](./COPYRIGHT.md)

**[📄 License (code)](./LICENSE)** · **[© Copyright (letter content)](./COPYRIGHT.md)**

An interactive, handwritten love letter you open and read as if you were holding the paper.

A sealed envelope lies on a desk. You turn it over, break the wax seal, draw out the folded letter and unfold it. Then you read it sheet by sheet, turning each page with a physical 3D page turn. The letter is Gerald Durrell's 1978 letter to Lee McGeorge, written out in royal-blue fountain-pen ink on Quarto paper.

> **Note:** This project was built as part of a **React.js assessment**. It is a front-end showcase of component architecture, animation, accessibility and responsive layout in React. It is not a commercial product. See [Copyright and license](#copyright-and-license) for the terms that apply to the letter.

---

## Contents

- [Features](#features)
- [Controls](#controls)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Adding another letter](#adding-another-letter)
- [Accessibility](#accessibility)
- [Deployment (CI/CD)](#deployment-cicd)
- [Copyright and license](#copyright-and-license)

---

## Features

- **Envelope**
  - The front has a handwritten sender and recipient, a row of three perforated stamps, and a postmark in uneven ink.
  - The back has a triangular flap and a raised, glossy wax seal pressed with a monogram, drawn with SVG lighting filters.
- **Opening**
  1. The seal presses and cracks.
  2. The flap swings open and the folded letter is drawn out.
  3. The envelope slides away and the letter unfolds panel by panel.
  4. The reader takes over without a cut.
- **Handwritten pages**
  - The letter is laid out at runtime into Quarto (203 × 254 mm) sheets.
  - Line breaks and page breaks are measured in the handwriting font.
  - Each line has a slightly wandering baseline and varying ink density.
  - Orphan and widow lines are avoided.
- **3D page turn**
  - Each sheet bends as it turns over its left edge and lands face-down on a read pile, with changing shading and a cast shadow.
  - It's built with CSS 3D and Motion; no WebGL.
- **Same proportions on every screen**
  - All sizes inside the paper are in container-query units, so the sheet keeps its exact aspect ratio at any size.
  - Small screens switch to a larger-type layout so the text stays readable.
- **Content kept separate**
  - The letter text lives in a Markdown file.
  - Envelope details (addresses, stamps, postmark, seal) live in one typed config object.

## Controls

| Action | Mouse / trackpad | Keyboard | Touch |
| --- | --- | --- | --- |
| Turn the envelope over | Left or right click | Tab to it, then <kbd>Enter</kbd> / <kbd>Space</kbd> | Tap |
| Break the seal | Left or right click on the seal | <kbd>Enter</kbd> / <kbd>Space</kbd> (focus moves there) | Tap the seal |
| Next page | Right click, drag left, or two-finger swipe left | <kbd>→</kbd> / <kbd>Page Down</kbd> | Swipe left, or tap the right half |
| Previous page | Left click, drag right, or two-finger swipe right | <kbd>←</kbd> / <kbd>Page Up</kbd> | Swipe right, or tap the left half |
| Put the letter back in its envelope | ✕ button, top right | <kbd>Esc</kbd> | Tap ✕ |

## Tech stack

- **[Next.js 16](https://nextjs.org/)** (App Router, static prerender) with **React 19** and **TypeScript**.
- **[Motion](https://motion.dev/)** (Framer Motion) for motion values and the animation sequences.
- **Tailwind CSS 4** for the base styles, plus plain CSS for the paper, desk and envelope materials.
- **next/font** to self-host the Google Fonts: La Belle Aurore for the handwriting, Herr Von Muellerhoff for the signature, and Cormorant Garamond for captions.

## Getting started

You need **Node.js 20.9 or later**; 22 is recommended (see `.nvmrc`).

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run verify:text` | Check that the letter in `content/` matches `letter-content.md` word for word |
| `npm run check` | Lint, typecheck and verify the text |

## Project structure

```
app/
  layout.tsx, page.tsx      # fonts, metadata; loads the letter and envelope config
  globals.css               # desk, paper, ink, page turn and envelope materials
components/
  Correspondence.tsx        # the two stages: sealed envelope, then the letter
  Desk.tsx                  # the surface, lamp light and caption
  Letter.tsx                # reader state: unread stack, read pile, turning
  LetterPage.tsx            # one sheet, front or back (handwritten lines)
  PageTurn.tsx              # the 3D page turn (strips hinged to bend)
  PaperTexture.tsx          # grain, fibres, tone, fold lines
  ControlsHint.tsx          # one quiet line of guidance
  envelope/
    Envelope.tsx            # stages and opening sequence
    EnvelopeFront.tsx       # addresses, stamps, postmark
    EnvelopeBack.tsx        # interior, pocket flaps, contents
    EnvelopeFlap.tsx        # hinged top flap
    WaxSeal.tsx             # SVG seal with lighting, cracks into two halves
    PostageStamp.tsx        # perforated stamps in a row
    PostalMark.tsx          # postmark and cancellation waves
    AddressBlock.tsx        # handwritten From / To blocks
    LetterReveal.tsx        # the tri-folded sheet and its unfold
hooks/
  useLetterLayout.ts        # measure words in the loaded font, then paginate
  useLetterControls.ts      # clicks, keys, swipes, trackpad gestures
  usePrefersReducedMotion.ts
lib/
  parse-letter.ts, letters.ts   # Markdown letter → structured document
  layout/                       # measuring, line breaking, pagination, profiles
  envelope.ts                   # EnvelopeConfig type
content/letters/
  durrell-1978.md               # the letter (frontmatter + text)
  durrell-1978.envelope.ts      # envelope details
public/stamps/                  # stamp image
scripts/verify-text.mjs         # text integrity check
```

## How it works

- **Layout.**
  - Once the handwriting font has loaded, every word is measured once in a hidden, 1000px-wide stand-in for the sheet.
  - Lines are filled greedily, with a slightly different right edge on each line, as a hand would write them.
  - They're then paginated in line units: the date and salutation go on sheet 1, paragraph gaps are counted, and a paragraph never leaves a single line alone at the top or bottom of a sheet. If the letter would end on a near-empty sheet, the sheet before it finishes early.
  - Everything is in `cqw` units, so the layout depends only on the layout profile (desktop or compact), never on pixel size.
- **Page turn.**
  - The turning sheet is cut into four vertical strips, each hinged to the one before. The strips lag slightly as the sheet turns, which reads as a curl.
  - Shading is interpolated across the strips, and a cast shadow falls on whichever pile lies beneath.
- **Envelope.**
  - It's drawn inside the letter's own box, and the folded letter inside it is the real first sheet cut into three panels.
  - When the panels finish unfolding, the result lines up exactly with the reader, which takes over on the same frame.

## Adding another letter

1. Add `content/letters/<slug>.md` with frontmatter (`slug`, `title`, `from`, `to`, `dateline`, `seed`, and optionally `signature`). Then write the date, the salutation and the paragraphs, separated by blank lines.
2. Add `content/letters/<slug>.envelope.ts` exporting an `EnvelopeConfig`: sender, recipient, stamps (`src`, `count`, `crop`), postmark, and seal (`monogram`, `wax`).
3. Load both in `app/page.tsx`, or add a route per letter.

## Accessibility

- Every interaction is a real `<button>` with an accessible name, and works with <kbd>Enter</kbd> / <kbd>Space</kbd>, touch and mouse. Right-click is an extra, never the only way.
- Focus moves logically: to the seal after the envelope turns over, into the letter once it's open, and back to the envelope when it's put away.
- The seal button uses `aria-expanded` and `aria-controls`. Live regions announce what changed ("Letter opened.", "Sheet 2 of 9").
- The letter is real, selectable HTML text; it isn't drawn as images.
- With `prefers-reduced-motion`, the 3D motion is replaced by instant changes.
- Focus is always visible, and nothing is conveyed by colour alone.

## Deployment (CI/CD)

**CI:** `.github/workflows/ci-cd.yml` runs on every push to `main` and on every pull request. It installs with `npm ci`, then runs lint, typecheck, text verification and a production build. Any failure turns the check red.

**CD:** deployment is handled by the hosting platform's Git integration, set up from its dashboard.

- **Vercel:** Add New → Project → import the repository. Next.js is detected automatically; no settings are needed.
- **Netlify:** Add new site → Import an existing project → pick the repository. Next.js is detected automatically: the build command is `npm run build`, and the Next.js runtime is applied for you.

Both platforms deploy `main` to production and create a preview for every pull request. Use Node.js 20.9 or later (see `.nvmrc`).

## Copyright and license

This repository is under two sets of terms: the code is under the [MIT License](./LICENSE), and the letter's rights and third-party credits are in [`COPYRIGHT.md`](./COPYRIGHT.md).

- **Source code:** MIT License.
- **The letter:** "All This I Did Without You", Gerald Durrell to Lee McGeorge, 31 July 1978.
  - © Gerald Durrell and his estate, his wife **Lee Durrell (née McGeorge)**, and the **Durrell family**. **All rights reserved.**
  - It is published in ***More Letters of Note: Correspondence Deserving of a Wider Audience***, compiled by Shaun Usher.
  - The text is reproduced here verbatim for non-commercial, educational use as part of a React.js assessment, and is **not** covered by the MIT License. No ownership is claimed.
  - The signature "Gerry" and the envelope addresses are illustrative additions.
- **Third-party assets:**
  - The stamp image is a scan of the 1977 USPS 13c Colorado Statehood Centennial stamp.
  - The fonts are under the SIL Open Font License.

If you hold rights to any of this content and want it changed or removed, please open an issue.
