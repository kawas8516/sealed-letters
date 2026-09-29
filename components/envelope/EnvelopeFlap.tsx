"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { PaperTexture } from "../PaperTexture";

/** Height of the flap: its point reaches this far down the envelope (cqw). */
export const FLAP_DEPTH = 31;

/**
 * The pointed top flap, hinged along the top edge. `angle` runs 0 (closed)
 * to ~180 (lying open above the envelope). It drops behind the letter once
 * it passes upright, so the letter can be drawn out over it.
 */
export function EnvelopeFlap({
  angle,
  seed,
  children,
}: {
  angle: MotionValue<number>;
  seed: number;
  /** Rides on the outside of the flap: the upper half of the seal. */
  children?: ReactNode;
}) {
  const transform = useTransform(angle, (a) => `perspective(1600px) rotateX(${a.toFixed(2)}deg)`);
  const zIndex = useTransform(angle, (a) => (a > 90 ? 2 : 5));
  // The outside darkens as it tips away from the lamp; the inside is in its
  // own shadow until it lies open.
  const outerShade = useTransform(angle, (a) => Math.sin((Math.min(a, 90) * Math.PI) / 180) * 0.3);
  const innerShade = useTransform(angle, (a) => 0.08 + Math.max(0, Math.cos((a * Math.PI) / 180) + 1) * 0.25);
  const dropShadow = useTransform(angle, (a) =>
    a > 90
      ? "drop-shadow(0 -0.2cqw 0.35cqw rgba(30, 20, 10, 0.18))"
      : `drop-shadow(0 ${(0.25 + (a / 90) * 1.2).toFixed(2)}cqw ${(0.35 + (a / 90) * 1.4).toFixed(2)}cqw rgba(30, 20, 10, ${(0.22 - (a / 90) * 0.08).toFixed(3)}))`,
  );

  return (
    <motion.div className="env-flap-wrap" style={{ zIndex, filter: dropShadow }}>
      <motion.div className="env-flap" style={{ transform }}>
        <div className="env-flap__face env-flap__face--outer">
          <PaperTexture seed={seed} sheet={301} plain />
          <motion.div className="env-shade" style={{ opacity: outerShade }} />
        </div>
        <div className="env-flap__face env-flap__face--inner">
          <PaperTexture seed={seed} sheet={302} plain />
          <motion.div className="env-shade" style={{ opacity: innerShade }} />
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
