import type { LayoutProfile } from "../types";

/** Quarto sheet: 203 × 254 mm. */
export const SHEET_RATIO = 254 / 203;

/**
 * Every measurement is in cqw (percent of sheet width), so a layout computed
 * once per profile holds at any rendered size.
 */
export interface ProfileSpec {
  /** Body font size. */
  font: number;
  /** Line pitch (baseline to baseline). */
  lineHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  /** First-line paragraph indent. */
  indent: number;
  /** Paragraph gap, in line units (varied per paragraph). */
  paragraphGap: [number, number];
  /** Space taken by the date and salutation on sheet one, in line units. */
  dateUnits: number;
  salutationUnits: number;
  /** Space the signature needs on the final sheet, in line units. */
  signatureUnits: number;
}

export const PROFILES: Record<LayoutProfile, ProfileSpec> = {
  desktop: {
    font: 3.05,
    lineHeight: 5.05,
    marginTop: 10.5,
    marginBottom: 9,
    marginLeft: 10.5,
    marginRight: 9,
    indent: 5,
    paragraphGap: [0.35, 0.6],
    dateUnits: 1.6,
    salutationUnits: 1.9,
    signatureUnits: 3,
  },
  compact: {
    font: 4.35,
    lineHeight: 6.9,
    marginTop: 8.5,
    marginBottom: 7.5,
    marginLeft: 7.5,
    marginRight: 6.5,
    indent: 5,
    paragraphGap: [0.3, 0.5],
    dateUnits: 1.5,
    salutationUnits: 1.8,
    signatureUnits: 2.8,
  },
};

/** Paper narrower than this (px) switches to larger relative type. */
export const COMPACT_BREAKPOINT = 480;

export function profileForWidth(px: number): LayoutProfile {
  return px < COMPACT_BREAKPOINT ? "compact" : "desktop";
}

/** Mirrors `--paper-w` in globals.css, so the profile is known without layout. */
export function paperWidthFor(viewportW: number, viewportH: number, remPx = 16): number {
  const fit = Math.min(viewportW * 0.92, ((viewportH - 7.5 * remPx) * 203) / 254);
  return Math.max(300, Math.min(fit, 720));
}
