"use client";

import { useState } from "react";
import { Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TEST_CARDS } from "@/utils/constants";

interface TestCardModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function TestCardModal({ open, onClose, onConfirm }: TestCardModalProps) {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  async function handleCopy(number: string) {
    await navigator.clipboard.writeText(number.replace(/\s/g, ""));
    setCopiedNumber(number);
  }

  const hasCopied = copiedNumber !== null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-linen/10 bg-surface p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg text-linen">Sandbox checkout</h2>
                <p className="mt-1 text-xs text-linen/55">
                  This is running in Stripe test mode. Copy one of the cards below, then
                  continue -- Stripe checkout won&rsquo;t accept a real card here.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 cursor-pointer text-linen/40 transition-colors hover:text-linen"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-4 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
              {TEST_CARDS.map((card) => {
                const copied = copiedNumber === card.number;
                return (
                  <button
                    key={card.number}
                    type="button"
                    onClick={() => handleCopy(card.number)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      copied ? "border-clay bg-clay/5" : "border-linen/10 hover:border-linen/25"
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-linen/50">{card.brand}</p>
                      <p className="font-mono text-sm text-linen">{card.number}</p>
                      <p className="mt-0.5 text-[11px] text-linen/40">
                        Exp: any future date &middot; CVC: any {card.cvc.length} digits
                      </p>
                    </div>
                    {copied ? (
                      <Check className="h-4 w-4 shrink-0 text-clay" strokeWidth={2.5} />
                    ) : (
                      <Copy className="h-4 w-4 shrink-0 text-linen/40" strokeWidth={2} />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!hasCopied}
              onClick={onConfirm}
              className="mt-5 w-full rounded-md bg-clay px-4 py-2.5 text-sm font-medium text-ink
                         transition-colors hover:bg-clay/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hasCopied ? "Continue to Stripe checkout" : "Copy a card to continue"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}