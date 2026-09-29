"use client";

import { motion, type MotionValue } from "motion/react";
import { useId, useMemo, type CSSProperties } from "react";
import { createRng } from "@/lib/layout/rng";

/**
 * Where the wax gives when the flap is pulled: a jagged break a little below
 * the middle. The upper piece stays on the flap, the lower on the envelope.
 */
const CRACK: [number, number][] = [
  [0, 55], [9, 51], [19, 56], [28, 50], [37, 54], [45, 49], [53, 55],
  [61, 50], [70, 56], [79, 51], [88, 55], [100, 50],
];
const crackPoints = CRACK.map(([x, y]) => `${x},${y}`).join(" ");
const CLIP = {
  upper: `0,0 100,0 ${[...CRACK].reverse().map(([x, y]) => `${x},${y}`).join(" ")}`,
  lower: `${crackPoints} 100,100 0,100`,
};

interface WaxSealProps {
  monogram: string;
  wax: string;
  seed: number;
  part: "whole" | "upper" | "lower";
  /** 0 → 1: how visible the fracture line is. Only drawn on the lower piece. */
  crack?: MotionValue<number>;
  className?: string;
  style?: CSSProperties;
}

/**
 * A pressed wax seal. The shape and relief are a height map: a poured blob,
 * a recessed die impression with a raised border and monogram. SVG lighting
 * turns that into a raised, faintly glossy surface.
 */
export function WaxSeal({ monogram, wax, seed, part, crack, className, style }: WaxSealProps) {
  const uid = useId().replace(/:/g, "");
  const blob = useMemo(() => blobPath(seed), [seed]);

  return (
    <svg
      className={`wax-seal ${className ?? ""}`}
      style={style}
      viewBox="-6 -6 112 112"
      aria-hidden
    >
      <defs>
        <filter id={`lit-${uid}`} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="luminanceToAlpha" result="height" />
          <feGaussianBlur in="height" stdDeviation="1.6" result="relief" />
          <feDiffuseLighting in="relief" surfaceScale="7" diffuseConstant="1.15" lightingColor="#fff" result="diffuse">
            <feDistantLight azimuth="235" elevation="48" />
          </feDiffuseLighting>
          <feSpecularLighting
            in="relief"
            surfaceScale="7"
            specularConstant="0.75"
            specularExponent="26"
            lightingColor="#ffe9dc"
            result="spec"
          >
            <fePointLight x="18" y="4" z="120" />
          </feSpecularLighting>
          <feFlood floodColor={wax} result="wax" />
          <feComposite in="wax" in2="diffuse" operator="arithmetic" k1="1.05" k4="0.02" result="shaded" />
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="gloss" />
          <feComposite in="gloss" in2="shaded" operator="arithmetic" k2="0.5" k3="1" result="lit" />
          <feComposite in="lit" in2="SourceAlpha" operator="in" />
        </filter>
        {part !== "whole" && (
          <clipPath id={`clip-${uid}`}>
            <polygon points={CLIP[part]} />
          </clipPath>
        )}
      </defs>

      <g clipPath={part === "whole" ? undefined : `url(#clip-${uid})`}>
        {/* Height map: white is high, grey is low. */}
        <g filter={`url(#lit-${uid})`}>
          <path d={blob} fill="#f2f2f2" />
          <circle cx="50" cy="50" r="31" fill="#8c8c8c" />
          <circle cx="50" cy="50" r="28.2" fill="none" stroke="#c9c9c9" strokeWidth="1.3" />
          <text
            x="50"
            y="51"
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily="var(--font-caption), Georgia, serif"
            fontStyle="italic"
            fontWeight="500"
            fontSize="38"
            fill="#e6e6e6"
          >
            {monogram}
          </text>
        </g>
      </g>

      {part === "lower" && crack && (
        <motion.polyline
          points={crackPoints}
          fill="none"
          stroke="rgba(20, 4, 7, 0.85)"
          strokeWidth="0.9"
          strokeLinejoin="round"
          style={{ opacity: crack }}
        />
      )}
    </svg>
  );
}

/** A poured, slightly uneven circle of wax. */
function blobPath(seed: number) {
  const rng = createRng(seed * 31 + 7);
  const n = 26;
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = 45 + (rng() - 0.5) * 3.2 + Math.sin(a * 3 + seed) * 0.9;
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r];
  });
  // Closed Catmull-Rom through the points, as cubic Béziers.
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)}, ${c2[0].toFixed(2)} ${c2[1].toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d + " Z";
}
