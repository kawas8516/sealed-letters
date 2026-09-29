import type { CSSProperties } from "react";
import { hash01 } from "@/lib/layout/rng";

/**
 * Grain, fibres, tone and folds. Each sheet gets its own offsets so no two
 * sheets are identical, but a sheet always looks the same.
 */
export function PaperTexture({
  seed,
  sheet,
  plain = false,
}: {
  seed: number;
  sheet: number;
  /** No fold lines: for envelopes. */
  plain?: boolean;
}) {
  const style = {
    "--grain-x": `${Math.round(hash01(seed, sheet * 3 + 1) * 600)}px`,
    "--grain-y": `${Math.round(hash01(seed, sheet * 3 + 2) * 600)}px`,
    "--tone-x": `${55 + hash01(seed, sheet * 3 + 3) * 35}%`,
    "--tone-y": `${70 + hash01(seed, sheet * 7) * 25}%`,
  } as CSSProperties;

  return <div className={plain ? "paper paper--plain" : "paper"} style={style} aria-hidden />;
}
