import Link from "next/link";
import { XCircle, Clock, CheckCircle2, type LucideIcon } from "lucide-react";

interface StatusConfig {
  icon: LucideIcon;
  heading: string;
  description: string;
  action?: { href: string; label: string };
}

const STATUS_CONFIG: Record<Exclude<InviteStatus, "pending">, StatusConfig> = {
  INVALID: {
    icon: XCircle,
    heading: "Invite not found",
    description: "This invite link doesn't match any invitation we have on file.",
    action: { href: "/login", label: "Go to sign in" },
  },
  EXPIRED: {
    icon: Clock,
    heading: "This invite has expired",
    description: "Ask whoever invited you to send a new invitation.",
    action: { href: "/login", label: "Go to sign in" },
  },
  COMPLETED: {
    icon: CheckCircle2,
    heading: "Invite already used",
    description: "This invitation has already been accepted. You can sign in instead.",
    action: { href: "/login", label: "Go to sign in" },
  },
};

export function InviteStatusCard({ status }: { status: Exclude<InviteStatus, "pending"> }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 py-12">
      <div className="w-full max-w-95 rounded-xl border border-linen/10 bg-surface px-8 py-9 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-linen/5">
          <Icon className="h-5 w-5 text-linen/50" strokeWidth={2} />
        </div>
        <h1 className="mt-4 font-display text-[22px] text-linen">{config.heading}</h1>
        <p className="mt-2 text-sm text-linen/55">{config.description}</p>

        {config.action && (
          <Link
            href={config.action.href}
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-clay px-4 py-2.5
                       text-sm font-medium text-ink transition-colors hover:bg-clay/90"
          >
            {config.action.label}
          </Link>
        )}
      </div>
    </div>
  );
}