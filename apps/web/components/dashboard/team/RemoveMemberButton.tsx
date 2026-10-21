"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { removeMember } from "@/actions/teamActions";

interface RemoveMemberButtonProps {
  memberId: string;
  memberName: string;
  memberEmail: string;
}

export function RemoveMemberButton({ memberId, memberName, memberEmail }: RemoveMemberButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function close() {
    if (isPending) return; // don't let backdrop/Esc dismiss mid-request
    setOpen(false);
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeMember(memberId);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message); // keep the modal open so they can retry
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-red-400/80 transition-colors hover:text-red-400"
      >
        Remove
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            onKeyDown={(e) => e.key === "Escape" && close()}
          >
            <motion.div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="remove-member-title"
              className="w-full max-w-md rounded-xl border border-linen/10 bg-surface p-6"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="remove-member-title" className="font-display text-lg text-linen">
                Remove this member?
              </h2>
              <p className="mt-2 text-sm text-linen/60">
                <span className="font-medium text-linen">{memberName}</span> ({memberEmail}) will
                immediately lose access to this organization. You can invite them again later.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={close}
                  disabled={isPending}
                  autoFocus
                  className="rounded-md px-4 py-2 text-sm font-medium text-linen/60 transition-colors hover:text-linen disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-md bg-red-500/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending ? "Removing…" : "Remove member"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}