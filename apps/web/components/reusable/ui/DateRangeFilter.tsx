"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function set(name: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const cls = "rounded-md border border-linen/10 bg-ink/40 px-3 py-2 text-sm text-linen focus:border-clay/60 focus:outline-none [color-scheme:dark]";

  return (
    <div className="flex items-center gap-2">
      <input type="date" aria-label="From date" value={searchParams.get("from") ?? ""} max={searchParams.get("to") ?? undefined}
        onChange={(e) => set("from", e.target.value)} className={cls} />
      <span className="text-linen/30">–</span>
      <input type="date" aria-label="To date" value={searchParams.get("to") ?? ""} min={searchParams.get("from") ?? undefined}
        onChange={(e) => set("to", e.target.value)} className={cls} />
    </div>
  );
}