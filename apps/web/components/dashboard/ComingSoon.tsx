import type { ComponentType } from "react";

interface ComingSoonProps {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  description: string;
}

export function ComingSoon({ icon: Icon, description }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-clay/15 text-clay">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="max-w-sm text-sm text-linen/55">{description}</p>
    </div>
  );
}