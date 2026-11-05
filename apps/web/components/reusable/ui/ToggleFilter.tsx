"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ToggleFilter({ paramName, label }: { paramName: string; label: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(paramName) === "true";

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (active) params.delete(paramName);
    else params.set(paramName, "true");
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={active}
      className={`rounded-md border px-3 py-2 text-sm transition-colors ${
        active ? "border-clay/60 bg-clay/10 text-clay" : "border-linen/10 text-linen/60 hover:text-linen"
      }`}
    >
      {label}
    </button>
  );
}