"use client";

import Link from "next/link";

export function BrandLogo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2"
      aria-label="AI Medical Assistant"
    >
      <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <span className="text-sm font-bold">AI</span>
      </div>

      <span className="text-sm font-semibold">
        AI Medical Assistant
      </span>
    </Link>
  );
}