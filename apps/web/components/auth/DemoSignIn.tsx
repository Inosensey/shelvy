"use client";

import { useState, useTransition } from "react";
import { useRouter } from "nextjs-toploader/app";
import { AuthButton } from "@/components/auth/AuthButton";
import { FormMessage } from "../reusable/FormMessage";
import { demoSignIn } from "@/actions/authActions";
import { safeRedirect } from "@/lib/safeRedirect";

const ROLES = [
  { role: "OWNER", label: "Owner" },
  { role: "MANAGER", label: "Manager" },
  { role: "STAFF", label: "Staff" },
] as const;

type DemoRole = (typeof ROLES)[number]["role"];

export function DemoSignIn({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<DemoRole | null>(null);
  const [error, setError] = useState("");

  function handleClick(role: DemoRole) {
    setActive(role);
    setError("");
    startTransition(async () => {
      const res = await demoSignIn(role);
      if (res.success) {
        router.push(safeRedirect(redirectTo));
        return; // keep the loading state until the page changes
      }
      setError(res.message || "Could not start the demo. Please try again.");
      setActive(null);
    });
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3 text-xs text-linen/45">
        <span className="h-px flex-1 bg-linen/10" />
        <span>or explore with sample data</span>
        <span className="h-px flex-1 bg-linen/10" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {ROLES.map(({ role, label }) => (
          <AuthButton
            key={role}
            type="button"
            variant="secondary"
            disabled={isPending}
            loading={isPending && active === role}
            loadingText="Loading…"
            onClick={() => handleClick(role)}
          >
            {label}
          </AuthButton>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-linen/45">
        Shared demo workspace. It resets daily and some actions are disabled.
      </p>

      {error && (
        <div className="mt-3">
          <FormMessage message={error} success={false} />
        </div>
      )}
    </div>
  );
}
