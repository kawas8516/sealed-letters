import type { EnvelopeConfig } from "@/lib/envelope";
import { PaperTexture } from "../PaperTexture";
import { AddressBlock } from "./AddressBlock";
import { PostageStamp } from "./PostageStamp";
import { PostalMark } from "./PostalMark";

/**
 * Address side, laid out the way British post expected it: sender small at
 * the upper left, stamp in the upper right, recipient large toward the lower
 * right. All positions are in cqw of the letter box; the envelope is 106 × 53.
 */
export function EnvelopeFront({ config, seed }: { config: EnvelopeConfig; seed: number }) {
  return (
    <div className="env-face env-face--front">
      <PaperTexture seed={seed} sheet={201} plain />
      <AddressBlock
        label="From:"
        name={config.from.name}
        address={config.from.address}
        seed={seed + 1}
        style={{ left: "6.5cqw", top: "5cqw", fontSize: "max(2.3cqw, 10.5px)" }}
      />
      <AddressBlock
        label="To:"
        name={config.to.name}
        address={config.to.address}
        seed={seed + 2}
        style={{ left: "43cqw", top: "24.5cqw", fontSize: "max(3.15cqw, 12.5px)" }}
      />
      <PostageStamp
        stamp={config.stamp}
        seed={seed}
        style={{ left: "77.8cqw", top: "3.8cqw", width: "23.4cqw", rotate: "0.6deg" }}
      />
      <PostalMark
        postmark={config.postmark}
        style={{ left: "61.5cqw", top: "6.4cqw", width: "34cqw", rotate: "-2deg" }}
      />
    </div>
  );
}
