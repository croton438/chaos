import type { ReactNode } from "react";
import { Brand } from "./Brand";

export function Shell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <header className="mx-auto flex max-w-7xl items-center justify-between">
        <Brand compact />
        {right}
      </header>
      <div className="mx-auto max-w-7xl py-10">{children}</div>
    </main>
  );
}

