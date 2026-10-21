"use client";

import { useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { resendInviteRecord } from "@/actions/teamActions";
import { toast } from "sonner";

export function ResendInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await resendInviteRecord(token);
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
      className="flex shrink-0 items-center gap-1 text-xs text-linen/40 transition-colors hover:text-clay disabled:opacity-50"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
      ) : (
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
      )}
      Resend
    </button>
  );
}
