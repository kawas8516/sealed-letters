import type { CSSProperties } from "react";
import { hashSigned } from "@/lib/layout/rng";

interface AddressBlockProps {
  label: string;
  name: string;
  address: string[];
  /** Position and size on the envelope, in cqw of the letter box. */
  style: CSSProperties;
  seed: number;
}

/** A handwritten "From:" or "To:" block in the letter's own hand and ink. */
export function AddressBlock({ label, name, address, style, seed }: AddressBlockProps) {
  const lines = [name, ...address];
  return (
    <address className="env-address" style={style}>
      <span className="env-address__label">{label}</span>
      {lines.map((line, i) => (
        <span
          key={i}
          className={i === 0 ? "env-address__line env-address__name" : "env-address__line"}
          style={{
            // Each line starts a little further in, and none sits quite level.
            transform: `translate(${(i * 1.1 + hashSigned(seed, 40 + i) * 0.5).toFixed(2)}em, ${(hashSigned(seed, 60 + i) * 0.05).toFixed(3)}em) rotate(${(hashSigned(seed, 80 + i) * 0.6 - 0.7).toFixed(2)}deg)`,
          }}
        >
          {line}
        </span>
      ))}
    </address>
  );
}
