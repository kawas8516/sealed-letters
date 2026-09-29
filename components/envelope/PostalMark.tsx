import { useId, type CSSProperties } from "react";
import type { EnvelopeConfig } from "@/lib/envelope";

/**
 * A circular date stamp with wavy cancellation lines running across the
 * postage stamp. Uneven ink: heavy in places, missing in others.
 */
export function PostalMark({
  postmark,
  style,
}: {
  postmark: EnvelopeConfig["postmark"];
  style: CSSProperties;
}) {
  const id = useId().replace(/:/g, "");
  const ring = `ring-${id}`;
  const ink = `ink-${id}`;

  // Five parallel waves, each slightly different, like a worn roller die.
  const waves = Array.from({ length: 5 }, (_, i) => {
    const y = 11 + i * 3.4;
    let d = `M 22 ${y}`;
    for (let x = 22; x < 62; x += 5) {
      d += ` q 1.25 ${-1.3 + (i % 2) * 0.1} 2.5 0 t 2.5 0`;
    }
    return <path key={i} d={d} />;
  });

  return (
    <svg className="postmark" style={style} viewBox="0 0 64 30" aria-hidden>
      <defs>
        <filter id={ink} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="0.7" result="rough" />
          <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="9" result="patchy" />
          <feColorMatrix
            in="patchy"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 1.75"
            result="coverage"
          />
          <feComposite in="rough" in2="coverage" operator="in" />
        </filter>
        <path id={ring} d="M 5 15 a 10 10 0 1 1 20 0" />
      </defs>
      <g filter={`url(#${ink})`} fill="none" stroke="currentColor">
        <circle cx="15" cy="15" r="12.6" strokeWidth="0.7" />
        <circle cx="15" cy="15" r="8.6" strokeWidth="0.45" />
        <text fontSize="3" fill="currentColor" stroke="none" letterSpacing="0.35">
          <textPath href={`#${ring}`} startOffset="50%" textAnchor="middle">
            {postmark.town}
          </textPath>
        </text>
        <text x="15" y="14.4" fontSize="2.6" textAnchor="middle" fill="currentColor" stroke="none">
          {postmark.time}
        </text>
        <text x="15" y="18" fontSize="2.6" textAnchor="middle" fill="currentColor" stroke="none">
          {postmark.date}
        </text>
        <g strokeWidth="0.65">{waves}</g>
      </g>
    </svg>
  );
}
