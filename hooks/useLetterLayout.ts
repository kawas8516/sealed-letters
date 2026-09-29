"use client";

import { useEffect, useState } from "react";
import { measureWords } from "@/lib/layout/measure";
import { breakLines, paginate, splitWords } from "@/lib/layout/paginate";
import { PROFILES } from "@/lib/layout/profiles";
import type { LayoutProfile, LetterDocument, Sheet } from "@/lib/types";

export interface LetterLayout {
  profile: LayoutProfile;
  sheets: Sheet[];
}

/**
 * Lays the letter out once the handwriting font is available. Layout depends
 * only on the profile, never on pixel size, so resizing within a profile
 * costs nothing.
 */
export function useLetterLayout(letter: LetterDocument, profile: LayoutProfile | null) {
  const [layout, setLayout] = useState<LetterLayout | null>(null);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    (async () => {
      const spec = PROFILES[profile];
      const family = getComputedStyle(document.documentElement)
        .getPropertyValue("--font-hand")
        .trim();
      try {
        if (family) await document.fonts.load(`40px ${family}`);
        await document.fonts.ready;
      } catch {
        // Fall through: measure with whatever font is available.
      }
      if (cancelled) return;

      const words = letter.paragraphs.flatMap(splitWords);
      const metrics = measureWords(words, "ink-body", spec.font);
      const lines = breakLines(letter, spec, metrics);
      const sheets = paginate(letter, spec, lines);
      setLayout({ profile, sheets });
    })();

    return () => {
      cancelled = true;
    };
  }, [letter, profile]);

  return layout;
}
