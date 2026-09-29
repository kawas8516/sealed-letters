export interface LetterMeta {
  slug: string;
  title: string;
  from: string;
  to: string;
  dateline: string;
  /** Name written under the letter. */
  signature?: string;
  /** True when the signature is not part of the source text. */
  signatureIsAddition?: boolean;
  /** Seed for handwriting variation, so each letter always looks the same. */
  seed: number;
}

export interface LetterDocument {
  meta: LetterMeta;
  date: string;
  salutation: string;
  paragraphs: string[];
}

/** One handwritten line after layout. */
export interface LayoutLine {
  text: string;
  /** Index of the paragraph this line belongs to. */
  paragraph: number;
  /** First line of a paragraph (indented). */
  first: boolean;
  /** Last line of a paragraph. */
  last: boolean;
}

export type SheetBlock =
  | { kind: "date"; text: string }
  | { kind: "salutation"; text: string }
  | { kind: "line"; line: LayoutLine; index: number }
  | { kind: "gap"; units: number }
  | { kind: "signature"; text: string };

export interface Sheet {
  number: number;
  blocks: SheetBlock[];
}

export type LayoutProfile = "desktop" | "compact";
