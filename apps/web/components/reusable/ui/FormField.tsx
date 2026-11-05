export const inputClass =
  "w-full rounded-md border border-linen/10 bg-ink/40 px-3 py-2 text-sm text-linen placeholder:text-linen/30 focus:border-clay/60 focus:outline-none disabled:opacity-60";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wide text-linen/50">
        {label}
      </span>
      {children}
      {hint && <span className="text-xs text-linen/40">{hint}</span>}
    </label>
  );
}
