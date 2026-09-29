import type { ReactNode } from "react";

/** The quiet surface the letter lies on. Purely presentational. */
export function Desk({ children, caption }: { children: ReactNode; caption?: string }) {
  return (
    <main className="desk">
      <div className="desk__surface" aria-hidden />
      <div className="desk__grain" aria-hidden />
      <div className="desk__light" aria-hidden />
      {children}
      <div className="desk__falloff" aria-hidden />
      {caption && <p className="desk__caption">{caption}</p>}
    </main>
  );
}
