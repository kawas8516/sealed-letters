"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import type { FirstSheet } from "../Letter";
import { LetterPage } from "../LetterPage";
import type { EnvelopeConfig } from "@/lib/envelope";
import { SHEET_RATIO } from "@/lib/layout/profiles";
import { EnvelopeBack } from "./EnvelopeBack";
import { EnvelopeFlap, FLAP_DEPTH } from "./EnvelopeFlap";
import { EnvelopeFront } from "./EnvelopeFront";
import { LetterReveal } from "./LetterReveal";
import { WaxSeal } from "./WaxSeal";

export type EnvelopeStage = "front" | "turning" | "back" | "opening";

/** Envelope size in cqw of the letter box: a DL-like 2:1 that takes the folded sheet. */
const ENV_W = 106;
const ENV_H = 53;
const ENV_TOP = (100 * SHEET_RATIO - ENV_H) / 2;
const SEAL = { size: 15.5, x: ENV_W / 2, y: FLAP_DEPTH - 1.6 };

interface EnvelopeProps {
  config: EnvelopeConfig;
  seed: number;
  first: FirstSheet;
  reduceMotion: boolean;
  onStage: (stage: EnvelopeStage) => void;
  onOpened: () => void;
  /** Take focus on arrival (when the reader has just put the letter back). */
  autoFocus?: boolean;
}

/**
 * The sealed envelope, from the address side through to the folded letter
 * lying open. Everything is drawn inside the letter's own box so the final
 * frame lines up exactly with the letter that takes over.
 */
export function Envelope({
  config,
  seed,
  first,
  reduceMotion,
  onStage,
  onOpened,
  autoFocus = false,
}: EnvelopeProps) {
  const [stage, setStageState] = useState<EnvelopeStage>("front");
  const alive = useRef(true);
  const sealButton = useRef<HTMLButtonElement>(null);
  const frontButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (autoFocus) frontButton.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const flip = useMotionValue(0);
  const press = useMotionValue(1);
  const crack = useMotionValue(0);
  const settle = useMotionValue(0);
  const flapAngle = useMotionValue(0);
  const envY = useMotionValue(0);
  const packetY = useMotionValue(0);
  const foldTop = useMotionValue(-180);
  const foldBottom = useMotionValue(180);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const setStage = useCallback(
    (s: EnvelopeStage) => {
      setStageState(s);
      onStage(s);
    },
    [onStage],
  );

  const turnOver = useCallback(async () => {
    if (stage !== "front") return;
    setStage("turning");
    if (reduceMotion) flip.jump(1);
    else await animate(flip, 1, { duration: 1.05, ease: [0.45, 0.05, 0.25, 1] });
    if (!alive.current) return;
    setStage("back");
    requestAnimationFrame(() => sealButton.current?.focus({ preventScroll: true }));
  }, [stage, setStage, reduceMotion, flip]);

  const breakSeal = useCallback(async () => {
    if (stage !== "back") return;
    setStage("opening");
    if (reduceMotion || !first.ready) {
      onOpened();
      return;
    }
    const step = async (p: Promise<unknown>) => {
      await p;
      if (!alive.current) throw new Error("unmounted");
    };
    try {
      // A thumb presses the seal; it gives a little, then the wax breaks.
      await step(animate(press, 0.93, { duration: 0.11, ease: "easeOut" }).then(() => undefined));
      animate(press, 1, { duration: 0.4, ease: [0.2, 1.4, 0.4, 1] });
      await step(animate(crack, 1, { duration: 0.14 }).then(() => undefined));
      animate(settle, 1, { duration: 0.45, ease: "easeOut" });
      // The flap comes up and over, taking its half of the seal with it.
      await step(
        animate(flapAngle, 178, { duration: 1.05, ease: [0.42, 0.02, 0.22, 1] }).then(
          () => undefined,
        ),
      );
      // The folded letter is drawn up…
      await step(
        animate(packetY, -21, { duration: 0.95, ease: [0.45, 0, 0.25, 1] }).then(() => undefined),
      );
      // …the envelope is set aside, and the letter laid down where it will be read.
      await step(
        Promise.all([
          animate(envY, 175, { duration: 1.3, ease: [0.55, 0, 0.8, 0.5] }),
          animate(packetY, 0, { duration: 1.05, delay: 0.2, ease: [0.3, 0, 0.2, 1] }),
        ]),
      );
      await step(
        animate(foldTop, 0, { duration: 0.8, ease: [0.4, 0, 0.2, 1] }).then(() => undefined),
      );
      await step(
        animate(foldBottom, 0, { duration: 0.8, ease: [0.4, 0, 0.2, 1] }).then(() => undefined),
      );
      onOpened();
    } catch {
      // Unmounted mid-way; nothing to finish.
    }
  }, [
    stage,
    setStage,
    reduceMotion,
    first.ready,
    onOpened,
    press,
    crack,
    settle,
    flapAngle,
    packetY,
    envY,
    foldTop,
    foldBottom,
  ]);

  // Right-click does what left-click does, and never opens the browser menu here.
  const onTurnContext = (e: MouseEvent) => {
    e.preventDefault();
    void turnOver();
  };
  const onSealContext = (e: MouseEvent) => {
    e.preventDefault();
    void breakSeal();
  };

  const flipperTransform = useTransform(flip, (f) => {
    const lift = Math.sin(Math.PI * f);
    return `translateZ(${(lift * 70).toFixed(1)}px) rotateY(${(f * 180).toFixed(2)}deg) rotateX(${(-lift * 7).toFixed(2)}deg)`;
  });
  const envTransform = useTransform(envY, (v) => `translateY(${v.toFixed(3)}cqw)`);
  const packetOffset = useTransform([packetY, envY], ([p, e]: number[]) => p - e);
  const sealScale = useTransform(press, (p) => p);
  const intact = useTransform(crack, (c) => (c > 0 ? 0 : 1));
  const lowerSettle = useTransform(
    settle,
    (s) => `translateY(${(s * 0.25).toFixed(3)}cqw) rotate(${(s * 2.5).toFixed(2)}deg)`,
  );

  const sealStyle = {
    left: `${SEAL.x - SEAL.size / 2}cqw`,
    top: `${SEAL.y - SEAL.size / 2}cqw`,
    width: `${SEAL.size}cqw`,
    height: `${SEAL.size}cqw`,
  };

  const interactiveFront = stage === "front";
  const interactiveBack = stage === "back";

  return (
    <motion.div
      className="envelope"
      style={{
        left: `${(100 - ENV_W) / 2}cqw`,
        top: `${ENV_TOP}cqw`,
        width: `${ENV_W}cqw`,
        height: `${ENV_H}cqw`,
      }}
      // Laid on the desk: it arrives from just above and settles.
      initial={{ opacity: 0, y: -14, rotate: -1.2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: reduceMotion ? 0.2 : 1.1, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <motion.div className="env-slide" style={{ transform: envTransform }}>
        <motion.div className="env-flipper" style={{ transform: flipperTransform }}>
          <div className="env-side" inert={!interactiveFront}>
            <EnvelopeFront config={config} seed={seed} />
            <button
              ref={frontButton}
              type="button"
              className="env-hit"
              aria-label={`Envelope addressed to ${config.to.name}, from ${config.from.name}. Turn it over`}
              onClick={() => void turnOver()}
              onContextMenu={onTurnContext}
            />
          </div>

          <div className="env-side env-side--back" inert={!interactiveBack}>
            <EnvelopeBack
              seed={seed}
              flap={
                <EnvelopeFlap angle={flapAngle} seed={seed}>
                  <motion.div
                    className="seal-piece seal-piece--upper"
                    style={{ ...sealStyle, scale: sealScale }}
                  >
                    <WaxSeal
                      monogram={config.seal.monogram}
                      wax={config.seal.wax}
                      seed={seed}
                      part="upper"
                    />
                  </motion.div>
                </EnvelopeFlap>
              }
              contents={
                <LetterReveal
                  y={packetOffset}
                  top={foldTop}
                  bottom={foldBottom}
                  front={
                    <LetterPage
                      sheet={first.sheet}
                      total={first.total}
                      spec={first.spec}
                      seed={first.seed}
                      ready={first.ready}
                    />
                  }
                  back={
                    <LetterPage
                      sheet={first.sheet}
                      total={first.total}
                      spec={first.spec}
                      seed={first.seed}
                      face="back"
                    />
                  }
                />
              }
              seal={
                <>
                  <motion.div
                    className="seal-piece seal-piece--lower"
                    style={{ ...sealStyle, scale: sealScale }}
                  >
                    <motion.div style={{ width: "100%", height: "100%", transform: lowerSettle }}>
                      <WaxSeal
                        monogram={config.seal.monogram}
                        wax={config.seal.wax}
                        seed={seed}
                        part="lower"
                        crack={crack}
                      />
                    </motion.div>
                  </motion.div>
                  {/* Unbroken, the seal is one piece: no seam where it will split. */}
                  <motion.div
                    className="seal-piece seal-piece--whole"
                    style={{ ...sealStyle, scale: sealScale, opacity: intact }}
                  >
                    <WaxSeal
                      monogram={config.seal.monogram}
                      wax={config.seal.wax}
                      seed={seed}
                      part="whole"
                    />
                  </motion.div>
                  <button
                    ref={sealButton}
                    type="button"
                    className="seal-hit"
                    style={sealStyle}
                    aria-label="Break the seal and open the letter"
                    aria-expanded={stage === "opening"}
                    aria-controls="letter-sheets"
                    onClick={() => void breakSeal()}
                    onContextMenu={onSealContext}
                  />
                </>
              }
            />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
