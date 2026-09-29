/**
 * Measures word widths in the real handwriting font, in cqw.
 *
 * A hidden 1000px-wide box stands in for the sheet, so 1cqw = 10px. All words
 * go into one element and are read in a single layout pass.
 */
const CANONICAL_PX = 1000;

export interface WordMetrics {
  widths: Map<string, number>;
  space: number;
}

export function measureWords(
  words: Iterable<string>,
  className: string,
  fontCqw: number,
): WordMetrics {
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:absolute",
    "left:-99999px",
    "top:0",
    `width:${CANONICAL_PX}px`,
    "visibility:hidden",
    "pointer-events:none",
    "contain:layout style",
  ].join(";");

  const probe = document.createElement("div");
  probe.className = className;
  probe.style.fontSize = `${(fontCqw * CANONICAL_PX) / 100}px`;
  probe.style.whiteSpace = "nowrap";
  host.appendChild(probe);

  const unique = Array.from(new Set(words));
  const spans = unique.map((w) => {
    const s = document.createElement("span");
    s.style.display = "inline-block";
    s.textContent = w;
    probe.appendChild(s);
    return s;
  });

  // Space width: difference between "x x" and "xx".
  const pair = document.createElement("span");
  pair.style.display = "inline-block";
  pair.style.whiteSpace = "pre";
  pair.textContent = "x x";
  const solid = document.createElement("span");
  solid.style.display = "inline-block";
  solid.textContent = "xx";
  probe.append(pair, solid);

  document.body.appendChild(host);

  const toCqw = (px: number) => (px / CANONICAL_PX) * 100;
  const widths = new Map<string, number>();
  unique.forEach((w, i) => widths.set(w, toCqw(spans[i].getBoundingClientRect().width)));
  const space = toCqw(pair.getBoundingClientRect().width - solid.getBoundingClientRect().width);

  host.remove();
  return { widths, space };
}
