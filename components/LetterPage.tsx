import { memo, type CSSProperties } from "react";
import type { ProfileSpec } from "@/lib/layout/profiles";
import { hashSigned } from "@/lib/layout/rng";
import type { Sheet, SheetBlock } from "@/lib/types";
import { PaperTexture } from "./PaperTexture";

interface LetterPageProps {
  sheet: Sheet;
  total: number;
  spec: ProfileSpec;
  seed: number;
  /** "back" shows the reverse of the sheet: bare paper with faint show-through. */
  face?: "front" | "back";
  ready?: boolean;
  className?: string;
  style?: CSSProperties;
}

const cq = (v: number) => `${v}cqw`;

/** One physical sheet, front or back. */
export const LetterPage = memo(function LetterPage({
  sheet,
  total,
  spec,
  seed,
  face = "front",
  ready = true,
  className = "",
  style,
}: LetterPageProps) {
  const back = face === "back";
  return (
    <div
      className={`sheet ${back ? "sheet--back" : ""} ${className}`}
      style={style}
      role={back ? undefined : "group"}
      aria-roledescription={back ? undefined : "sheet"}
      aria-label={back ? undefined : `Sheet ${sheet.number} of ${total}`}
      aria-hidden={back || undefined}
    >
      <PaperTexture seed={seed} sheet={back ? sheet.number + 101 : sheet.number} />
      {back ? (
        <div className="bleed">
          <Writing sheet={sheet} spec={spec} seed={seed} ready={ready} />
        </div>
      ) : (
        <Writing sheet={sheet} spec={spec} seed={seed} ready={ready} />
      )}
    </div>
  );
});

function Writing({
  sheet,
  spec,
  seed,
  ready,
}: {
  sheet: Sheet;
  spec: ProfileSpec;
  seed: number;
  ready: boolean;
}) {
  let lineOnSheet = 0;

  return (
    <>
      {sheet.number > 1 && (
        <span
          className="ink-folio"
          style={{
            top: cq(spec.marginTop * 0.42),
            right: cq(spec.marginRight * 0.8),
            fontSize: cq(spec.font * 0.9),
            transform: `rotate(${hashSigned(seed, sheet.number) * 3}deg)`,
          }}
          data-ready={ready}
          aria-hidden
        >
          {sheet.number}
        </span>
      )}
      <div
        className="writing"
        data-ready={ready}
        style={{
          top: cq(spec.marginTop),
          left: cq(spec.marginLeft),
          right: cq(spec.marginRight),
          fontSize: cq(spec.font),
        }}
      >
        {sheet.blocks.map((block, i) => (
          <Block
            key={`${block.kind}-${i}`}
            block={block}
            spec={spec}
            seed={seed}
            lineOnSheet={block.kind === "line" ? lineOnSheet++ : lineOnSheet}
          />
        ))}
      </div>
    </>
  );
}

function Block({
  block,
  spec,
  seed,
  lineOnSheet,
}: {
  block: SheetBlock;
  spec: ProfileSpec;
  seed: number;
  lineOnSheet: number;
}) {
  const lh = spec.lineHeight;
  switch (block.kind) {
    case "date":
      return (
        <span
          className="ink-date"
          style={{
            height: cq(spec.dateUnits * lh),
            lineHeight: cq(lh),
            fontSize: "0.94em",
            paddingRight: cq(1.5),
            transform: "rotate(-1.2deg)",
          }}
        >
          {block.text}
        </span>
      );
    case "salutation":
      return (
        <span
          className="ink-salutation"
          style={{
            height: cq(spec.salutationUnits * lh),
            lineHeight: cq(lh),
            paddingTop: cq(lh * 0.45),
            fontSize: "1.12em",
            transform: "rotate(-0.8deg) translateX(-0.4cqw)",
            transformOrigin: "0 70%",
          }}
        >
          {block.text}
        </span>
      );
    case "gap":
      return <span style={{ display: "block", height: cq(block.units * lh) }} aria-hidden />;
    case "signature":
      return (
        <span
          className="ink-signature"
          data-addition="true"
          style={{
            height: cq(spec.signatureUnits * lh),
            paddingTop: cq(lh * 0.85),
            lineHeight: cq(lh * 1.5),
            paddingLeft: "50%",
            fontSize: "3.3em",
            transform: "rotate(-6deg)",
            transformOrigin: "30% 60%",
          }}
        >
          {block.text}
        </span>
      );
    case "line":
      return <InkLine block={block} spec={spec} seed={seed} lineOnSheet={lineOnSheet} />;
  }
}

function InkLine({
  block,
  spec,
  seed,
  lineOnSheet,
}: {
  block: Extract<SheetBlock, { kind: "line" }>;
  spec: ProfileSpec;
  seed: number;
  lineOnSheet: number;
}) {
  const { line, index } = block;

  // Baseline wander, a slight uphill habit, and a margin that creeps right
  // as the page goes on.
  const dy = hashSigned(seed, 100 + index) * 0.06 + Math.sin(index * 0.7) * 0.025;
  const rot = hashSigned(seed, 200 + index) * 0.28 - 0.1;
  const dx =
    hashSigned(seed, 300 + index) * 0.3 + lineOnSheet * 0.035 + (line.first ? spec.indent : 0);

  // Ink is darkest just after the pen is dipped, then slowly thins.
  const sinceDip = line.first ? 0 : (index % 7) + 1;
  const opacity = 1 - 0.11 * Math.min(1, sinceDip / 7) + hashSigned(seed, 400 + index) * 0.025;

  return (
    <span
      className="ink-line ink-body"
      style={{
        height: cq(spec.lineHeight),
        lineHeight: cq(spec.lineHeight),
        transform: `translate(${dx.toFixed(3)}cqw, ${dy.toFixed(3)}em) rotate(${rot.toFixed(3)}deg)`,
        opacity: Math.min(1, opacity).toFixed(3),
      }}
    >
      {line.text}
      {/* Copied text reads as prose, not as broken lines. */}
      {!line.last && " "}
    </span>
  );
}
