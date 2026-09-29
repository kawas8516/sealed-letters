// Checks that the letter the site renders is word-for-word the source text.
// Usage: node scripts/verify-text.mjs [letter-slug]
import { readFileSync } from "node:fs";
import path from "node:path";

const slug = process.argv[2] ?? "durrell-1978";
const file = path.join(process.cwd(), "content", "letters", `${slug}.md`);
const raw = readFileSync(file, "utf8").replace(/\r\n?/g, "\n");

const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");
const blocks = body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);

// The parser in lib/parse-letter.ts must see exactly these blocks.
const expected = readFileSync(path.join(process.cwd(), "letter-content.md"), "utf8")
  .replace(/\r\n?/g, "\n")
  .split(/\n\s*\n/)
  .map((b) => b.trim())
  .filter(Boolean);

let ok = blocks.length === expected.length;
for (let i = 0; i < Math.max(blocks.length, expected.length); i++) {
  if (blocks[i] !== expected[i]) {
    ok = false;
    console.error(`Block ${i + 1} differs:\n  content: ${blocks[i]?.slice(0, 80)}\n  source:  ${expected[i]?.slice(0, 80)}`);
  }
}
// Rendering splits on whitespace only, so words must survive intact.
const words = blocks.slice(2).join(" ").split(/\s+/).length;
console.log(ok ? `OK: ${blocks.length} blocks, ${words} body words match letter-content.md` : "MISMATCH");
process.exit(ok ? 0 : 1);
