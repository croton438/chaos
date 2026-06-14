import type { ReactNode } from "react";
import { Brand } from "./Brand";
import { LanguageToggle } from "./LanguageToggle";

export function Shell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <main className="h-full overflow-y-auto px-5 py-6 sm:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Brand compact />
        <div className="flex items-center gap-3"><LanguageToggle />{right}</div>
      </header>
      <div className="mx-auto max-w-7xl py-10">{children}</div>
    </main>
  );
}
