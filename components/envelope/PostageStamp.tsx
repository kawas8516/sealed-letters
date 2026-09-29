/* eslint-disable @next/next/no-img-element -- a fixed local asset inside a transformed 3D face; next/image adds nothing here */
import type { CSSProperties } from "react";
import type { EnvelopeConfig } from "@/lib/envelope";
import { hashSigned } from "@/lib/layout/rng";

/**
 * The stamps, licked and pressed on by hand in a row: perforated edges,
 * each a little off square, sitting just proud of the paper.
 */
export function PostageStamp({
  stamp,
  style,
  seed,
}: {
  stamp: EnvelopeConfig["stamp"];
  /** Position and width of the whole row. */
  style: CSSProperties;
  seed: number;
}) {
  const { x: cx, y: cy } = stamp.crop;
  // Show only the stamp itself, at its true proportions: the image is
  // enlarged and offset so the trimmed margins fall outside the box.
  const aspect = `${stamp.width * (1 - 2 * cx)} / ${stamp.height * (1 - 2 * cy)}`;
  const imageStyle: CSSProperties = {
    width: `${100 / (1 - 2 * cx)}%`,
    height: `${100 / (1 - 2 * cy)}%`,
    left: `${(-cx * 100) / (1 - 2 * cx)}%`,
    top: `${(-cy * 100) / (1 - 2 * cy)}%`,
  };
  const label = stamp.count > 1 ? `${stamp.count} stamps, side by side. Each: ${stamp.alt}` : stamp.alt;
  return (
    <div className="stamps" style={style} role="img" aria-label={label}>
      {Array.from({ length: stamp.count }, (_, i) => (
        <div
          key={i}
          className="stamp"
          style={{
            aspectRatio: aspect,
            rotate: `${(hashSigned(seed, 900 + i) * 1.3).toFixed(2)}deg`,
            translate: `${(hashSigned(seed, 910 + i) * 0.12).toFixed(2)}cqw ${(hashSigned(seed, 920 + i) * 0.3).toFixed(2)}cqw`,
          }}
        >
          <div className="stamp__perf-y">
            <div className="stamp__perf-x">
              <img
                className="stamp__image"
                src={stamp.src}
                alt=""
                width={stamp.width}
                height={stamp.height}
                draggable={false}
                style={imageStyle}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
