import Link from "next/link";

interface PanelProps {
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
}

export function Panel({ title, action, children }: PanelProps) {
  return (
    <section className="rounded-xl border border-linen/10 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base text-linen">{title}</h2>
        {action && (
          <Link
            href={action.href}
            className="text-sm text-clay hover:underline"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
