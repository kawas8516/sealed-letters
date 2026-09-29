"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { ReactNode } from "react";
import { SHEET_RATIO } from "@/lib/layout/profiles";

/** One third of the sheet's height, in cqw: the letter is folded in three. */
const THIRD = (100 * SHEET_RATIO) / 3;

/**
 * The letter as it came out of the envelope: folded in three, writing inside.
 * The box is the full sheet, drawn exactly where the open letter will lie;
 * folded, only the middle third's footprint is occupied.
 *
 * `top` runs -180 (folded down over the middle) → 0; `bottom` runs
 * 180 (folded up under it) → 0. Once both are 0 the sheet is pixel-for-pixel
 * the first sheet of the letter, ready to hand over.
 */
export function LetterReveal({
  front,
  back,
  y,
  top,
  bottom,
}: {
  front: ReactNode;
  back: ReactNode;
  /** Vertical offset in cqw from the resting position. */
  y: MotionValue<number>;
  top: MotionValue<number>;
  bottom: MotionValue<number>;
}) {
  const transform = useTransform(y, (v) => `translateY(${v.toFixed(3)}cqw)`);
  // The sheet's own shadow on the desk grows in as it opens flat, so the
  // hand-over to the letter (which has the same shadow) doesn't jump.
  const shadow = useTransform(bottom, (b) => Math.max(0, 1 - b / 70));

  return (
    <motion.div className="fold" style={{ transform }} aria-hidden>
      <motion.div className="fold__shadow" style={{ opacity: shadow }} />
      <div className="fold__panel fold__panel--middle" style={{ top: `${THIRD}cqw` }}>
        <Face canvasTop={-THIRD}>{front}</Face>
      </div>
      <Panel angle={bottom} origin="top" offset={2 * THIRD} lift={1} front={front} back={back} />
      <Panel angle={top} origin="bottom" offset={0} lift={2} front={front} back={back} />
    </motion.div>
  );
}

function Panel({
  angle,
  origin,
  offset,
  lift,
  front,
  back,
}: {
  angle: MotionValue<number>;
  origin: "top" | "bottom";
  offset: number;
  /** px it sits proud of the middle while folded: paper has thickness. */
  lift: number;
  front: ReactNode;
  back: ReactNode;
}) {
  const transform = useTransform(
    angle,
    (a) => `translateZ(${(lift * Math.min(1, Math.abs(a) / 90)).toFixed(2)}px) rotateX(${a.toFixed(2)}deg)`,
  );
  // Tilted away from the lamp: darker. Face-down: the back takes the light.
  const shade = useTransform(angle, (a) => Math.sin((Math.min(Math.abs(a), 90) * Math.PI) / 180) * 0.28);
  const backShade = useTransform(angle, (a) => 0.06 + Math.max(0, Math.cos((a * Math.PI) / 180) + 1) * 0.12);

  return (
    <motion.div
      className="fold__panel"
      style={{ top: `${offset}cqw`, transform, transformOrigin: `50% ${origin}` }}
    >
      <div className="fold__face">
        <Face canvasTop={-offset}>{front}</Face>
        <motion.div className="env-shade" style={{ opacity: shade }} />
      </div>
      <div className="fold__face fold__face--back">
        <Face canvasTop={-offset}>{back}</Face>
        <motion.div className="env-shade" style={{ opacity: backShade }} />
      </div>
    </motion.div>
  );
}

function Face({ canvasTop, children }: { canvasTop: number; children: ReactNode }) {
  return (
    <div className="fold__canvas" style={{ top: `${canvasTop}cqw` }}>
      {children}
    </div>
  );
}
