"use client";

import { useState, useTransition } from "react";
import { Check, ClipboardList, X } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/reusable/ui/Modal";
import { FilterSelect } from "@/components/reusable/ui/FilterSelect";
import { EmptyState } from "@/components/reusable/ui/EmptyState";
import { ConfirmDialog } from "@/components/reusable/ui/ConfirmDialog";
import {
  cancelRequest,
  decideRequest,
} from "@/actions/stockMovementRequestAction";
import { Loader2 } from "lucide-react";
import { AnimatePresence } from "motion/react";

const STATUS_STYLE: Record<RequestStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-400",
  APPROVED: "bg-emerald-500/15 text-emerald-400",
  REJECTED: "bg-red-500/15 text-red-400",
  CANCELLED: "bg-linen/10 text-linen/50",
};
const TYPE_LABEL: Record<MovementType, string> = {
  INITIAL: "Initial",
  IN: "Stock in",
  OUT: "Stock out",
  ADJUSTMENT: "Adjustment",
};

const when = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Manila",
});
function change(r: MovementRequest) {
  const n = r.type === "OUT" ? -r.quantity : r.quantity;
  return n > 0 ? `+${n}` : String(n);
}

interface Props {
  requests: MovementRequest[];
  isManager: boolean;
  currentUserId: string;
  hasFilters: boolean;
}

export function RequestsView({
  requests,
  isManager,
  currentUserId,
  hasFilters,
}: Props) {
  const [decide, setDecide] = useState<{
    request: MovementRequest;
    decision: "approve" | "reject";
  } | null>(null);
  const [note, setNote] = useState("");
  const [cancelTarget, setCancelTarget] = useState<MovementRequest | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function runDecision() {
    if (!decide) return;
    startTransition(async () => {
      const result = await decideRequest(
        decide.request.id,
        decide.request.product.id,
        decide.decision,
        note,
      );
      if (result.success) {
        toast.success(result.message);
        setDecide(null);
        setNote("");
      } else toast.error(result.message);
    });
  }

  function runCancel() {
    if (!cancelTarget) return;
    startTransition(async () => {
      const result = await cancelRequest(cancelTarget.id);
      if (result.success) {
        toast.success(result.message);
        setCancelTarget(null);
      } else toast.error(result.message);
    });
  }

  return (
    <>
      <div className="mb-4">
        <FilterSelect
          paramName="status"
          allLabel="All statuses"
          options={(
            ["PENDING", "APPROVED", "REJECTED", "CANCELLED"] as const
          ).map((s) => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))}
        />
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={hasFilters ? "No matching requests" : "No requests yet"}
          description={
            isManager
              ? "Staff stock requests will show up here for review."
              : "Use “Request stock change” on the Ledger tab to submit one."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((r) => (
            <li
              key={r.id}
              id={`request-${r.id}`}
              className="rounded-xl border border-linen/10 bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-linen">{r.product.name}</p>
                  <p className="text-xs text-linen/40">
                    {when.format(new Date(r.createdAt))}
                    {isManager && <> · {r.requestedBy.email}</>}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}
                >
                  {r.status[0] + r.status.slice(1).toLowerCase()}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                <span className="text-linen/60">{TYPE_LABEL[r.type]}</span>
                <span className="font-medium tabular-nums text-linen">
                  {change(r)}
                </span>
                <span className="text-linen/40">
                  Current stock:{" "}
                  <span className="tabular-nums text-linen/70">
                    {r.product.stock}
                  </span>
                </span>
              </div>

              {r.reason && (
                <p className="mt-2 text-sm text-linen/60">{r.reason}</p>
              )}
              {r.note && <p className="mt-1 text-xs text-linen/40">{r.note}</p>}
              {r.decisionNote && (
                <p className="mt-2 rounded-md bg-linen/5 px-3 py-2 text-sm text-linen/70">
                  {r.decidedBy?.email ? `${r.decidedBy.email}: ` : ""}
                  {r.decisionNote}
                </p>
              )}

              {r.status === "PENDING" && (
                <div className="mt-3 flex justify-end gap-2">
                  {isManager && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setDecide({ request: r, decision: "reject" })
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-linen/10 px-3 py-1.5 text-sm text-linen/70 hover:bg-red-500/10 hover:text-red-400"
                      >
                        <X className="h-4 w-4" /> Reject
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDecide({ request: r, decision: "approve" })
                        }
                        className="inline-flex items-center gap-1.5 rounded-md bg-clay px-3 py-1.5 text-sm font-medium text-ink hover:bg-clay/90"
                      >
                        <Check className="h-4 w-4" /> Approve
                      </button>
                    </>
                  )}
                  {r.requestedBy.id === currentUserId && (
                    <button
                      type="button"
                      onClick={() => setCancelTarget(r)}
                      className="rounded-md px-3 py-1.5 text-sm text-linen/60 hover:text-linen"
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <AnimatePresence>
        {decide && (
          <Modal
            onClose={() => {
              setDecide(null);
              setNote("");
            }}
            locked={isPending}
            labelledBy="decide-title"
          >
            <h2 id="decide-title" className="font-display text-lg text-linen">
              {decide.decision === "approve"
                ? "Approve this request?"
                : "Reject this request?"}
            </h2>
            <p className="mt-2 text-sm text-linen/60">
              {decide.decision === "approve" ? (
                <>
                  This will change the stock of{" "}
                  <span className="font-medium text-linen">
                    {decide.request.product.name}
                  </span>{" "}
                  by{" "}
                  <span className="font-medium text-linen">
                    {change(decide.request)}
                  </span>{" "}
                  and add a ledger entry.
                </>
              ) : (
                <>Stock won&apos;t change. The requester will be notified.</>
              )}
            </p>
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-linen/50">
                Note (optional)
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded-md border border-linen/10 bg-ink/40 px-3 py-2 text-sm text-linen focus:border-clay/60 focus:outline-none"
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDecide(null);
                  setNote("");
                }}
                disabled={isPending}
                className="rounded-md px-4 py-2 text-sm font-medium text-linen/60 hover:text-linen disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runDecision}
                disabled={isPending}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
                  decide.decision === "approve"
                    ? "bg-clay text-ink hover:bg-clay/90"
                    : "bg-red-500/90 text-white hover:bg-red-500"
                }`}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {decide.decision === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel this request?"
        description="It will be withdrawn and no stock will change."
        confirmLabel="Cancel request"
        pendingLabel="Cancelling…"
        pending={isPending}
        destructive
        onConfirm={runCancel}
        onCancel={() => setCancelTarget(null)}
      />
    </>
  );
}
