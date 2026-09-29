import type { LayoutLine, LetterDocument, Sheet, SheetBlock } from "../types";
import type { ProfileSpec } from "./profiles";
import { SHEET_RATIO } from "./profiles";
import { hash01 } from "./rng";
import type { WordMetrics } from "./measure";

export function splitWords(paragraph: string): string[] {
  return paragraph.split(/\s+/).filter(Boolean);
}

/**
 * Greedy line filling. Each line gets a slightly different right edge,
 * because a hand never stops at exactly the same place twice.
 */
export function breakLines(
  doc: LetterDocument,
  spec: ProfileSpec,
  metrics: WordMetrics,
): LayoutLine[] {
  const seed = doc.meta.seed;
  // Room for the per-line drift applied at render time.
  const measure = 100 - spec.marginLeft - spec.marginRight - 1.2;
  const lines: LayoutLine[] = [];
  let lineNo = 0;

  doc.paragraphs.forEach((paragraph, p) => {
    const words = splitWords(paragraph);
    let current: string[] = [];
    let width = 0;
    let first = true;

    const limit = () => {
      const ragged = 1 - 0.045 * hash01(seed, 1000 + lineNo);
      return (measure - (first ? spec.indent : 0)) * ragged;
    };

    const flush = (last: boolean) => {
      lines.push({ text: current.join(" "), paragraph: p, first, last });
      lineNo++;
      current = [];
      width = 0;
      first = false;
    };

    for (const word of words) {
      const w = metrics.widths.get(word) ?? 0;
      const next = current.length === 0 ? w : width + metrics.space + w;
      if (current.length > 0 && next > limit()) {
        flush(false);
        current.push(word);
        width = w;
      } else {
        current.push(word);
        width = next;
      }
    }
    if (current.length) flush(true);
  });

  return lines;
}

/** Fewest lines the closing sheet should carry above the signature. */
const MIN_CLOSING_LINES = 8;

/**
 * Lays lines onto sheets. Heights are counted in line units, so the maths is
 * exact for every rendered size. Sheets deliberately don't all fill to the
 * same depth, and single orphan or widow lines are avoided.
 *
 * If the letter would end on a nearly empty sheet, the sheet before it
 * finishes early instead, as a writer would when they saw the end coming,
 * so the closing lines and signature have company.
 */
export function paginate(doc: LetterDocument, spec: ProfileSpec, lines: LayoutLine[]): Sheet[] {
  let sheets = layOut(doc, spec, lines, null);
  const penultimate = sheets.length - 1;
  const want = Math.min(MIN_CLOSING_LINES, lines.length);

  for (
    let reserve = 1;
    penultimate >= 1 && linesOn(sheets.at(-1)!) < want && reserve <= 14;
    reserve++
  ) {
    const attempt = layOut(doc, spec, lines, { sheet: penultimate, units: reserve });
    if (attempt.length > sheets.length) break;
    // Share the ending out; never starve the sheet before it.
    if (linesOn(attempt[penultimate - 1]) < linesOn(attempt.at(-1)!)) break;
    sheets = attempt;
  }
  return sheets;
}

function linesOn(sheet: Sheet) {
  return sheet.blocks.filter((b) => b.kind === "line").length;
}

function layOut(
  doc: LetterDocument,
  spec: ProfileSpec,
  lines: LayoutLine[],
  reserve: { sheet: number; units: number } | null,
): Sheet[] {
  const seed = doc.meta.seed;
  const sheetHeight = 100 * SHEET_RATIO;
  const usable = (sheetHeight - spec.marginTop - spec.marginBottom) / spec.lineHeight;

  const gapFor = (p: number) => {
    const [lo, hi] = spec.paragraphGap;
    return lo + (hi - lo) * hash01(seed, 5000 + p);
  };

  // Lines of each paragraph, so widow/orphan checks can see the whole shape.
  const byParagraph = new Map<number, number[]>();
  lines.forEach((l, i) => {
    const list = byParagraph.get(l.paragraph) ?? [];
    list.push(i);
    byParagraph.set(l.paragraph, list);
  });

  const sheets: Sheet[] = [];
  let blocks: SheetBlock[] = [];
  let used = 0;
  let capacity = 0;

  const openSheet = () => {
    const n = sheets.length + 1;
    blocks = [];
    used = 0;
    // Later sheets stop a little short of the margin, by a varying amount.
    capacity = usable - (n === 1 ? 0 : 0.2 + 0.9 * hash01(seed, 9000 + n));
    if (reserve?.sheet === n) capacity -= reserve.units;
    if (n === 1) {
      blocks.push({ kind: "date", text: doc.date });
      blocks.push({ kind: "salutation", text: doc.salutation });
      used = spec.dateUnits + spec.salutationUnits;
    }
  };
  const closeSheet = () => {
    sheets.push({ number: sheets.length + 1, blocks });
  };

  openSheet();
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const siblings = byParagraph.get(line.paragraph)!;
    const posInPara = siblings.indexOf(i);
    const remainingInPara = siblings.length - posInPara;

    // Paragraph gap before every paragraph except the first line on a sheet.
    const needsGap = line.first && used > 0 && blocks.at(-1)?.kind === "line";
    const gap = needsGap ? gapFor(line.paragraph) : 0;

    const free = capacity - used - gap;
    let take = 0;

    if (line.first) {
      // Starting a paragraph: need room for at least two lines (no orphan),
      // unless the whole paragraph is a single line.
      const minStart = Math.min(2, remainingInPara);
      if (free >= minStart) take = Math.min(Math.floor(free), remainingInPara);
    } else {
      take = Math.min(Math.floor(capacity - used), remainingInPara);
    }

    // Avoid a single widow line carried to the next sheet.
    if (take > 0 && take < remainingInPara && remainingInPara - take === 1) {
      take = take - 1 >= (line.first ? 2 : 1) ? take - 1 : 0;
    }

    if (take <= 0) {
      closeSheet();
      openSheet();
      continue;
    }

    if (gap) {
      blocks.push({ kind: "gap", units: gap });
      used += gap;
    }
    for (let k = 0; k < take; k++) {
      blocks.push({ kind: "line", line: lines[i + k], index: i + k });
    }
    used += take;
    i += take;
  }

  if (doc.meta.signature) {
    if (capacity - used < spec.signatureUnits) {
      // Carry the last two lines over so the signature never sits alone.
      const tail: SheetBlock[] = [];
      let moved = 0;
      while (moved < 2 && blocks.length > 0) {
        const b = blocks.pop()!;
        if (b.kind === "line") moved++;
        if (b.kind !== "gap") tail.unshift(b);
      }
      closeSheet();
      openSheet();
      blocks.push(...tail);
    }
    blocks.push({ kind: "signature", text: doc.meta.signature });
  }
  closeSheet();

  return sheets;
}
