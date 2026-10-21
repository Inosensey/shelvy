"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import { AuthInput } from "@/components/auth/AuthInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { inviteMember } from "@/actions/teamActions";

const initialFormState: ApiResponse<null> = { success: false, message: "", data: null };

export function InviteMemberControl() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [formState, formAction, isPending] = useActionState(inviteMember, initialFormState);

  useEffect(() => {
    if (formState.success) {
      formRef.current?.reset();
      const timer = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [formState]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-clay transition-colors hover:text-clay/80"
      >
        {open ? <X className="h-4 w-4" strokeWidth={2.5} /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
        {open ? "Cancel" : "Invite member"}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.form
            ref={formRef}
            action={formAction}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 flex flex-col gap-3 border-t border-linen/10 pt-4 sm:flex-row sm:items-end">
              <div className="flex-1">
                <AuthInput id="email" name="email" type="email" label="Email address" placeholder="teammate@company.com" required />
              </div>

              <div className="flex w-full flex-col gap-1.5 sm:w-40">
                <label htmlFor="role" className="text-sm font-medium text-linen">Role</label>
                <select
                  id="role"
                  name="role"
                  defaultValue="STAFF"
                  className="w-full rounded-md border border-linen/15 bg-ink/40 px-3 py-2 text-[15px] text-linen outline-none
                             transition-colors duration-150 focus:border-clay focus:ring-2 focus:ring-clay/30"
                >
                  <option value="MANAGER">Manager</option>
                  <option value="STAFF">Staff</option>
                </select>
              </div>

              <AuthButton type="submit" loading={isPending} loadingText="Sending…" className="sm:w-auto sm:shrink-0 sm:px-6">
                Send invite
              </AuthButton>
            </div>

            {formState.message && (
              <div className="mt-3">
                <FormMessage message={formState.message} success={formState.success} />
              </div>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}