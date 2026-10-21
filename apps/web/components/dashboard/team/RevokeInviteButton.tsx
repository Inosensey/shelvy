// RevokeInviteButton.tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { revokeInviteRecord } from "@/actions/teamActions";

export function RevokeInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await revokeInviteRecord(token);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex shrink-0 items-center gap-1 text-xs text-linen/40 transition-colors hover:text-red-400 disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
      ) : (
        <X className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      Revoke
    </button>
  );
}
