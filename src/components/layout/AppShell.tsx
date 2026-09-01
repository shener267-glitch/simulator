import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="min-h-full bg-slate-900">{children}</div>;
}
