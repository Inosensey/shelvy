"use client";

import { AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, description, confirmLabel = "Confirm", pendingLabel = "Working…",
  pending = false, destructive = false, onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <Modal onClose={onCancel} locked={pending} labelledBy="confirm-title">
          <h2 id="confirm-title" className="font-display text-lg text-linen">{title}</h2>
          <div className="mt-2 text-sm text-linen/60">{description}</div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              autoFocus
              className="rounded-md px-4 py-2 text-sm font-medium text-linen/60 transition-colors hover:text-linen disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                destructive ? "bg-red-500/90 text-white hover:bg-red-500" : "bg-clay text-ink hover:bg-clay/90"
              }`}
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? pendingLabel : confirmLabel}
            </button>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}