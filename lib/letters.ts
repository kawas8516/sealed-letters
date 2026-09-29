import "server-only";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parseLetter } from "./parse-letter";
import type { LetterDocument } from "./types";

const LETTERS_DIR = path.join(process.cwd(), "content", "letters");

export async function listLetterSlugs(): Promise<string[]> {
  const files = await readdir(LETTERS_DIR);
  return files.filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
}

export async function loadLetter(slug: string): Promise<LetterDocument> {
  const raw = await readFile(path.join(LETTERS_DIR, `${slug}.md`), "utf8");
  return parseLetter(raw);
}
