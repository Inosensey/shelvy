export const TYPE_STYLE: Record<
  MovementType,
  { label: string; badge: string; delta: string }
> = {
  INITIAL: {
    label: "Initial",
    badge: "bg-sky-500/15 text-sky-400",
    delta: "text-sky-400",
  },
  IN: {
    label: "In",
    badge: "bg-emerald-500/15 text-emerald-400",
    delta: "text-emerald-400",
  },
  OUT: {
    label: "Out",
    badge: "bg-red-500/15 text-red-400",
    delta: "text-red-400",
  },
  ADJUSTMENT: {
    label: "Adjustment",
    badge: "bg-amber-500/15 text-amber-400",
    delta: "text-amber-400",
  },
};

export const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
