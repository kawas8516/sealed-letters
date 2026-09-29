"use client";

import { AnimatePresence, motion } from "motion/react";

/** A single quiet line under the paper, shown once. */
export function ControlsHint({ visible, text }: { visible: boolean; text: string }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.p
          key={text}
          className="hint"
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 1.4, ease: [0.25, 0.1, 0.25, 1] } }}
          exit={{ opacity: 0, transition: { duration: 1.2 } }}
        >
          {text}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
