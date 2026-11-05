"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

interface ModalProps {
  onClose: () => void;
  locked?: boolean; // true while a request is running: blocks Esc and backdrop clicks
  labelledBy?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export function Modal({
  onClose,
  locked = false,
  labelledBy,
  maxWidth = "max-w-md",
  children,
}: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !locked) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locked, onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={() => !locked && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={`w-full ${maxWidth} rounded-xl border border-linen/10 bg-surface p-6`}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
