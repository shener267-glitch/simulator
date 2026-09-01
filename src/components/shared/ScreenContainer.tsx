import type { ReactNode } from "react";

const WIDTHS = {
  wide: "max-w-lg",
  normal: "max-w-[28rem]",
  narrow: "max-w-[27rem]",
} as const;

interface ScreenContainerProps {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
  /** Set when the screen renders its own sticky footer flush to the bottom edge. */
  flushBottom?: boolean;
}

/**
 * Shared root wrapper for every screen. The game is built for a phone held
 * upright, so the column stays near phone width even on a desktop rather than
 * stretching into something that reads as a web page.
 */
export function ScreenContainer({ children, width = "normal", flushBottom = false }: ScreenContainerProps) {
  const bottomPadding = flushBottom ? "" : "pb-[calc(2rem+env(safe-area-inset-bottom))]";

  return (
    <div className={`mx-auto flex ${WIDTHS[width]} animate-fade-in flex-col gap-5 px-5 pt-5 ${bottomPadding}`}>
      {children}
    </div>
  );
}
