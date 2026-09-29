"use client";

import { animate, motion, useMotionValue } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useLetterControls } from "@/hooks/useLetterControls";
import { useLetterLayout } from "@/hooks/useLetterLayout";
import { PROFILES, paperWidthFor, profileForWidth } from "@/lib/layout/profiles";
import { hashSigned } from "@/lib/layout/rng";
import type { ProfileSpec } from "@/lib/layout/profiles";
import type { LayoutProfile, LetterDocument, Sheet } from "@/lib/types";
import { ControlsHint } from "./ControlsHint";
import { LetterPage } from "./LetterPage";
import { PageTurn, type TurnDirection } from "./PageTurn";

const HINT_KEY = "letter:hint-seen";
const BLANK: Sheet = { number: 1, blocks: [] };

interface Position {
  index: number;
  profile: LayoutProfile | null;
  /** First paragraph on the sheet, to keep the reader's place across layouts. */
  anchor: number;
}

interface Turn {
  direction: TurnDirection;
  /** Index of the sheet that moves. */
  sheet: number;
  variance: number;
  id: number;
}

// The layout profile follows the viewport. Read from window size rather than
// observing the element, so it resolves even in a background tab.
function subscribeViewport(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

function viewportProfile(): LayoutProfile {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return profileForWidth(paperWidthFor(window.innerWidth, window.innerHeight, rem));
}

function firstParagraph(sheet: Sheet | undefined) {
  const line = sheet?.blocks.find((b) => b.kind === "line");
  return line && line.kind === "line" ? line.line.paragraph : 0;
}

function sheetForParagraph(sheets: Sheet[], paragraph: number) {
  const i = sheets.findIndex((s) =>
    s.blocks.some((b) => b.kind === "line" && b.line.paragraph >= paragraph),
  );
  return Math.max(0, i);
}

/** What an overlay (the envelope) needs to draw the first sheet itself. */
export interface FirstSheet {
  sheet: Sheet;
  total: number;
  spec: ProfileSpec;
  seed: number;
  ready: boolean;
}

interface LetterProps {
  letter: LetterDocument;
  /**
   * False while the letter is still sealed in its envelope: the sheets are
   * hidden, controls are off, and `overlay` draws in the same box instead.
   */
  active?: boolean;
  overlay?: (first: FirstSheet) => ReactNode;
}

/**
 * The letter: an unread stack in the centre and a read pile, face down, to
 * its left. Sheets move between them one turn at a time.
 */
export function Letter({ letter, active = true, overlay }: LetterProps) {
  const seed = letter.meta.seed;
  const rootRef = useRef<HTMLDivElement>(null);
  const profile = useSyncExternalStore(subscribeViewport, viewportProfile, () => null);
  const layout = useLetterLayout(letter, profile);
  const reduceMotion = usePrefersReducedMotion();

  const [pos, setPos] = useState<Position>({ index: 0, profile: null, anchor: 0 });
  const [turn, setTurn] = useState<Turn | null>(null);
  const queued = useRef<TurnDirection | null>(null);
  const nudge = useMotionValue(0);

  const [hint, setHint] = useState<{ visible: boolean; touch: boolean }>({
    visible: false,
    touch: false,
  });

  // Once the letter is out of the envelope, reading starts here.
  useEffect(() => {
    if (active) rootRef.current?.focus({ preventScroll: true });
  }, [active]);

  const sheets = layout?.sheets ?? null;
  const total = sheets?.length ?? 1;
  const current = !sheets
    ? 0
    : pos.profile === layout!.profile
      ? Math.min(pos.index, total - 1)
      : sheetForParagraph(sheets, pos.anchor);

  const moveTo = useCallback(
    (index: number) => {
      if (!sheets || !layout) return;
      setPos({ index, profile: layout.profile, anchor: firstParagraph(sheets[index]) });
    },
    [sheets, layout],
  );

  const dismissHint = useCallback(() => {
    setHint((h) => (h.visible ? { ...h, visible: false } : h));
    try {
      localStorage.setItem(HINT_KEY, "1");
    } catch {
      // Storage unavailable; the hint simply may show again.
    }
  }, []);

  const go = useCallback(
    (direction: TurnDirection) => {
      if (!sheets) return;
      if (turn) {
        queued.current = direction;
        return;
      }
      const target = current + (direction === "forward" ? 1 : -1);
      if (target < 0 || target >= total) {
        // Nothing more that way: the sheet gives a little, then settles.
        animate(nudge, [0, direction === "forward" ? -4 : 2.5, 0], {
          duration: 0.5,
          ease: "easeOut",
        });
        return;
      }
      if (reduceMotion) {
        moveTo(target);
        return;
      }
      setTurn({
        direction,
        sheet: direction === "forward" ? current : current - 1,
        variance: Math.random(),
        id: Date.now(),
      });
    },
    [sheets, turn, current, total, reduceMotion, moveTo, nudge],
  );

  const finishTurn = useCallback(() => {
    if (!turn) return;
    moveTo(turn.direction === "forward" ? turn.sheet + 1 : turn.sheet);
    setTurn(null);
  }, [turn, moveTo]);

  // Run a turn that was asked for while the last one was still in the air.
  useEffect(() => {
    if (turn || !queued.current) return;
    const next = queued.current;
    queued.current = null;
    const id = requestAnimationFrame(() => go(next));
    return () => cancelAnimationFrame(id);
  }, [turn, go]);

  useLetterControls({
    next: () => go("forward"),
    prev: () => go("back"),
    onInteract: dismissHint,
    enabled: active,
  });

  // First visit: say how to turn the page, once, quietly.
  useEffect(() => {
    if (!active) return;
    let seen = false;
    try {
      seen = localStorage.getItem(HINT_KEY) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const show = window.setTimeout(() => setHint({ visible: true, touch }), 1400);
    const hide = window.setTimeout(dismissHint, 7400);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [dismissHint, active]);

  const spec = PROFILES[layout?.profile ?? profile ?? "desktop"];
  const ready = !!sheets;
  const sheetAt = (i: number) => (sheets ? sheets[i] : BLANK);

  // What lies where right now.
  const centre = turn?.direction === "forward" ? current + 1 : current;
  const pileTop = turn ? (turn.direction === "forward" ? current - 1 : current - 2) : current - 1;
  const unreadBelow = Math.min(3, total - centre - 1);
  const readBelow = Math.min(3, Math.max(0, pileTop));

  return (
    <>
      <div
        ref={rootRef}
        id="letter-sheets"
        className={active ? "letter" : "letter letter--sealed"}
        role="region"
        aria-roledescription="letter"
        aria-label={`${letter.meta.title}. A letter from ${letter.meta.from} to ${letter.meta.to}.`}
        tabIndex={-1}
      >
        {/* Read pile, face down, to the left. */}
        {Array.from({ length: readBelow }, (_, d) => (
          <div
            key={`read-${d}`}
            className="sheet sheet--under"
            style={edgeStyle(seed, 50 + d, readBelow - d, "left")}
            aria-hidden
          />
        ))}
        {pileTop >= 0 && sheets && (
          <LetterPage
            key={`pile-${pileTop}`}
            sheet={sheetAt(pileTop)}
            total={total}
            spec={spec}
            seed={seed}
            face="back"
            style={{ transform: "translateX(-100%)" }}
          />
        )}

        {/* Unread stack. */}
        {Array.from({ length: Math.max(0, unreadBelow) }, (_, d) => (
          <div
            key={`unread-${d}`}
            className="sheet sheet--under"
            style={edgeStyle(seed, d, unreadBelow - d, "right")}
            aria-hidden
          />
        ))}
        <motion.div
          key={reduceMotion ? `centre-${centre}` : "centre"}
          className="sheet-holder"
          style={{
            position: "absolute",
            inset: 0,
            rotateY: nudge,
            transformPerspective: 2600,
            originX: 0,
          }}
          initial={reduceMotion ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35 }}
        >
          <LetterPage
            sheet={sheetAt(centre)}
            total={total}
            spec={spec}
            seed={seed}
            ready={ready}
            className="sheet--top"
          />
        </motion.div>

        {turn && sheets && (
          <PageTurn
            key={turn.id}
            direction={turn.direction}
            variance={turn.variance}
            onDone={finishTurn}
            front={<LetterPage sheet={sheets[turn.sheet]} total={total} spec={spec} seed={seed} />}
            back={
              <LetterPage
                sheet={sheets[turn.sheet]}
                total={total}
                spec={spec}
                seed={seed}
                face="back"
              />
            }
          />
        )}

        {overlay && (
          <div className="letter__overlay">
            {overlay({ sheet: sheetAt(0), total, spec, seed, ready })}
          </div>
        )}

        <p className="sr-only" aria-live="polite">
          {ready ? `Sheet ${current + 1} of ${total}` : "Loading letter"}
        </p>
        <div className="sr-only">
          <button type="button" data-no-turn onClick={() => go("back")}>
            Previous sheet
          </button>
          <button type="button" data-no-turn onClick={() => go("forward")}>
            Next sheet
          </button>
        </div>
      </div>
      <ControlsHint
        visible={hint.visible && active}
        text={
          hint.touch
            ? "Swipe, or tap either side, to turn the page"
            : "Right-click or swipe left to turn the page · left-click or swipe right to go back"
        }
      />
    </>
  );
}

/** Edges of the sheets beneath: never quite squared up. */
function edgeStyle(
  seed: number,
  key: number,
  depth: number,
  side: "left" | "right",
): CSSProperties {
  const x = hashSigned(seed, 700 + key) * 0.5 + (side === "left" ? -depth * 0.25 : depth * 0.25);
  const y = hashSigned(seed, 800 + key) * 0.4 + depth * 0.18;
  const r = hashSigned(seed, 900 + key) * 0.45;
  const base = side === "left" ? "translateX(-100%) " : "";
  return { transform: `${base}translate(${x}cqw, ${y}cqw) rotate(${r}deg)` };
}
