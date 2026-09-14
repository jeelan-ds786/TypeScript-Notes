"use client";

import { useEffect } from "react";

const excludedAreas = ".graph-experience, .mermaid";

export function ClickRipple() {
  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function showRipple(event: PointerEvent) {
      if (
        event.button !== 0 ||
        !finePointer.matches ||
        reducedMotion.matches ||
        !(event.target instanceof Element) ||
        event.target.closest(excludedAreas)
      ) {
        return;
      }

      const ripple = document.createElement("span");
      ripple.className = "click-ripple";
      ripple.style.left = `${event.clientX}px`;
      ripple.style.top = `${event.clientY}px`;
      document.body.append(ripple);

      ripple.addEventListener("animationend", () => ripple.remove(), {
        once: true,
      });
      window.setTimeout(() => ripple.remove(), 650);
    }

    document.addEventListener("pointerdown", showRipple);
    return () => document.removeEventListener("pointerdown", showRipple);
  }, []);

  return null;
}
