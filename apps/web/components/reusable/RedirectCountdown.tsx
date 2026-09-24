"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RedirectCountdownProps {
  redirectTo: string;
  seconds?: number;
  message?: string;
}

export function RedirectCountdown({
  redirectTo,
  seconds = 5,
  message = "Redirecting",
}: RedirectCountdownProps) {
  const router = useRouter();
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      router.push(redirectTo);
      return;
    }
    const timer = setTimeout(() => setRemaining((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, redirectTo, router]);

  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <p className="text-sm text-linen/60">
        {message} in <span className="font-medium text-linen">{remaining}s</span>…
      </p>
      <a href={redirectTo} className="text-xs font-medium text-clay hover:underline">
        Go now
      </a>
    </div>
  );
}