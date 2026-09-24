"use client";

import { useTransition } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { signOut } from "@/actions/authActions";

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      // signOut() clears the session server-side and redirects on its own
      // (via next/navigation's redirect()) -- no client-side router.push needed.
      await signOut();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-md border border-linen/20 px-4 py-2 text-sm
                 text-linen/70 transition-colors hover:bg-linen/5 hover:text-linen
                 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isPending ? (
          <motion.span
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            Signing out…
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Sign out
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
