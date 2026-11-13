"use client";

import { useState, useTransition, useEffect } from "react";
import { PLANS } from "@/utils/plans";
import {
  startUpgradeAction,
  cancelSubscriptionAction,
  resumeSubscriptionAction,
  openBillingPortalAction,
} from "@/actions/settingsAction";
import { STRIPE_TEST_MODE } from "@/utils/constants";
import { TestCardModal } from "@/components/reusable/TestCardModal";
import { Loader2 } from "lucide-react";
import { UsageRow } from "./UsageRow";

const dateFmt = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: "Asia/Manila", // pinned, same hydration fix as elsewhere
});
const fmtDate = (d?: string | null) => (d ? dateFmt.format(new Date(d)) : "—");
const fmtMoney = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

export function BillingPanel({ billing }: { billing: BillingOverview }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(
    null,
  );
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const [busy, setBusy] = useState<string | null>(null);
  const locked = pending || busy !== null;

  // After a final cancel the subscription row stays (CANCELED) but the user is on FREE
  const hasActivePlan =
    billing.status !== null && billing.status !== "CANCELED";
  const currentPlan = PLANS.find(
    (p) => p.id === (hasActivePlan ? billing.plan : "FREE"),
  )!;
  const isPastDue =
    billing.status === "PAST_DUE" || billing.status === "UNPAID";

  function run<T>(
    action: () => Promise<ApiResponse<T>>,
    onOk?: (data: T) => void,
  ) {
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      if (!res.success) {
        setMessage({ text: res.message, ok: false });
        return;
      }
      if (onOk) onOk(res.data as T);
      else setMessage({ text: res.message, ok: true });
      setConfirmingCancel(false);
    });
  }

  const upgrade = (planId: string) =>
    redirectFlow(`upgrade:${planId}`, () => startUpgradeAction(planId));

  const statusLabel = !hasActivePlan
    ? "Free"
    : isPastDue
      ? "Payment failed"
      : billing.cancelAtPeriodEnd
        ? `Ends ${fmtDate(billing.currentPeriodEnd)}`
        : "Active";

  function redirectFlow(
    key: string,
    action: () => Promise<ApiResponse<{ url: string } | null>>,
  ) {
    setBusy(key);
    setMessage(null);
    startTransition(async () => {
      const res = await action();
      if (!res.success || !res.data?.url) {
        setBusy(null);
        setMessage({
          text: res.message || "Could not open Stripe.",
          ok: false,
        });
        return;
      }
      window.location.href = res.data.url; // busy stays on until the page unloads
    });
  }
  function Redirecting({
    label = "Redirecting to Stripe…",
  }: {
    label?: string;
  }) {
    return (
      <span className="inline-flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {label}
      </span>
    );
  }

  useEffect(() => {
    const reset = (e: PageTransitionEvent) => {
      if (e.persisted) setBusy(null);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Current plan */}
        <section className="rounded-xl border border-linen/15 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg">{currentPlan.name} plan</h3>
              <p className="text-sm opacity-60">
                {currentPlan.price} {currentPlan.period}
              </p>
            </div>
            <span className="rounded-full border border-linen/20 px-3 py-1 text-xs">
              {statusLabel}
            </span>
          </div>

          {hasActivePlan && (
            <p className="mt-3 text-sm opacity-70">
              {billing.cancelAtPeriodEnd
                ? `You keep access until ${fmtDate(billing.currentPeriodEnd)}.`
                : `Renews on ${fmtDate(billing.nextPaymentDate ?? billing.currentPeriodEnd)}.`}
            </p>
          )}
          {!hasActivePlan && billing.canceledAt && (
            <p className="mt-3 text-sm opacity-70">
              Your {billing.plan.toLowerCase()} plan ended on{" "}
              {fmtDate(billing.canceledAt)}.
            </p>
          )}

          {isPastDue && (
            <div className="mt-4 rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm">
              <p>
                We couldn&apos;t process your last payment
                {billing.failedAttempts
                  ? ` (attempt ${billing.failedAttempts})`
                  : ""}
                . Update your payment method to keep your plan.
              </p>
              <button
                type="button"
                disabled={locked}
                onClick={() => redirectFlow("portal", openBillingPortalAction)}
                className="mt-2 rounded-md border border-linen/30 px-3 py-1.5 text-xs hover:border-linen/60 disabled:opacity-50"
              >
                {busy === "portal" ? <Redirecting /> : "Update payment method"}
              </button>
            </div>
          )}

          {hasActivePlan && !isPastDue && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={locked}
                onClick={() => redirectFlow("portal", openBillingPortalAction)}
                className="rounded-md border border-linen/30 px-3 py-1.5 text-xs hover:border-linen/60 disabled:opacity-50"
              >
                {busy === "portal" ? <Redirecting /> : "Manage payment method"}
              </button>

              {billing.cancelAtPeriodEnd ? (
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => run(resumeSubscriptionAction)}
                  className="rounded-md bg-clay px-3 py-1.5 text-xs text-ink disabled:opacity-50"
                >
                  Keep my plan
                </button>
              ) : confirmingCancel ? (
                <span className="flex items-center gap-2 text-xs">
                  Cancel at the end of this period?
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => run(cancelSubscriptionAction)}
                    className="rounded-md border border-red-400/50 px-2 py-1 text-red-400 disabled:opacity-50"
                  >
                    Yes, cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingCancel(false)}
                    className="rounded-md px-2 py-1 opacity-70"
                  >
                    No
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Cancel plan
                </button>
              )}
            </div>
          )}

          {message && (
            <p
              className={`mt-3 text-sm ${message.ok ? "text-clay" : "text-red-400"}`}
            >
              {message.text}
            </p>
          )}
        </section>
        
        {billing.usage && (
          <section className="flex flex-col gap-4 rounded-xl border border-linen/15 p-5">
            <h3 className="font-display text-lg">Usage</h3>
            <UsageRow
              label="Products"
              used={billing.usage.products}
              limit={billing.limits.products}
            />
            <UsageRow
              label="Team members (incl. pending invites)"
              used={billing.usage.members}
              limit={billing.limits.members}
            />
          </section>
        )}

        {/* Upgrade options */}
        {!hasActivePlan && (
          <section className="grid gap-4 sm:grid-cols-2">
            {PLANS.filter((p) => p.id !== "FREE").map((plan) => (
              <div
                key={plan.id}
                className="flex flex-col rounded-xl border border-linen/15 p-5"
              >
                <h3 className="font-display text-lg">{plan.name}</h3>
                <p className="mt-1">
                  <span className="font-display text-2xl">{plan.price}</span>{" "}
                  <span className="text-xs opacity-60">{plan.period}</span>
                </p>
                <ul className="my-4 flex flex-col gap-1 text-xs opacity-80">
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() =>
                    STRIPE_TEST_MODE
                      ? setPendingPlan(plan.id)
                      : upgrade(plan.id)
                  }
                  className="mt-auto rounded-md bg-clay px-3 py-2 text-sm text-ink disabled:opacity-50"
                >
                  {busy === `upgrade:${plan.id}` ? (
                    <Redirecting />
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </button>
              </div>
            ))}
          </section>
        )}
        {hasActivePlan && billing.plan === "PREMIUM" && (
          <p className="text-xs opacity-60">
            Want Enterprise? Contact support and we&apos;ll switch your plan.
          </p>
        )}

        {/* Payment history */}
        <section className="rounded-xl border border-linen/15 p-5">
          <h3 className="mb-3 font-display text-lg">Payment history</h3>
          {billing.payments.length === 0 ? (
            <p className="text-sm opacity-60">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs opacity-60">
                  <tr>
                    <th className="py-2 pr-4 font-normal">Date</th>
                    <th className="py-2 pr-4 font-normal">Period</th>
                    <th className="py-2 pr-4 font-normal">Amount</th>
                    <th className="py-2 font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.payments.map((p) => (
                    <tr key={p.id} className="border-t border-linen/10">
                      <td className="py-2 pr-4">{fmtDate(p.createdAt)}</td>
                      <td className="py-2 pr-4">
                        {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                      </td>
                      <td className="py-2 pr-4">
                        {fmtMoney(p.amount, p.currency)}
                      </td>
                      <td className="py-2">{p.status.toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {STRIPE_TEST_MODE && (
        <TestCardModal
          open={pendingPlan !== null}
          onClose={() => setPendingPlan(null)}
          onConfirm={() => {
            const planId = pendingPlan!;
            setPendingPlan(null);
            upgrade(planId);
          }}
        />
      )}
    </>
  );
}
