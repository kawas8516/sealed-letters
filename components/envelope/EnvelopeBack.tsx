"use client";

import type { ReactNode } from "react";
import { PaperTexture } from "../PaperTexture";

/**
 * The reverse: the inside of the envelope (seen only once the flap is up),
 * whatever sits inside it, the pocket formed by the side and bottom flaps,
 * and the top flap with its seal.
 *
 * Layer order: interior 1 · open flap 2 · contents 3 · pocket 4 ·
 * closed flap 5 · lower seal 6 · seal control 7.
 */
export function EnvelopeBack({
  seed,
  flap,
  contents,
  seal,
}: {
  seed: number;
  flap: ReactNode;
  contents?: ReactNode;
  seal?: ReactNode;
}) {
  return (
    <div className="env-face env-face--back">
      <div className="env-interior">
        <PaperTexture seed={seed} sheet={303} plain />
      </div>
      {flap}
      {contents && <div className="env-contents">{contents}</div>}
      <div className="env-pocket" aria-hidden>
        <div className="env-pocket__part env-pocket__part--left">
          <div className="env-pocket__paper">
            <PaperTexture seed={seed} sheet={304} plain />
          </div>
        </div>
        <div className="env-pocket__part env-pocket__part--right">
          <div className="env-pocket__paper">
            <PaperTexture seed={seed} sheet={305} plain />
          </div>
        </div>
        <div className="env-pocket__part env-pocket__part--bottom">
          <div className="env-pocket__paper">
            <PaperTexture seed={seed} sheet={306} plain />
          </div>
        </div>
      </div>
      {seal}
    </div>
  );
}
