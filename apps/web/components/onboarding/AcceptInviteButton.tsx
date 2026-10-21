"use client";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { acceptInvite } from "@/actions/onboardingActions";

export function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInvite(token); // only returns on failure; success redirects
      if (result && !result.success) toast.error(result.message);
    });
  }

  return (
    <button
      type="button"
      onClick={handleAccept}
      disabled={isPending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-clay px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-clay/90 disabled:opacity-60"
    >
      {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
      {isPending ? "Joining…" : "Join organization"}
    </button>
  );
}