"use client";

import { useCallback, useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import type { EnvelopeConfig } from "@/lib/envelope";
import type { LetterDocument } from "@/lib/types";
import { ControlsHint } from "./ControlsHint";
import { Envelope, type EnvelopeStage } from "./envelope/Envelope";
import { Letter } from "./Letter";

const HINTS: Record<"front" | "back", { mouse: string; touch: string }> = {
  front: { mouse: "Click the envelope to turn it over", touch: "Tap the envelope to turn it over" },
  back: { mouse: "Break the seal to open the letter", touch: "Tap the seal to open the letter" },
};

/**
 * A letter as it arrives: sealed in its envelope first, then read. The
 * envelope draws inside the letter's own box, so opening it hands over to
 * the letter without a cut.
 */
export function Correspondence({
  letter,
  envelope,
}: {
  letter: LetterDocument;
  envelope: EnvelopeConfig;
}) {
  const reduceMotion = usePrefersReducedMotion();
  const [opened, setOpened] = useState(false);
  const [stage, setStage] = useState<EnvelopeStage>("front");
  const [announcement, setAnnouncement] = useState("");
  const [idle, setIdle] = useState<{ stage: EnvelopeStage; touch: boolean } | null>(null);
  /** Bumped each time the letter is put back, so both start afresh. */
  const [visit, setVisit] = useState(0);

  // If nothing happens for a moment, say quietly what to do next.
  useEffect(() => {
    if (opened || (stage !== "front" && stage !== "back")) return;
    const t = window.setTimeout(
      () => setIdle({ stage, touch: window.matchMedia("(pointer: coarse)").matches }),
      stage === "front" ? 2600 : 1800,
    );
    return () => window.clearTimeout(t);
  }, [stage, opened]);

  const onStage = useCallback((s: EnvelopeStage) => {
    setStage(s);
    if (s === "back")
      setAnnouncement("The envelope is turned over. Its wax seal is ready to break.");
    if (s === "opening") setAnnouncement("Opening the letter.");
  }, []);

  const onOpened = useCallback(() => {
    setOpened(true);
    setAnnouncement("Letter opened.");
  }, []);

  // Put the letter back: the envelope returns, address side up.
  const close = useCallback(() => {
    setOpened(false);
    setStage("front");
    setIdle(null);
    setVisit((v) => v + 1);
    setAnnouncement("Letter put away. The envelope is back on the desk.");
  }, []);

  useEffect(() => {
    if (!opened) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opened, close]);

  const hint =
    !opened && idle && idle.stage === stage && (stage === "front" || stage === "back")
      ? HINTS[stage][idle.touch ? "touch" : "mouse"]
      : null;

  return (
    <>
      <Letter
        key={visit}
        letter={letter}
        active={opened}
        overlay={
          opened
            ? undefined
            : (first) => (
                <Envelope
                  config={envelope}
                  seed={letter.meta.seed}
                  first={first}
                  reduceMotion={reduceMotion}
                  onStage={onStage}
                  onOpened={onOpened}
                  autoFocus={visit > 0}
                />
              )
        }
      />
      {opened && (
        <button
          type="button"
          className="close-letter"
          aria-label="Close the letter"
          onClick={close}
        >
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        </button>
      )}
      <ControlsHint visible={!!hint} text={hint ?? ""} />
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </>
  );
}
