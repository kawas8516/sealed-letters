import type { LetterDocument, LetterMeta } from "./types";

/**
 * Letter files are plain text with a small frontmatter block:
 *
 *   ---
 *   key: value
 *   ---
 *   <date>
 *
 *   <salutation>
 *
 *   <paragraph>...
 *
 * Blocks are separated by blank lines. The text itself is never altered
 * beyond trimming surrounding whitespace.
 */
export function parseLetter(raw: string): LetterDocument {
  const normalized = raw.replace(/\r\n?/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Letter is missing its frontmatter block");

  const fields: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    fields[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }

  const meta: LetterMeta = {
    slug: fields.slug,
    title: fields.title ?? "",
    from: fields.from ?? "",
    to: fields.to ?? "",
    dateline: fields.dateline ?? "",
    signature: fields.signature || undefined,
    signatureIsAddition: fields.signatureIsAddition === "true",
    seed: Number(fields.seed ?? 1),
  };

  const blocks = match[2]
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const [date, salutation, ...paragraphs] = blocks;
  if (!date || !salutation || paragraphs.length === 0) {
    throw new Error(`Letter "${meta.slug}" needs a date, a salutation and a body`);
  }

  return { meta, date, salutation, paragraphs };
}
