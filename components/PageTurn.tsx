"use client";

import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export type TurnDirection = "forward" | "back";

/** Strips the sheet is cut into so it can bend. More strips, smoother curl. */
const STRIPS = 4;
/** Extra rotation per strip at the height of the turn: the free edge lags. */
const BEND_DEG = 6.5;

const SHADOW_RGB = "34, 24, 14";

interface PageTurnProps {
  direction: TurnDirection;
  front: ReactNode;
  back: ReactNode;
  /** Varies each turn slightly so no two feel machine-identical. */
  variance: number;
  onDone: () => void;
}

/**
 * A single sheet turning over its left edge, from the unread stack (face up,
 * right) to the read pile (face down, left), or back again.
 *
 * `p` runs 0 → 1 going forward and 1 → 0 going back; everything else is
 * derived from it.
 */
export function PageTurn({ direction, front, back, variance, onDone }: PageTurnProps) {
  const forward = direction === "forward";
  const p = useMotionValue(forward ? 0 : 1);
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    const controls = animate(p, forward ? 1 : 0, {
      duration: 1.12 + variance * 0.12,
      // Slow to lift, quick through the air, soft as it settles.
      ease: [0.45, 0.04, 0.18, 1],
      onComplete: () => done.current(),
    });
    return () => controls.stop();
  }, [forward, p, variance]);

  const dir = forward ? 1 : -1;
  const lift = useTransform(p, (v) => Math.sin(Math.PI * v));
  const bend = useTransform(lift, (l) => dir * BEND_DEG * l);

  const rootTransform = useTransform([p, lift], ([v, l]: number[]) => {
    const angle = -180 * v;
    const tilt = dir * (1.6 + variance * 0.8) * l; // the lower corner leads
    const drift = -0.5 * l;
    return `translateZ(${(14 * l).toFixed(2)}px) rotateZ(${drift.toFixed(3)}deg) rotateY(${angle.toFixed(3)}deg) rotateX(${tilt.toFixed(3)}deg)`;
  });

  // Shadow the moving sheet throws: onto the stack while it's still over
  // the right side, onto the read pile once it passes upright.
  const rightShadow = useTransform(p, (v) => {
    const a = v * 180;
    if (a >= 90) return "none";
    const r = (a * Math.PI) / 180;
    const edge = Math.cos(r) * 100;
    const reach = edge + 4 + 26 * Math.sin(r);
    const alpha = 0.3 * Math.sin(r) * (1 - 0.35 * (a / 90));
    return `linear-gradient(to right, rgba(${SHADOW_RGB}, ${alpha.toFixed(3)}) ${edge.toFixed(2)}%, rgba(${SHADOW_RGB}, 0) ${reach.toFixed(2)}%)`;
  });
  const leftShadow = useTransform(p, (v) => {
    const a = v * 180;
    if (a <= 90) return "none";
    const r = (a * Math.PI) / 180;
    const edge = 100 - Math.abs(Math.cos(r)) * 100;
    const reach = edge - 4 - 26 * Math.sin(r);
    const alpha = 0.3 * Math.sin(r) * (1 - 0.35 * ((180 - a) / 90));
    return `linear-gradient(to right, rgba(${SHADOW_RGB}, 0) ${reach.toFixed(2)}%, rgba(${SHADOW_RGB}, ${alpha.toFixed(3)}) ${edge.toFixed(2)}%)`;
  });

  return (
    <div className="turn-stage" aria-hidden>
      <motion.div className="cast-shadow" style={{ backgroundImage: rightShadow }} />
      <motion.div
        className="cast-shadow"
        style={{ backgroundImage: leftShadow, left: "-100%", right: "100%", width: "100%" }}
      />
      <motion.div
        className="turn-root"
        style={{ transform: rootTransform, "--seg-w": `calc(100cqw / ${STRIPS})` } as never}
      >
        <Strip k={0} p={p} bend={bend} front={front} back={back} />
      </motion.div>
    </div>
  );
}

function Strip({
  k,
  p,
  bend,
  front,
  back,
}: {
  k: number;
  p: MotionValue<number>;
  bend: MotionValue<number>;
  front: ReactNode;
  back: ReactNode;
}) {
  const transform = useTransform(bend, (b) => (k === 0 ? "none" : `rotateY(${b.toFixed(3)}deg)`));

  // Angle the sheet makes with the desk at this strip's two edges. Shading
  // runs between them so the strips read as one continuous curve.
  const angles = useTransform([p, bend], ([v, b]: number[]) => {
    const clamp = (a: number) => Math.min(180, Math.max(0, a));
    return [clamp(v * 180 - k * b), clamp(v * 180 - (k + 1) * b)];
  });

  const frontShade = useTransform(angles, ([a0, a1]) => {
    const [d0, s0] = frontLight(a0);
    const [d1, s1] = frontLight(a1);
    return `linear-gradient(90deg, rgba(${SHADOW_RGB}, ${d0}), rgba(${SHADOW_RGB}, ${d1})), linear-gradient(90deg, rgba(255, 250, 238, ${s0}), rgba(255, 250, 238, ${s1}))`;
  });
  // The back face is mirrored, so its left edge is this strip's far edge.
  const backShade = useTransform(angles, ([a0, a1]) => {
    const [d0, s0] = backLight(a0);
    const [d1, s1] = backLight(a1);
    return `linear-gradient(90deg, rgba(${SHADOW_RGB}, ${d1}), rgba(${SHADOW_RGB}, ${d0})), linear-gradient(90deg, rgba(255, 250, 238, ${s1}), rgba(255, 250, 238, ${s0}))`;
  });

  const frontCanvas: CSSProperties = { left: `calc(${-k} * var(--seg-w))` };
  const backCanvas: CSSProperties = { left: `calc(${-(STRIPS - 1 - k)} * var(--seg-w))` };

  return (
    <motion.div className="turn-seg" style={{ transform, left: k === 0 ? 0 : undefined }}>
      <div className="turn-face">
        <div className="turn-canvas" style={frontCanvas}>
          {front}
        </div>
        <motion.div className="turn-shade" style={{ backgroundImage: frontShade }} />
      </div>
      <div className="turn-face turn-face--back">
        <div className="turn-canvas" style={backCanvas}>
          {back}
        </div>
        <motion.div className="turn-shade" style={{ backgroundImage: backShade }} />
      </div>
      {k < STRIPS - 1 && <Strip k={k + 1} p={p} bend={bend} front={front} back={back} />}
    </motion.div>
  );
}

/** Darkening and sheen for the written side at a given angle from the desk. */
function frontLight(a: number): [string, string] {
  const r = (Math.min(a, 90) * Math.PI) / 180;
  const dark = 0.26 * (1 - Math.cos(r));
  const sheen = 0.09 * Math.exp(-(((a - 38) / 18) ** 2));
  return [dark.toFixed(3), sheen.toFixed(3)];
}

/** The same for the reverse, which faces the light as it lands. */
function backLight(a: number): [string, string] {
  const r = (Math.max(a, 90) * Math.PI) / 180;
  const dark = 0.26 * (1 + Math.cos(r));
  const sheen = 0.07 * Math.exp(-(((a - 142) / 18) ** 2));
  return [dark.toFixed(3), sheen.toFixed(3)];
}
