"use client";

import { useEffect, useRef } from "react";

interface Controls {
  next: () => void;
  prev: () => void;
  /** Called on the first deliberate interaction of any kind. */
  onInteract?: () => void;
  /** Controls are live only while the letter is out of its envelope. */
  enabled?: boolean;
}

const SWIPE_PX = 40;
/** A mouse drag has to be more deliberate than a finger flick. */
const MOUSE_SWIPE_PX = 70;
const WHEEL_PX = 60;
const TAP_MOVE_PX = 10;

/**
 * Right click → next sheet, left click → previous sheet, arrow keys, swipes
 * (finger, mouse drag, or trackpad) and edge taps on touch screens. The
 * whole desk is the control surface.
 */
export function useLetterControls({ next, prev, onInteract, enabled = true }: Controls) {
  const handlers = useRef({ next, prev, onInteract });
  useEffect(() => {
    handlers.current = { next, prev, onInteract };
  });

  useEffect(() => {
    if (!enabled) return;
    let lastPointer: string = "mouse";
    let start: { x: number; y: number; t: number; type: string } | null = null;
    let touchHandledAt = 0;
    let swipedAt = 0;
    let wheelAcc = 0;
    let wheelLocked = false;
    let wheelTimer = 0;

    const call = (fn: "next" | "prev") => {
      handlers.current.onInteract?.();
      handlers.current[fn]();
    };

    const hasSelection = () => {
      const s = window.getSelection();
      return !!s && !s.isCollapsed && s.toString().trim().length > 0;
    };

    const isControl = (t: EventTarget | null) =>
      t instanceof Element && !!t.closest("a, button, input, textarea, select, [data-no-turn]");

    const recentlyHandled = () => Date.now() - touchHandledAt < 800 || Date.now() - swipedAt < 400;

    const onContextMenu = (e: MouseEvent) => {
      if (isControl(e.target)) return;
      e.preventDefault();
      // A long press on a touch screen raises a context menu; the tap
      // handler already dealt with it.
      if (lastPointer === "touch" || recentlyHandled()) return;
      call("next");
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || isControl(e.target)) return;
      // The click that ends a touch tap or a mouse swipe is not a turn.
      if (lastPointer === "touch" || recentlyHandled()) return;
      if (e.detail > 1 || hasSelection()) return; // selecting text, not turning
      call("prev");
    };

    const onPointerDown = (e: PointerEvent) => {
      lastPointer = e.pointerType;
      if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType };
    };

    const onPointerUp = (e: PointerEvent) => {
      const s = start;
      start = null;
      if (!s || s.type !== e.pointerType || isControl(e.target)) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      const dt = performance.now() - s.t;
      const touch = e.pointerType === "touch";

      // A deliberate sideways sweep, by finger or with the mouse held down.
      // Swiping leftwards pulls the next sheet over, like turning a page.
      const reach = touch ? SWIPE_PX : MOUSE_SWIPE_PX;
      if (Math.abs(dx) > reach && Math.abs(dx) > Math.abs(dy) * 1.3) {
        if (touch) touchHandledAt = Date.now();
        else {
          swipedAt = Date.now();
          window.getSelection()?.removeAllRanges(); // the drag may have caught some text
        }
        call(dx < 0 ? "next" : "prev");
        return;
      }
      if (touch && Math.abs(dx) < TAP_MOVE_PX && Math.abs(dy) < TAP_MOVE_PX && dt < 500) {
        if (hasSelection()) return;
        touchHandledAt = Date.now();
        call(e.clientX > window.innerWidth / 2 ? "next" : "prev");
      }
    };

    const onPointerCancel = () => {
      start = null;
    };

    // Two-finger sideways swipes on a trackpad arrive as horizontal wheel
    // events. One gesture turns one sheet, however long its momentum runs.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheelLocked = false;
        wheelAcc = 0;
      }, 280);
      if (wheelLocked) return;
      wheelAcc += e.deltaX;
      if (Math.abs(wheelAcc) > WHEEL_PX) {
        wheelLocked = true;
        call(wheelAcc > 0 ? "next" : "prev");
        wheelAcc = 0;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isControl(e.target)) return;
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        call("next");
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        call("prev");
      }
    };

    window.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("click", onClick);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerCancel, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(wheelTimer);
      window.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("click", onClick);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [enabled]);
}
