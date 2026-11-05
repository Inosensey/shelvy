"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Loader2, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { Field, inputClass } from "@/components/reusable/ui/FormField";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "@/components/reusable/FormMessage";
import { changePassword, revokeOtherSessions } from "@/actions/settingsAction";

const initialState: ApiResponse<null> = {
  success: false,
  message: "",
  data: null,
};

export function SecurityPanel({ security }: { security: SecurityInfo }) {
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [revoking, startRevoking] = useTransition();

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      formRef.current?.reset();
    }
  }, [state]);

  function handleRevoke() {
    startRevoking(async () => {
      const result = await revokeOtherSessions();
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    });
  }

  const otherDevices = Math.max(0, security.activeSessions - 1);

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <section>
        <h2 className="font-display text-base text-linen">Password</h2>
        {security.hasPassword ? (
          <form
            ref={formRef}
            action={formAction}
            className="mt-4 flex flex-col gap-4"
          >
            <fieldset
              disabled={pending}
              className="m-0 flex flex-col gap-4 border-0 p-0"
            >
              <Field label="Current password">
                <input
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="New password" hint="At least 8 characters.">
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </Field>
                <Field label="Confirm new password">
                  <input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    className={inputClass}
                  />
                </Field>
              </div>
            </fieldset>

            {!state.success && state.message && (
              <FormMessage message={state.message} success={false} />
            )}

            <div>
              <AuthButton
                type="submit"
                loading={pending}
                loadingText="Changing…"
                className="w-auto px-6"
              >
                Change password
              </AuthButton>
            </div>
          </form>
        ) : (
          <p className="mt-2 text-sm text-linen/60">
            You sign in with{" "}
            {security.authProvider === "GITHUB" ? "GitHub" : "Google"}, so
            there&apos;s no password to manage here.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-linen/10 bg-surface p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <MonitorSmartphone className="mt-0.5 h-5 w-5 text-linen/40" />
            <div>
              <h2 className="font-display text-base text-linen">
                Signed-in devices
              </h2>
              <p className="mt-1 text-sm text-linen/60">
                {otherDevices === 0
                  ? "This is the only device signed in to your account."
                  : `You're also signed in on ${otherDevices} other device${otherDevices > 1 ? "s" : ""}.`}
              </p>
            </div>
          </div>
          {otherDevices > 0 && (
            <button
              type="button"
              onClick={handleRevoke}
              disabled={revoking}
              className="inline-flex shrink-0 items-center gap-2 rounded-md border border-linen/10 px-4 py-2 text-sm text-linen/80 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
            >
              {revoking && <Loader2 className="h-4 w-4 animate-spin" />} Sign
              out other devices
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
