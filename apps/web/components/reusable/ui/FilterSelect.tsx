"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface FilterSelectProps {
  paramName: string;
  allLabel: string;
  options: { value: string; label: string }[];
}

export function FilterSelect({ paramName, allLabel, options }: FilterSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) params.set(paramName, e.target.value);
    else params.delete(paramName);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <select
      value={searchParams.get(paramName) ?? ""}
      onChange={onChange}
      aria-label={allLabel}
      className="rounded-md border border-linen/10 bg-ink/40 px-3 py-2 text-sm text-linen focus:border-clay/60 focus:outline-none"
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}