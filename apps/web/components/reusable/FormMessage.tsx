"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FormMessageProps {
  message: string;
  success: boolean;
}

export function FormMessage({ message, success }: FormMessageProps) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm font-medium ${
            success
              ? "border-clay/30 bg-clay/10 text-clay"
              : "border-red-400/30 bg-red-400/10 text-red-400"
          }`}
        >
          {success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          )}
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}