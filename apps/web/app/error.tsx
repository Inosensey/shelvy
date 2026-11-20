"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6 text-center text-linen">
      <p className="text-sm uppercase tracking-widest text-clay">
        Something went wrong
      </p>
      <h1 className="font-display  text-4xl sm:text-5xl">We dropped a box</h1>
      <p className="max-w-md text-linen/70">
        An unexpected error occurred. You can try again, and if it keeps
        happening, we&apos;ve already been notified.
      </p>
      {error.digest && (
        <p className="text-xs text-linen/40">Reference: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="rounded-lg bg-clay px-5 py-2.5 font-medium text-ink hover:opacity-90"
      >
        Try again
      </button>
    </main>
  );
}
