"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const HIGHLIGHT = ["bg-clay/10", "ring-1", "ring-inset", "ring-clay/40"];

interface Props {
  elementId?: string;
  clearAfterMs?: number;
}

export function ScrollToHighlight({ elementId, clearAfterMs = 5000 }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!elementId) return;

    const els = Array.from(
      document.querySelectorAll<HTMLElement>(`[id="${elementId}"]`),
    );
    if (els.length === 0) return;

    els.forEach((el) => el.classList.add(...HIGHLIGHT));
    const visible = els.find((el) => el.getClientRects().length > 0);
    visible?.scrollIntoView({ block: "center", behavior: "smooth" });

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("highlight");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, clearAfterMs);

    return () => {
      clearTimeout(timer);
      els.forEach((el) => el.classList.remove(...HIGHLIGHT));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementId]);

  return null;
}
