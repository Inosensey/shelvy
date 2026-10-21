// components/dashboard/NoOrganizationState.tsx
import { LogoutButton } from "@/components/dashboard/LogoutButton";

export function NoOrganizationState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink px-4 text-center">
      <h1 className="font-display text-2xl text-linen">You`&apos;`re not part of an organization</h1>
      <p className="max-w-sm text-sm text-linen/60">
        You were removed from your previous organization. Ask an owner to send you a new invite
        to get back in.
      </p>
      <LogoutButton />
    </div>
  );
}