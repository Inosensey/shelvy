import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode; // optional action button
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-linen/15 px-6 py-14 text-center">
      <Icon className="h-8 w-8 text-linen/30" strokeWidth={1.5} />
      <h3 className="font-display text-lg text-linen">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-linen/50">{description}</p>
      )}
      {children}
    </div>
  );
}
