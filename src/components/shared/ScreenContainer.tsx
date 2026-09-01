import type { ReactNode } from "react";

const WIDTHS = {
  wide: "max-w-3xl",
  normal: "max-w-2xl",
  narrow: "max-w-xl",
} as const;

interface ScreenContainerProps {
  children: ReactNode;
  width?: keyof typeof WIDTHS;
  /** Set when the screen renders its own sticky footer flush to the bottom edge. */
  flushBottom?: boolean;
}

/**
 * Shared root wrapper for every screen: tighter padding on phones (where 24px
 * of side padding eats an eighth of the width) and the iOS home-indicator
 * inset, unless the screen pins its own footer to the bottom edge.
 */
export function ScreenContainer({ children, width = "normal", flushBottom = false }: ScreenContainerProps) {
  const bottomPadding = flushBottom ? "" : "pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-6";

  return (
    <div className={`mx-auto flex ${WIDTHS[width]} flex-col gap-4 px-4 pt-5 sm:px-6 sm:pt-6 ${bottomPadding}`}>
      {children}
    </div>
  );
}
